import { MeshBVH } from 'three-mesh-bvh'
import { Quaternion, Sphere, Vector3 } from 'three'

export const marblePosition = new Vector3(0, 1.49, 0)
export const marbleRadius = 0.051

const collisionRadius = marbleRadius + 0.003
const rotationSpeed = 0.9
const maxStep = 0.005
const screenAxis = new Vector3(0, 1, 0)
const cornerDirections = [15, 30, 45, 60, 75].map((degrees) => {
  const radians = degrees * Math.PI / 180
  return { forward: Math.cos(radians), sideways: Math.sin(radians) }
})

export function createMazeMotion({ walls, finish, pickups, scale = 1 }) {
  const bvh = new MeshBVH(walls, { indirect: true })
  const marble = new Sphere(new Vector3(), collisionRadius / scale)
  const contactRadiusSquared = (0.075 / scale) ** 2
  const axis = new Vector3()
  const turn = new Quaternion()
  const roll = new Quaternion()
  const candidate = new Quaternion()
  const inverse = new Quaternion()
  const normal = new Vector3()
  const nearest = {}
  const collected = new Set()

  function tryTurn(rotation, marbleRotation, x, y, step) {
    const magnitude = Math.hypot(x, y)
    if (magnitude < 0.001) return false

    axis.set(y / magnitude, 0, -x / magnitude)
    turn.setFromAxisAngle(axis, step * magnitude)
    candidate.multiplyQuaternions(turn, rotation).normalize()
    inverse.copy(candidate).invert()
    marble.center.copy(marblePosition).applyQuaternion(inverse)

    if (bvh.intersectsSphere(marble)) return false

    rotation.copy(candidate)
    const travel = step * magnitude * marblePosition.y
    roll.setFromAxisAngle(axis, -travel * scale / marbleRadius)
    marbleRotation.premultiply(roll).normalize()
    return true
  }

  function slide(rotation, marbleRotation, x, y, step) {
    if (!bvh.closestPointToPoint(marble.center, nearest, 0, marble.radius + 0.001)) return false
    normal.copy(marble.center).sub(nearest.point).applyQuaternion(candidate)
    normal.y = 0
    if (normal.lengthSq() < 1e-10) return false
    normal.normalize()
    const intoWall = Math.min(0, -(x * normal.x + y * normal.z))
    return tryTurn(rotation, marbleRotation, x + intoWall * normal.x, y + intoWall * normal.z, step * 0.65)
  }

  function roundCorner(rotation, marbleRotation, x, y, step) {
    // Where two faces meet, the nearest face's tangent can still hit the other face.
    // Try nearby forward directions at reduced speed, checking each against the walls.
    for (const { forward, sideways } of cornerDirections) {
      const dx = x * forward
      const dy = y * forward
      if (tryTurn(rotation, marbleRotation, dx - y * sideways, dy + x * sideways, step * 0.55)
        || tryTurn(rotation, marbleRotation, dx + y * sideways, dy - x * sideways, step * 0.55)) return true
    }
    return false
  }

  return {
    reachedFinish(rotation) {
      inverse.copy(rotation).invert()
      marble.center.copy(marblePosition).applyQuaternion(inverse)
      return marble.center.distanceToSquared(finish) <= contactRadiusSquared
    },

    twist(rotation, radians) {
      // The overhead screen's Z axis is world Y. Both poles stay fixed during this turn.
      turn.setFromAxisAngle(screenAxis, radians)
      rotation.premultiply(turn).normalize()
    },

    advance(rotation, marbleRotation, x, y, delta, onCollect) {
      const angle = Math.min(delta, 0.05) * rotationSpeed
      const steps = Math.max(1, Math.ceil(angle / maxStep))
      let moved = false

      for (let index = 0; index < steps; index++) {
        const step = angle / steps
        const accepted = tryTurn(rotation, marbleRotation, x, y, step)
          || slide(rotation, marbleRotation, x, y, step)
          || roundCorner(rotation, marbleRotation, x, y, step)
        if (!accepted) break

        moved = true
        pickups.forEach((position, id) => {
          if (collected.has(id) || marble.center.distanceToSquared(position) > contactRadiusSquared) return
          collected.add(id)
          onCollect(id)
        })
        if (marble.center.distanceToSquared(finish) <= contactRadiusSquared) {
          return { moved, finished: true }
        }
      }

      return { moved, finished: false }
    },
  }
}
