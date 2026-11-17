import { createContext, useContext } from 'react'

export const CustomizationContext = createContext(null)

export function useCustomization() {
  return useContext(CustomizationContext)
}
