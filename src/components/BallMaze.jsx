import { MeshTransmissionMaterial, useTexture } from '@react-three/drei'
import { RepeatWrapping } from 'three'
import { useMazeModel } from './useMazeModel'
import { useCustomization } from '../context/customization-context'
import { MazeColors } from '../context/palette'

const assets = import.meta.env.BASE_URL

function tileTextures(textures) {
  for (const texture of Object.values(textures)) {
    texture.repeat.set(4, 4)
    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.needsUpdate = true
  }
}

export default function BallMaze({ clearCover = false }) {
  const { material, mazeColor, glassColor } = useCustomization()
  const nodes = useMazeModel()
  const veins = useTexture({
    roughnessMap: `${assets}textures/maze/Plastic_004_roughness.jpg`,
    aoMap: `${assets}textures/maze/Veins_001_ambientOcclusion.jpg`,
  }, tileTextures)
  const swirls = useTexture({
    roughnessMap: `${assets}textures/glass/Plastic_001_ROUGH.jpg`,
    aoMap: `${assets}textures/glass/Abstract_Organic_005_ambientOcclusion.jpg`,
  })

  return (
    <group>
      <mesh>
        <primitive object={nodes.maze.geometry} attach="geometry" />
        <meshStandardMaterial {...(material === 'Plastic' ? veins : swirls)} color={(mazeColor ?? MazeColors[0]).color} />
      </mesh>
      <mesh>
        <primitive object={nodes.glass.geometry} attach="geometry" />
        {clearCover
          ? <meshPhysicalMaterial color={glassColor.color} transparent opacity={0.18} roughness={0.3} depthWrite={false} />
          : <MeshTransmissionMaterial resolution={256} samples={6} roughness={0.15} thickness={0.025} color={glassColor.color} />}
      </mesh>
    </group>
  )
}
