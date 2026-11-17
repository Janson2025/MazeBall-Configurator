import { OrbitControls } from '@react-three/drei'
import BallMaze from './BallMaze'
import SceneLighting from './SceneLighting'
import GeneratedMaze from '../game/GeneratedMaze'

export default function Experience({ level }) {
  return (
    <>
      <SceneLighting />
      {level ? <GeneratedMaze level={level} /> : <BallMaze />}
      <OrbitControls makeDefault enablePan={false} minDistance={4.8} maxDistance={13} />
    </>
  )
}
