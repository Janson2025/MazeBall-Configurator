import { useRef, useState } from 'react'

export default function ThumbJoystick({ input }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const pointer = useRef(null)

  function move(event) {
    if (event.pointerId !== pointer.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const travel = bounds.width * 0.29
    const x = (event.clientX - bounds.left - bounds.width / 2) / travel
    const y = (event.clientY - bounds.top - bounds.height / 2) / travel
    const length = Math.hypot(x, y)
    const scale = Math.max(1, length)
    const strength = length > 0.15 ? Math.min(1, (length - 0.15) / 0.85) / length : 0
    input.current.stick = { x: x * strength, y: y * strength }
    setOffset({ x: x / scale * travel, y: y / scale * travel })
  }

  function press(event) {
    if (pointer.current !== null || event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    pointer.current = event.pointerId
    move(event)
  }

  function release(event) {
    if (event.pointerId !== pointer.current) return
    pointer.current = null
    input.current.stick = { x: 0, y: 0 }
    setOffset({ x: 0, y: 0 })
  }

  return (
    <div
      className="thumb-joystick"
      aria-hidden="true"
      onPointerDown={press}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <span style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }} />
    </div>
  )
}
