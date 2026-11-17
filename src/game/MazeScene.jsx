import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import EnemyMarbles from './EnemyMarbles'
import GeneratedMaze from './GeneratedMaze'
import { createMazeActors } from './mazeActors'
import { createMazeMotion, marblePosition, marbleRadius } from './mazeMotion'
import { createTerrainProbe, goldDuration, isLavaHot, mudSpeed, terrainColors } from './terrain'
import TerrainTiles from './TerrainTiles'

export default function MazeScene({ level, input, rawTime, onMove, onCollect, onFinish, onFailure, onGold }) {
  const actors = useMemo(() => createMazeActors(level), [level])
  const motion = useMemo(() => createMazeMotion({ ...level, finish: actors.finish }), [level, actors])
  const terrainAt = useMemo(() => createTerrainProbe(level.terrain), [level])
  const maze = useRef()
  const marble = useRef()
  const pickups = useRef([])
  const goal = useRef()
  const finished = useRef(false)
  const lavaMaterials = useRef(new Map())
  const lavaHot = useRef(false)
  const goldTiles = useRef(new Map())
  const usedGold = useRef(new Set())
  const goldUntil = useRef(0)
  const goldActive = useRef(false)
  const marbleMaterial = useRef()
  const stripeMaterial = useRef()

  function finish() {
    finished.current = true
    onFinish()
  }

  useFrame((_, delta) => {
    if (finished.current) return

    const elapsed = rawTime()
    const tile = terrainAt(marblePosition, maze.current.quaternion)
    if (tile?.type === 'gold' && !usedGold.current.has(tile.id)) {
      usedGold.current.add(tile.id)
      goldUntil.current = elapsed + goldDuration
      goldTiles.current.get(tile.id).visible = false
    }
    const powered = elapsed < goldUntil.current
    if (powered !== goldActive.current) {
      goldActive.current = powered
      marbleMaterial.current.color.set(powered ? '#ffc54d' : '#168dff')
      stripeMaterial.current.color.set(powered ? '#813b17' : '#b3e3ff')
      onGold(powered)
    }
    const hot = isLavaHot(elapsed)
    if (hot && tile?.type === 'lava') {
      finished.current = true
      onFailure('Active lava')
      return
    }
    if (elapsed > 0) {
      if (actors.advance(maze.current.quaternion, Math.min(delta, 0.05), () => {
        finished.current = true
        onFailure('Caught by a patrol')
      }, powered)) return
      goal.current.position.copy(actors.finish)
      if (level.fleeing && motion.reachedFinish(maze.current.quaternion)) {
        finish()
        return
      }
    }
    if (hot !== lavaHot.current) {
      lavaHot.current = hot
      for (const material of lavaMaterials.current.values()) {
        material.color.set(hot ? terrainColors.hotLava : terrainColors.lava)
      }
    }

    const state = input.current
    if (state.twist !== 0) {
      motion.twist(maze.current.quaternion, state.twist)
      state.twist = 0
      onMove()
    }

    // Both controls steer the marble relative to the maze beneath it.
    const x = Number(state.keys.has('left')) - Number(state.keys.has('right')) - state.stick.x
    const y = Number(state.keys.has('up')) - Number(state.keys.has('down')) - state.stick.y
    if (x === 0 && y === 0) return

    const scale = Math.max(1, Math.hypot(x, y)) / (tile?.type === 'mud' ? mudSpeed : 1)
    const result = motion.advance(maze.current.quaternion, marble.current.quaternion, x / scale, y / scale, delta, (id) => {
      pickups.current[id].visible = false
      onCollect()
    })
    if (result.moved) onMove()
    if (result.finished) finish()
  })

  return (
    <group scale={level.scale}>
      <group ref={maze}>
        <GeneratedMaze level={level} />
        <TerrainTiles terrain={level.terrain} lavaMaterials={lavaMaterials} goldTiles={goldTiles} />
        <mesh ref={goal} position={actors.finish}>
          <sphereGeometry args={[0.057 / level.scale, 16, 12]} />
          <meshBasicMaterial color="#76f430" toneMapped={false} />
        </mesh>
        <EnemyMarbles actors={actors} level={level} />
        {level.pickups.map((position, id) => (
          <mesh key={id} position={position} ref={(mesh) => { pickups.current[id] = mesh }}>
            <sphereGeometry args={[0.04, 16, 12]} />
            <meshPhysicalMaterial color="#27e2ff" emissive="#0080ba" emissiveIntensity={0.5} clearcoat={1} />
          </mesh>
        ))}
      </group>
      <group ref={marble} position={marblePosition} scale={1 / level.scale}>
        <mesh>
          <sphereGeometry args={[marbleRadius, 32, 24]} />
          <meshPhysicalMaterial ref={marbleMaterial} color="#168dff" roughness={0.24} clearcoat={1} clearcoatRoughness={0.09} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 5]}>
          <sphereGeometry args={[marbleRadius * 1.01, 32, 4, 0, Math.PI * 2, 1.42, 0.3]} />
          <meshPhysicalMaterial ref={stripeMaterial} color="#b3e3ff" roughness={0.24} clearcoat={1} clearcoatRoughness={0.09} />
        </mesh>
      </group>
    </group>
  )
}
