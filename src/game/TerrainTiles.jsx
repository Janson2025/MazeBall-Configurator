import { DoubleSide } from 'three'
import { terrainColors } from './terrain'

export default function TerrainTiles({ terrain, lavaMaterials, goldTiles }) {
  return terrain.map((tile) => (
    <mesh key={tile.id} ref={tile.type === 'gold' ? (mesh) => {
      if (mesh) goldTiles.current.set(tile.id, mesh)
      else goldTiles.current.delete(tile.id)
    } : undefined}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[tile.positions, 3]} />
      </bufferGeometry>
      <meshBasicMaterial
        color={terrainColors[tile.type]}
        toneMapped={false}
        side={DoubleSide}
        ref={tile.type === 'lava' ? (material) => {
          if (material) lavaMaterials.current.set(tile.id, material)
          else lavaMaterials.current.delete(tile.id)
        } : undefined}
      />
    </mesh>
  ))
}
