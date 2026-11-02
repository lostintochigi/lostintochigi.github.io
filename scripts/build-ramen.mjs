#!/usr/bin/env node
// Validates data/try_ramen.csv (one row per TRY award) and writes
// public/data/try-ramen.json (one entry per shop, with its awards),
// a public copy of the CSV, and data/try-ramen-report.md.
//
// Usage: npm run data:ramen
// Manual fixes: data/try-ramen-overrides.json (never written by this script).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { clean, parseCsv, parseHours } from './lib/data-utils.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CSV_PATH = path.resolve(ROOT, 'data/try_ramen.csv')
const OVERRIDES_PATH = path.resolve(ROOT, 'data/try-ramen-overrides.json')
const OUT_PATH = path.resolve(ROOT, 'public/data/try-ramen.json')
const PUBLIC_CSV = path.resolve(ROOT, 'public/data/try_ramen.csv')
const REPORT_PATH = path.resolve(ROOT, 'data/try-ramen-report.md')

// Greater Tokyo and neighbouring prefectures.
const BOUNDS = { minLat: 34.8, maxLat: 37.2, minLng: 138.4, maxLng: 141.0 }
const REQUIRED = ['edition', 'category', 'name', 'address']
const SHOP_FIELDS = ['name', 'name_ja', 'style', 'address', 'address_ja', 'prefecture', 'district', 'lat', 'lng', 'description', 'hours', 'hours_note']

// The overall TRY Grand Prize winner (the category also ranks runners-up).
const isGrandPrize = (a) => a.category === 'Grand Prize' && a.rank === 1

function main() {
    const text = fs.readFileSync(CSV_PATH, 'utf8').replace(/^﻿/, '')
    const [header, ...body] = parseCsv(text)
    const cols = header.map((h) => clean(h).toLowerCase())
    for (const c of [...REQUIRED, 'lat', 'lng']) if (!cols.includes(c)) throw new Error(`Missing column "${c}"`)
    const overrideFile = fs.existsSync(OVERRIDES_PATH) ? JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8')) : {}
    const overrides = overrideFile.overrides || []

    const report = { invalid: [], noCoords: [], outOfBounds: [], badHours: [], noHours: [], closed: [], overridden: [] }
    const shops = new Map()
    const awardKeys = new Set()
    let awardCount = 0

    body.forEach((cells, i) => {
        const r = Object.fromEntries(cols.map((c, j) => [c, clean(cells[j])]))
        r.line = i + 2
        const shopKey = (r.name_ja || r.name).toLowerCase().replace(/\s+/g, '')
        const o = overrides.find((x) => [r.name, r.name_ja].some((n) => n && clean(x.name).toLowerCase() === n.toLowerCase()))
        if (o) {
            if (o.exclude) { report.overridden.push({ r, note: `excluded${o.note ? `: ${o.note}` : ''}` }); return }
            for (const k of SHOP_FIELDS) if (o[k] !== undefined && o[k] !== null && o[k] !== '') r[k] = String(o[k])
            if (o.lat != null) r.coord_confidence = 'high'
            if (!report.overridden.some((x) => x.r.name === r.name)) report.overridden.push({ r, note: o.note || 'fields overridden' })
        }
        const problems = REQUIRED.filter((k) => !r[k]).map((k) => `missing ${k}`)
        if (r.rank && !/^\d+$/.test(r.rank)) problems.push(`rank "${r.rank}" is not a number`)
        if (problems.length) { report.invalid.push({ r, note: problems.join('; ') }); return }

        const awardKey = `${shopKey}|${r.edition}|${r.category}`
        if (awardKeys.has(awardKey)) { report.invalid.push({ r, note: 'duplicate award row' }); return }
        awardKeys.add(awardKey)

        const award = { edition: r.edition, category: r.category, categoryJa: r.category_ja || null, rank: r.rank ? Number(r.rank) : null }
        let shop = shops.get(shopKey)
        if (!shop) {
            shop = { rows: [], awards: [] }
            shops.set(shopKey, shop)
        }
        shop.rows.push(r)
        shop.awards.push(award)
        awardCount++
    })

    const out = []
    for (const shop of shops.values()) {
        // Shop details come from the newest edition's row that has them.
        const rows = [...shop.rows].sort((a, b) => b.edition.localeCompare(a.edition))
        const pick = (k) => rows.find((x) => x[k])?.[k] || ''
        const r = rows[0]
        const lat = parseFloat(pick('lat'))
        const lng = parseFloat(pick('lng'))
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) { report.noCoords.push({ r }); continue }
        if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat || lng < BOUNDS.minLng || lng > BOUNDS.maxLng) {
            report.outOfBounds.push({ r, note: `${lat}, ${lng}` })
            continue
        }
        const hoursRow = rows.find((x) => x.hours) || r
        let week = null
        try {
            week = parseHours(hoursRow.hours)
        } catch (e) {
            report.badHours.push({ r: hoursRow, note: `${e.message} (in "${hoursRow.hours}")` })
        }
        if (!week) report.noHours.push({ r })
        else if (week.some((d) => d === null)) report.badHours.push({ r: hoursRow, note: 'some days not covered (shown as unknown)' })
        const notes = pick('notes')
        const closed = /^closed/i.test(notes)
        if (closed) report.closed.push({ r, note: notes })

        const awards = shop.awards.sort((a, b) => b.edition.localeCompare(a.edition) || (a.rank ?? 99) - (b.rank ?? 99))
        out.push({
            name: r.name,
            nameJa: pick('name_ja') || null,
            style: pick('style') || 'other',
            address: pick('address'),
            addressJa: pick('address_ja') || null,
            prefecture: pick('prefecture') || null,
            district: pick('district') || pick('prefecture') || 'Other',
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
            approximate: /^low$/i.test(pick('coord_confidence')) || null,
            description: pick('description') || null,
            week,
            hoursNote: hoursRow.hours_note || null,
            hoursSource: hoursRow.hours_source || null,
            hoursUnsure: /^low$/i.test(hoursRow.hours_confidence || '') || null,
            closed: closed || null,
            notes: closed ? notes.replace(/^closed[:.\s-]*/i, '') || null : null,
            grandPrize: awards.some(isGrandPrize) || null,
            bestRank: Math.min(...awards.map((a) => a.rank ?? 99)),
            awards,
        })
    }
    out.sort((a, b) => (b.grandPrize ? 1 : 0) - (a.grandPrize ? 1 : 0) || a.bestRank - b.bestRank || a.name.localeCompare(b.name))
    out.forEach((s, i) => (s.id = i + 1))

    const editions = [...new Set(out.flatMap((s) => s.awards.map((a) => a.edition)))].sort().reverse()
    const categories = [...new Set(out.flatMap((s) => s.awards.map((a) => a.category)))].sort((a, b) =>
        a === 'Grand Prize' ? -1 : b === 'Grand Prize' ? 1 : a.localeCompare(b)
    )
    const data = {
        source: { name: 'TRY Ramen Awards (Tokyo Ramen of the Year)', csv: '/data/try_ramen.csv' },
        editionNotes: overrideFile.editionNotes || {},
        generated: new Date().toISOString(),
        editions,
        categories,
        styles: [...new Set(out.map((s) => s.style))].sort(),
        districts: [...new Set(out.map((s) => s.district))].sort(),
        counts: Object.fromEntries(editions.map((e) => [e, out.filter((s) => s.awards.some((a) => a.edition === e)).length])),
        shops: out,
    }
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
    fs.writeFileSync(OUT_PATH, JSON.stringify(data))
    fs.copyFileSync(CSV_PATH, PUBLIC_CSV)

    const fmt = ({ r, note }) => `- ${r.name} (${r.edition}, ${r.category}, CSV line ${r.line})${note ? ` — ${note}` : ''}`
    const L = [`# TRY ramen data report`, '', `Source: \`data/try_ramen.csv\` · generated ${data.generated}`, '']
    L.push(`- Award rows: ${body.length} (${awardCount} kept)`, `- Shops on the map: ${out.length}`)
    editions.forEach((e) => L.push(`  - ${e}: ${data.counts[e]} shops`))
    L.push('')
    const section = (title, list, hint) => {
        L.push(`## ${title} (${list.length})`, '')
        if (hint) L.push(hint, '')
        list.forEach((x) => L.push(fmt(x)))
        L.push('')
    }
    section('Invalid rows (skipped)', report.invalid)
    section('No coordinates (not on map)', report.noCoords, 'Add lat/lng in the CSV or in data/try-ramen-overrides.json.')
    section('Outside the map area (not on map)', report.outOfBounds)
    section('Opening hours that need fixing', report.badHours, 'Format: "Tue-Sun 11:00-15:00, 18:00-21:00; Mon closed".')
    section('No opening hours', report.noHours)
    section('Marked closed (shown with a warning)', report.closed)
    section('Overrides applied', report.overridden)
    fs.writeFileSync(REPORT_PATH, L.join('\n'))
    console.log(L.join('\n'))
    console.log(`Wrote ${path.relative(ROOT, OUT_PATH)} (${out.length} shops)`)
}

main()
