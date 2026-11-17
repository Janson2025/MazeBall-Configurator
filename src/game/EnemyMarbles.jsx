import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, Vector3 } from 'three'
import { sightHalfAngle } from './mazeSight'

function EnemyMarble({ enemy, sight, level }) {
  const ball = useRef()
  const cone = useRef()
  const overlay = useMemo(() => ({
    positions: new Float32Array(12 * 9),
    center: new Vector3(),
    last: new Vector3(),
    next: new Vector3(),
  }), [])

  useFrame(() => {
    ball.current.visible = !enemy.defeated
    cone.current.visible = !enemy.defeated
    if (enemy.defeated) return
    ball.current.position.copy(enemy.position)
    const { center, last, next, positions } = overlay
    center.copy(enemy.position).setLength(level.floorRadius + 0.042)
    sight.conePoint(enemy.position, enemy.heading, -sightHalfAngle, last)
    for (let i = 0; i < 12; i++) {
      sight.conePoint(enemy.position, enemy.heading, (i + 1) / 6 * sightHalfAngle - sightHalfAngle, next)
      center.toArray(positions, i * 9)
      last.toArray(positions, i * 9 + 3)
      next.toArray(positions, i * 9 + 6)
      last.copy(next)
    }
    cone.current.geometry.attributes.position.needsUpdate = true
    cone.current.material.opacity = enemy.sees ? 0.37 : 0.19
  })

  return (
    <>
      <mesh ref={ball} position={enemy.position}>
        <sphereGeometry args={[0.041 / level.scale, 20, 16]} />
        <meshPhysicalMaterial color="#f23933" emissive="#8f0c08" emissiveIntensity={0.6} clearcoat={1} />
      </mesh>
      <mesh ref={cone} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[overlay.positions, 3]} />
        </bufferGeometry>
        <meshBasicMaterial color="#ff652d" side={DoubleSide} transparent opacity={0.19} depthWrite={false} />
      </mesh>
    </>
  )
}

export default function EnemyMarbles({ actors, level }) {
  return actors.enemies.map((enemy, index) =>
    <EnemyMarble key={level.chasers[index]} enemy={enemy} sight={actors.sight} level={level} />)
}
