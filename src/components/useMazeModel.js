import { useGLTF } from '@react-three/drei'

export function useMazeModel() {
  return useGLTF(`${import.meta.env.BASE_URL}models/ballMaze.gltf`, false, false).nodes
}
