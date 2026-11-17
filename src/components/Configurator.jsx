import { useCustomization } from '../context/customization-context'
import { defaultMaterial, GlassColors, MazeColors } from '../context/palette'
import { levelThemes } from '../game/levels'

const patterns = [
  { name: 'Veins', value: defaultMaterial },
  { name: 'Swirls', value: 'Glass' },
]

function ColorPicker({ label, name, colors, selected, onChange }) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="swatches">
        {colors.map((item) => (
          <label className="choice swatch" key={item.name}>
            <input type="radio" name={name} checked={selected === item} onChange={() => onChange(item)} />
            <span className="swatch-dot" style={{ backgroundColor: item.color }} aria-hidden="true" />
            <span className="swatch-name">{item.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

const surfaces = [['floor', 'Floor texture'], ['side', 'Wall-side texture'], ['cap', 'Wall-top texture']]

export default function Configurator({ preview, onPreview }) {
  const { material, setMaterial, mazeColor, setMazeColor, glassColor, setGlassColor, surfaceTextures, setSurfaceTextures } = useCustomization()

  function reset() {
    setMaterial(patterns[0].value)
    setMazeColor(null)
    setGlassColor(GlassColors[0])
    setSurfaceTextures({})
  }

  return (
    <section className="configurator" aria-labelledby="customize-heading">
      <div className="configurator-header">
        <h2 id="customize-heading">Customize</h2>
        <button type="button" className="style-reset" onClick={reset}>Reset appearance</button>
      </div>
      <label className="texture-select">
        Preview maze
        <select value={preview} onChange={(event) => onPreview(event.target.value)}>
          {Object.entries(levelThemes).map(([size, theme]) => <option key={size} value={size}>{theme.name}</option>)}
          <option value="original">Original model</option>
        </select>
      </label>
      {preview === 'original' ? <fieldset>
        <legend>Maze pattern</legend>
        <div className="patterns">
          {patterns.map(({ name, value }) => (
            <label className="choice pattern" key={value}>
              <input type="radio" name="pattern" checked={material === value} onChange={() => setMaterial(value)} />
              <span className={`pattern-icon pattern-icon--${name.toLowerCase()}`} aria-hidden="true" />
              {name}
            </label>
          ))}
        </div>
      </fieldset> : (
        <div className="texture-controls">
          {surfaces.map(([surface, title]) => (
            <label className="texture-select" key={surface}>
              {title}
              <select value={surfaceTextures[surface] ?? ''} onChange={(event) => {
                const texture = event.target.value
                setSurfaceTextures((current) => ({ ...current, [surface]: texture }))
              }}>
                <option value="">Level theme</option>
                {Object.values(levelThemes).map((theme) => <option key={theme.texture} value={theme.texture}>{theme.texture[0].toUpperCase() + theme.texture.slice(1)}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}
      <ColorPicker label="Maze color" name="maze" colors={MazeColors}
        selected={mazeColor ?? (preview === 'original' ? MazeColors[0] : null)} onChange={setMazeColor} />
      {preview !== 'original' && mazeColor && <button type="button" className="style-reset theme-color-reset" onClick={() => setMazeColor(null)}>Use theme color</button>}
      <ColorPicker label="Glass tint" name="glass" colors={GlassColors} selected={glassColor} onChange={setGlassColor} />
    </section>
  )
}
