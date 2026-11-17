import { MeshBVH } from 'three-mesh-bvh'
import { DoubleSide, Ray, Vector3 } from 'three'

export const sightHalfAngle = Math.PI / 5
const sightArc = 0.4

export function createMazeSight(level) {
  const tree = new MeshBVH(level.walls, { indirect: true })
  const ray = new Ray()
  const tangent = new Vector3()
  const radial = new Vector3()
  const across = new Vector3()
  const target = new Vector3()

  function clear(from, to) {
    const length = ray.direction.subVectors(to, from).length()
    if (length < 0.0001) return true
    ray.origin.copy(from)
    ray.direction.multiplyScalar(1 / length)
    const midpoint = Math.min(length, Math.max(0, -from.dot(ray.direction)))
    if (ray.at(midpoint, tangent).lengthSq() < level.floorRadius ** 2) return false
    return !tree.raycastFirst(ray, DoubleSide, 0, length)
  }

  return {
    sees(from, heading, to) {
      const distance = from.angleTo(to)
      if (distance > sightArc) return false
      if (distance < 0.0001) return true
      radial.copy(from).normalize()
      tangent.copy(to).addScaledVector(radial, -to.dot(radial)).normalize()
      return tangent.dot(heading) >= Math.cos(sightHalfAngle) && clear(from, to)
    },

    conePoint(from, heading, angle, out) {
      radial.copy(from).normalize()
      across.crossVectors(radial, heading).normalize()
      const radius = from.length()
      const sample = (length) => target.copy(radial).multiplyScalar(Math.cos(length) * radius)
        .addScaledVector(heading, Math.sin(length) * radius * Math.cos(angle))
        .addScaledVector(across, Math.sin(length) * radius * Math.sin(angle))
      let low = 0
      let high = sightArc
      if (clear(from, sample(high))) low = high
      else {
        for (let i = 0; i < 5; i++) {
          const middle = (low + high) / 2
          if (clear(from, sample(middle))) low = middle
          else high = middle
        }
      }
      return out.copy(sample(low)).setLength(level.floorRadius + 0.042)
    },
  }
}
