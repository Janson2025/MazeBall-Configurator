import { DoubleSide } from 'three'
import { useCustomization } from '../context/customization-context'
import MazeSurfaceMaterial from './MazeSurfaceMaterial'

export default function GeneratedMaze({ level }) {
  const { mazeColor, glassColor, surfaceTextures } = useCustomization()
  const color = mazeColor?.color ?? level.theme.color
  const texture = (surface) => surfaceTextures[surface] || level.theme.texture

  return (
    <>
      <mesh>
        <sphereGeometry args={[level.floorRadius, 64, 48]} />
        <MazeSurfaceMaterial texture={texture('floor')} surface="floor" color={color} roughness={0.84} />
      </mesh>
      <mesh>
        <primitive object={level.walls} attach="geometry" />
        <MazeSurfaceMaterial attach="material-0" texture={texture('side')} surface="side"
          color={color} roughness={0.68} side={DoubleSide} />
        <MazeSurfaceMaterial attach="material-1" texture={texture('cap')} surface="cap"
          color={color} roughness={0.41} side={DoubleSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.65, 64, 48]} />
        <meshPhysicalMaterial color={glassColor.color} transparent opacity={0.14} roughness={0.24} depthWrite={false} />
      </mesh>
    </>
  )
}
