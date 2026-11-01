// Pure filtering helpers for the Michelin map pages.

import { isOpenNow } from './hours'

export const DISTINCTIONS = [
    { key: '3 Stars', label: '3 Stars', short: '3★' },
    { key: '2 Stars', label: '2 Stars', short: '2★' },
    { key: '1 Star', label: '1 Star', short: '1★' },
    { key: 'Bib Gourmand', label: 'Bib Gourmand', short: 'Bib' },
]

export const DEFAULT_FILTERS = {
    distinctions: DISTINCTIONS.map((d) => d.key),
    greenOnly: false,
    openNow: false,
    cuisine: '',
    district: '',
    search: '',
}

export function filterRestaurants(list, f, now) {
    const q = f.search.trim().toLowerCase()
    const allowed = new Set(f.distinctions)
    return list.filter((r) => {
        if (!allowed.has(r.distinction)) return false
        if (f.greenOnly && !r.greenStar) return false
        if (f.openNow && !isOpenNow(r.week, now)) return false
        if (f.cuisine && r.cuisine !== f.cuisine) return false
        if (f.district && r.district !== f.district) return false
        if (q && !`${r.name} ${r.cuisine} ${r.district} ${r.address} ${r.description || ''} ${r.nameJa || ''}`.toLowerCase().includes(q)) return false
        return true
    })
}

export function activeFilterCount(f) {
    return (
        (f.distinctions.length === DISTINCTIONS.length ? 0 : 1) +
        (f.greenOnly ? 1 : 0) +
        (f.openNow ? 1 : 0) +
        (f.cuisine ? 1 : 0) +
        (f.district ? 1 : 0)
    )
}
