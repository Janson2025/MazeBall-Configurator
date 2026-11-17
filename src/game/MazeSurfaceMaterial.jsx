import { useCallback } from 'react'

const patterns = {
  clay: 'sin(p.y * 61.0 + ripple * 1.8) * 0.035 + ripple * 0.06',
  slate: 'smoothstep(0.13, 0.27, abs(sin(p.y * 92.0 + 1.8 * sin(p.x * 11.0) + p.z * 14.0))) * 0.22 - 0.14',
  wood: 'sin(p.x * 53.0 + sin(p.z * 6.0) * 3.0 + sin(p.y * 18.0) * 0.5) * 0.17 + ripple * 0.06',
  basalt: '(sin(p.x * 110.0) * sin(p.y * 103.0) * sin(p.z * 97.0) + ripple) * 0.15',
  steel: 'max(smoothstep(0.93, 1.0, sin((p.x + p.z) * 86.0)), smoothstep(0.93, 1.0, sin(p.y * 86.0))) * 0.19 - 0.07',
  obsidian: 'smoothstep(0.90, 1.0, sin((p.x - p.z) * 29.0 + sin(p.y * 17.0) * 2.5 + ripple)) * 0.37 - 0.12',
}

const finishes = {
  floor: '1.0 + pattern',
  side: '0.85 + pattern * 0.36 + 0.085 * sin(length(p) * 163.0 + p.x * 18.0) + ripple * 0.045',
  cap: '1.13 + pattern * 0.3 + 0.13 * sin(p.x * 176.0) * cos(p.z * 163.0) * sin(p.y * 169.0)',
}

export default function MazeSurfaceMaterial({ texture, surface, ...props }) {
  const compile = useCallback((shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMazePosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMazePosition = position;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMazePosition;')
      .replace('#include <color_fragment>', `
        #include <color_fragment>
        vec3 p = vMazePosition;
        float ripple = sin(p.x * 31.0) * sin(p.y * 34.0) * cos(p.z * 37.0);
        float pattern = ${patterns[texture]};
        diffuseColor.rgb *= ${finishes[surface]};
      `)
  }, [texture, surface])

  const program = `${texture}-${surface}`
  return <meshStandardMaterial key={program} {...props} onBeforeCompile={compile} customProgramCacheKey={() => program} />
}
