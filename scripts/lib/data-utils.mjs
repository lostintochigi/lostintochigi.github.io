// Shared helpers for the data build scripts (no dependencies).

// RFC 4180 CSV parser (quoted fields, "" escapes, CRLF/LF).
export function parseCsv(text) {
    const rows = []
    let row = []
    let field = ''
    let quoted = false
    for (let i = 0; i < text.length; i++) {
        const c = text[i]
        if (quoted) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i++ } else quoted = false
            } else field += c
        } else if (c === '"') quoted = true
        else if (c === ',') { row.push(field); field = '' }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++
            row.push(field); field = ''
            if (row.length > 1 || row[0] !== '') rows.push(row)
            row = []
        } else field += c
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row) }
    return rows
}

export const clean = (v) => (v || '').replace(/\s+/g, ' ').replace(/ +,/g, ',').trim()

export function km(a, b) {
    const rad = (d) => (d * Math.PI) / 180
    const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2
    return 2 * 6371 * Math.asin(Math.sqrt(h))
}
// Opening hours, e.g. "Mon-Fri 12:00-14:30, 18:00-22:30; Sat-Sun 11:30-15:00; Tue closed".
// Returns [Sun..Sat] of null (unknown) or [[openMin, closeMin], ...]; throws on bad input.
const DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
export function parseHours(text) {
    if (!text) return null
    const week = Array(7).fill(null)
    for (const seg of text.split(';').map((s) => s.trim()).filter(Boolean)) {
        const m = seg.match(/^([A-Za-z&-]+)\s+(.+)$/)
        if (!m) throw new Error(`can't read segment "${seg}"`)
        const days = []
        for (const part of m[1].split('&')) {
            const [a, b] = part.split('-')
            if (!(a in DAY_INDEX) || (b && !(b in DAY_INDEX))) throw new Error(`unknown day in "${part}"`)
            if (!b) days.push(DAY_INDEX[a])
            else for (let d = DAY_INDEX[a]; ; d = (d + 1) % 7) { days.push(d); if (d === DAY_INDEX[b]) break }
        }
        let spans = []
        if (!/^closed$/i.test(m[2].trim())) {
            spans = m[2].split(',').map((t) => {
                const x = t.trim().match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/)
                if (!x) throw new Error(`can't read time "${t.trim()}"`)
                const open = +x[1] * 60 + +x[2]
                let close = +x[3] * 60 + +x[4]
                if (open >= 1440 || close > 1440) throw new Error(`bad time "${t.trim()}"`)
                if (close <= open) close += 1440 // past midnight
                return [open, close]
            })
        }
        for (const d of days) {
            if (week[d] !== null) throw new Error(`${Object.keys(DAY_INDEX)[d]} listed twice`)
            week[d] = spans
        }
    }
    return week
}

export const median = (xs) => {
    const s = [...xs].sort((a, b) => a - b)
    const m = Math.floor(s.length / 2)
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

