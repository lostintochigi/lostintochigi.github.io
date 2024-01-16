import { Link } from 'react-router-dom';
import LogoTitle from '../../assets/images/logo-s-temp.png';
import './index.scss';
import { useEffect, useState } from 'react';
import AnimatedLetters from '../AnimatedLetters';
import Logo from './Logo';
import Loader from 'react-loaders'

const Home = () => {
    const [letterClass, setLetterClass] = useState('text-animate')
    
    const nameArray = "nimesh"
    const jobArray = "3rd year Computer Science Undergrad"
    
    
    useEffect(() => {
        setTimeout(() => {
        return  setLetterClass('text-animate-hover')
        }, 4000)
    }, [])

    return (
        <>
        <div className = "container home-page">
            <div className="text-zone">
            <h1> 
            <AnimatedLetters letterClass={letterClass}
            strArray={("Hi !").split("")}
            idx={12+("Hi").length}
            /> 
            <br /> 
            <AnimatedLetters letterClass={letterClass}
            strArray={("I'm").split("")}
            idx={12+("Hi").length+("I'm").length}
            />
            <img src={LogoTitle} alt="A character symbol" />
            <AnimatedLetters letterClass={letterClass}
            strArray={nameArray.split("")}
            idx={12+nameArray.length} />
            <br />
            <AnimatedLetters letterClass={letterClass}
            strArray={jobArray.split("")}
            idx={-12+jobArray.length} />
            </h1>
            <h2> Image Processing/ Frontend/ Python Scirpting</h2>
            <div className="button-container">
            <Link to="/contact" className='flat-button'>CONTACT</Link>
            <a 
                target="_blank"
                rel="noreferrer"
                href="https://github.com/lostintochigi/resume/blob/main/AnimeshHarsh_CV.pdf"
                className="flat-button"
            >
                <strong>Download resume</strong> 
            </a>
            </div>
            </div>
            <Logo />
        </div>
        <Loader type="pacman"/>
        </>
    )
}
export default Home