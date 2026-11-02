import 'leaflet/dist/leaflet.css'
import '../MapKit/mapPage.scss'
import '../Michelin/index.scss'
import './index.scss'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import ClusterLayer from '../MapKit/ClusterLayer'
import LocateControl from '../MapKit/LocateControl'
import FlyTo from '../MapKit/FlyTo'
import { directionsLinks, distanceKm, formatDistance, locateUser } from '../MapKit/geo'
import { openStatus, zonedNow } from '../Michelin/hours'
import OpeningHours from '../Michelin/OpeningHours'
import { ramenIcon, ramenTitle } from './markers'
import { DEFAULT_FILTERS, activeFilterCount, awardLabel, filterShops, matchingAwards, shortEdition, styleLabel } from './logic'

const PAGE_SIZE = 40
const NEAREST_COUNT = 10
const TOKYO = { timeLong: 'Tokyo time', place: 'Tokyo' }
// Central Tokyo for the first view; shops further out are reachable by zooming or filtering.
const START_BOUNDS = [
    [35.6, 139.6],
    [35.78, 139.85],
]
const AREA_BOUNDS = [
    [35.2, 139.0],
    [36.1, 140.3],
]

function RankChip({ s }) {
    return (
        <span className={`ramen-chip${s.grandPrize ? ' is-gp' : s.bestRank <= 3 ? ' is-top' : ''}`} aria-hidden="true">
            {s.grandPrize ? 'GP' : s.bestRank < 99 ? `#${s.bestRank}` : '★'}
        </span>
    )
}

function ShopDetail({ s, distance, now, onBack }) {
    const headingRef = useRef(null)
    useEffect(() => {
        headingRef.current?.focus()
    }, [s.id])
    const links = s.approximate
        ? directionsLinks({ query: `${s.nameJa || s.name} ${s.addressJa || s.address}` })
        : directionsLinks({ lat: s.lat, lng: s.lng })
    const search = `https://www.google.com/search?q=${encodeURIComponent(`${s.nameJa || s.name} ラーメン`)}`
    return (
        <section className="venue-detail" aria-labelledby="ramen-detail-title">
            <button type="button" className="text-button" onClick={onBack}>
                ← Back to list
            </button>
            <h2 id="ramen-detail-title" tabIndex={-1} ref={headingRef}>
                {s.name}
                {s.nameJa && s.nameJa !== s.name && (
                    <span className="mic-name-ja" lang="ja">
                        {' '}
                        {s.nameJa}
                    </span>
                )}
            </h2>
            {s.closed && (
                <p className="warning" role="note">
                    ⚠ Reported closed{s.notes ? `: ${s.notes}` : ''}.
                </p>
            )}
            <ul className="ramen-awards" aria-label="TRY awards">
                {s.awards.map((a) => (
                    <li key={`${a.edition}|${a.category}`}>
                        <span className={`ramen-award-rank${a.rank === 1 ? ' is-first' : ''}`}>
                            {a.category === 'Grand Prize' && a.rank === 1 ? '🏆' : a.rank ? `#${a.rank}` : '•'}
                        </span>
                        <span>
                            {a.category}
                            <span className="ramen-award-meta">
                                TRY {a.edition}
                                {a.categoryJa && (
                                    <>
                                        {' · '}
                                        <span lang="ja">{a.categoryJa}</span>
                                    </>
                                )}
                            </span>
                        </span>
                    </li>
                ))}
            </ul>
            {s.description && <p className="mic-desc">{s.description}</p>}
            <dl className="mic-facts">
                <dt>Style</dt>
                <dd>{styleLabel(s.style)}</dd>
                <dt>Address</dt>
                <dd>
                    {s.address}
                    {s.addressJa && (
                        <>
                            <br />
                            <span lang="ja" className="mic-muted-inline">
                                {s.addressJa}
                            </span>
                        </>
                    )}
                </dd>
                {distance != null && (
                    <>
                        <dt>Distance</dt>
                        <dd>{formatDistance(distance)}</dd>
                    </>
                )}
            </dl>
            <OpeningHours r={s} now={now} city={TOKYO} />
            {s.approximate && (
                <p className="warning" role="note">
                    ⚠ The map position is approximate. Use the address to find the shop.
                </p>
            )}
            <div className="directions">
                <a className="flat-btn" href={links.google} target="_blank" rel="noreferrer">
                    Directions (Google Maps)
                </a>
                <a className="flat-btn" href={links.apple} target="_blank" rel="noreferrer">
                    Directions (Apple Maps)
                </a>
            </div>
            <p className="mic-search">
                <a href={search} target="_blank" rel="noreferrer">
                    Search the web for menus, photos and queues ↗
                </a>
            </p>
        </section>
    )
}

function ShopRow({ s, filters, distance, now, selected, onSelect }) {
    const status = openStatus(s.week, now)
    const shown = matchingAwards(s, filters)
    return (
        <li>
            <button
                type="button"
                className={`venue-row${selected ? ' is-selected' : ''}`}
                onClick={() => onSelect(s.id, 'list')}
                aria-current={selected ? 'true' : undefined}
            >
                <RankChip s={s} />
                <span className="row-main">
                    <span className="row-name">{s.name}</span>
                    <span className="row-where">
                        {shown
                            .slice(0, 2)
                            .map((a) => `${awardLabel(a)} (${shortEdition(a.edition)})`)
                            .join(' · ')}
                        {shown.length > 2 && ` · +${shown.length - 2} more`}
                    </span>
                    <span className="row-meta">
                        {s.district}
                        {distance != null && <> · {formatDistance(distance)}</>}
                        {s.closed ? (
                            <>
                                {' · '}
                                <span className="row-status is-closed">Reported closed</span>
                            </>
                        ) : (
                            status.state !== 'unknown' && (
                                <>
                                    {' · '}
                                    <span className={`row-status is-${status.state}`}>{status.state === 'open' ? 'Open now' : 'Closed now'}</span>
                                </>
                            )
                        )}
                    </span>
                </span>
            </button>
        </li>
    )
}

export default function Ramen() {
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)
    const [filters, setFilters] = useState(DEFAULT_FILTERS)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [selectedId, setSelectedId] = useState(null)
    const [focusRequest, setFocusRequest] = useState(null)
    const [shown, setShown] = useState(PAGE_SIZE)
    const [userLoc, setUserLoc] = useState(null)
    const [geoStatus, setGeoStatus] = useState({ state: 'idle', message: '' })
    const [flyTarget, setFlyTarget] = useState(null)
    const [now, setNow] = useState(() => zonedNow('Asia/Tokyo'))
    const sideRef = useRef(null)

    useEffect(() => {
        const t = setInterval(() => setNow(zonedNow('Asia/Tokyo')), 60 * 1000)
        return () => clearInterval(t)
    }, [])

    useEffect(() => {
        document.title = 'TRY Ramen Map · Animesh Harsh'
        fetch(`${process.env.PUBLIC_URL}/data/try-ramen.json`)
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.json()
            })
            .then(setData)
            .catch((e) => setError(e.message))
        return () => {
            document.title = 'Animesh Harsh'
        }
    }, [])

    const shops = useMemo(() => (data ? data.shops : []), [data])
    const byId = useMemo(() => new Map(shops.map((s) => [s.id, s])), [shops])

    // Categories available for the chosen edition.
    const categories = useMemo(() => {
        if (!data) return []
        const set = new Set(
            shops.flatMap((s) => s.awards.filter((a) => !filters.edition || a.edition === filters.edition).map((a) => a.category))
        )
        return data.categories.filter((c) => set.has(c))
    }, [data, shops, filters.edition])

    const filtered = useMemo(() => {
        const list = filterShops(shops, filters, now)
        if (!userLoc) return list
        return list
            .map((s) => ({ s, d: distanceKm(userLoc, s) }))
            .sort((a, b) => a.d - b.d)
            .map((x) => x.s)
    }, [shops, filters, userLoc, now])

    const visibleIds = useMemo(() => filtered.map((s) => s.id), [filtered])
    const nearest = useMemo(
        () => (userLoc ? filtered.slice(0, NEAREST_COUNT).map((s) => ({ s, d: distanceKm(userLoc, s) })) : []),
        [filtered, userLoc]
    )

    useEffect(() => setShown(PAGE_SIZE), [filters])

    const setFilter = (key) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setFilters((f) => {
            const next = { ...f, [key]: value }
            // Drop a category that doesn't exist in the newly chosen edition.
            if (key === 'edition' && next.category && value) {
                const exists = shops.some((s) => s.awards.some((a) => a.edition === value && a.category === next.category))
                if (!exists) next.category = ''
            }
            return next
        })
    }

    const select = useCallback((id, source) => {
        setSelectedId(id)
        if (source === 'list') setFocusRequest({ id, t: Date.now() })
        if (source === 'map' && window.matchMedia('(max-width: 899px)').matches) {
            setTimeout(() => sideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
        }
    }, [])

    const locate = () =>
        locateUser(
            (status) => {
                setGeoStatus({ state: status.state, message: status.message })
                if (status.loc) {
                    setUserLoc(status.loc)
                    setFlyTarget({ ...status.loc, zoom: status.inHk ? 15 : 11, t: Date.now() })
                }
            },
            { bounds: AREA_BOUNDS, name: 'the Tokyo area' }
        )

    const selected = selectedId ? byId.get(selectedId) : null
    const nFilters = activeFilterCount(filters)
    const fitKey = [filters.edition, filters.category, filters.topOnly, filters.style, filters.district, filters.search.trim().toLowerCase()].some(Boolean)
        ? `${filters.edition}|${filters.category}|${filters.topOnly}|${filters.style}|${filters.district}|${filters.search.trim().toLowerCase()}`
        : ''

    return (
        <div className="map-page michelin-page ramen-page">
            <header className="fp-header">
                <Link to="/utilities" className="back-link">
                    ← Utilities
                </Link>
                <h1>TRY Ramen Map</h1>
                <p className="fp-sub">
                    Award-winning shops from the TRY Ramen Awards (Tokyo Ramen of the Year)
                    {data && data.editions.length > 0 && (
                        <>
                            , {data.editions.length > 1 ? 'editions' : 'edition'} {[...data.editions].reverse().join(', ')}.
                            <span className="mic-counts"> {shops.length} shops.</span>
                        </>
                    )}
                </p>
            </header>

            <div className="fp-layout">
                <aside className="fp-side" ref={sideRef}>
                    <div className="fp-controls">
                        <label htmlFor="ramen-search" className="visually-hidden">
                            Search by shop, style, area or category
                        </label>
                        <input
                            id="ramen-search"
                            type="search"
                            placeholder="Search shop, style, area or category"
                            value={filters.search}
                            onChange={setFilter('search')}
                            autoComplete="off"
                        />
                        <label className="select ramen-edition">
                            Edition
                            <select value={filters.edition} onChange={setFilter('edition')}>
                                <option value="">All editions</option>
                                {(data?.editions || []).map((e) => (
                                    <option key={e} value={e}>
                                        TRY {e} ({data.counts[e]} shops{data.editionNotes[e] ? ', partial' : ''})
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="control-row">
                            <button type="button" className="flat-btn" onClick={locate} disabled={geoStatus.state === 'loading'}>
                                {geoStatus.state === 'loading' ? 'Locating…' : '◎ Near me'}
                            </button>
                            <button
                                type="button"
                                className="flat-btn filters-toggle"
                                aria-expanded={filtersOpen}
                                aria-controls="ramen-filters"
                                onClick={() => setFiltersOpen((o) => !o)}
                            >
                                Filters{nFilters - (filters.edition ? 1 : 0) > 0 ? ` (${nFilters - (filters.edition ? 1 : 0)})` : ''}
                            </button>
                        </div>
                        {geoStatus.message && (
                            <p className={`geo-msg ${geoStatus.state === 'error' ? 'is-error' : ''}`} role="status">
                                {geoStatus.message}
                            </p>
                        )}

                        <fieldset id="ramen-filters" className={`fp-filters${filtersOpen ? ' is-open' : ''}`}>
                            <legend className="visually-hidden">Filters</legend>
                            <label className="select">
                                Award category
                                <select value={filters.category} onChange={setFilter('category')}>
                                    <option value="">All categories</option>
                                    {categories.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="check">
                                <input type="checkbox" checked={filters.topOnly} onChange={setFilter('topOnly')} />
                                Top 3 in a category only
                            </label>
                            <label className="select">
                                Ramen style
                                <select value={filters.style} onChange={setFilter('style')}>
                                    <option value="">All styles</option>
                                    {(data?.styles || []).map((s) => (
                                        <option key={s} value={s}>
                                            {styleLabel(s)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="select">
                                Ward / city
                                <select value={filters.district} onChange={setFilter('district')}>
                                    <option value="">All areas</option>
                                    {(data?.districts || []).map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="check">
                                <input type="checkbox" checked={filters.openNow} onChange={setFilter('openNow')} />
                                Open now <span className="count">(Tokyo time, {now.label})</span>
                            </label>
                            <label className="check">
                                <input type="checkbox" checked={filters.hideClosed} onChange={setFilter('hideClosed')} />
                                Hide shops reported closed
                            </label>
                            {nFilters > 0 && (
                                <button
                                    type="button"
                                    className="text-button"
                                    onClick={() => setFilters((f) => ({ ...DEFAULT_FILTERS, search: f.search }))}
                                >
                                    Reset filters
                                </button>
                            )}
                        </fieldset>
                    </div>

                    {data && filters.edition && data.editionNotes[filters.edition] && (
                        <p className="warning ramen-edition-note" role="note">
                            ⚠ {data.editionNotes[filters.edition]}
                        </p>
                    )}
                    {selected ? (
                        <ShopDetail
                            s={selected}
                            distance={userLoc ? distanceKm(userLoc, selected) : null}
                            now={now}
                            onBack={() => setSelectedId(null)}
                        />
                    ) : (
                        <>
                            {nearest.length > 0 && (
                                <section className="nearest" aria-labelledby="ramen-nearest-title">
                                    <h2 id="ramen-nearest-title">Nearest to you</h2>
                                    <ol>
                                        {nearest.map(({ s, d }) => (
                                            <li key={s.id}>
                                                <button type="button" className="nearest-row" onClick={() => select(s.id, 'list')}>
                                                    <span className="row-name">{s.name}</span>
                                                    <span className="distance">{formatDistance(d)}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ol>
                                </section>
                            )}

                            <section className="results" aria-labelledby="ramen-results-title">
                                <h2 id="ramen-results-title" className="results-count" aria-live="polite">
                                    {error
                                        ? "Couldn't load ramen data."
                                        : !data
                                        ? 'Loading shops…'
                                        : `${filtered.length} shop${filtered.length === 1 ? '' : 's'}${userLoc ? ', nearest first' : ''}`}
                                </h2>
                                <ul className="venue-list">
                                    {filtered.slice(0, shown).map((s) => (
                                        <ShopRow
                                            key={s.id}
                                            s={s}
                                            filters={filters}
                                            distance={userLoc ? distanceKm(userLoc, s) : null}
                                            now={now}
                                            selected={s.id === selectedId}
                                            onSelect={select}
                                        />
                                    ))}
                                </ul>
                                {filtered.length > shown && (
                                    <button type="button" className="flat-btn show-more" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                                        Show more ({filtered.length - shown} left)
                                    </button>
                                )}
                            </section>
                        </>
                    )}

                    <footer className="fp-footer">
                        <p>
                            Awards are from the TRY Ramen Awards (業界最高権威 TRYラーメン大賞, Kodansha), compiled from published
                            results. Descriptions are our own; opening hours come mostly from Tabelog and shop pages. Ramen shops
                            often close early when the soup runs out, so check before you go.
                        </p>
                        {data &&
                            Object.entries(data.editionNotes).map(([e, note]) => (
                                <p key={e}>
                                    TRY {e}: {note}
                                </p>
                            ))}
                        <p>
                            An independent fan project, not affiliated with TRY or Kodansha.{' '}
                            {data && (
                                <a href={data.source.csv} download>
                                    Download the list (CSV)
                                </a>
                            )}
                        </p>
                    </footer>
                </aside>

                <div className="fp-map" role="region" aria-label="Map of TRY award-winning ramen shops">
                    <MapContainer bounds={START_BOUNDS} scrollWheelZoom className="fp-leaflet" minZoom={8}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {data && (
                            <ClusterLayer
                                items={shops}
                                visibleIds={visibleIds}
                                selectedId={selectedId}
                                onSelect={select}
                                focusRequest={focusRequest}
                                fitKey={fitKey}
                                defaultBounds={START_BOUNDS}
                                iconFor={ramenIcon}
                                titleFor={ramenTitle}
                                maxClusterRadius={35}
                            />
                        )}
                        {userLoc && (
                            <CircleMarker
                                center={[userLoc.lat, userLoc.lng]}
                                radius={8}
                                pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#1e88e5', fillOpacity: 1 }}
                            />
                        )}
                        <FlyTo target={flyTarget} />
                        <LocateControl onLocate={locate} busy={geoStatus.state === 'loading'} />
                    </MapContainer>
                    <div className="map-legend" aria-hidden="true">
                        <span>
                            <span className="ramen-chip is-gp">GP</span> Grand Prize
                        </span>
                        <span>
                            <span className="ramen-chip is-top">#1</span> Top 3
                        </span>
                        <span>
                            <span className="ramen-chip">#5</span> Ranked
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
