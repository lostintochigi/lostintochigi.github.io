#!/usr/bin/env node
// Validates data/michelin_hk_2026.csv and writes public/data/michelin-hk.json
// (+ a public copy of the CSV for download) and data/michelin-report.md.
//
// Usage: npm run data:michelin [-- --csv path --edition "2026"]
// Manual fixes: data/michelin-overrides.json (never written by this script).

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
const EDITION = args.edition || '2026'
const CSV_PATH = path.resolve(ROOT, args.csv || `data/michelin_hk_${EDITION}.csv`)
const OVERRIDES_PATH = path.resolve(ROOT, 'data/michelin-overrides.json')
const OUT_PATH = path.resolve(ROOT, 'public/data/michelin-hk.json')
const PUBLIC_CSV = path.resolve(ROOT, `public/data/michelin_hk_${EDITION}.csv`)
const REPORT_PATH = path.resolve(ROOT, 'data/michelin-report.md')

const HK = { minLat: 22.15, maxLat: 22.57, minLng: 113.82, maxLng: 114.45 }
const DISTINCTIONS = ['3 Stars', '2 Stars', '1 Star', 'Bib Gourmand']
const DISTRICTS = [
    'Central & Western', 'Eastern', 'Islands', 'Kowloon City', 'Kwai Tsing', 'Kwun Tong', 'North', 'Sai Kung', 'Sha Tin',
    'Sham Shui Po', 'Southern', 'Tai Po', 'Tsuen Wan', 'Tuen Mun', 'Wan Chai', 'Wong Tai Sin', 'Yau Tsim Mong', 'Yuen Long',
]
const REQUIRED = ['name', 'distinction', 'cuisine', 'address', 'district']

// RFC 4180 CSV parser (quoted fields, "" escapes, CRLF/LF).
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

const clean = (v) => (v || '').replace(/\s+/g, ' ').replace(/ +,/g, ',').trim()

function km(a, b) {
    const rad = (d) => (d * Math.PI) / 180
    const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2
    return 2 * 6371 * Math.asin(Math.sqrt(h))
}
const median = (xs) => {
    const s = [...xs].sort((a, b) => a - b)
    const m = Math.floor(s.length / 2)
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function main() {
    const text = fs.readFileSync(CSV_PATH, 'utf8').replace(/^﻿/, '')
    const [header, ...body] = parseCsv(text)
    const cols = header.map((h) => clean(h).toLowerCase())
    for (const c of [...REQUIRED, 'lat', 'lng']) {
        if (!cols.includes(c)) throw new Error(`Missing column "${c}" in ${CSV_PATH}`)
    }
    const overrides = fs.existsSync(OVERRIDES_PATH) ? JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8')).overrides || [] : []

    const report = { invalid: [], noCoords: [], outOfBounds: [], duplicates: [], flagged: [], lowConfidence: [], overridden: [] }
    const rows = []
    const seen = new Map()

    body.forEach((cells, i) => {
        const line = i + 2
        const r = Object.fromEntries(cols.map((c, j) => [c, clean(cells[j])]))
        r.line = line

        const o = overrides.find((x) => clean(x.name).toLowerCase() === r.name.toLowerCase())
        if (o) {
            if (o.exclude) { report.overridden.push({ r, note: `excluded${o.note ? `: ${o.note}` : ''}` }); return }
            for (const k of ['lat', 'lng', 'address', 'district', 'distinction', 'cuisine']) {
                if (o[k] !== undefined && o[k] !== null && o[k] !== '') r[k] = String(o[k])
            }
            if (o.lat != null) { r.coord_confidence = 'high'; r.coord_source = 'manual' }
            report.overridden.push({ r, note: o.note || 'fields overridden' })
        }

        const problems = REQUIRED.filter((k) => !r[k]).map((k) => `missing ${k}`)
        if (r.distinction && !DISTINCTIONS.includes(r.distinction)) problems.push(`unknown distinction "${r.distinction}"`)
        if (r.district && !DISTRICTS.includes(r.district)) problems.push(`unknown district "${r.district}"`)
        if (problems.length) { report.invalid.push({ r, note: problems.join('; ') }); return }

        const key = `${r.name.toLowerCase()}|${r.address.toLowerCase()}`
        if (seen.has(key)) { report.duplicates.push({ r, note: `duplicate of CSV line ${seen.get(key)}` }); return }
        seen.set(key, line)

        const lat = parseFloat(r.lat)
        const lng = parseFloat(r.lng)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) { report.noCoords.push({ r }); return }
        if (lat < HK.minLat || lat > HK.maxLat || lng < HK.minLng || lng > HK.maxLng) {
            report.outOfBounds.push({ r, note: `${lat}, ${lng}` })
            return
        }
        r.lat = lat
        r.lng = lng
        if (/^(low|none)$/i.test(r.coord_confidence || '')) report.lowConfidence.push({ r })
        rows.push(r)
    })

    // Same district-outlier check as the fountain data: far from the district's
    // other entries AND much closer to another district.
    const byDistrict = new Map()
    rows.forEach((r) => byDistrict.set(r.district, [...(byDistrict.get(r.district) || []), r]))
    const centres = new Map(
        [...byDistrict].map(([d, list]) => [d, { lat: median(list.map((x) => x.lat)), lng: median(list.map((x) => x.lng)) }])
    )
    rows.forEach((r) => {
        const others = byDistrict.get(r.district).filter((x) => x !== r)
        if (others.length < 3 || r.coord_source === 'manual') return
        const own = km(r, { lat: median(others.map((x) => x.lat)), lng: median(others.map((x) => x.lng)) })
        if (own <= 3) return
        let best = null
        for (const [d, c] of centres) {
            if (d === r.district) continue
            const dd = km(r, c)
            if (!best || dd < best.km) best = { d, km: dd }
        }
        if (best && own / best.km >= 4) {
            r.flagged = `The map position may be off: it is ${own.toFixed(1)} km from other ${r.district} entries. Check the address.`
            report.flagged.push({ r, note: `${own.toFixed(1)} km from ${r.district} entries; ${best.km.toFixed(1)} km from ${best.d}` })
        }
    })

    const order = Object.fromEntries(DISTINCTIONS.map((d, i) => [d, i]))
    const restaurants = rows
        .sort((a, b) => order[a.distinction] - order[b.distinction] || a.name.localeCompare(b.name))
        .map((r, i) => ({
            id: i + 1,
            name: r.name,
            distinction: r.distinction,
            stars: r.distinction === 'Bib Gourmand' ? 0 : parseInt(r.distinction, 10),
            greenStar: /^(yes|true|y)$/i.test(r.green_star || ''),
            cuisine: r.cuisine,
            address: r.address,
            district: r.district,
            lat: Number(r.lat.toFixed(6)),
            lng: Number(r.lng.toFixed(6)),
            approximate: /^low$/i.test(r.coord_confidence || '') || null,
            flagged: r.flagged || null,
        }))

    const cuisines = [...new Set(restaurants.map((r) => r.cuisine))].sort((a, b) => a.localeCompare(b))
    const out = {
        source: {
            edition: `MICHELIN Guide Hong Kong & Macau ${EDITION}`,
            compiledFrom: 'published press coverage of the guide announcement',
            csv: `/data/michelin_hk_${EDITION}.csv`,
        },
        generated: new Date().toISOString(),
        counts: Object.fromEntries(DISTINCTIONS.map((d) => [d, restaurants.filter((r) => r.distinction === d).length])),
        districts: [...new Set(restaurants.map((r) => r.district))].sort(),
        cuisines,
        restaurants,
    }
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
    fs.writeFileSync(OUT_PATH, JSON.stringify(out))
    fs.copyFileSync(CSV_PATH, PUBLIC_CSV)

    const fmt = ({ r, note }) => `- ${r.name} (${r.distinction || '?'}, CSV line ${r.line})${note ? ` — ${note}` : ''}`
    const L = []
    L.push(`# Michelin data report`, '', `Source: \`${path.relative(ROOT, CSV_PATH)}\` · generated ${out.generated}`, '')
    L.push(`- CSV rows: ${body.length}`, `- On the map: ${restaurants.length}`)
    DISTINCTIONS.forEach((d) => L.push(`  - ${d}: ${out.counts[d]}`))
    L.push(`  - Green Star: ${restaurants.filter((r) => r.greenStar).length}`, '')
    const section = (title, list, hint) => {
        L.push(`## ${title} (${list.length})`, '')
        if (hint) L.push(hint, '')
        list.forEach((x) => L.push(fmt(x)))
        L.push('')
    }
    section('Invalid rows (not on map)', report.invalid)
    section('No coordinates (not on map)', report.noCoords, 'Add lat/lng in the CSV or in data/michelin-overrides.json.')
    section('Outside Hong Kong (not on map)', report.outOfBounds)
    section('Duplicates (skipped)', report.duplicates)
    section('Flagged: position looks wrong for the district', report.flagged, 'Shown with a warning; Directions use the address.')
    section('Low-confidence coordinates (shown as approximate)', report.lowConfidence)
    section('Overrides applied', report.overridden)
    fs.writeFileSync(REPORT_PATH, L.join('\n'))
    console.log(L.join('\n'))
    console.log(`Wrote ${path.relative(ROOT, OUT_PATH)} (${restaurants.length} restaurants)`)
}

main()
