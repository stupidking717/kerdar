import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import type { ThemeConfig, Theme } from '../types';
import {
  ThemeMode,
  BorderRadius,
  NodeCategory,
  defaultNodeColors,
  defaultLightTheme,
  defaultDarkTheme,
} from '../types';

/**
 * Theme state
 */
interface ThemeState {
  // Current theme configuration
  config: ThemeConfig;

  // Computed theme
  theme: Theme;

  // System preference
  systemPreference: 'light' | 'dark';

  // CSS variables applied
  cssVariablesApplied: boolean;
}

/**
 * Theme actions
 */
interface ThemeActions {
  // Theme configuration
  setThemeConfig: (config: Partial<ThemeConfig>) => void;
  resetThemeConfig: () => void;

  // Mode
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  getEffectiveMode: () => 'light' | 'dark';

  // Colors
  setPrimaryColor: (color: string) => void;
  setAccentColor: (color: string) => void;
  setNodeColor: (category: NodeCategory, color: string) => void;
  resetNodeColors: () => void;

  // Border radius
  setBorderRadius: (radius: BorderRadius) => void;

  // Fonts
  setFontFamily: (fontFamily: string) => void;
  setFontFamilyMono: (fontFamily: string) => void;

  // Custom CSS
  setCustomCSS: (css: string) => void;
  setCustomVariable: (name: string, value: string) => void;
  removeCustomVariable: (name: string) => void;

  // CSS variables
  applyCSSVariables: (element?: HTMLElement) => void;
  getCSSVariables: () => Record<string, string>;

  // System preference
  updateSystemPreference: () => void;
}

/**
 * Default theme configuration
 */
const defaultThemeConfig: ThemeConfig = {
  mode: ThemeMode.System,
  primaryColor: '#3B82F6',
  accentColor: '#8B5CF6',
  borderRadius: BorderRadius.Medium,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontFamilyMono: 'Fira Code, monospace',
  nodeColors: defaultNodeColors,
  customCSS: '',
  customVariables: {},
};

/**
 * Get system color preference
 */
function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Compute theme from config
 */
function computeTheme(config: ThemeConfig, systemPreference: 'light' | 'dark'): Theme {
  const effectiveMode =
    config.mode === ThemeMode.System ? systemPreference : config.mode === ThemeMode.Dark ? 'dark' : 'light';

  const baseTheme = effectiveMode === 'dark' ? defaultDarkTheme : defaultLightTheme;

  return {
    ...baseTheme,
    mode: effectiveMode === 'dark' ? ThemeMode.Dark : ThemeMode.Light,
    nodeColors: {
      ...baseTheme.nodeColors,
      ...config.nodeColors,
    },
  };
}

/**
 * Theme store
 */
export const useThemeStore = create<ThemeState & ThemeActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        config: defaultThemeConfig,
        theme: computeTheme(defaultThemeConfig, getSystemPreference()),
        systemPreference: getSystemPreference(),
        cssVariablesApplied: false,

        // Theme configuration
        setThemeConfig: (configUpdate) => {
          set((state) => {
            const newConfig = { ...state.config, ...configUpdate };
            return {
              config: newConfig,
              theme: computeTheme(newConfig, state.systemPreference),
            };
          });
          get().applyCSSVariables();
        },

        resetThemeConfig: () => {
          set((state) => ({
            config: defaultThemeConfig,
            theme: computeTheme(defaultThemeConfig, state.systemPreference),
          }));
          get().applyCSSVariables();
        },

        // Mode
        setMode: (mode) => {
          set((state) => {
            const newConfig = { ...state.config, mode };
            return {
              config: newConfig,
              theme: computeTheme(newConfig, state.systemPreference),
            };
          });
          get().applyCSSVariables();
        },

        toggleMode: () => {
          const { config, systemPreference } = get();
          const currentEffectiveMode =
            config.mode === ThemeMode.System
              ? systemPreference
              : config.mode === ThemeMode.Dark
              ? 'dark'
              : 'light';

          const newMode =
            currentEffectiveMode === 'dark' ? ThemeMode.Light : ThemeMode.Dark;
          get().setMode(newMode);
        },

        getEffectiveMode: () => {
          const { config, systemPreference } = get();
          return config.mode === ThemeMode.System
            ? systemPreference
            : config.mode === ThemeMode.Dark
            ? 'dark'
            : 'light';
        },

        // Colors
        setPrimaryColor: (color) => {
          get().setThemeConfig({ primaryColor: color });
        },

        setAccentColor: (color) => {
          get().setThemeConfig({ accentColor: color });
        },

        setNodeColor: (category, color) => {
          const { config } = get();
          get().setThemeConfig({
            nodeColors: {
              ...config.nodeColors,
              [category]: color,
            },
          });
        },

        resetNodeColors: () => {
          get().setThemeConfig({ nodeColors: defaultNodeColors });
        },

        // Border radius
        setBorderRadius: (radius) => {
          get().setThemeConfig({ borderRadius: radius });
        },

        // Fonts
        setFontFamily: (fontFamily) => {
          get().setThemeConfig({ fontFamily });
        },

        setFontFamilyMono: (fontFamily) => {
          get().setThemeConfig({ fontFamilyMono: fontFamily });
        },

        // Custom CSS
        setCustomCSS: (css) => {
          get().setThemeConfig({ customCSS: css });
        },

        setCustomVariable: (name, value) => {
          const { config } = get();
          get().setThemeConfig({
            customVariables: {
              ...config.customVariables,
              [name]: value,
            },
          });
        },

        removeCustomVariable: (name) => {
          const { config } = get();
          const newVariables = { ...config.customVariables };
          delete newVariables[name];
          get().setThemeConfig({ customVariables: newVariables });
        },

        // CSS variables
        applyCSSVariables: (element) => {
          if (typeof document === 'undefined') return;

          const target = element ?? document.documentElement;
          const variables = get().getCSSVariables();

          Object.entries(variables).forEach(([key, value]) => {
            target.style.setProperty(key, value);
          });

          // Apply dark mode class
          const effectiveMode = get().getEffectiveMode();
          if (effectiveMode === 'dark') {
            target.classList.add('dark');
          } else {
            target.classList.remove('dark');
          }

          set({ cssVariablesApplied: true });
        },

        getCSSVariables: () => {
          const { config, theme } = get();
          const variables: Record<string, string> = {};

          // Base colors
          Object.entries(theme.colors).forEach(([key, value]) => {
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            variables[`--kd-${cssKey}`] = value;
          });

          // Primary and accent colors
          variables['--kd-primary-hex'] = config.primaryColor;
          variables['--kd-accent-hex'] = config.accentColor;

          // Node colors
          Object.entries(theme.nodeColors).forEach(([category, color]) => {
            variables[`--kd-node-${category}`] = color;
          });

          // Status colors
          Object.entries(theme.statusColors).forEach(([status, color]) => {
            variables[`--kd-status-${status}`] = color;
          });

          // Border radius
          const radiusMap: Record<BorderRadius, string> = {
            [BorderRadius.None]: '0px',
            [BorderRadius.Small]: '4px',
            [BorderRadius.Medium]: '8px',
            [BorderRadius.Large]: '12px',
            [BorderRadius.ExtraLarge]: '16px',
            [BorderRadius.Full]: '9999px',
          };
          variables['--kd-radius'] = radiusMap[config.borderRadius];

          // Fonts
          if (config.fontFamily) {
            variables['--kd-font-sans'] = config.fontFamily;
          }
          if (config.fontFamilyMono) {
            variables['--kd-font-mono'] = config.fontFamilyMono;
          }

          // Canvas
          variables['--kd-canvas-bg'] = theme.canvas.backgroundColor;
          variables['--kd-canvas-grid-color'] = theme.canvas.gridColor;

          // Edges
          variables['--kd-edge-color'] = theme.edge.color;
          variables['--kd-edge-width'] = `${theme.edge.width}px`;
          variables['--kd-edge-selected'] = theme.edge.selectedColor;

          // Custom variables
          if (config.customVariables) {
            Object.entries(config.customVariables).forEach(([key, value]) => {
              variables[key.startsWith('--') ? key : `--${key}`] = value;
            });
          }

          return variables;
        },

        // System preference
        updateSystemPreference: () => {
          const preference = getSystemPreference();
          set((state) => ({
            systemPreference: preference,
            theme: computeTheme(state.config, preference),
          }));
          get().applyCSSVariables();
        },
      }),
      {
        name: 'kerdar-theme',
        partialize: (state) => ({ config: state.config }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.theme = computeTheme(state.config, state.systemPreference);
          }
        },
      }
    )
  )
);

/**
 * Initialize theme (call on app mount)
 */
export function initializeTheme() {
  const store = useThemeStore.getState();

  // Listen for system preference changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      store.updateSystemPreference();
    });
  }

  // Apply CSS variables
  store.applyCSSVariables();
}

/**
 * Selector hooks
 */
export const useTheme = () => useThemeStore((state) => state.theme);
export const useThemeConfig = () => useThemeStore((state) => state.config);
export const useThemeMode = () => useThemeStore((state) => state.config.mode);
export const useEffectiveThemeMode = () => useThemeStore((state) => state.getEffectiveMode());
export const useNodeColors = () => useThemeStore((state) => state.theme.nodeColors);

/**
 * Hook to get color for a node category
 */
export function useNodeColor(category: NodeCategory): string {
  return useThemeStore((state) => state.theme.nodeColors[category]);
}

/**
 * Hook for theme actions
 */
export function useThemeActions() {
  const store = useThemeStore;

  return {
    setMode: store.getState().setMode,
    toggleMode: store.getState().toggleMode,
    setPrimaryColor: store.getState().setPrimaryColor,
    setAccentColor: store.getState().setAccentColor,
    setNodeColor: store.getState().setNodeColor,
    setBorderRadius: store.getState().setBorderRadius,
    setCustomCSS: store.getState().setCustomCSS,
    resetThemeConfig: store.getState().resetThemeConfig,
  };
}
