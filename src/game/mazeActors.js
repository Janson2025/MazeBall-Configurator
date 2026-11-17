import { Quaternion, Vector3 } from 'three'
import { marblePosition } from './mazeMotion.js'
import { createMazeSight } from './mazeSight.js'

export function passageDistances(neighbors, start) {
  const distances = new Int32Array(neighbors.length).fill(-1)
  const queue = [start]
  distances[start] = 0
  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i]
    for (const next of neighbors[cell]) {
      if (distances[next] !== -1) continue
      distances[next] = distances[cell] + 1
      queue.push(next)
    }
  }
  return distances
}

export function createMazeActors(level) {
  const { centers, neighbors, passages } = level
  const actorAt = (cell) => ({
    cell, next: null, progress: 0, length: 0, split: 0, position: centers[cell].clone(),
  })
  const enemies = level.chasers.map((home) => {
    const distances = passageDistances(neighbors, home)
    const waypoint = distances.findIndex((distance) => distance === 4)
    const patrol = waypoint < 0 ? neighbors[home][0] : waypoint
    const heading = centers[neighbors[home][0]].clone().sub(centers[home])
    heading.addScaledVector(centers[home], -heading.dot(centers[home]) / marblePosition.lengthSq()).normalize()
    return { ...actorAt(home), home, patrol, patrolTarget: patrol, heading, sees: false, boost: 0, defeated: false }
  })
  const sight = enemies.length ? createMazeSight(level) : null
  const goal = level.fleeing ? actorAt(level.finishCell) : null
  const inverse = new Quaternion()
  const player = new Vector3()
  const previousPosition = new Vector3()
  const patrolDistances = new Map()
  let playerCell = -1
  let distances

  function step(actor, delta, speed, choose) {
    if (actor.next === null) {
      actor.next = choose(actor.cell)
      if (actor.next === null) return
      const middle = passages[actor.cell].get(actor.next)
      const firstLeg = centers[actor.cell].angleTo(middle)
      actor.length = firstLeg + middle.angleTo(centers[actor.next])
      actor.split = firstLeg / actor.length
    }

    actor.progress = Math.min(1, actor.progress + speed * delta / actor.length)
    const middle = passages[actor.cell].get(actor.next)
    if (actor.progress <= actor.split) {
      actor.position.copy(centers[actor.cell]).lerp(middle, actor.progress / actor.split)
    } else {
      actor.position.copy(middle).lerp(centers[actor.next], (actor.progress - actor.split) / (1 - actor.split))
    }
    actor.position.setLength(marblePosition.y)
    if (actor.progress === 1) {
      actor.cell = actor.next
      actor.next = null
      actor.progress = 0
    }
  }

  function chooseEscape(cell) {
    if (distances[cell] > 6) return null
    const exits = neighbors[cell].filter((next) => distances[next] > distances[cell])
    // Prefer an open junction over a dead end when both lead away.
    return exits.find((next) => neighbors[next].length > 1) ?? exits[0] ?? null
  }

  function distancesTo(cell) {
    if (!patrolDistances.has(cell)) patrolDistances.set(cell, passageDistances(neighbors, cell))
    return patrolDistances.get(cell)
  }

  function moveToward(cell, distances) {
    return neighbors[cell].find((next) => distances[next] < distances[cell]) ?? null
  }

  function patrolStep(enemy, cell) {
    if (cell === enemy.patrolTarget) enemy.patrolTarget = cell === enemy.home ? enemy.patrol : enemy.home
    return moveToward(cell, distancesTo(enemy.patrolTarget))
  }

  return {
    enemies,
    sight,
    finish: goal?.position ?? level.finish,
    advance(rotation, delta, onHit, gold = false) {
      if (!goal && enemies.length === 0) return false
      player.copy(marblePosition).applyQuaternion(inverse.copy(rotation).invert())
      let nearest = 0
      let bestDot = -Infinity
      centers.forEach((center, cell) => {
        const dot = center.dot(player)
        if (dot <= bestDot) return
        bestDot = dot
        nearest = cell
      })
      if (playerCell !== nearest) {
        playerCell = nearest
        distances = passageDistances(neighbors, playerCell)
      }

      if (goal) step(goal, delta, 0.34, chooseEscape)
      const touchRadius = 0.07 / level.scale
      for (const enemy of enemies) {
        if (enemy.defeated) continue
        const seen = sight.sees(enemy.position, enemy.heading, player)
        enemy.boost = Math.max(0, enemy.boost - delta)
        if (seen && !enemy.sees && enemy.boost === 0) enemy.boost = 1.2
        enemy.sees = seen
      }
      const spotter = enemies.find((enemy) => !enemy.defeated && enemy.sees)
      const reinforcement = spotter ? passageDistances(neighbors, spotter.cell) : null
      for (const enemy of enemies) {
        if (enemy.defeated) continue
        previousPosition.copy(enemy.position)
        const speed = level.chaserSpeed * (enemy.boost > 0 ? 1.65 : spotter ? 1 : 0.7)
        step(enemy, delta, speed, (cell) => {
          if (enemy.sees) return moveToward(cell, distances)
          if (reinforcement) return moveToward(cell, reinforcement)
          return patrolStep(enemy, cell)
        })
        if (previousPosition.distanceToSquared(enemy.position) > 1e-12) {
          enemy.heading.subVectors(enemy.position, previousPosition)
            .addScaledVector(enemy.position, -enemy.heading.dot(enemy.position) / marblePosition.lengthSq()).normalize()
        }
        if (enemy.position.distanceToSquared(player) > touchRadius ** 2) continue
        if (gold) {
          enemy.defeated = true
          enemy.sees = false
        } else {
          onHit()
          return true
        }
      }
      return false
    },
  }
}
