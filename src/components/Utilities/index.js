import './index.scss'
import { useEffect, useState } from 'react'
import Loader from 'react-loaders'
import AnimatedLetters from '../AnimatedLetters'
import utilities from '../../data/utilities'

const Utilities = () => {
    const [letterClass, setLetterClass] = useState('text-animate')

    useEffect(() => {
        const timer = setTimeout(() => setLetterClass('text-animate-hover'), 3000)
        return () => clearTimeout(timer)
    }, [])

    return (
        <>
        <div className="container utilities-page">
            <div className="text-zone">
                <h1>
                    <AnimatedLetters
                        letterClass={letterClass}
                        strArray={'Utilities'.split('')}
                        idx={15}
                    />
                </h1>
                <p className="utilities-intro">
                    Small tools I've vibe coded to make everyday tasks a little easier.
                </p>

                {utilities.length === 0 ? (
                    <p className="utilities-empty">Nothing here yet — check back soon.</p>
                ) : (
                    <ul className="utilities-grid">
                        {utilities.map((u) => (
                            <li key={u.url}>
                                <a
                                    className="utility-card"
                                    href={u.url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span className="utility-name">{u.name}</span>
                                    {u.date && <span className="utility-date">{u.date}</span>}
                                    <span className="utility-desc">{u.description}</span>
                                    {u.tags && u.tags.length > 0 && (
                                        <span className="utility-tags">
                                            {u.tags.map((t) => (
                                                <span key={t} className="utility-tag">{t}</span>
                                            ))}
                                        </span>
                                    )}
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
        <Loader type="pacman" />
        </>
    )
}

export default Utilities
