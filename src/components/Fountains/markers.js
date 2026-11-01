import L from 'leaflet'

// Public = round yellow pin with a water drop. Restricted = grey square with a
// lock. Shape and glyph differ, not just colour.
const DROP = '<path d="M12 5c-2.6 3.3-4.5 5.9-4.5 8.2a4.5 4.5 0 0 0 9 0C16.5 10.9 14.6 8.3 12 5z" fill="#052409"/>'
const LOCK =
    '<rect x="7.5" y="11" width="9" height="7" rx="1" fill="#1b1b1b"/><path d="M9.5 11V9a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="#1b1b1b" stroke-width="1.8"/>'

export function fountainIcon(venue, selected) {
    const isPublic = venue.access === 'public'
    const size = selected ? 38 : 28
    const ring = selected ? '#ffffff' : '#052409'
    const shape = isPublic
        ? `<circle cx="12" cy="12" r="10.5" fill="#ffd700" stroke="${ring}" stroke-width="2"/>${DROP}`
        : `<rect x="2" y="2" width="20" height="20" rx="3" fill="#b8c2cc" stroke="${ring}" stroke-width="2"/>${LOCK}`
    return L.divIcon({
        className: `map-marker${selected ? ' is-selected' : ''}`,
        html: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${shape}</svg>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    })
}

export function fountainTitle(venue) {
    return `${venue.name} (${venue.access === 'public' ? 'public' : 'restricted access'})`
}
