import './index.scss'
import LogoS from '../../../assets/images/logo-s.png'
import { useEffect, useRef } from 'react'
import DrawSVGPlugin from 'gsap-trial/DrawSVGPlugin'
import gsap from 'gsap-trial'

const Logo = () => {
    const bgRef = useRef();
    const outlineLogoRef = useRef();
    const solidLogoRef = useRef();
    
    useEffect(() => {
        gsap.registerPlugin(DrawSVGPlugin)
    
        gsap
          .timeline()
          .to(bgRef.current, {
            duration: 1,
            opacity: 1,
          })
          .from(outlineLogoRef.current, {
            drawSVG: 0,
            duration: 20,
          })
    
        gsap.fromTo(
          solidLogoRef.current,
          {
            opacity: 0,
          },
          {
            opacity: 1,
            delay: 4,
            duration: 4,
          }
        )
      }, [])

    return(
        <div className='logo-container' ref={bgRef}>
            <img ref={solidLogoRef} className='solid-logo' src={LogoS} alt='A'/>
            <svg
        width="559pt"
        height="897pt"
        version="1.0"
        viewBox="0 0 559 897"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          className="svg-container"
          transform="translate(0 800) scale(10 -10)"
          fill="none"
        >
          <path
            ref={outlineLogoRef}
            d="M 9.902 0 L 15.702 0 A 11.69 11.69 0 0 1 18.617 0.343 A 8.016 8.016 0 0 1 22.802 2.9 Q 25.302 5.8 25.302 9.6 L 25.302 64.5 L 17.302 64.5 L 17.302 47.5 L 8.202 47.5 L 8.202 64.5 L 0.002 64.5 L 0.002 9.6 Q 0.002 5.6 2.652 2.8 A 8.741 8.741 0 0 1 7.469 0.222 A 12.746 12.746 0 0 1 9.902 0 Z M 15.702 1.5 L 9.902 1.5 A 9.958 9.958 0 0 0 7.119 1.872 A 7.792 7.792 0 0 0 3.852 3.75 A 7.517 7.517 0 0 0 1.544 8.668 A 10.26 10.26 0 0 0 1.502 9.6 L 1.502 63 L 6.702 63 L 6.702 46 L 18.802 46 L 18.802 63 L 23.802 63 L 23.802 9.6 A 9.382 9.382 0 0 0 23.431 6.898 A 7.379 7.379 0 0 0 21.552 3.75 A 7.576 7.576 0 0 0 17.005 1.58 A 10.412 10.412 0 0 0 15.702 1.5 Z M 9.902 6.4 L 15.702 6.4 A 3.776 3.776 0 0 1 16.648 6.512 A 2.559 2.559 0 0 1 18.002 7.35 Q 18.802 8.3 18.802 9.6 L 18.802 41.2 L 6.702 41.2 L 6.702 9.6 Q 6.702 8.2 7.602 7.3 A 3.037 3.037 0 0 1 9.56 6.415 A 4.082 4.082 0 0 1 9.902 6.4 Z M 15.702 7.9 L 9.902 7.9 A 2.447 2.447 0 0 0 9.229 7.985 Q 8.202 8.279 8.202 9.6 L 8.202 39.7 L 17.302 39.7 L 17.302 9.6 A 2.61 2.61 0 0 0 17.226 8.941 Q 16.954 7.9 15.702 7.9 Z"
          />
        </g>
      </svg>
                
        </div>
    )
}

export default Logo