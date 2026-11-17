import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import PreviewBoundary from '../components/PreviewBoundary'
import SceneLighting from '../components/SceneLighting'
import FinishDialog from './FinishDialog'
import { generateMaze } from './generateMaze'
import { levelDefaults, mazeSizes } from './levels'
import MazeDevelopmentPanel from './MazeDevelopmentPanel'
import MazeScene from './MazeScene'
import { marblePosition } from './mazeMotion'
import { finishPoints, pickupPoints } from './raceScore'
import ThumbJoystick from './ThumbJoystick'
import TwistControl from './TwistControl'
import { formatTime, useMazeRun } from './useMazeRun'
import './game.css'

const directions = new Map([
  ['ArrowUp', 'up'], ['w', 'up'],
  ['ArrowDown', 'down'], ['s', 'down'],
  ['ArrowLeft', 'left'], ['a', 'left'],
  ['ArrowRight', 'right'], ['d', 'right'],
])

export default function MazeGame() {
  const [maze, setMaze] = useState({ seed: 74021, sizeIndex: 0 })
  const [overrides, setOverrides] = useState(null)

  function newMaze() {
    const next = crypto.getRandomValues(new Uint32Array(1))[0]
    setMaze((current) => ({
      seed: next === current.seed ? (next + 1) >>> 0 : next,
      sizeIndex: Math.min(current.sizeIndex + 1, mazeSizes.length - 1),
    }))
    setOverrides(null)
  }

  const size = mazeSizes[maze.sizeIndex]
  return (
    <div className="game">
      {import.meta.env.DEV && (
        <MazeDevelopmentPanel size={size} options={overrides ?? levelDefaults(size)}
          onSize={(value) => {
            setMaze((current) => ({ ...current, sizeIndex: mazeSizes.indexOf(value) }))
            setOverrides(null)
          }}
          onOptions={setOverrides} onReset={() => setOverrides(null)} />
      )}
      <MazeRace key={`${size}-${maze.seed}-${JSON.stringify(overrides)}`}
        seed={maze.seed} size={size} overrides={overrides} onNewMaze={newMaze} />
    </div>
  )
}

function MazeRace({ seed, size, overrides, onNewMaze }) {
  const level = useMemo(() => generateMaze(seed, size, overrides ?? levelDefaults(size)), [seed, size, overrides])
  useEffect(() => () => level.walls.dispose(), [level])

  const input = useRef({ keys: new Set(), stick: { x: 0, y: 0 }, twist: 0 })
  const pressed = useRef(new Set())
  const playfield = useRef(null)
  const run = useMazeRun(seed, size, Boolean(overrides))
  const [failure, setFailure] = useState('')
  const [powered, setPowered] = useState(false)

  function clearInput() {
    pressed.current.clear()
    input.current.keys.clear()
    input.current.stick = { x: 0, y: 0 }
    input.current.twist = 0
  }

  useEffect(() => {
    window.addEventListener('blur', clearInput)
    document.addEventListener('visibilitychange', clearInput)
    return () => {
      window.removeEventListener('blur', clearInput)
      document.removeEventListener('visibilitychange', clearInput)
    }
  }, [])

  function handleKey(event, down) {
    if (event.target !== event.currentTarget) return
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    if (!directions.has(key) || event.altKey || event.ctrlKey || event.metaKey) return
    event.preventDefault()
    if (down) pressed.current.add(key)
    else pressed.current.delete(key)
    input.current.keys = new Set([...pressed.current].map((held) => directions.get(held)))
  }

  function restart() {
    setFailure('')
    setPowered(false)
    clearInput()
    run.restart()
    // A modal blocks focus until it closes.
    requestAnimationFrame(() => playfield.current?.focus({ preventScroll: true }))
  }

  return (
    <section className="game" aria-label="MazeBall game">
      <h2 className="race-theme">{level.theme.name}</h2>
      <div className="game-scoreboard">
        <dl className="game-times">
          <div><dt>Time</dt><dd>{formatTime(run.elapsed)}</dd></div>
          <div><dt>Pickups</dt><dd>{run.collected}/{level.pickups.length}</dd></div>
          <div><dt>Best score</dt><dd>{overrides ? 'Practice' : run.best ?? '—'}</dd></div>
          <div><dt>Maze grid</dt><dd>{size} × {size}</dd></div>
        </dl>
        <div className="race-actions">
          <button type="button" className="style-reset" onClick={restart}>Restart</button>
          <button type="button" className="style-reset" onClick={onNewMaze}>New maze</button>
        </div>
      </div>
      <div
        className="preview game-preview"
        ref={playfield}
        tabIndex={0}
        role="region"
        aria-label="Maze playfield"
        aria-describedby="game-instructions"
        onKeyDown={(event) => handleKey(event, true)}
        onKeyUp={(event) => handleKey(event, false)}
        onBlur={clearInput}
      >
        <div className="viewport game-viewport" onPointerDown={() => playfield.current?.focus({ preventScroll: true })}>
          <PreviewBoundary message="The game preview could not load. Try refreshing the page in a WebGL-capable browser.">
            <Suspense fallback={<p className="preview-message" role="status">Loading maze…</p>}>
              <Canvas
                camera={{ position: [0, 7.6 + marblePosition.y * (level.scale - 1), 0], up: [0, 0, -1], fov: 26 }}
                dpr={[1, 1.5]}
                fallback={<p className="preview-message">The game requires WebGL.</p>}
              >
                <SceneLighting />
                <MazeScene key={run.round} level={level} input={input} rawTime={run.rawTime} onMove={() => {
                  setFailure('')
                  run.start()
                }} onCollect={run.collect} onFinish={run.finish} onGold={setPowered} onFailure={(reason) => {
                  restart()
                  setFailure(`${reason}. Run restarted.`)
                }} />
              </Canvas>
            </Suspense>
          </PreviewBoundary>
        </div>
        <div className="game-controls">
          <p id="game-instructions">Use arrow keys, WASD, or the joystick. Collect blue marbles and {level.fleeing
            ? 'catch the fleeing green marble. It starts at the opposite pole.'
            : 'reach the green finish at the opposite pole.'}</p>
          <TwistControl key={`twist-${run.round}`} input={input} disabled={Boolean(run.result)} />
          <ThumbJoystick key={run.round} input={input} />
        </div>
      </div>
      <p className="race-notice" role="status">{powered ? 'Gold power active' : failure}</p>
      <p className="race-scoring">Finish for {finishPoints.toLocaleString()} points. Blue marbles add {pickupPoints} each. The time penalty grows the longer you take.</p>
      {level.terrain.length > 0 && (
        <p className="race-scoring">
          {level.terrain.some((tile) => tile.type === 'mud') && 'Brown mud halves your speed. '}
          {level.terrain.some((tile) => tile.type === 'lava') && ' Glowing lava restarts the run.'}
          {level.terrain.some((tile) => tile.type === 'gold') && ' Gold tiles let you defeat patrols for six seconds.'}
        </p>
      )}
      {level.chasers.length > 0 && <p className="race-scoring">Stay out of red patrols’ vision cones. Enemy contact restarts the run.</p>}
      {run.result && <FinishDialog result={run.result} best={run.best} fleeing={level.fleeing}
        onRestart={restart} onNewMaze={onNewMaze} />}
    </section>
  )
}
