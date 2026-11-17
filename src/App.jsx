import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Configurator from './components/Configurator'
import Experience from './components/Experience'
import PreviewBoundary from './components/PreviewBoundary'
import { CustomizationProvider } from './context/Customization'
import { generateMaze } from './game/generateMaze'
import './App.css'

const MazeGame = lazy(() => import('./game/MazeGame'))

function DesignStudio() {
  const [view, setView] = useState(0)
  const [preview, setPreview] = useState('3')
  const level = useMemo(() => preview === 'original' ? null : generateMaze(74021, Number(preview)), [preview])
  useEffect(() => () => level?.walls.dispose(), [level])

  return (
    <>
      <h1>Design your MazeBall</h1>
      <p className="intro">Preview a level theme and customize the floor, walls, and glass.</p>
      <div className="studio">
        <section className="preview" aria-labelledby="preview-heading">
          <div className="preview-header">
            <h2 id="preview-heading">3D preview</h2>
            <button className="view-reset" type="button" onClick={() => setView((current) => current + 1)}>
              Reset view
            </button>
          </div>
          <div className="viewport">
            <PreviewBoundary key={view} message="The 3D preview could not load. You can still customize the maze.">
              <Suspense fallback={<p className="preview-message" role="status">Loading 3D preview…</p>}>
                <Canvas
                  camera={{ position: [6, 4, 7], fov: 40 }}
                  dpr={[1, 1.5]}
                  fallback={<p className="preview-message">The preview requires WebGL.</p>}
                >
                  <Experience level={level} />
                </Canvas>
              </Suspense>
            </PreviewBoundary>
          </div>
          <p className="preview-hint">Drag to rotate · Scroll or pinch to zoom</p>
        </section>
        <Configurator preview={preview} onPreview={setPreview} />
      </div>
    </>
  )
}

export default function App() {
  const [mode, setMode] = useState('play')

  return (
    <CustomizationProvider>
      <header className="site-header">
        <div className="shell app-header">
          <div className="brand"><span className="brand-mark" aria-hidden="true" />MazeBall</div>
          <nav className="mode-nav" aria-label="MazeBall modes">
            <button type="button" aria-pressed={mode === 'play'} onClick={() => setMode('play')}>Play</button>
            <button type="button" aria-pressed={mode === 'design'} onClick={() => setMode('design')}>Customize</button>
          </nav>
        </div>
      </header>
      <main className={`shell workspace${mode === 'play' ? ' game-workspace' : ''}`}>
        {mode === 'play'
          ? <>
              <h1>MazeBall Challenge</h1>
              <Suspense fallback={<p role="status">Loading game…</p>}><MazeGame /></Suspense>
            </>
          : <DesignStudio />}
      </main>
    </CustomizationProvider>
  )
}
