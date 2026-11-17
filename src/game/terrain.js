import { Quaternion, Vector3 } from 'three'

export const mudSpeed = 0.5
export const goldDuration = 6000
export const terrainColors = { mud: '#623e30', lava: '#863a26', hotLava: '#ff642b', gold: '#ffd456' }

export function isLavaHot(elapsed) {
  return elapsed % 6000 >= 3500
}

export function makeTerrainTile(cell, type, floorRadius) {
  const corners = cell.corners.map((corner) => corner.clone().lerp(cell.direction, 0.16).normalize())
  const edges = corners.map((corner, index) => {
    const inward = corner.clone().cross(corners[(index + 1) % corners.length])
    return inward.dot(cell.direction) < 0 ? inward.negate() : inward
  })
  const rim = corners.map((corner) => corner.clone().multiplyScalar(floorRadius + 0.009))
  const center = cell.direction.clone().multiplyScalar(floorRadius + 0.009)
  const positions = new Float32Array(rim.flatMap((corner, index) => [
    ...center.toArray(), ...corner.toArray(), ...rim[(index + 1) % rim.length].toArray(),
  ]))

  return { id: cell.id, type, positions, edges }
}

export function createTerrainProbe(terrain) {
  const direction = new Vector3()
  const inverse = new Quaternion()
  return (position, rotation) => {
    direction.copy(position).applyQuaternion(inverse.copy(rotation).invert())
    return terrain.find((tile) => tile.edges.every((edge) => edge.dot(direction) >= 0))
  }
}
