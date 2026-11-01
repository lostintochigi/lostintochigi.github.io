// Pure helpers for the HK Water Fountains page: Hong Kong time, opening
// hours, filtering and distances. No React here so it's easy to test.

const HK_TZ = 'Asia/Hong_Kong'
const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

const hkFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: HK_TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
})

// Current day-of-week (0 = Sun) and minutes since midnight in Hong Kong,
// regardless of the visitor's own timezone.
export function hkNow(date = new Date()) {
    const parts = Object.fromEntries(hkFormatter.formatToParts(date).map((p) => [p.type, p.value]))
    return {
        day: WEEKDAYS[parts.weekday],
        minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute),
        label: `${parts.weekday} ${parts.hour}:${parts.minute}`,
    }
}

function within(open, close, minutes) {
    if (open === 0 && close >= 1440) return true
    if (close > open) return minutes >= open && minutes < close
    if (close < open) return minutes >= open || minutes < close // past midnight
    return false
}

// true / false, or null when hours can't be determined (e.g. event days).
export function dispenserOpen(hours, now) {
    if (!hours) return null
    if (hours.kind === '24h') return true
    if (typeof hours.open === 'number' && typeof hours.close === 'number') {
        return within(hours.open, hours.close, now.minutes)
    }
    if (hours.week) {
        const today = hours.week[now.day]
        if (today && within(today[0], today[1], now.minutes)) return true
        // Yesterday's hours may run past midnight.
        const y = hours.week[(now.day + 6) % 7]
        if (y && y[1] < y[0] && now.minutes < y[1]) return true
        return false
    }
    return null
}

// A venue is open if any of its dispensers is open. Unknown only if all are unknown.
export function venueOpen(venue, now) {
    let unknown = true
    for (const d of venue.dispensers) {
        const o = dispenserOpen(d.hours, now)
        if (o === true) return true
        if (o === false) unknown = false
    }
    return unknown ? null : false
}

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

export const ACCESS_LABELS = {
    public: 'Public',
    users_only: 'Venue users only',
    hirers_only: 'Venue hirers only',
    restricted: 'Restricted',
}

export function temperatureLabel(t) {
    const parts = []
    if (t.cold) parts.push('Cold')
    if (t.ambient) parts.push('Room temperature')
    if (t.hot) parts.push('Hot')
    return parts.length ? parts.join(' · ') : 'Not listed'
}

export function venueHas(venue, pred) {
    return venue.dispensers.some(pred)
}

export function filterVenues(venues, f, now) {
    const q = f.search.trim().toLowerCase()
    return venues.filter((v) => {
        if (f.publicOnly && v.access !== 'public') return false
        if (f.district && v.district !== f.district) return false
        if (f.cold && !venueHas(v, (d) => d.temp.cold)) return false
        if (f.setting !== 'any' && !venueHas(v, (d) => d.indoor === f.setting)) return false
        if (f.openNow && venueOpen(v, now) !== true) return false
        if (q && !`${v.name} ${v.district} ${v.address}`.toLowerCase().includes(q)) return false
        return true
    })
}

// Google Maps on Android/desktop, Apple Maps on iOS/macOS. Rows with
// suspicious coordinates route to the address instead.
export function directionsLinks(venue) {
    const dest = venue.flagged
        ? encodeURIComponent(`${venue.name}, ${venue.address}, Hong Kong`)
        : `${venue.lat},${venue.lng}`
    return {
        google: `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
        apple: `https://maps.apple.com/?daddr=${dest}`,
    }
}
