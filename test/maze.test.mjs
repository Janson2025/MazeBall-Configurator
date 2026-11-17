import assert from 'node:assert/strict'
import test from 'node:test'
import { BufferGeometry, Float32BufferAttribute, Quaternion, Vector3 } from 'three'
import { generateMaze } from '../src/game/generateMaze.js'
import { createMazeMotion, marblePosition } from '../src/game/mazeMotion.js'
import { pickupPoints, raceScore } from '../src/game/raceScore.js'
import { createTerrainProbe, isLavaHot } from '../src/game/terrain.js'
import { createMazeActors, passageDistances } from '../src/game/mazeActors.js'
import { createMazeSight } from '../src/game/mazeSight.js'

test('generated corridors connect both poles across cube-face seams', () => {
  for (const [seed, size] of [[74021, 3], [74021, 5], [0, 5], [2, 5], [23, 7], [91, 7],
    [82831, 9], [4294967295, 9], [74021, 11], [74021, 13], [4294967295, 13]]) {
    const level = generateMaze(seed, size)
    const motion = createMazeMotion(level)
    const rotation = new Quaternion()
    const marble = new Quaternion()
    const collected = new Set()
    assert.ok(level.finish.distanceTo(marblePosition.clone().negate()) < 1e-8)

    motion.twist(rotation, Math.PI / 2)
    assert.ok(marblePosition.clone().applyQuaternion(rotation).distanceTo(marblePosition) < 1e-8)

    let finished = false
    for (const target of level.routeWaypoints.slice(1)) {
      for (let step = 0; step < 100; step++) {
        const world = target.clone().applyQuaternion(rotation)
        const distance = world.angleTo(marblePosition)
        if (distance < 1e-7) break
        const magnitude = Math.hypot(world.x, world.z)
        const result = motion.advance(rotation, marble, -world.x / magnitude, -world.z / magnitude, distance / 0.9, (id) => {
          assert.ok(!collected.has(id), 'A pickup can only be collected once')
          collected.add(id)
        })
        assert.ok(result.moved, `Generated route is blocked at size ${size}, seed ${seed}`)
        if (result.finished) {
          finished = true
          break
        }
      }
      if (finished) break
    }
    assert.ok(finished, `Finish is unreachable for seed ${seed}`)
    assert.equal(collected.size, 3)
  }
})

test('a direct wall hit stops while angled input slides along the wall', () => {
  const motion = createMazeMotion(generateMaze(74021, 5))
  const rotation = new Quaternion()
  const marble = new Quaternion()
  const collect = () => {}
  const frame = 1 / 60
  for (let i = 0; i < 100; i++) {
    if (!motion.advance(rotation, marble, 1, 0, frame, collect).moved) break
  }
  assert.equal(motion.advance(rotation, marble, 1, 0, frame, collect).moved, false)
  assert.equal(motion.advance(rotation, marble, Math.SQRT1_2, Math.SQRT1_2, frame, collect).moved, true)
})

test('steering around a corner can clear a second wall face', () => {
  const motion = createMazeMotion(generateMaze(74021, 5))
  // A position where pushing slightly into the corner stalled the original wall slide.
  const rotation = new Quaternion(0.048777579, 0.001736035, -0.048064999, 0.997650986).normalize()
  const marble = new Quaternion()
  const heading = Math.PI / 12
  const result = motion.advance(rotation, marble, Math.cos(heading), Math.sin(heading), 1 / 60, () => {})
  assert.equal(result.moved, true)
})

test('pickups score points and the delay penalty grows faster over time', () => {
  assert.equal(raceScore(20000, 2).points - raceScore(20000, 1).points, pickupPoints)
  const early = raceScore(10000, 0)
  const middle = raceScore(20000, 0)
  const late = raceScore(30000, 0)
  assert.ok(late.penalty - middle.penalty > middle.penalty - early.penalty)
  assert.ok(raceScore(10000, 0).points < raceScore(11000, 1).points)
  assert.ok(raceScore(10000, 0).points > raceScore(30000, 1).points)
})

test('terrain unlocks by grid size and leaves the start and finish clear', () => {
  for (const [size, types] of [[5, []], [7, ['mud', 'mud']], [9, ['mud', 'mud', 'lava', 'lava']]]) {
    const level = generateMaze(74021, size)
    const probe = createTerrainProbe(level.terrain)
    const localToWorld = new Quaternion()
    assert.deepEqual(level.terrain.map((tile) => tile.type), types)
    assert.equal(probe(marblePosition, localToWorld), undefined)
    assert.equal(probe(level.finish, localToWorld), undefined)
    const visitedTiles = new Set(level.route.map((point) => {
      localToWorld.setFromUnitVectors(point.clone().normalize(), marblePosition.clone().normalize())
      return probe(marblePosition, localToWorld)?.id
    }))
    assert.ok(level.terrain.every((tile) => visitedTiles.has(tile.id)))
  }
})

test('lava is cool at the start and alternates between hot and cool', () => {
  assert.equal(isLavaHot(0), false)
  assert.equal(isLavaHot(3499), false)
  assert.equal(isLavaHot(3500), true)
  assert.equal(isLavaHot(5999), true)
  assert.equal(isLavaHot(6000), false)
  assert.equal(isLavaHot(9500), true)
})

test('late tiers spawn opponents and the final goal takes an open passage away from the player', () => {
  assert.equal(generateMaze(74021, 11).chasers.length, 1)
  const level = generateMaze(74021, 13)
  const actors = createMazeActors(level)
  assert.equal(actors.enemies.length, 2)
  assert.ok(actors.finish.equals(level.finish))

  const player = level.route.at(-2)
  const cell = level.centers.findIndex((center) => center.equals(player))
  const distances = passageDistances(level.neighbors, cell)
  const rotation = new Quaternion().setFromUnitVectors(player.clone().normalize(), marblePosition.clone().normalize())
  actors.advance(rotation, 0.01, () => {})
  assert.ok(!actors.finish.equals(level.finish))
  assert.ok(level.neighbors[level.finishCell].some((next) =>
    distances[next] > distances[level.finishCell]
      && actors.finish.distanceToSquared(level.centers[next]) < level.finish.distanceToSquared(level.centers[next])))
})

test('patrol sight respects facing, maze walls, and the spherical horizon', () => {
  const from = new Vector3(-0.18, 1.48, 0)
  const to = new Vector3(0.18, 1.48, 0)
  const heading = new Vector3(1.48, 0.18, 0).normalize()
  function sight(wallX, floorRadius) {
    const walls = new BufferGeometry()
    walls.setAttribute('position', new Float32BufferAttribute([wallX, 1.2, -0.3, wallX, 1.7, 0, wallX, 1.2, 0.3], 3))
    return createMazeSight({ walls, floorRadius })
  }
  assert.equal(sight(1, 1.37).sees(from, heading, to), true)
  assert.equal(sight(1, 1.37).sees(from, heading.clone().negate(), to), false)
  assert.equal(sight(0, 1.37).sees(from, heading, to), false)
  assert.equal(sight(1, 1.485).sees(from, heading, to), false)
})

test('ordinary enemy contact fails the run and gold defeats the enemy', () => {
  const level = generateMaze(74021, 11)
  const actors = createMazeActors(level)
  const enemy = actors.enemies[0]
  const rotation = new Quaternion().setFromUnitVectors(enemy.position.clone().normalize(), marblePosition.clone().normalize())
  let failures = 0
  assert.equal(actors.advance(rotation, 0, () => failures++), true)
  assert.equal(failures, 1)
  assert.equal(actors.advance(rotation, 0, () => failures++, true), false)
  assert.equal(enemy.defeated, true)
  assert.equal(failures, 1)
})
