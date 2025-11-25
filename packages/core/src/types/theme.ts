import { ThemeMode, BorderRadius, NodeCategory } from './enums';

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Theme mode */
  mode: ThemeMode;

  /** Primary color (hex) */
  primaryColor: string;

  /** Accent color (hex) */
  accentColor: string;

  /** Border radius preset */
  borderRadius: BorderRadius;

  /** Font family for text */
  fontFamily?: string;

  /** Font family for code */
  fontFamilyMono?: string;

  /** Node colors by category */
  nodeColors?: Partial<Record<NodeCategory, string>>;

  /** Custom CSS to inject */
  customCSS?: string;

  /** Custom CSS variables */
  customVariables?: Record<string, string>;
}

/**
 * Default node colors by category
 */
export const defaultNodeColors: Record<NodeCategory, string> = {
  [NodeCategory.Trigger]: '#8B5CF6',      // Purple
  [NodeCategory.Action]: '#3B82F6',       // Blue
  [NodeCategory.Logic]: '#F59E0B',        // Amber
  [NodeCategory.Data]: '#10B981',         // Green
  [NodeCategory.Integration]: '#EC4899',  // Pink
  [NodeCategory.AI]: '#6366F1',           // Indigo
  [NodeCategory.Database]: '#14B8A6',     // Teal
  [NodeCategory.Communication]: '#F97316', // Orange
  [NodeCategory.Custom]: '#64748B',       // Slate
};

/**
 * Status colors
 */
export interface StatusColors {
  success: string;
  error: string;
  warning: string;
  info: string;
  running: string;
}

/**
 * Default status colors
 */
export const defaultStatusColors: StatusColors = {
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  running: '#8B5CF6',
};

/**
 * Light theme colors
 */
export interface LightThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

/**
 * Default light theme colors
 */
export const defaultLightColors: LightThemeColors = {
  background: '0 0% 100%',
  foreground: '222.2 84% 4.9%',
  card: '0 0% 100%',
  cardForeground: '222.2 84% 4.9%',
  popover: '0 0% 100%',
  popoverForeground: '222.2 84% 4.9%',
  primary: '221.2 83.2% 53.3%',
  primaryForeground: '210 40% 98%',
  secondary: '210 40% 96.1%',
  secondaryForeground: '222.2 47.4% 11.2%',
  muted: '210 40% 96.1%',
  mutedForeground: '215.4 16.3% 46.9%',
  accent: '210 40% 96.1%',
  accentForeground: '222.2 47.4% 11.2%',
  destructive: '0 84.2% 60.2%',
  destructiveForeground: '210 40% 98%',
  border: '214.3 31.8% 91.4%',
  input: '214.3 31.8% 91.4%',
  ring: '221.2 83.2% 53.3%',
};

/**
 * Dark theme colors
 */
export interface DarkThemeColors extends LightThemeColors {}

/**
 * Default dark theme colors
 */
export const defaultDarkColors: DarkThemeColors = {
  background: '222.2 84% 4.9%',
  foreground: '210 40% 98%',
  card: '222.2 84% 4.9%',
  cardForeground: '210 40% 98%',
  popover: '222.2 84% 4.9%',
  popoverForeground: '210 40% 98%',
  primary: '217.2 91.2% 59.8%',
  primaryForeground: '222.2 47.4% 11.2%',
  secondary: '217.2 32.6% 17.5%',
  secondaryForeground: '210 40% 98%',
  muted: '217.2 32.6% 17.5%',
  mutedForeground: '215 20.2% 65.1%',
  accent: '217.2 32.6% 17.5%',
  accentForeground: '210 40% 98%',
  destructive: '0 62.8% 30.6%',
  destructiveForeground: '210 40% 98%',
  border: '217.2 32.6% 17.5%',
  input: '217.2 32.6% 17.5%',
  ring: '224.3 76.3% 48%',
};

/**
 * Canvas style configuration
 */
export interface CanvasStyle {
  /** Background color/pattern */
  backgroundColor: string;

  /** Grid pattern type */
  gridPattern: 'dots' | 'lines' | 'cross' | 'none';

  /** Grid size */
  gridSize: number;

  /** Grid color */
  gridColor: string;

  /** Snap to grid */
  snapToGrid: boolean;

  /** Snap grid size */
  snapGrid: [number, number];
}

/**
 * Default canvas style (light)
 */
export const defaultLightCanvasStyle: CanvasStyle = {
  backgroundColor: '#FAFAFA',
  gridPattern: 'dots',
  gridSize: 20,
  gridColor: '#E2E8F0',
  snapToGrid: true,
  snapGrid: [15, 15],
};

/**
 * Default canvas style (dark)
 */
export const defaultDarkCanvasStyle: CanvasStyle = {
  backgroundColor: '#0F172A',
  gridPattern: 'dots',
  gridSize: 20,
  gridColor: '#1E293B',
  snapToGrid: true,
  snapGrid: [15, 15],
};

/**
 * Edge style configuration
 */
export interface EdgeStyle {
  /** Default edge color */
  color: string;

  /** Edge width */
  width: number;

  /** Selected edge color */
  selectedColor: string;

  /** Hover edge color */
  hoverColor: string;

  /** Success flow color */
  successColor: string;

  /** Error flow color */
  errorColor: string;

  /** Animated edge color */
  animatedColor: string;

  /** Edge type */
  type: 'bezier' | 'smoothstep' | 'step' | 'straight';

  /** Animation speed (ms) */
  animationSpeed: number;
}

/**
 * Default edge style (light)
 */
export const defaultLightEdgeStyle: EdgeStyle = {
  color: '#94A3B8',
  width: 2,
  selectedColor: '#3B82F6',
  hoverColor: '#64748B',
  successColor: '#10B981',
  errorColor: '#EF4444',
  animatedColor: '#3B82F6',
  type: 'bezier',
  animationSpeed: 500,
};

/**
 * Default edge style (dark)
 */
export const defaultDarkEdgeStyle: EdgeStyle = {
  color: '#475569',
  width: 2,
  selectedColor: '#60A5FA',
  hoverColor: '#64748B',
  successColor: '#34D399',
  errorColor: '#F87171',
  animatedColor: '#60A5FA',
  type: 'bezier',
  animationSpeed: 500,
};

/**
 * Node style configuration
 */
export interface NodeStyle {
  /** Border radius */
  borderRadius: number;

  /** Border width */
  borderWidth: number;

  /** Shadow */
  shadow: string;

  /** Selected shadow */
  selectedShadow: string;

  /** Min width */
  minWidth: number;

  /** Min height */
  minHeight: number;

  /** Header height */
  headerHeight: number;

  /** Port size */
  portSize: number;

  /** Port border width */
  portBorderWidth: number;
}

/**
 * Default node style
 */
export const defaultNodeStyle: NodeStyle = {
  borderRadius: 12,
  borderWidth: 1,
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  selectedShadow: '0 0 0 2px var(--kd-primary), 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  minWidth: 220,
  minHeight: 80,
  headerHeight: 40,
  portSize: 8,
  portBorderWidth: 2,
};

/**
 * Complete theme
 */
export interface Theme {
  mode: ThemeMode;
  colors: LightThemeColors | DarkThemeColors;
  canvas: CanvasStyle;
  edge: EdgeStyle;
  node: NodeStyle;
  nodeColors: Record<NodeCategory, string>;
  statusColors: StatusColors;
}

/**
 * Default light theme
 */
export const defaultLightTheme: Theme = {
  mode: ThemeMode.Light,
  colors: defaultLightColors,
  canvas: defaultLightCanvasStyle,
  edge: defaultLightEdgeStyle,
  node: defaultNodeStyle,
  nodeColors: defaultNodeColors,
  statusColors: defaultStatusColors,
};

/**
 * Default dark theme
 */
export const defaultDarkTheme: Theme = {
  mode: ThemeMode.Dark,
  colors: defaultDarkColors,
  canvas: defaultDarkCanvasStyle,
  edge: defaultDarkEdgeStyle,
  node: defaultNodeStyle,
  nodeColors: defaultNodeColors,
  statusColors: defaultStatusColors,
};

/**
 * Get theme by mode
 */
export function getTheme(mode: ThemeMode): Theme {
  return mode === ThemeMode.Dark ? defaultDarkTheme : defaultLightTheme;
}

/**
 * Merge theme config with defaults
 */
export function mergeThemeConfig(config: Partial<ThemeConfig>, baseTheme: Theme): Theme {
  return {
    ...baseTheme,
    mode: config.mode ?? baseTheme.mode,
    nodeColors: {
      ...baseTheme.nodeColors,
      ...config.nodeColors,
    },
  };
}
