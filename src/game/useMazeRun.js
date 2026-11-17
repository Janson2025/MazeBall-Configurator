import { useEffect, useRef, useState } from 'react'
import { raceScore } from './raceScore'

function readBest(key) {
  try {
    const raw = localStorage.getItem(key)
    const score = Number(raw)
    return raw !== null && Number.isSafeInteger(score) ? score : null
  } catch {
    return null
  }
}

export function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000)
  const fraction = Math.floor(milliseconds % 1000 / 100)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}.${fraction}`
}

export function useMazeRun(seed, size, practice) {
  const key = `mazeball.race-best.v4.${size}.${seed}`
  const startTime = useRef(null)
  const collectedCount = useRef(0)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [collected, setCollected] = useState(0)
  const [best, setBest] = useState(() => readBest(key))
  const [result, setResult] = useState(null)
  const [round, setRound] = useState(0)

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => {
      if (startTime.current !== null) setElapsed(performance.now() - startTime.current)
    }, 100)
    return () => clearInterval(timer)
  }, [running])

  function start() {
    if (startTime.current !== null) return
    startTime.current = performance.now()
    setRunning(true)
  }

  function collect() {
    collectedCount.current++
    setCollected(collectedCount.current)
  }

  function rawTime() {
    return startTime.current === null ? 0 : performance.now() - startTime.current
  }

  function finish() {
    if (startTime.current === null) return

    const time = Math.max(1, Math.round(rawTime()))
    startTime.current = null
    const count = collectedCount.current
    const score = raceScore(time, count)
    const previousBest = Math.max(best ?? -Infinity, readBest(key) ?? -Infinity)
    const record = !practice && score.points > previousBest
    setElapsed(time)
    setRunning(false)
    if (record) setBest(score.points)
    setResult({ time, count, ...score, record, practice })

    if (record) {
      try {
        localStorage.setItem(key, String(score.points))
      } catch {
        // Keep the record available for the current session.
      }
    }
  }

  function restart() {
    startTime.current = null
    collectedCount.current = 0
    setRunning(false)
    setElapsed(0)
    setCollected(0)
    setResult(null)
    setRound((current) => current + 1)
  }

  return { elapsed, collected, best, result, round, rawTime, start, collect, finish, restart }
}
