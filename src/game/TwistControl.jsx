import { useRef } from 'react'

export default function TwistControl({ input, disabled }) {
  const angle = useRef(0)

  function twist(event) {
    const next = event.currentTarget.valueAsNumber
    input.current.twist += -(next - angle.current) * Math.PI / 180
    angle.current = next
  }

  return (
    <label className="maze-twist">
      <span>Twist maze</span>
      <input type="range" min="-180" max="180" step="1" defaultValue="0" onChange={twist} disabled={disabled} />
    </label>
  )
}
