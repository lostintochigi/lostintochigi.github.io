import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'

// Public = round yellow pin with a water drop. Restricted = grey square with a
// lock. Shape and glyph differ, not just colour.
const DROP = '<path d="M12 5c-2.6 3.3-4.5 5.9-4.5 8.2a4.5 4.5 0 0 0 9 0C16.5 10.9 14.6 8.3 12 5z" fill="#052409"/>'
const LOCK =
    '<rect x="7.5" y="11" width="9" height="7" rx="1" fill="#1b1b1b"/><path d="M9.5 11V9a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="#1b1b1b" stroke-width="1.8"/>'

function iconFor(venue, selected) {
    const isPublic = venue.access === 'public'
    const size = selected ? 38 : 28
    const ring = selected ? '#ffffff' : '#052409'
    const shape = isPublic
        ? `<circle cx="12" cy="12" r="10.5" fill="#ffd700" stroke="${ring}" stroke-width="2"/>${DROP}`
        : `<rect x="2" y="2" width="20" height="20" rx="3" fill="#b8c2cc" stroke="${ring}" stroke-width="2"/>${LOCK}`
    return L.divIcon({
        className: `fountain-marker${selected ? ' is-selected' : ''}`,
        html: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${shape}</svg>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    })
}

function clusterIcon(cluster) {
    const n = cluster.getChildCount()
    const size = n < 10 ? 34 : n < 100 ? 40 : 48
    return L.divIcon({
        className: 'fountain-cluster',
        html: `<span>${n}</span>`,
        iconSize: [size, size],
    })
}

export default function ClusterLayer({ venues, visibleIds, selectedId, onSelect, focusRequest, fitKey, defaultBounds }) {
    const map = useMap()
    const groupRef = useRef(null)
    const markersRef = useRef(new Map())
    const prevSelected = useRef(null)
    const onSelectRef = useRef(onSelect)
    onSelectRef.current = onSelect

    // Create every marker once.
    useEffect(() => {
        const group = L.markerClusterGroup({
            iconCreateFunction: clusterIcon,
            showCoverageOnHover: false,
            maxClusterRadius: 45,
            chunkedLoading: true,
        })
        const markers = new Map()
        venues.forEach((v) => {
            const label = `${v.name} (${v.access === 'public' ? 'public' : 'restricted access'})`
            const m = L.marker([v.lat, v.lng], { icon: iconFor(v, false), title: label, alt: label, keyboard: true })
            m.on('click', () => onSelectRef.current(v.id, 'map'))
            markers.set(v.id, m)
        })
        groupRef.current = group
        markersRef.current = markers
        map.addLayer(group)
        return () => {
            map.removeLayer(group)
        }
    }, [map, venues])

    // Show only the markers that pass the filters. When the district/search
    // changes, zoom to fit the results (or back to all of Hong Kong).
    const lastFitKey = useRef(fitKey)
    useEffect(() => {
        const group = groupRef.current
        if (!group) return
        group.clearLayers()
        group.addLayers(visibleIds.map((id) => markersRef.current.get(id)).filter(Boolean))
        if (fitKey !== lastFitKey.current) {
            lastFitKey.current = fitKey
            if (fitKey && visibleIds.length) map.fitBounds(group.getBounds(), { padding: [30, 30], maxZoom: 16 })
            else if (!fitKey) map.fitBounds(defaultBounds)
        }
    }, [visibleIds, venues, fitKey, map, defaultBounds])

    // Highlight the selected marker.
    useEffect(() => {
        const markers = markersRef.current
        const byId = new Map(venues.map((v) => [v.id, v]))
        if (prevSelected.current && markers.get(prevSelected.current)) {
            markers.get(prevSelected.current).setIcon(iconFor(byId.get(prevSelected.current), false))
        }
        if (selectedId && markers.get(selectedId)) {
            const m = markers.get(selectedId)
            m.setIcon(iconFor(byId.get(selectedId), true))
            m.setZIndexOffset(1000)
        }
        prevSelected.current = selectedId
    }, [selectedId, venues])

    // Zoom to a marker when the list asks for it (opens its cluster if needed).
    useEffect(() => {
        if (!focusRequest) return
        const m = markersRef.current.get(focusRequest.id)
        const group = groupRef.current
        if (!m || !group || !group.hasLayer(m)) return
        group.zoomToShowLayer(m, () => {
            if (map.getZoom() < 16) map.setView(m.getLatLng(), 16)
        })
    }, [focusRequest, map])

    return null
}
