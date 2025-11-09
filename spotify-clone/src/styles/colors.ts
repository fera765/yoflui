// Cores primárias do projeto
export const primaryColors = {
  // Cores principais
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  accent: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },
};

// Paleta de cores para o tema escuro
export const darkThemeColors = {
  background: '#0f172a', // slate-900
  surface: '#1e293b',    // slate-800
  text: {
    primary: '#f8fafc',  // slate-50
    secondary: '#e2e8f0', // slate-200
    disabled: '#94a3b8',  // slate-400
  },
  border: '#334155',     // slate-700
  primary: primaryColors.primary,
  accent: primaryColors.accent,
};

// Paleta de cores para o tema claro
export const lightThemeColors = {
  background: '#ffffff',
  surface: '#f8fafc',    // slate-50
  text: {
    primary: '#0f172a',  // slate-900
    secondary: '#64748b', // slate-500
    disabled: '#cbd5e1',  // slate-300
  },
  border: '#e2e8f0',     // slate-200
  primary: primaryColors.primary,
  accent: primaryColors.accent,
};

// Exportar cores padrão (tema escuro como padrão)
export const colors = darkThemeColors;

// Tipos para as cores
export type ColorPalette = typeof colors;
export type PrimaryColors = typeof primaryColors;