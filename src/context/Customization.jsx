import { useState } from 'react'
import { CustomizationContext } from './customization-context'
import { defaultMaterial, GlassColors } from './palette'

export const CustomizationProvider = (props) => {
    const [material, setMaterial] = useState(defaultMaterial);
    const [mazeColor, setMazeColor]  = useState(null);
    const [glassColor, setGlassColor] = useState(GlassColors[0]);
    const [surfaceTextures, setSurfaceTextures] = useState({});
    return (
        <CustomizationContext.Provider 
        value={{
            material,
            setMaterial,
            mazeColor,
            setMazeColor,
            glassColor,
            setGlassColor,
            surfaceTextures,
            setSurfaceTextures,
        }}>
            {props.children}
        </CustomizationContext.Provider>
    );
};
