import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three'
import { marblePosition } from './mazeMotion.js'
import { makeTerrainTile } from './terrain.js'
import { levelDefaults, levelThemes } from './levels.js'

const floorRadius = 1.37
const wallRadius = 1.59
const faces = [
  ([u, v]) => [u, 1, v],
  ([u, v]) => [u, -1, v],
  ([u, v]) => [1, u, v],
  ([u, v]) => [-1, u, v],
  ([u, v]) => [u, v, 1],
  ([u, v]) => [u, v, -1],
]

function randomSource(seed) {
  let state = seed >>> 0 || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4294967296
  }
}

function makeGrid(divisions) {
  const cells = []
  const edges = new Map()
  const vertices = new Map()
  const steps = Array.from({ length: divisions + 1 }, (_, i) =>
    i === 0 ? -1 : i === divisions ? 1 : Math.tan((i / divisions - 0.5) * Math.PI / 2))

  function vertex(face, u, v) {
    const point = face([steps[u], steps[v]])
    const key = point.join(',')
    if (!vertices.has(key)) vertices.set(key, { id: vertices.size, direction: new Vector3(...point).normalize() })
    return vertices.get(key)
  }

  for (const face of faces) {
    for (let row = 0; row < divisions; row++) {
      for (let col = 0; col < divisions; col++) {
        const corners = [
          vertex(face, col, row), vertex(face, col + 1, row),
          vertex(face, col + 1, row + 1), vertex(face, col, row + 1),
        ]
        const direction = corners.reduce((sum, corner) => sum.add(corner.direction), new Vector3()).normalize()
        const cell = { id: cells.length, direction, corners: corners.map((corner) => corner.direction), edges: [] }
        cells.push(cell)

        corners.forEach((a, index) => {
          const b = corners[(index + 1) % corners.length]
          const key = [Math.min(a.id, b.id), Math.max(a.id, b.id)].join(':')
          if (!edges.has(key)) edges.set(key, { a: a.direction, b: b.direction, cells: [], open: false })
          const edge = edges.get(key)
          edge.cells.push(cell.id)
          cell.edges.push(edge)
        })
      }
    }
  }
  return { cells, edges }
}

function makeWalls(edges, scale) {
  const wallHalfWidth = 0.022 / scale
  const positions = []
  const caps = []
  function quad(a, b, c, d, target = positions) {
    for (const point of [a, b, c, a, c, d]) target.push(point.x, point.y, point.z)
  }

  for (const { a, b, open } of edges.values()) {
    if (open) continue
    const normal = a.clone().cross(b).normalize()
    const overhang = wallHalfWidth / a.angleTo(b)
    let previous
    for (let i = 0; i <= 5; i++) {
      const center = a.clone().lerp(b, -overhang + i / 5 * (1 + 2 * overhang)).normalize()
      const left = center.clone().addScaledVector(normal, wallHalfWidth).normalize()
      const right = center.clone().addScaledVector(normal, -wallHalfWidth).normalize()
      const ring = [
        left.clone().multiplyScalar(floorRadius - 0.015), left.multiplyScalar(wallRadius),
        right.clone().multiplyScalar(floorRadius - 0.015), right.multiplyScalar(wallRadius),
      ]
      if (previous) {
        quad(previous[0], ring[0], ring[1], previous[1])
        quad(previous[1], ring[1], ring[3], previous[3], caps)
        quad(previous[3], ring[3], ring[2], previous[2])
      } else {
        quad(ring[0], ring[1], ring[3], ring[2])
      }
      if (i === 5) quad(ring[0], ring[2], ring[3], ring[1])
      previous = ring
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions.concat(caps), 3))
  geometry.addGroup(0, positions.length / 3, 0)
  geometry.addGroup(positions.length / 3, caps.length / 3, 1)
  geometry.computeVertexNormals()
  return geometry
}

function shuffle(items, random) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

export function generateMaze(seed, divisions = 3, options = levelDefaults(divisions)) {
  const random = randomSource(seed)
  const { cells, edges } = makeGrid(divisions)
  const start = Math.floor(divisions ** 2 / 2)
  const finish = start + divisions ** 2
  const parent = new Map([[start, null]])
  const otherCell = (edge, cell) => edge.cells.find((id) => id !== cell)
  const stack = [start]

  if (divisions === 3) {
    // Reserve a short, easily learned route before carving the side passages.
    const search = [start]
    const previous = new Map([[start, null]])
    for (let i = 0; !previous.has(finish); i++) {
      const cell = search[i]
      for (const edge of shuffle([...cells[cell].edges], random)) {
        const next = otherCell(edge, cell)
        if (previous.has(next)) continue
        previous.set(next, edge)
        search.push(next)
      }
    }
    const opening = []
    for (let cell = finish; cell !== start;) {
      const edge = previous.get(cell)
      const from = otherCell(edge, cell)
      parent.set(cell, from)
      edge.open = true
      opening.unshift(cell)
      cell = from
    }
    stack.push(...opening)
  }

  while (stack.length) {
    const cell = stack.at(-1)
    const choices = cells[cell].edges.filter((edge) => !parent.has(otherCell(edge, cell)))
    if (!choices.length) {
      stack.pop()
      continue
    }
    const edge = choices[Math.floor(random() * choices.length)]
    const next = otherCell(edge, cell)
    edge.open = true
    parent.set(next, cell)
    stack.push(next)
  }

  const route = []
  for (let cell = finish; cell !== null; cell = parent.get(cell)) route.unshift(cell)
  const routeSet = new Set(route)
  const detour = new Map(route.map((cell) => [cell, 0]))
  const queue = [...route]
  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i]
    for (const edge of cells[cell].edges.filter((edge) => edge.open)) {
      const next = otherCell(edge, cell)
      if (detour.has(next)) continue
      detour.set(next, detour.get(cell) + 1)
      queue.push(next)
    }
  }

  const routePickups = shuffle(route.slice(2, -2), random).slice(0, Math.min(3, options.buddies))
  const sideCells = cells.filter(({ id }) => !routeSet.has(id))
  const sidePickups = shuffle(sideCells.filter(({ id }) => detour.get(id) <= 6), random)
    .concat(sideCells.filter(({ id }) => detour.get(id) > 6))
    .slice(0, options.buddies - routePickups.length).map(({ id }) => id)
  const point = (id) => cells[id].direction.clone().multiplyScalar(marblePosition.y)
  const reserved = new Set([start, finish, ...routePickups, ...sidePickups])
  const terrainCells = [
    ...shuffle(route.slice(3, -3).filter((id) => !reserved.has(id)), random),
    ...shuffle(cells.filter(({ id }) => !routeSet.has(id) && !reserved.has(id)).map(({ id }) => id), random),
  ]
  const terrainTypes = [
    ...Array(options.mud).fill('mud'),
    ...Array(options.lava).fill('lava'),
    ...Array(options.gold ?? 0).fill('gold'),
  ]
  const terrain = terrainCells.slice(0, terrainTypes.length).map((id, index) =>
    makeTerrainTile(cells[id], terrainTypes[index], floorRadius))

  // Escape routes give the mobile finish alternatives to doubling back at a dead end.
  const loops = divisions === 3 ? 2 : divisions * 5
  if (options.flee) {
    const finishExits = cells[finish].edges
    const extraExits = Math.max(0, 2 - finishExits.filter((edge) => edge.open).length)
    for (const edge of finishExits.filter((edge) => !edge.open).slice(0, extraExits)) edge.open = true
  }
  const closed = shuffle([...edges.values()].filter((edge) => !edge.open), randomSource(seed ^ 0x5123))
  for (const edge of closed.slice(0, loops)) edge.open = true

  const passages = cells.map((cell) => new Map(cell.edges.filter((edge) => edge.open).map((edge) => [
    otherCell(edge, cell.id), edge.a.clone().add(edge.b).setLength(marblePosition.y),
  ])))
  const neighbors = passages.map((passage) => [...passage.keys()])
  const routeWaypoints = route.flatMap((cell, index) =>
    index === 0 ? [point(cell)] : [passages[cell].get(route[index - 1]), point(cell)])
  const spawnPool = shuffle(cells.filter(({ id }) => !reserved.has(id) && detour.get(id) >= 3), random)
  const chasers = spawnPool.slice(0, options.chasers).map(({ id }) => id)

  // Leave enough clearance at the oblique turns where three cube faces meet.
  const scale = divisions >= 9 ? divisions / 8 : 1

  return {
    theme: levelThemes[divisions],
    scale,
    floorRadius,
    walls: makeWalls(edges, scale),
    finish: point(finish),
    pickups: [...routePickups, ...sidePickups].map(point),
    route: route.map(point),
    routeWaypoints,
    terrain,
    neighbors,
    passages,
    centers: cells.map(({ id }) => point(id)),
    finishCell: finish,
    fleeing: options.flee,
    chasers,
    chaserSpeed: divisions >= 13 ? 0.28 : 0.17,
  }
}
