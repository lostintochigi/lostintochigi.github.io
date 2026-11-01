import 'leaflet/dist/leaflet.css'
import '../MapKit/mapPage.scss'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import ClusterLayer from '../MapKit/ClusterLayer'
import LocateControl from '../MapKit/LocateControl'
import FlyTo from '../MapKit/FlyTo'
import { HK_BOUNDS, locateUser } from '../MapKit/geo'
import { fountainIcon, fountainTitle } from './markers'
import {
    ACCESS_LABELS,
    directionsLinks,
    dispenserOpen,
    distanceKm,
    filterVenues,
    formatDistance,
    hkNow,
    temperatureLabel,
    venueHas,
    venueOpen,
} from './logic'

const PAGE_SIZE = 40
const NEAREST_COUNT = 10

const DEFAULT_FILTERS = { publicOnly: true, openNow: false, cold: false, setting: 'any', district: '', search: '' }

function useHkClock() {
    const [now, setNow] = useState(() => hkNow())
    useEffect(() => {
        const t = setInterval(() => setNow(hkNow()), 30000)
        return () => clearInterval(t)
    }, [])
    return now
}

// Turn bare URLs in LCSD's free-text notes into links.
function Linkified({ text }) {
    const parts = text.split(/(https?:\/\/[^\s)]+)/g)
    return parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
            <a key={i} href={p} target="_blank" rel="noreferrer">
                {p.replace(/^https?:\/\//, '')}
            </a>
        ) : (
            p
        )
    )
}

function OpenBadge({ state }) {
    if (state === true) return <span className="badge badge-open">Open now</span>
    if (state === false) return <span className="badge badge-closed">Closed now</span>
    return <span className="badge badge-unknown">Hours vary</span>
}

function AccessBadge({ access }) {
    return access === 'public' ? (
        <span className="badge badge-public">
            <span aria-hidden="true">●</span> Public
        </span>
    ) : (
        <span className="badge badge-restricted">
            <span aria-hidden="true">■</span> {ACCESS_LABELS[access]}
        </span>
    )
}

function VenueDetail({ venue, now, distance, onBack }) {
    const headingRef = useRef(null)
    useEffect(() => {
        headingRef.current?.focus()
    }, [venue.id])
    const links = directionsLinks(venue)
    return (
        <section className="venue-detail" aria-labelledby="venue-detail-title">
            <button type="button" className="text-button" onClick={onBack}>
                ← Back to list
            </button>
            <h2 id="venue-detail-title" tabIndex={-1} ref={headingRef}>
                {venue.name}
            </h2>
            <p className="venue-address">
                {venue.address}
                {distance != null && <> · {formatDistance(distance)} away</>}
            </p>
            <div className="badges">
                <AccessBadge access={venue.access} />
                <OpenBadge state={venueOpen(venue, now)} />
            </div>
            {venue.flagged && (
                <p className="warning" role="note">
                    ⚠ {venue.flagged}
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

            <h3>
                {venue.dispensers.length === 1 ? 'Dispenser' : `${venue.dispensers.length} dispenser locations`}
            </h3>
            <ul className="dispensers">
                {venue.dispensers.map((d, i) => {
                    const open = dispenserOpen(d.hours, now)
                    return (
                        <li key={i}>
                            <p className="dispenser-location">{d.location || 'Location not specified'}</p>
                            <dl>
                                <dt>Count</dt>
                                <dd>
                                    {d.count} × {d.type ? d.type.toLowerCase() : 'dispenser'}
                                </dd>
                                <dt>Water</dt>
                                <dd>{temperatureLabel(d.temp)}</dd>
                                <dt>Setting</dt>
                                <dd>{d.indoor ? (d.indoor === 'indoor' ? 'Indoor' : 'Outdoor') : 'Not listed'}</dd>
                                <dt>Hours</dt>
                                <dd>
                                    {d.hours.label}{' '}
                                    {open === true && <span className="inline-open">(open now)</span>}
                                    {open === false && <span className="inline-closed">(closed now)</span>}
                                </dd>
                                {d.exception && (
                                    <>
                                        <dt>Exceptions</dt>
                                        <dd>
                                            <Linkified text={d.exception} />
                                        </dd>
                                    </>
                                )}
                                <dt>Access</dt>
                                <dd>
                                    {ACCESS_LABELS[d.access]}
                                    {d.accessNote && d.accessNote !== ACCESS_LABELS[d.access] && <> — {d.accessNote}</>}
                                </dd>
                            </dl>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}

function VenueRow({ venue, now, distance, selected, onSelect }) {
    return (
        <li>
            <button
                type="button"
                className={`venue-row${selected ? ' is-selected' : ''}`}
                onClick={() => onSelect(venue.id, 'list')}
                aria-current={selected ? 'true' : undefined}
            >
                <span className={`row-icon ${venue.access === 'public' ? 'is-public' : 'is-restricted'}`} aria-hidden="true" />
                <span className="row-main">
                    <span className="row-name">{venue.name}</span>
                    {venue.dispensers[0].location && (
                        <span className="row-where">
                            {venue.dispensers[0].location}
                            {venue.dispensers.length > 1 && ` +${venue.dispensers.length - 1} more`}
                        </span>
                    )}
                    <span className="row-meta">
                        {venue.district}
                        {distance != null && <> · {formatDistance(distance)}</>}
                        {venueHas(venue, (d) => d.temp.cold) && <> · Cold</>}
                    </span>
                </span>
                <span className="row-badges">
                    <OpenBadge state={venueOpen(venue, now)} />
                    {venue.access !== 'public' && <span className="badge badge-restricted">Restricted</span>}
                </span>
            </button>
        </li>
    )
}

export default function Fountains() {
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
    const now = useHkClock()
    const sideRef = useRef(null)

    useEffect(() => {
        document.title = 'HK Water Fountains · Animesh Harsh'
        fetch(`${process.env.PUBLIC_URL}/data/fountains.json`)
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

    const venues = useMemo(() => (data ? data.venues : []), [data])
    const byId = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues])

    const filtered = useMemo(() => {
        const list = filterVenues(venues, filters, now)
        if (!userLoc) return list
        return list
            .map((v) => ({ v, d: distanceKm(userLoc, v) }))
            .sort((a, b) => a.d - b.d)
            .map((x) => x.v)
    }, [venues, filters, now, userLoc])

    // Marker visibility shouldn't churn every clock tick unless "open now" is on.
    const visibleIds = useMemo(() => filtered.map((v) => v.id), [filtered])
    const visibleKey = visibleIds.join(',')
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableVisibleIds = useMemo(() => visibleIds, [visibleKey])

    const nearest = useMemo(() => {
        if (!userLoc) return []
        // One entry per venue (its closest fountain), so ten results are ten places.
        const seen = new Set()
        return venues
            .filter((v) => v.access === 'public' && venueOpen(v, now) === true && !v.flagged)
            .map((v) => ({ v, d: distanceKm(userLoc, v) }))
            .sort((a, b) => a.d - b.d)
            .filter(({ v }) => !seen.has(v.name) && seen.add(v.name))
            .slice(0, NEAREST_COUNT)
    }, [venues, userLoc, now])

    useEffect(() => setShown(PAGE_SIZE), [filters])

    const setFilter = (key) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setFilters((f) => ({ ...f, [key]: value }))
    }

    const select = useCallback((id, source) => {
        setSelectedId(id)
        if (source === 'list') setFocusRequest({ id, t: Date.now() })
        // On phones the detail panel sits below the map; bring it into view.
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
    const fitKey = filters.district || filters.search.trim() ? `${filters.district}|${filters.search.trim().toLowerCase()}` : ''
    const activeFilterCount =
        (filters.publicOnly ? 0 : 1) + (filters.openNow ? 1 : 0) + (filters.cold ? 1 : 0) + (filters.setting !== 'any' ? 1 : 0) + (filters.district ? 1 : 0)

    const asOf = data
        ? new Date(`${data.source.asOf}T00:00:00+08:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Hong_Kong' })
        : ''

    return (
        <div className="map-page">
            <header className="fp-header">
                <Link to="/utilities" className="back-link">
                    ← Utilities
                </Link>
                <h1>HK Water Fountains</h1>
                <p className="fp-sub">
                    Find a drinking fountain in Hong Kong's parks, sports centres, pools, beaches and libraries.
                    <span className="hk-time"> Hong Kong time: {now.label}</span>
                </p>
            </header>

            <div className="fp-layout">
                <aside className="fp-side" ref={sideRef}>
                    <div className="fp-controls">
                        <label htmlFor="fp-search" className="visually-hidden">
                            Search by venue name or district
                        </label>
                        <input
                            id="fp-search"
                            type="search"
                            placeholder="Search venue or district"
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
                                aria-controls="fp-filters"
                                onClick={() => setFiltersOpen((o) => !o)}
                            >
                                Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
                            </button>
                        </div>
                        {geoStatus.message && (
                            <p className={`geo-msg ${geoStatus.state === 'error' ? 'is-error' : ''}`} role="status">
                                {geoStatus.message}
                            </p>
                        )}

                        <fieldset id="fp-filters" className={`fp-filters${filtersOpen ? ' is-open' : ''}`}>
                            <legend className="visually-hidden">Filters</legend>
                            <label className="check">
                                <input type="checkbox" checked={filters.publicOnly} onChange={setFilter('publicOnly')} />
                                Public access only
                            </label>
                            <label className="check">
                                <input type="checkbox" checked={filters.openNow} onChange={setFilter('openNow')} />
                                Open now (Hong Kong time)
                            </label>
                            <label className="check">
                                <input type="checkbox" checked={filters.cold} onChange={setFilter('cold')} />
                                Cold water available
                            </label>
                            <fieldset className="radio-group">
                                <legend>Indoor / outdoor</legend>
                                {[
                                    ['any', 'Any'],
                                    ['indoor', 'Indoor'],
                                    ['outdoor', 'Outdoor'],
                                ].map(([val, label]) => (
                                    <label key={val} className="radio">
                                        <input
                                            type="radio"
                                            name="fp-setting"
                                            value={val}
                                            checked={filters.setting === val}
                                            onChange={setFilter('setting')}
                                        />
                                        {label}
                                    </label>
                                ))}
                            </fieldset>
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
                            {activeFilterCount > 0 && (
                                <button type="button" className="text-button" onClick={() => setFilters((f) => ({ ...DEFAULT_FILTERS, search: f.search }))}>
                                    Reset filters
                                </button>
                            )}
                        </fieldset>
                    </div>

                    {selected ? (
                        <VenueDetail
                            venue={selected}
                            now={now}
                            distance={userLoc ? distanceKm(userLoc, selected) : null}
                            onBack={() => setSelectedId(null)}
                        />
                    ) : (
                        <>
                            {nearest.length > 0 && (
                                <section className="nearest" aria-labelledby="nearest-title">
                                    <h2 id="nearest-title">Nearest open public fountains</h2>
                                    <ol>
                                        {nearest.map(({ v, d }) => (
                                            <li key={v.id}>
                                                <button type="button" className="nearest-row" onClick={() => select(v.id, 'list')}>
                                                    <span className="row-name">{v.name}</span>
                                                    <span className="distance">{formatDistance(d)}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ol>
                                </section>
                            )}
                            {userLoc && nearest.length === 0 && geoStatus.state === 'ok' && (
                                <p className="geo-msg">No public fountains are open right now.</p>
                            )}

                            <section className="results" aria-labelledby="results-title">
                                <h2 id="results-title" className="results-count" aria-live="polite">
                                    {error
                                        ? "Couldn't load fountain data."
                                        : !data
                                        ? 'Loading fountains…'
                                        : `${filtered.length} location${filtered.length === 1 ? '' : 's'}${userLoc ? ', nearest first' : ''}`}
                                </h2>
                                <ul className="venue-list">
                                    {filtered.slice(0, shown).map((v) => (
                                        <VenueRow
                                            key={v.id}
                                            venue={v}
                                            now={now}
                                            distance={userLoc ? distanceKm(userLoc, v) : null}
                                            selected={v.id === selectedId}
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
                            Fountains may be closed for cleaning or maintenance. Hours shown are the official listing and don't include
                            public holidays or special closures.
                        </p>
                        <p>
                            Data:{' '}
                            <a href={data?.source.url || 'https://data.gov.hk/en-data/dataset/hk-lcsd-facwd-fac-wd-list'} target="_blank" rel="noreferrer">
                                Water Dispensers in LCSD venues
                            </a>
                            , Leisure and Cultural Services Department, via DATA.GOV.HK
                            {asOf && <>. Data as of {asOf}</>}.
                        </p>
                    </footer>
                </aside>

                <div className="fp-map" role="region" aria-label="Map of drinking fountains">
                    <MapContainer bounds={HK_BOUNDS} scrollWheelZoom className="fp-leaflet" minZoom={10}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {data && (
                            <ClusterLayer
                                items={venues}
                                iconFor={fountainIcon}
                                titleFor={fountainTitle}
                                visibleIds={stableVisibleIds}
                                selectedId={selectedId}
                                onSelect={select}
                                focusRequest={focusRequest}
                                fitKey={fitKey}
                                defaultBounds={HK_BOUNDS}
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
                            <span className="row-icon is-public" /> Public
                        </span>
                        <span>
                            <span className="row-icon is-restricted" /> Restricted
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
