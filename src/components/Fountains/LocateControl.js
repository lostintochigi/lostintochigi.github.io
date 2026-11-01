import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

const ICON =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
    '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>' +
    '<path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/></svg>'

// "Show my location" button that sits under the zoom buttons.
export default function LocateControl({ onLocate, busy }) {
    const map = useMap()
    const buttonRef = useRef(null)
    const onLocateRef = useRef(onLocate)
    onLocateRef.current = onLocate

    useEffect(() => {
        const control = L.control({ position: 'topleft' })
        control.onAdd = () => {
            const wrap = L.DomUtil.create('div', 'leaflet-bar fp-locate')
            const btn = L.DomUtil.create('button', '', wrap)
            btn.type = 'button'
            btn.title = 'Show my location'
            btn.setAttribute('aria-label', 'Show my location and nearest fountains')
            btn.innerHTML = ICON
            L.DomEvent.disableClickPropagation(wrap)
            L.DomEvent.on(btn, 'click', (e) => {
                L.DomEvent.preventDefault(e)
                onLocateRef.current()
            })
            buttonRef.current = btn
            return wrap
        }
        control.addTo(map)
        return () => control.remove()
    }, [map])

    useEffect(() => {
        if (!buttonRef.current) return
        buttonRef.current.disabled = busy
        buttonRef.current.classList.toggle('is-busy', busy)
    }, [busy])

    return null
}
