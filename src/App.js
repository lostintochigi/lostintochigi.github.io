//import logo from './logo.svg';
import './App.scss'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout';
import Home from './components/Home'
import About from './components/About';
import Contact from './components/Contact';
import Utilities from './components/Utilities';
import './responsive.scss';
import { lazy, Suspense } from 'react';

// Full-screen utilities load on demand and render outside the sidebar layout.
const Fountains = lazy(() => import('./components/Fountains'));
const Michelin = lazy(() => import('./components/Michelin'));
const Ramen = lazy(() => import('./components/Ramen'));

function App() {
  return (
    <>
    <Routes>
    <Route
      path="utilities/hk-water-fountains"
      element={<Suspense fallback={null}><Fountains /></Suspense>}
    />
    <Route
      path="utilities/hk-michelin"
      element={<Suspense fallback={null}><Michelin key="hk" cityKey="hk" /></Suspense>}
    />
    <Route
      path="utilities/tokyo-michelin"
      element={<Suspense fallback={null}><Michelin key="tokyo" cityKey="tokyo" /></Suspense>}
    />
    <Route
      path="utilities/tokyo-ramen"
      element={<Suspense fallback={null}><Ramen /></Suspense>}
    />
    <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="portfolio-website" element={<Home />} />
          <Route path="about" element={<About/>} />
          <Route path="utilities" element={<Utilities />} />
          <Route path="contact" element={<Contact />} />
    </Route>
    </Routes>
    </>
  )
}

export default App;
