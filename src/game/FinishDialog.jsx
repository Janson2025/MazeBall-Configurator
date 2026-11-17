import { useEffect, useRef } from 'react'
import { formatTime } from './useMazeRun'
import { pickupPoints } from './raceScore'

export default function FinishDialog({ result, best, fleeing, onRestart, onNewMaze }) {
  const dialog = useRef(null)

  useEffect(() => {
    const element = dialog.current
    if (!element.open) element.showModal()
  }, [])

  return (
    <dialog className="finish-dialog" ref={dialog} aria-labelledby="finish-title">
      <h2 id="finish-title">Congratulations!</h2>
      <p>{fleeing ? 'You caught the green marble' : 'You reached the opposite pole'} in <strong>{formatTime(result.time)}</strong>.</p>
      <dl className="race-breakdown">
        <div><dt>Pickup bonus</dt><dd>+{result.count * pickupPoints}</dd></div>
        <div><dt>Time penalty</dt><dd>−{result.penalty}</dd></div>
        <div><dt>Final score</dt><dd>{result.points}</dd></div>
      </dl>
      <p>{result.practice ? 'Practice run' : result.record ? 'New personal best!' : `Personal best ${best}`}</p>
      <div className="finish-actions">
        <button className="style-reset" type="button" onClick={() => dialog.current.close()}>Close</button>
        <button className="style-reset" type="button" onClick={onNewMaze}>New maze</button>
        <button className="game-primary" type="button" onClick={onRestart}>Play again</button>
      </div>
    </dialog>
  )
}
