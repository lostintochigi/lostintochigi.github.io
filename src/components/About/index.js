import './index.scss'

import AnimatedLetters from '../AnimatedLetters'
import {useEffect, useState} from 'react'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
//import {CableCar as C} from '@styled-icons/fa-solid';
import {faAndroid, faAngular, faGithub, faHtml5, faJsSquare, faPython, faReact} from '@fortawesome/free-brands-svg-icons'
import Loader from 'react-loaders'

const About = () => {
    const [letterClass, setLetterClass] = useState('text-animate')

    useEffect(() => {
        setTimeout(() => {
        return  setLetterClass('text-animate-hover')
        }, 3000)
    }, [])

    return(
        <>
        <div className='container about-page'>
            <div className='text-zone'>
            <h1>
                <AnimatedLetters
                letterClass={letterClass}
                strArray={("About Me").split("")}
                idx = {15}
                />
            </h1>
            <p className="intro-para1">
            Hi there! I'm Animesh Harsh, a Computer Science junior based in Tokyo. <br/><br/>
            </p>
            <p className="intro-para2">
            Originally from India, I embarked on my journey in Japan for my Undergraduate education back in 2019. <br/><br/>
            </p>
            <p className="intro-para3">
            My passion lies in Image Processing, App Development, Linux Server Management, Unity, Scripting, and I thrive on leveraging technology to simplify my life.
            </p>
            <p className="intro-para3">
            Link to resume:- <br/>
            <a target="_blank"
                rel="noreferrer"
                href="https://github.com/lostintochigi/resume/blob/main/AnimeshHarsh_CV.pdf"
                className="flat-button">
            <strong>Download resume</strong> </a>
            </p>
            
        </div>
        <div className="stage-cube-cont">
            <div className="cubespinner">
                <div className="face1">
                    <FontAwesomeIcon icon={faGithub} color="#DD0031"/>
                </div>
                <div className="face2">
                    <FontAwesomeIcon icon={faReact} color= "#DD0031" />
                </div>
                <div className="face3">
                    <FontAwesomeIcon icon={faPython} color="#DD0031"/>
                </div>
                <div className="face4">
                    <FontAwesomeIcon icon={faAndroid} color="#DD0031"/>
                </div>
                <div className="face5">
                    <FontAwesomeIcon icon={faHtml5} color="#DD0031"/>
                </div>
                <div className="face6">
                    <FontAwesomeIcon icon={faJsSquare} color="#EFD81D"/>
                </div>
            </div>
        </div>
        </div>
        <Loader type="pacman" />
        </>
    )
}

export default About