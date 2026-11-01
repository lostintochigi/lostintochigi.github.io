// Opening-hours helpers for the HK Michelin map.
// `week` comes from scripts/build-michelin.mjs: an array indexed by day
// (0 = Sun … 6 = Sat), each entry null (unknown) or a list of [open, close]
// spans in minutes since midnight. close > 1440 means it runs past midnight.

import { hkNow } from '../Fountains/logic'

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export const fmtTime = (m) => {
    const t = m % 1440
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

const fmtSpans = (spans) =>
    spans && spans.length ? spans.map(([o, c]) => `${fmtTime(o)}–${fmtTime(c)}`).join(', ') : 'Closed'

// { state: 'open' | 'closed' | 'unknown', label }
export function openStatus(week, now = hkNow()) {
    if (!week) return { state: 'unknown', label: 'Hours not listed' }
    const today = week[now.day]
    const yesterday = week[(now.day + 6) % 7]
    const m = now.minutes

    for (const [, c] of yesterday || []) {
        if (c > 1440 && m < c - 1440) return { state: 'open', label: `Open now · until ${fmtTime(c)}` }
    }
    for (const [o, c] of today || []) {
        if (m >= o && m < c) return { state: 'open', label: `Open now · until ${fmtTime(c)}` }
    }
    if (today === null) return { state: 'unknown', label: 'Hours for today not listed' }

    const later = (today || []).find(([o]) => o > m)
    if (later) return { state: 'closed', label: `Closed now · opens ${fmtTime(later[0])}` }
    for (let i = 1; i <= 7; i++) {
        const d = (now.day + i) % 7
        const spans = week[d]
        if (spans && spans.length) {
            return { state: 'closed', label: `Closed now · opens ${i === 1 ? 'tomorrow' : DAY_NAMES[d]} ${fmtTime(spans[0][0])}` }
        }
    }
    return { state: 'closed', label: 'Closed' }
}

export const isOpenNow = (week, now) => openStatus(week, now).state === 'open'

// Rows for the weekly table, Monday first, with consecutive equal days merged.
export function weekRows(week) {
    if (!week) return []
    const rows = []
    DISPLAY_ORDER.forEach((d) => {
        const text = week[d] === null ? '—' : fmtSpans(week[d])
        const last = rows[rows.length - 1]
        if (last && last.text === text) last.days.push(d)
        else rows.push({ days: [d], text })
    })
    return rows.map(({ days, text }) => ({
        days,
        label: days.length > 1 ? `${DAY_NAMES[days[0]]}–${DAY_NAMES[days[days.length - 1]]}` : DAY_NAMES[days[0]],
        text,
    }))
}
