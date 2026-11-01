// Small, framework-free geo helpers shared by the map utilities.

export const HK_BOUNDS = [
    [22.15, 113.82],
    [22.57, 114.45],
]

export function distanceKm(a, b) {
    const R = 6371
    const rad = (d) => (d * Math.PI) / 180
    const dLat = rad(b.lat - a.lat)
    const dLng = rad(b.lng - a.lng)
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(h))
}

export function formatDistance(km) {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`
}

// Directions to coordinates, or to a text query (name + address) when the
// coordinates are suspect.
export function directionsLinks({ lat, lng, query }) {
    const dest = query ? encodeURIComponent(query) : `${lat},${lng}`
    return {
        google: `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
        apple: `https://maps.apple.com/?daddr=${dest}`,
    }
}

// Browser geolocation with friendly error messages.
// onUpdate receives { state: 'loading'|'ok'|'error', message, loc? }.
// area: { bounds: [[s, w], [n, e]], name } — used to warn when the visitor is far away.
export function locateUser(onUpdate, area = { bounds: HK_BOUNDS, name: 'Hong Kong' }) {
    if (!('geolocation' in navigator)) {
        onUpdate({ state: 'error', message: "Your browser doesn't support location. Search or pick a district instead." })
        return
    }
    if (!window.isSecureContext) {
        onUpdate({ state: 'error', message: 'Location only works over a secure (https://) connection.' })
        return
    }
    onUpdate({ state: 'loading', message: 'Finding your location…' })
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            const [[s, w], [n, e]] = area.bounds
            const pad = 0.1
            const inHk = loc.lat > s - pad && loc.lat < n + pad && loc.lng > w - pad && loc.lng < e + pad
            onUpdate({
                state: 'ok',
                loc,
                inHk,
                message: inHk ? '' : `You seem to be outside ${area.name}, so distances will be large.`,
            })
        },
        (err) => {
            const messages = {
                1: 'Location permission was denied. You can still search or filter by district.',
                2: "Couldn't determine your location. Try again outdoors, or search instead.",
                3: 'Finding your location took too long. Please try again.',
            }
            onUpdate({ state: 'error', message: messages[err.code] || 'Location is unavailable.' })
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
}
