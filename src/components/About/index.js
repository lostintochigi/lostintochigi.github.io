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
            Hi there! I'm Animesh Harsh, an AI graduate student researcher at the University of Tokyo (Matsuo-Iwasawa Lab), based in Tokyo. <br/><br/>
            </p>
            <p className="intro-para2">
            Originally from India, I came to Japan in 2019 as a MEXT scholar and earned my B.S. in Computer Science from Chiba Institute of Technology in 2025. I'm now working on web agent development with the UT LLM Team. <br/><br/>
            </p>
            <p className="intro-para3">
            My interests lie in Image Processing, App Development, Linux Server Management, Unity and Bash Scripting. I thrive on leveraging technology to simplify my life.
            </p>
            <p className="intro-para3">
            Link to resume:- <br/>
            <a target="_blank"
                rel="noreferrer"
                href="/Animesh_Harsh_Resume.pdf"
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