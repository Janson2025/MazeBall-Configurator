import { Environment, Lightformer } from '@react-three/drei'

export default function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 5]} intensity={2} />
      <Environment resolution={128}>
        <Lightformer position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[6, 3, 1]} intensity={2} />
        <Lightformer position={[0, 1, -5]} scale={[4, 4, 1]} color="#bcc8ff" />
      </Environment>
    </>
  )
}
