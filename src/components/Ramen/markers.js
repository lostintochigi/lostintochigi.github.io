import L from 'leaflet'

// Grand Prize = gold rounded square labelled "GP".
// Ranked shops = circle labelled with the best rank ("#1", "#2"…): red for
// top 3, brown otherwise. Shape + text, not colour alone.
export function ramenIcon(s, selected) {
    const size = selected ? 42 : s.grandPrize ? 36 : s.bestRank <= 3 ? 32 : 28
    const ring = selected ? '#ffffff' : '#052409'
    const label = s.grandPrize ? 'GP' : s.bestRank < 99 ? `#${s.bestRank}` : '★'
    const shape = s.grandPrize
        ? `<rect x="2" y="2" width="36" height="36" rx="9" fill="#ffd700" stroke="${ring}" stroke-width="3"/>
           <text x="20" y="25.5" text-anchor="middle" font-size="15" font-weight="700" fill="#1b1b1b" font-family="Arial, sans-serif">${label}</text>`
        : `<circle cx="20" cy="20" r="18" fill="${s.bestRank <= 3 ? '#c62828' : '#8d5524'}" stroke="${ring}" stroke-width="3"/>
           <text x="20" y="25.5" text-anchor="middle" font-size="${label.length > 2 ? 13 : 15}" font-weight="700" fill="#ffffff" font-family="Arial, sans-serif">${label}</text>`
    return L.divIcon({
        className: `map-marker${selected ? ' is-selected' : ''}${s.closed ? ' is-closed' : ''}`,
        html: `<svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">${shape}</svg>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    })
}

export function ramenTitle(s) {
    const best = s.grandPrize ? 'Grand Prize' : s.bestRank < 99 ? `best rank #${s.bestRank}` : 'TRY award'
    return `${s.name}, ${best}`
}
