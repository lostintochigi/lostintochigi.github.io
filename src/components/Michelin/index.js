import 'leaflet/dist/leaflet.css'
import '../MapKit/mapPage.scss'
import './index.scss'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import ClusterLayer from '../MapKit/ClusterLayer'
import LocateControl from '../MapKit/LocateControl'
import FlyTo from '../MapKit/FlyTo'
import { HK_BOUNDS, directionsLinks, distanceKm, formatDistance, locateUser } from '../MapKit/geo'
import { michelinIcon, michelinTitle } from './markers'
import { DEFAULT_FILTERS, DISTINCTIONS, activeFilterCount, filterRestaurants } from './logic'

const PAGE_SIZE = 40
const NEAREST_COUNT = 10

function DistinctionBadge({ r }) {
    return (
        <>
            <span className={`badge ${r.stars ? 'badge-star' : 'badge-bib'}`}>
                {r.stars ? `${'★'.repeat(r.stars)} ${r.distinction}` : 'Bib Gourmand'}
            </span>
            {r.greenStar && <span className="badge badge-green">Green Star</span>}
        </>
    )
}

function RestaurantDetail({ r, distance, onBack }) {
    const headingRef = useRef(null)
    useEffect(() => {
        headingRef.current?.focus()
    }, [r.id])
    const links = r.flagged
        ? directionsLinks({ query: `${r.name}, ${r.address}, Hong Kong` })
        : directionsLinks({ lat: r.lat, lng: r.lng })
    const search = `https://www.google.com/search?q=${encodeURIComponent(`${r.name} Hong Kong`)}`
    return (
        <section className="venue-detail" aria-labelledby="mic-detail-title">
            <button type="button" className="text-button" onClick={onBack}>
                ← Back to list
            </button>
            <h2 id="mic-detail-title" tabIndex={-1} ref={headingRef}>
                {r.name}
            </h2>
            <div className="badges">
                <DistinctionBadge r={r} />
            </div>
            <dl className="mic-facts">
                <dt>Cuisine</dt>
                <dd>{r.cuisine}</dd>
                <dt>Address</dt>
                <dd>{r.address}</dd>
                <dt>District</dt>
                <dd>{r.district}</dd>
                {distance != null && (
                    <>
                        <dt>Distance</dt>
                        <dd>{formatDistance(distance)}</dd>
                    </>
                )}
            </dl>
            {(r.flagged || r.approximate) && (
                <p className="warning" role="note">
                    ⚠ {r.flagged || 'The map position is approximate. Use the address to find the entrance.'}
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
                    Search the web for menus, prices and booking ↗
                </a>
            </p>
        </section>
    )
}

function RestaurantRow({ r, distance, selected, onSelect }) {
    return (
        <li>
            <button
                type="button"
                className={`venue-row${selected ? ' is-selected' : ''}`}
                onClick={() => onSelect(r.id, 'list')}
                aria-current={selected ? 'true' : undefined}
            >
                <span className={`mic-chip ${r.stars ? 'is-star' : 'is-bib'}`} aria-hidden="true">
                    {r.stars ? `${r.stars}★` : 'Bib'}
                </span>
                <span className="row-main">
                    <span className="row-name">{r.name}</span>
                    <span className="row-where">{r.cuisine}</span>
                    <span className="row-meta">
                        {r.district}
                        {distance != null && <> · {formatDistance(distance)}</>}
                        {r.greenStar && <> · Green Star</>}
                    </span>
                </span>
                <span className="visually-hidden">{r.distinction}</span>
            </button>
        </li>
    )
}

export default function Michelin() {
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
    const sideRef = useRef(null)

    useEffect(() => {
        document.title = 'HK Michelin Map · Animesh Harsh'
        fetch(`${process.env.PUBLIC_URL}/data/michelin-hk.json`)
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

    const restaurants = useMemo(() => (data ? data.restaurants : []), [data])
    const byId = useMemo(() => new Map(restaurants.map((r) => [r.id, r])), [restaurants])

    const filtered = useMemo(() => {
        const list = filterRestaurants(restaurants, filters)
        if (!userLoc) return list
        return list
            .map((r) => ({ r, d: distanceKm(userLoc, r) }))
            .sort((a, b) => a.d - b.d)
            .map((x) => x.r)
    }, [restaurants, filters, userLoc])

    const visibleIds = useMemo(() => filtered.map((r) => r.id), [filtered])

    // Nearest within the current distinction/cuisine filters.
    const nearest = useMemo(() => {
        if (!userLoc) return []
        return filtered
            .filter((r) => !r.flagged)
            .slice(0, NEAREST_COUNT)
            .map((r) => ({ r, d: distanceKm(userLoc, r) }))
    }, [filtered, userLoc])

    useEffect(() => setShown(PAGE_SIZE), [filters])

    const setFilter = (key) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setFilters((f) => ({ ...f, [key]: value }))
    }
    const toggleDistinction = (key) => (e) =>
        setFilters((f) => ({
            ...f,
            distinctions: e.target.checked ? [...f.distinctions, key] : f.distinctions.filter((d) => d !== key),
        }))

    const select = useCallback((id, source) => {
        setSelectedId(id)
        if (source === 'list') setFocusRequest({ id, t: Date.now() })
        if (source === 'map' && window.matchMedia('(max-width: 899px)').matches) {
            setTimeout(() => sideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
        }
    }, [])

    const locate = () =>
        locateUser((status) => {
            setGeoStatus({ state: status.state, message: status.message })
            if (status.loc) {
                setUserLoc(status.loc)
                setFlyTarget({ ...status.loc, zoom: status.inHk ? 15 : 11, t: Date.now() })
            }
        })

    const selected = selectedId ? byId.get(selectedId) : null
    const nFilters = activeFilterCount(filters)
    const fitKey =
        filters.district || filters.cuisine || filters.search.trim()
            ? `${filters.district}|${filters.cuisine}|${filters.search.trim().toLowerCase()}`
            : ''

    return (
        <div className="map-page michelin-page">
            <header className="fp-header">
                <Link to="/utilities" className="back-link">
                    ← Utilities
                </Link>
                <h1>HK Michelin Map</h1>
                <p className="fp-sub">
                    Every Hong Kong restaurant with MICHELIN stars or a Bib Gourmand in the {data ? data.source.edition.replace('MICHELIN Guide ', '') : '2026'} guide.
                    {data && (
                        <span className="mic-counts">
                            {' '}
                            {DISTINCTIONS.map((d) => `${data.counts[d.key]} × ${d.short}`).join(' · ')}
                        </span>
                    )}
                </p>
            </header>

            <div className="fp-layout">
                <aside className="fp-side" ref={sideRef}>
                    <div className="fp-controls">
                        <label htmlFor="mic-search" className="visually-hidden">
                            Search by restaurant, cuisine or district
                        </label>
                        <input
                            id="mic-search"
                            type="search"
                            placeholder="Search restaurant, cuisine or district"
                            value={filters.search}
                            onChange={setFilter('search')}
                            autoComplete="off"
                        />
                        <div className="control-row">
                            <button type="button" className="flat-btn" onClick={locate} disabled={geoStatus.state === 'loading'}>
                                {geoStatus.state === 'loading' ? 'Locating…' : '◎ Near me'}
                            </button>
                            <button
                                type="button"
                                className="flat-btn filters-toggle"
                                aria-expanded={filtersOpen}
                                aria-controls="mic-filters"
                                onClick={() => setFiltersOpen((o) => !o)}
                            >
                                Filters{nFilters ? ` (${nFilters})` : ''}
                            </button>
                        </div>
                        {geoStatus.message && (
                            <p className={`geo-msg ${geoStatus.state === 'error' ? 'is-error' : ''}`} role="status">
                                {geoStatus.message}
                            </p>
                        )}

                        <fieldset id="mic-filters" className={`fp-filters${filtersOpen ? ' is-open' : ''}`}>
                            <legend className="visually-hidden">Filters</legend>
                            <fieldset className="radio-group">
                                <legend>Distinction</legend>
                                {DISTINCTIONS.map((d) => (
                                    <label key={d.key} className="check">
                                        <input
                                            type="checkbox"
                                            checked={filters.distinctions.includes(d.key)}
                                            onChange={toggleDistinction(d.key)}
                                        />
                                        {d.label}
                                        {data && <span className="count">({data.counts[d.key]})</span>}
                                    </label>
                                ))}
                            </fieldset>
                            <label className="check">
                                <input type="checkbox" checked={filters.greenOnly} onChange={setFilter('greenOnly')} />
                                MICHELIN Green Star only (sustainability)
                            </label>
                            <label className="select">
                                Cuisine
                                <select value={filters.cuisine} onChange={setFilter('cuisine')}>
                                    <option value="">All cuisines</option>
                                    {(data?.cuisines || []).map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="select">
                                District
                                <select value={filters.district} onChange={setFilter('district')}>
                                    <option value="">All districts</option>
                                    {(data?.districts || []).map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
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

                    {selected ? (
                        <RestaurantDetail
                            r={selected}
                            distance={userLoc ? distanceKm(userLoc, selected) : null}
                            onBack={() => setSelectedId(null)}
                        />
                    ) : (
                        <>
                            {nearest.length > 0 && (
                                <section className="nearest" aria-labelledby="mic-nearest-title">
                                    <h2 id="mic-nearest-title">Nearest to you</h2>
                                    <ol>
                                        {nearest.map(({ r, d }) => (
                                            <li key={r.id}>
                                                <button type="button" className="nearest-row" onClick={() => select(r.id, 'list')}>
                                                    <span className="row-name">
                                                        {r.name} <span className={`nearest-tag${r.stars ? "" : " is-bib"}`}>{r.stars ? `${r.stars}★` : "Bib"}</span>
                                                    </span>
                                                    <span className="distance">{formatDistance(d)}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ol>
                                </section>
                            )}

                            <section className="results" aria-labelledby="mic-results-title">
                                <h2 id="mic-results-title" className="results-count" aria-live="polite">
                                    {error
                                        ? "Couldn't load restaurant data."
                                        : !data
                                        ? 'Loading restaurants…'
                                        : `${filtered.length} restaurant${filtered.length === 1 ? '' : 's'}${userLoc ? ', nearest first' : ''}`}
                                </h2>
                                <ul className="venue-list">
                                    {filtered.slice(0, shown).map((r) => (
                                        <RestaurantRow
                                            key={r.id}
                                            r={r}
                                            distance={userLoc ? distanceKm(userLoc, r) : null}
                                            selected={r.id === selectedId}
                                            onSelect={select}
                                        />
                                    ))}
                                </ul>
                                {filtered.length > shown && (
                                    <button type="button" className="flat-btn show-more" onClick={() => setShown((s) => s + PAGE_SIZE)}>
                                        Show more ({filtered.length - shown} left)
                                    </button>
                                )}
                            </section>
                        </>
                    )}

                    <footer className="fp-footer">
                        <p>
                            Distinctions are from the {data?.source.edition || 'MICHELIN Guide Hong Kong & Macau 2026'}, compiled from
                            published coverage of the announcement. Restaurants close, move and change hours, so check before you go.
                            Map positions are matched from addresses and may be approximate.
                        </p>
                        <p>
                            This is an independent fan project, not affiliated with or endorsed by Michelin.{' '}
                            {data && (
                                <a href={data.source.csv} download>
                                    Download the list (CSV)
                                </a>
                            )}
                        </p>
                    </footer>
                </aside>

                <div className="fp-map" role="region" aria-label="Map of Michelin restaurants">
                    <MapContainer bounds={HK_BOUNDS} scrollWheelZoom className="fp-leaflet" minZoom={10}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {data && (
                            <ClusterLayer
                                items={restaurants}
                                visibleIds={visibleIds}
                                selectedId={selectedId}
                                onSelect={select}
                                focusRequest={focusRequest}
                                fitKey={fitKey}
                                defaultBounds={HK_BOUNDS}
                                iconFor={michelinIcon}
                                titleFor={michelinTitle}
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
                            <span className="mic-chip is-star">1★</span> Stars
                        </span>
                        <span>
                            <span className="mic-chip is-bib">Bib</span> Bib Gourmand
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
