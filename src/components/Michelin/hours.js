// Opening-hours helpers for the Michelin map pages.
// `week` comes from scripts/build-michelin.mjs: an array indexed by day
// (0 = Sun … 6 = Sat), each entry null (unknown) or a list of [open, close]
// spans in minutes since midnight. close > 1440 means it runs past midnight.

const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
const formatters = new Map()

// Day (0 = Sun) and minutes since midnight in the given time zone,
// regardless of the visitor's own time zone.
export function zonedNow(timeZone, date = new Date()) {
    if (!formatters.has(timeZone)) {
        formatters.set(
            timeZone,
            new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        )
    }
    const parts = Object.fromEntries(formatters.get(timeZone).formatToParts(date).map((p) => [p.type, p.value]))
    return {
        day: WEEKDAYS[parts.weekday],
        minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute),
        label: `${parts.weekday} ${parts.hour}:${parts.minute}`,
    }
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export const fmtTime = (m) => {
    const t = m % 1440
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

const fmtSpans = (spans) =>
    spans && spans.length ? spans.map(([o, c]) => `${fmtTime(o)}–${fmtTime(c)}`).join(', ') : 'Closed'

// { state: 'open' | 'closed' | 'unknown', label }
export function openStatus(week, now) {
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
