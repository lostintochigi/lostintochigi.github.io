import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

// Animates the map to { lat, lng, zoom } whenever target changes.
export default function FlyTo({ target }) {
    const map = useMap()
    useEffect(() => {
        if (target) map.flyTo([target.lat, target.lng], target.zoom || 15, { duration: 0.8 })
    }, [target, map])
    return null
}
