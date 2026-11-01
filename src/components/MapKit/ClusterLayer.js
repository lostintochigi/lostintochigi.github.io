import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'

// Clustered markers for map utilities. Each page supplies its own marker look:
//   iconFor(item, selected) -> L.Icon, titleFor(item) -> accessible label.
// Items need { id, lat, lng }.

function defaultClusterIcon(cluster) {
    const n = cluster.getChildCount()
    const size = n < 10 ? 34 : n < 100 ? 40 : 48
    return L.divIcon({
        className: 'map-cluster',
        html: `<span>${n}</span>`,
        iconSize: [size, size],
    })
}

export default function ClusterLayer({
    items,
    visibleIds,
    selectedId,
    onSelect,
    focusRequest,
    fitKey,
    defaultBounds,
    iconFor,
    titleFor,
    clusterIcon = defaultClusterIcon,
    maxClusterRadius = 45,
}) {
    const map = useMap()
    const groupRef = useRef(null)
    const markersRef = useRef(new Map())
    const prevSelected = useRef(null)
    const onSelectRef = useRef(onSelect)
    onSelectRef.current = onSelect

    // Create every marker once per data set.
    useEffect(() => {
        const group = L.markerClusterGroup({
            iconCreateFunction: clusterIcon,
            showCoverageOnHover: false,
            maxClusterRadius,
            chunkedLoading: true,
        })
        const markers = new Map()
        items.forEach((item) => {
            const label = titleFor(item)
            const m = L.marker([item.lat, item.lng], { icon: iconFor(item, false), title: label, alt: label, keyboard: true })
            m.on('click', () => onSelectRef.current(item.id, 'map'))
            markers.set(item.id, m)
        })
        groupRef.current = group
        markersRef.current = markers
        map.addLayer(group)
        return () => {
            map.removeLayer(group)
        }
    }, [map, items, iconFor, titleFor, clusterIcon, maxClusterRadius])

    // Show only the markers that pass the filters. When the district/search
    // changes, zoom to fit the results (or back to the default view).
    const lastFitKey = useRef(fitKey)
    useEffect(() => {
        const group = groupRef.current
        if (!group) return
        group.clearLayers()
        group.addLayers(visibleIds.map((id) => markersRef.current.get(id)).filter(Boolean))
        if (fitKey !== lastFitKey.current) {
            lastFitKey.current = fitKey
            if (fitKey && visibleIds.length) map.fitBounds(group.getBounds(), { padding: [30, 30], maxZoom: 16 })
            else if (!fitKey && defaultBounds) map.fitBounds(defaultBounds)
        }
    }, [visibleIds, items, fitKey, map, defaultBounds])

    // Highlight the selected marker.
    useEffect(() => {
        const markers = markersRef.current
        const byId = new Map(items.map((i) => [i.id, i]))
        const prev = prevSelected.current
        if (prev && markers.get(prev) && byId.get(prev)) {
            markers.get(prev).setIcon(iconFor(byId.get(prev), false))
            markers.get(prev).setZIndexOffset(0)
        }
        if (selectedId && markers.get(selectedId)) {
            const m = markers.get(selectedId)
            m.setIcon(iconFor(byId.get(selectedId), true))
            m.setZIndexOffset(1000)
        }
        prevSelected.current = selectedId
    }, [selectedId, items, iconFor])

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
