import { createDarkTheme, createLightTheme, type BrandVariants, type Theme } from '@fluentui/react-components';

const brand: BrandVariants = {
  10: '#061B2E', 20: '#0A2B49', 30: '#0D3B63', 40: '#104B7C', 50: '#174A7E', 60: '#236292', 70: '#3678A6', 80: '#4B8DB8',
  90: '#62A1C7', 100: '#7AB5D5', 110: '#94C8E1', 120: '#B0D9EB', 130: '#C9E6F2', 140: '#DDF0F7', 150: '#EDF7FB', 160: '#F7FBFD',
};

export const themes: Record<'light' | 'dark', Theme> = {
  light: { ...createLightTheme(brand), fontFamilyBase: 'Inter, "Segoe UI Variable", system-ui, sans-serif', borderRadiusMedium: '8px', borderRadiusLarge: '12px' },
  dark: { ...createDarkTheme(brand), fontFamilyBase: 'Inter, "Segoe UI Variable", system-ui, sans-serif', borderRadiusMedium: '8px', borderRadiusLarge: '12px' },
};