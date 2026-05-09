import { useMemo } from 'react';
import { useUIStore } from '../store';
import { Colors as DarkColors, LightColors, Typography, Spacing, BorderRadius, Shadows, Gradients, Glassmorphism as DarkGlassmorphism, LightGlassmorphism } from '../theme/tokens';

export function useThemeColors() {
  const themeMode = useUIStore((state) => state.themeMode);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const isDark = themeMode === 'dark';
  
  const Colors = useMemo(() => isDark ? DarkColors : LightColors, [themeMode]);
  const Glassmorphism = useMemo(() => isDark ? DarkGlassmorphism : LightGlassmorphism, [themeMode]);
  
  return { Colors, isDark, toggleTheme, Typography, Spacing, BorderRadius, Shadows, Gradients, Glassmorphism };
}