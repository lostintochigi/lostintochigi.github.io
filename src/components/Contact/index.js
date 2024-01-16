import Loader from 'react-loaders'
import './index.scss'
import AnimatedLetters from '../AnimatedLetters'
import { useEffect, useRef, useState } from 'react'
import emailjs from '@emailjs/browser'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faGithub, faLinkedin} from '@fortawesome/free-brands-svg-icons'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

const Contact = () => {
    const [letterClass, setLetterClass] = useState('text-animate')
    const refForm = useRef()
    
    useEffect(() => {
        setTimeout(() => {
        return  setLetterClass('text-animate-hover')
        }, 3000)
    }, [])


    
    const sendEmail = (e) => {
        e.preventDefault()
        
        emailjs.sendForm(
            'default_service',
            'template_v3tdogc',
            refForm.current,
            ''
        )
    }
    
    return(
        <>
        <div className="container contact-page">
            <div className="text-zone">
                <h1>
                    <AnimatedLetters
                    letterClass={letterClass}
                    strArray={("Contact Me").split("")}
                    idx={15}
                    />
                </h1>
                <p className="contact-paragraph">
                
                    These are my socials! <br />
                    You can reach out to me via following channels:
                </p>
        <div className="socials">
        <ul>
            <li>
                <a target="_blank"
                    rel="noreferrer"
                    href="https://www.linkedin.com/in/animesh-harsh/">

                    <input type="submit" className="flat-button" value="LinkedIn" />
                </a>
            </li>
            <li>
                <a target="_blank"
                    rel="noreferrer"
                    href="https://github.com/lostintochigi/lostintochigi">
                        
                        <input type="submit" className="flat-button" value="Github" />
                </a>
            </li>
            <li>
            <a target="_blank"
                rel="noreferrer"
                href="mailto:animes.rishu@gmail.com?subject=Contact via Animesh's website&amp;"
                className="flat-button">
            <strong>E-Mail</strong>
</a>

            </li>
        </ul>
        </div>
            <div className="contact-form">
            <p className="form-heading">
                Email contact form ⇪
            </p>
                <form ref={refForm} onSubmit={sendEmail}>
                    <ul>
                        <li className="half">
                            <input type="text" name="name" placeholder="Name" required />
                        </li>
                        <li className="half">
                            <input 
                            type="email" 
                            name="email" 
                            placeholder="email" 
                            required
                        />
                        </li>
                        <li>
                            <input placeholder="Subject" type="text" name="subject" required/>
                        </li>
                        <li>
                            <textarea 
                            placeholder="Message" 
                            name="message" 
                            required
                            ></textarea>
                        </li>
                        <li>
                            <input type="submit" className="flat-button" value="SEND" />
                        </li>
                    </ul>
                </form>
            </div>
            </div>
            <div className='info-map'>
                Harsh Animesh,
                <br />
                東京都,
                <br />
                大田区 <br />
                Somewhere < br/>
                <span>animes.rishu@gmail.com</span>
            </div>
            <div className='map-wrap'>
                <MapContainer center={[35.6586, 139.7454]} zoom={13}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[35.6586, 139.7454]}>
                  <Popup>Come Over :)</Popup>
                  </Marker>
                </MapContainer>
            </div>
        </div>
        <Loader type="pacman"/>
        </>
    )
}

export default Contact