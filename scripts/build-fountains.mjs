#!/usr/bin/env node
// Converts LCSD's water-dispenser CSV into public/data/fountains.json for the
// HK Water Fountains utility, and writes a report of excluded / flagged rows.
//
// Usage:
//   npm run data:fountains                       (uses defaults below)
//   node scripts/build-fountains.mjs [--csv path] [--source-date YYYY-MM-DD]
//
// Re-runnable: drop a newer CSV at data/lcsd_wd_en.csv and run it again.
// Manual fixes live in data/fountain-overrides.json (never written by this script).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = Object.fromEntries(
    process.argv.slice(2).reduce((acc, a, i, all) => {
        if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]])
        return acc
    }, [])
)

const CSV_PATH = path.resolve(ROOT, args.csv || 'data/lcsd_wd_en.csv')
const OVERRIDES_PATH = path.resolve(ROOT, 'data/fountain-overrides.json')
const OUT_PATH = path.resolve(ROOT, 'public/data/fountains.json')
const REPORT_PATH = path.resolve(ROOT, 'data/fountains-report.md')

const HK_BOUNDS = { minLat: 22.15, maxLat: 22.57, minLng: 113.82, maxLng: 114.45 }
const DISTRICT_OUTLIER_KM = 3
const LIKELY_WRONG_RATIO = 4

// ---------------------------------------------------------------- CSV reading

function decode(buf) {
    if (buf[0] === 0xff && buf[1] === 0xfe) return buf.subarray(2).toString('utf16le')
    if (buf[0] === 0xfe && buf[1] === 0xff) {
        const swapped = Buffer.from(buf.subarray(2))
        swapped.swap16()
        return swapped.toString('utf16le')
    }
    if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return buf.subarray(3).toString('utf8')
    return buf.toString('utf8')
}

// RFC 4180 parser: quoted fields, "" escapes, CRLF/LF line endings.
function parseCsv(text) {
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

function readRows(file) {
    let rows = parseCsv(decode(fs.readFileSync(file)))
    // The LCSD export wraps each whole line in quotes, so every row parses as a
    // single field holding the real CSV line. Unwrap if that's the case.
    if (rows.every((r) => r.length === 1) && rows[0][0].includes(',')) {
        rows = rows.map((r) => parseCsv(r[0])[0] || [])
    }
    return rows
}

// ---------------------------------------------------------------- cleaning

const COLUMNS = {
    name: /name of building/i,
    street: /street/i,
    district: /district/i,
    region: /region/i,
    location: /location of water/i,
    lat: /latitude/i,
    lng: /longitude/i,
    type: /type of water/i,
    count: /number of water/i,
    from: /hours \(from\)/i,
    to: /hours \(to\)/i,
    exception: /exception/i,
    temperature: /temperature/i,
    indoor: /indoor/i,
    remarks: /remarks/i,
}

// Collapse whitespace; drop stray "?" that sit at the start/end of a value or a word
// (e.g. "Kowloon Tsai Swimming Pool?", "?Sai Kung", "?114.192904").
function clean(v) {
    return (v || '')
        .replace(/\s+/g, ' ')
        .replace(/ +,/g, ',')
        .replace(/(^|\s)\?+/g, '$1')
        .replace(/\?+(?=\s|$)/g, '')
        .trim()
}

function parseCoord(v) {
    const n = parseFloat(clean(v).replace(/[^0-9.-]/g, ''))
    return Number.isFinite(n) ? n : null
}

function parseTemperature(v) {
    const s = clean(v).toLowerCase()
    return { hot: /\bhot\b/.test(s), cold: /\bcold\b/.test(s), ambient: /ambient/.test(s) }
}

function normalizeType(v) {
    const s = clean(v).toLowerCase()
    if (s.startsWith('non-fountain')) return 'Non-fountain type'
    if (s.startsWith('fountain')) return 'Fountain type'
    return clean(v) || null
}

function normalizeIndoor(v) {
    const s = clean(v).toLowerCase()
    if (s === 'indoor') return 'indoor'
    if (s === 'outdoor') return 'outdoor'
    return null
}

// "07:00" / "24:00:00" -> minutes since midnight; null if not a time.
function toMinutes(v) {
    const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(clean(v))
    if (!m) return null
    const mins = Number(m[1]) * 60 + Number(m[2])
    return mins <= 1440 ? mins : null
}

const DAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

// Parses closing times like "Mon-Wed, Fri: 18:00;Sat, Sun, PH: 19:00" into
// { dayIndex: closeMinutes }. Days not listed are treated as closed.
function parseDailyClose(v) {
    const out = {}
    for (const seg of clean(v).split(';')) {
        const m = /^(.*):\s*(\d{1,2}:\d{2})$/.exec(seg.trim())
        if (!m) return null
        const close = toMinutes(m[2])
        for (const part of m[1].split(',')) {
            const p = part.trim().toLowerCase()
            if (p === 'ph') continue // public holidays can't be computed offline
            const range = /^([a-z]{3})(?:\s*-\s*([a-z]{3}))?$/.exec(p)
            if (!range || !(range[1] in DAY_INDEX)) return null
            const start = DAY_INDEX[range[1]]
            const end = range[2] ? DAY_INDEX[range[2]] : start
            for (let d = start; ; d = (d + 1) % 7) {
                out[d] = close
                if (d === end) break
            }
        }
    }
    return Object.keys(out).length ? out : null
}

// Returns { label, week } where week[0..6] (Sun..Sat) is [open, close] minutes,
// or null for closed that day. week === null means hours can't be determined.
function parseHours(fromRaw, toRaw) {
    const from = clean(fromRaw)
    const to = clean(toRaw)
    if (/event day/i.test(from) || /event day/i.test(to)) {
        return { label: 'Event days only', week: null, kind: 'event' }
    }
    const open = toMinutes(from)
    const close = toMinutes(to)
    if (open !== null && close !== null) {
        if (open === 0 && (close === 1440 || close === 0)) {
            return { label: 'Open 24 hours', week: Array(7).fill([0, 1440]), kind: '24h' }
        }
        const fmt = (m) => (m === 1440 ? '24:00' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
        return { label: `${fmt(open)}–${fmt(close)}`, week: Array(7).fill([open, close]), kind: 'fixed' }
    }
    if (open !== null) {
        const daily = parseDailyClose(to)
        if (daily) {
            const week = Array.from({ length: 7 }, (_, d) => (d in daily ? [open, daily[d]] : null))
            return { label: `From ${from}; closes ${to}`, week, kind: 'weekly' }
        }
    }
    return { label: [from, to].filter(Boolean).join(' – ') || 'Not listed', week: null, kind: 'unknown' }
}

// Remarks -> access category. Remarks that are clearly about hours or say the
// fountain is publicly accessible are not treated as access restrictions.
function parseAccess(remarksRaw) {
    const r = clean(remarksRaw)
    const s = r.toLowerCase()
    if (!s) return { access: 'public', note: null }
    if (s === 'for use by venue / facility users') return { access: 'users_only', note: r }
    if (s === 'for use by venue / facility hirers') return { access: 'hirers_only', note: r }
    if (/accessible by (the )?public/.test(s)) return { access: 'public', note: r }
    if (/^special opening arrangement/.test(s)) return { access: 'public', note: r }
    return { access: 'restricted', note: r }
}

// ---------------------------------------------------------------- geo helpers

function km(a, b) {
    const R = 6371
    const toRad = (d) => (d * Math.PI) / 180
    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - a.lng)
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(h))
}

const median = (xs) => {
    const s = [...xs].sort((a, b) => a - b)
    const m = Math.floor(s.length / 2)
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

const inBounds = ({ lat, lng }) =>
    lat >= HK_BOUNDS.minLat && lat <= HK_BOUNDS.maxLat && lng >= HK_BOUNDS.minLng && lng <= HK_BOUNDS.maxLng

const coordKey = (lat, lng) => `${lat.toFixed(6)},${lng.toFixed(6)}`

// ---------------------------------------------------------------- overrides

function loadOverrides() {
    if (!fs.existsSync(OVERRIDES_PATH)) return []
    const json = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'))
    return (json.overrides || []).map((o) => ({ ...o, used: false }))
}

// An override matches on venue name + the coordinates as listed in the CSV
// (and optionally the dispenser location text).
function findOverride(overrides, row) {
    return overrides.find(
        (o) =>
            o.match &&
            clean(o.match.name).toLowerCase() === row.name.toLowerCase() &&
            o.match.lat === row.rawLat &&
            o.match.lng === row.rawLng &&
            (!o.match.location || clean(o.match.location).toLowerCase() === row.location.toLowerCase())
    )
}

// ---------------------------------------------------------------- main

function main() {
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`CSV not found: ${CSV_PATH}`)
        process.exit(1)
    }
    const raw = readRows(CSV_PATH)
    const header = raw[0].map(clean)
    const idx = Object.fromEntries(
        Object.entries(COLUMNS).map(([key, re]) => {
            const i = header.findIndex((h) => re.test(h))
            if (i === -1) throw new Error(`Column for "${key}" not found in header: ${header.join(' | ')}`)
            return [key, i]
        })
    )

    const report = { repaired: [], skipped: [], excluded: [], flagged: [], overridden: [], unparsedHours: [] }
    const overrides = loadOverrides()
    const rows = []

    raw.slice(1).forEach((cells, i) => {
        const line = i + 2
        cells = [...cells]
        // Unescaped commas in the venue name ("King George V Memorial Park, Hong Kong")
        // split it into extra leading fields. Re-join them.
        if (cells.length > header.length) {
            const extra = cells.length - header.length
            const joined = cells.slice(0, extra + 1).map(clean).join(', ')
            report.repaired.push({ line, note: `Re-joined name split by unescaped comma: "${joined}"` })
            cells = [joined, ...cells.slice(extra + 1)]
        }
        if (cells.length < header.length) {
            report.skipped.push({ line, note: `Only ${cells.length} of ${header.length} columns`, cells })
            return
        }

        const get = (k) => cells[idx[k]]
        const lat = parseCoord(get('lat'))
        const lng = parseCoord(get('lng'))
        const hours = parseHours(get('from'), get('to'))
        const { access, note } = parseAccess(get('remarks'))
        const row = {
            line,
            name: clean(get('name')),
            street: clean(get('street')),
            district: clean(get('district')),
            region: clean(get('region')),
            location: clean(get('location')),
            rawLat: lat,
            rawLng: lng,
            lat,
            lng,
            type: normalizeType(get('type')),
            count: parseInt(clean(get('count')), 10) || 1,
            hours,
            exception: clean(get('exception')) || null,
            temp: parseTemperature(get('temperature')),
            indoor: normalizeIndoor(get('indoor')),
            access,
            accessNote: note,
        }
        if (hours.kind === 'unknown') report.unparsedHours.push(row)

        const o = findOverride(overrides, row)
        if (o) {
            o.used = true
            if (o.exclude) {
                report.overridden.push({ row, note: `Excluded by override${o.note ? `: ${o.note}` : ''}` })
                return
            }
            if (typeof o.lat === 'number' && typeof o.lng === 'number') {
                row.lat = o.lat
                row.lng = o.lng
                row.corrected = true
                report.overridden.push({ row, note: `Coordinates corrected to ${o.lat}, ${o.lng}${o.note ? ` (${o.note})` : ''}` })
            }
            if (o.access) row.access = o.access
        }

        if (row.lat === null || row.lng === null || !inBounds(row)) {
            report.excluded.push({ row, note: 'Outside Hong Kong bounding box / invalid coordinates' })
            return
        }
        rows.push(row)
    })

    // District outlier check: compare each row to the median of *other venues*
    // in the same district (rows of the same venue are excluded so a venue
    // can't vouch for itself).
    const byDistrict = new Map()
    rows.forEach((r) => {
        if (!byDistrict.has(r.district)) byDistrict.set(r.district, [])
        byDistrict.get(r.district).push(r)
    })
    rows.forEach((r) => {
        if (r.corrected) return
        const others = byDistrict.get(r.district).filter((o) => o.name !== r.name)
        if (others.length < 3) return
        const centre = { lat: median(others.map((o) => o.lat)), lng: median(others.map((o) => o.lng)) }
        const dist = km(r, centre)
        // Large rural districts legitimately span >3 km, so also require the point
        // to be nearer some other district's centre than its own.
        if (dist <= DISTRICT_OUTLIER_KM) return
        let nearest = null
        for (const [d, list] of byDistrict) {
            if (d === r.district) continue
            const c = { lat: median(list.map((o) => o.lat)), lng: median(list.map((o) => o.lng)) }
            const dd = km(r, c)
            if (!nearest || dd < nearest.km) nearest = { district: d, km: dd }
        }
        if (nearest && nearest.km < dist) {
            // "Likely wrong": much closer to another district than its own.
            // The rest are reported for review but not marked on the map,
            // since big districts (Islands, Sai Kung, Southern) span >3 km.
            const likely = dist / nearest.km >= LIKELY_WRONG_RATIO
            if (likely) {
                r.flagged = `The listed position may be wrong: it is ${dist.toFixed(1)} km from other ${r.district} venues. Check the address before going.`
            }
            report.flagged.push({ row: r, distKm: dist, nearest, likely })
        }
    })

    // Group by venue + coordinates.
    const groups = new Map()
    for (const r of rows) {
        const key = `${r.name.toLowerCase()}|${coordKey(r.lat, r.lng)}`
        if (!groups.has(key)) {
            groups.set(key, {
                name: r.name,
                // Append the district unless the street already ends with it.
                address: r.street && !r.street.toLowerCase().replace(/[.,\s]+$/, '').endsWith(r.district.toLowerCase())
                    ? `${r.street.replace(/[,\s]+$/, '')}, ${r.district}`
                    : r.street || r.district,
                district: r.district,
                region: r.region,
                lat: r.lat,
                lng: r.lng,
                flagged: r.flagged || null,
                dispensers: [],
            })
        }
        const g = groups.get(key)
        if (r.flagged && !g.flagged) g.flagged = r.flagged
        g.dispensers.push({
            location: r.location || null,
            type: r.type,
            count: r.count,
            temp: r.temp,
            indoor: r.indoor,
            // Same hours every day -> { open, close } minutes; per-weekday -> week[0..6] (Sun..Sat).
            hours:
                r.hours.kind === 'weekly'
                    ? { label: r.hours.label, kind: r.hours.kind, week: r.hours.week }
                    : r.hours.week
                    ? { label: r.hours.label, kind: r.hours.kind, open: r.hours.week[0][0], close: r.hours.week[0][1] }
                    : { label: r.hours.label, kind: r.hours.kind },
            exception: r.exception,
            access: r.access,
            accessNote: r.accessNote,
        })
    }

    const rank = { public: 0, users_only: 1, hirers_only: 2, restricted: 3 }
    const venues = [...groups.values()]
        .sort((a, b) => a.district.localeCompare(b.district) || a.name.localeCompare(b.name))
        .map((g, i) => ({
            id: i + 1,
            ...g,
            // A point is "public" if any dispenser there is publicly usable.
            access: g.dispensers.reduce((best, d) => (rank[d.access] < rank[best] ? d.access : best), 'restricted'),
        }))

    const sourceDate = args['source-date'] || new Date(fs.statSync(CSV_PATH).mtime).toISOString().slice(0, 10)
    const out = {
        source: {
            name: 'Water Dispensers in LCSD venues',
            publisher: 'Leisure and Cultural Services Department',
            portal: 'DATA.GOV.HK',
            url: 'https://data.gov.hk/en-data/dataset/hk-lcsd-facwd-fac-wd-list',
            asOf: sourceDate,
        },
        generated: new Date().toISOString(),
        districts: [...byDistrict.keys()].sort(),
        venues,
    }
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
    fs.writeFileSync(OUT_PATH, JSON.stringify(out))

    // ------------------------------------------------------------ report
    const fmtRow = (r) => `${r.name} — ${r.location || '(no location)'} [${r.rawLat}, ${r.rawLng}] (CSV line ${r.line})`
    const lines = []
    lines.push(`# Fountain data report`, '', `Source: \`${path.relative(ROOT, CSV_PATH)}\` · data as of ${sourceDate} · generated ${out.generated}`, '')
    lines.push(`- CSV rows: ${raw.length - 1}`, `- Rows kept: ${rows.length}`, `- Map points (venue + coordinates): ${venues.length}`, '')
    lines.push(`## Excluded: out-of-bounds or invalid coordinates (${report.excluded.length})`, '')
    report.excluded.forEach(({ row }) => lines.push(`- ${fmtRow(row)}`))
    const fmtFlag = ({ row, distKm, nearest }) =>
        `- ${fmtRow(row)} — ${distKm.toFixed(1)} km from other ${row.district} venues; ${nearest.km.toFixed(1)} km from ${nearest.district}. Address: ${row.street}`
    const likely = report.flagged.filter((f) => f.likely)
    const review = report.flagged.filter((f) => !f.likely)
    lines.push('', `## Flagged: likely wrong coordinates (${likely.length})`, '')
    lines.push(
        `More than ${DISTRICT_OUTLIER_KM} km from other venues in the same district and at least ${LIKELY_WRONG_RATIO}× closer to another district.`,
        'Kept on the map with a warning, and "Directions" uses the address instead of the coordinates.',
        'To fix, set lat/lng for the matching entry in `data/fountain-overrides.json`. A starter entry is printed below each row.',
        ''
    )
    likely.forEach((f) => {
        lines.push(fmtFlag(f))
        lines.push(`  \`{ "match": { "name": ${JSON.stringify(f.row.name)}, "lat": ${f.row.rawLat}, "lng": ${f.row.rawLng} }, "lat": null, "lng": null, "note": "" }\``)
    })
    lines.push('', `## Worth a look: more than ${DISTRICT_OUTLIER_KM} km from the district median (${review.length})`, '')
    lines.push('Usually fine. Large or spread-out districts (Islands, Southern, Kai Tak) trip this check. These rows are not marked on the map.', '')
    review.forEach((f) => lines.push(fmtFlag(f)))
    lines.push('', `## Manual overrides applied (${report.overridden.length})`, '')
    report.overridden.forEach(({ row, note }) => lines.push(`- ${fmtRow(row)} — ${note}`))
    const unused = overrides.filter((o) => !o.used)
    if (unused.length) {
        lines.push('', `## Overrides that matched no row (${unused.length})`, '')
        unused.forEach((o) => lines.push(`- ${JSON.stringify(o.match)}`))
    }
    lines.push('', `## Repaired rows (${report.repaired.length})`, '')
    report.repaired.forEach(({ line, note }) => lines.push(`- CSV line ${line}: ${note}`))
    if (report.skipped.length) {
        lines.push('', `## Skipped malformed rows (${report.skipped.length})`, '')
        report.skipped.forEach(({ line, note }) => lines.push(`- CSV line ${line}: ${note}`))
    }
    lines.push('', `## Hours that couldn't be parsed (${report.unparsedHours.length})`, '')
    lines.push('Shown as listed; never counted as "open now".', '')
    report.unparsedHours.forEach((r) => lines.push(`- ${fmtRow(r)}: "${r.hours.label}"`))
    fs.writeFileSync(REPORT_PATH, lines.join('\n') + '\n')

    console.log(lines.join('\n'))
    console.log(`\nWrote ${path.relative(ROOT, OUT_PATH)} (${venues.length} points) and ${path.relative(ROOT, REPORT_PATH)}`)
}

main()
