import { createContext, useContext } from 'react';

/** True when @shopify/react-native-skia / CanvasKit is initialized and safe to use. */
export const SkiaAvailableContext = createContext(true); // default true for native

export function useSkiaAvailable(): boolean {
  return useContext(SkiaAvailableContext);
}
