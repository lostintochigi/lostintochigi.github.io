// Pure filtering helpers for the TRY ramen map.

import { isOpenNow } from '../Michelin/hours'

export const STYLE_LABELS = {
    shoyu: 'Shoyu (soy sauce)',
    shio: 'Shio (salt)',
    miso: 'Miso',
    tonkotsu: 'Tonkotsu (pork bone)',
    niboshi: 'Niboshi (dried sardine)',
    tsukemen: 'Tsukemen (dipping)',
    mazesoba: 'Mazesoba / soupless',
    tantanmen: 'Tantanmen',
    'chuka-soba': 'Chuka soba',
    iekei: 'Iekei',
    'jiro-kei': 'Jiro-kei',
    other: 'Other',
}

export const styleLabel = (s) => STYLE_LABELS[s] || s

export const DEFAULT_FILTERS = {
    edition: '', // '' = all editions
    category: '',
    topOnly: false,
    style: '',
    district: '',
    openNow: false,
    hideClosed: true,
    search: '',
}

// Awards that count under the current edition/category/top-3 filters.
export function matchingAwards(shop, f) {
    return shop.awards.filter(
        (a) =>
            (!f.edition || a.edition === f.edition) &&
            (!f.category || a.category === f.category) &&
            (!f.topOnly || (a.rank != null && a.rank <= 3))
    )
}

export function filterShops(list, f, now) {
    const q = f.search.trim().toLowerCase()
    return list.filter((s) => {
        if (!matchingAwards(s, f).length) return false
        if (f.style && s.style !== f.style) return false
        if (f.district && s.district !== f.district) return false
        if (f.hideClosed && s.closed) return false
        if (f.openNow && !isOpenNow(s.week, now)) return false
        if (q) {
            const hay = `${s.name} ${s.nameJa || ''} ${s.district} ${s.address} ${s.addressJa || ''} ${s.description || ''} ${styleLabel(s.style)} ${s.awards
                .map((a) => `${a.category} ${a.categoryJa || ''}`)
                .join(' ')}`.toLowerCase()
            if (!hay.includes(q)) return false
        }
        return true
    })
}

export function activeFilterCount(f) {
    return ['edition', 'category', 'topOnly', 'style', 'district', 'openNow'].filter((k) => f[k]).length + (f.hideClosed ? 0 : 1)
}

export const shortEdition = (e) => e.replace(/^20(\d\d)-20(\d\d)$/, "'$1–'$2")
export const awardLabel = (a) => `${a.rank ? `#${a.rank} ` : ''}${a.category}`
