import { mazeSizes } from './levels'

const countFields = [
  ['mud', 'Mud tiles', 20],
  ['lava', 'Lava tiles', 20],
  ['gold', 'Gold tiles', 20],
  ['chasers', 'Red chasers', 8],
  ['buddies', 'Blue buddy pickups', 30],
]

export default function MazeDevelopmentPanel({ size, options, onSize, onOptions, onReset }) {
  return (
    <details className="maze-development">
      <summary>Development panel</summary>
      <p>Changing a setting restarts the run. Custom runs are for practice.</p>
      <div className="development-controls">
        <label>
          Grid per face
          <select value={size} onChange={(event) => onSize(Number(event.target.value))}>
            {mazeSizes.map((value) => <option key={value} value={value}>{value} × {value}</option>)}
          </select>
        </label>
        {countFields.map(([key, label, max]) => (
          <label key={key}>
            {label}
            <input type="number" value={options[key]} min="0" max={max} onChange={(event) => {
              const count = event.currentTarget.valueAsNumber
              onOptions({ ...options, [key]: Number.isFinite(count) ? Math.min(max, Math.max(0, Math.trunc(count))) : 0 })
            }} />
          </label>
        ))}
        <label className="development-toggle">
          <input type="checkbox" checked={options.flee} onChange={(event) => onOptions({ ...options, flee: event.target.checked })} />
          Fleeing finish
        </label>
        <button className="style-reset" type="button" onClick={onReset}>Restore tier defaults</button>
      </div>
    </details>
  )
}
