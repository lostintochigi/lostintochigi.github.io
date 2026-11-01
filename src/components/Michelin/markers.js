import L from 'leaflet'

// Starred = red circle labelled "3★"/"2★"/"1★" (bigger for more stars).
// Bib Gourmand = yellow rounded square labelled "Bib". Shape + text, not colour alone.
export function michelinIcon(r, selected) {
    const isBib = r.stars === 0
    const base = isBib ? 30 : 28 + r.stars * 3
    const size = selected ? base + 10 : base
    const ring = selected ? '#ffffff' : '#052409'
    const shape = isBib
        ? `<rect x="2" y="2" width="36" height="36" rx="9" fill="#ffd700" stroke="${ring}" stroke-width="3"/>
           <text x="20" y="25.5" text-anchor="middle" font-size="14" font-weight="700" fill="#1b1b1b" font-family="Arial, sans-serif">Bib</text>`
        : `<circle cx="20" cy="20" r="18" fill="#b3122e" stroke="${ring}" stroke-width="3"/>
           <text x="20" y="25.5" text-anchor="middle" font-size="15" font-weight="700" fill="#ffffff" font-family="Arial, sans-serif">${r.stars}★</text>`
    return L.divIcon({
        className: `map-marker${selected ? ' is-selected' : ''}`,
        html: `<svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">${shape}</svg>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    })
}

export function michelinTitle(r) {
    return `${r.name}, ${r.distinction}`
}
