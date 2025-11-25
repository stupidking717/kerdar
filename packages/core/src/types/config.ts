import type { ReactNode } from 'react';
import type { ThemeConfig } from './theme';
import type { Workflow, WorkflowViewport, WorkflowExecutionData } from './workflow';
import type { WorkflowNode, NodeTypeDefinition, INodeExecutionData, NodeExecutionResult } from './node';
import type { CredentialStore, CredentialTypeDefinition } from './credential';
import type { DialogConfig } from './dialog';
import type { PanelPosition } from './enums';

/**
 * Main WorkflowDesigner component props
 */
export interface WorkflowDesignerProps {
  /** Workflow data */
  workflow: Workflow;

  /** Called when workflow changes */
  onChange?: (workflow: Workflow) => void;

  /** Theme configuration */
  theme?: Partial<ThemeConfig>;

  /** White label configuration */
  whiteLabel?: WhiteLabelConfig;

  /** Credential store for managing credentials */
  credentialStore?: CredentialStore;

  /** Execution engine configuration */
  executionEngine?: ExecutionEngineConfig;

  /** Read-only mode */
  readOnly?: boolean;

  /** Initial viewport */
  defaultViewport?: WorkflowViewport;

  /** Node types to register */
  nodeTypes?: NodeTypeDefinition[];

  /** Credential types to register */
  credentialTypes?: CredentialTypeDefinition[];

  /** Event callbacks */
  onNodeSelect?: (node: WorkflowNode | null) => void;
  onNodeDoubleClick?: (node: WorkflowNode) => void;
  onNodeContextMenu?: (node: WorkflowNode, event: React.MouseEvent) => void;
  onEdgeSelect?: (edgeId: string | null) => void;
  onExecute?: (workflow: Workflow) => Promise<void>;
  onSave?: (workflow: Workflow) => Promise<void>;
  onViewportChange?: (viewport: WorkflowViewport) => void;
  onError?: (error: Error) => void;

  /** Custom toolbar actions */
  toolbarActions?: ToolbarAction[];

  /** Custom context menu items */
  contextMenuItems?: ContextMenuItem[];

  /** Panel configuration */
  panels?: PanelConfig;

  /** Keyboard shortcuts */
  shortcuts?: ShortcutConfig;

  /** CSS class for the container */
  className?: string;

  /** Custom styles */
  style?: React.CSSProperties;

  /** Children (for custom overlays) */
  children?: ReactNode;
}

/**
 * White label configuration for branding
 */
export interface WhiteLabelConfig {
  /** Branding options */
  branding?: {
    /** Logo URL or React component */
    logo?: string | ReactNode;

    /** Product name */
    name?: string;

    /** Primary brand color */
    primaryColor?: string;

    /** Accent brand color */
    accentColor?: string;

    /** Favicon URL */
    favicon?: string;
  };

  /** Feature toggles */
  features?: {
    /** Show minimap */
    showMinimap?: boolean;

    /** Show controls (zoom, fit) */
    showControls?: boolean;

    /** Show toolbar */
    showToolbar?: boolean;

    /** Show node palette */
    showNodePalette?: boolean;

    /** Show properties panel */
    showPropertiesPanel?: boolean;

    /** Allow workflow export */
    allowExport?: boolean;

    /** Allow workflow import */
    allowImport?: boolean;

    /** Allow workflow execution */
    allowExecute?: boolean;

    /** Allow credential management */
    allowCredentials?: boolean;

    /** Allow undo/redo */
    allowUndoRedo?: boolean;

    /** Show execution log */
    showExecutionLog?: boolean;

    /** Show node search (Cmd+K) */
    showNodeSearch?: boolean;

    /** Allow sticky notes */
    allowStickyNotes?: boolean;

    /** Show grid */
    showGrid?: boolean;

    /** Allow node copy/paste */
    allowCopyPaste?: boolean;

    /** Show keyboard shortcuts help */
    showShortcutsHelp?: boolean;
  };

  /** Node type restrictions */
  includeNodeTypes?: string[];
  excludeNodeTypes?: string[];

  /** Credential type restrictions */
  includeCredentialTypes?: string[];
  excludeCredentialTypes?: string[];

  /** Custom dialogs */
  customDialogs?: Record<string, (props: CustomDialogProps) => ReactNode>;

  /** Custom node palette groups */
  nodePaletteGroups?: NodePaletteGroup[];

  /** Custom strings for i18n */
  strings?: Record<string, string>;
}

/**
 * Custom dialog props
 */
export interface CustomDialogProps {
  data: Record<string, unknown>;
  onSave: (data: unknown) => void;
  onCancel: () => void;
  isLoading: boolean;
}

/**
 * Node palette group configuration
 */
export interface NodePaletteGroup {
  /** Group ID */
  id: string;

  /** Display name */
  name: string;

  /** Icon */
  icon?: string;

  /** Node types in this group */
  nodeTypes: string[];

  /** Sort order */
  order?: number;

  /** Default expanded state */
  defaultExpanded?: boolean;
}

/**
 * Execution engine configuration
 */
export interface ExecutionEngineConfig {
  /** Execute workflow function */
  execute?: (
    workflow: Workflow,
    options?: ExecutionOptions
  ) => Promise<WorkflowExecutionData>;

  /** Execute single node function */
  executeNode?: (
    node: WorkflowNode,
    inputData: INodeExecutionData[],
    options?: NodeExecutionOptions
  ) => Promise<NodeExecutionResult>;

  /** Progress callback */
  onProgress?: (nodeId: string, status: NodeProgressStatus) => void;

  /** Log callback */
  onLog?: (entry: ExecutionLogEntry) => void;

  /** Use built-in engine */
  useBuiltIn?: boolean;

  /** Execution timeout (ms) */
  timeout?: number;

  /** Max concurrent nodes */
  maxConcurrency?: number;
}

/**
 * Execution options
 */
export interface ExecutionOptions {
  /** Execution mode */
  mode?: 'manual' | 'trigger' | 'test';

  /** Start from specific node */
  startNodeId?: string;

  /** Input data for manual execution */
  inputData?: INodeExecutionData[];

  /** Run until this node */
  runUntilNodeId?: string;

  /** Pinned data for nodes */
  pinData?: Record<string, INodeExecutionData[]>;

  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Node execution options
 */
export interface NodeExecutionOptions {
  /** Item index for per-item execution */
  itemIndex?: number;

  /** Credentials to use */
  credentials?: Record<string, unknown>;
}

/**
 * Node progress status
 */
export interface NodeProgressStatus {
  /** Node ID */
  nodeId: string;

  /** Status */
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';

  /** Progress percentage (0-100) */
  progress?: number;

  /** Status message */
  message?: string;

  /** Start time */
  startedAt?: string;

  /** End time */
  finishedAt?: string;

  /** Output data preview */
  outputPreview?: INodeExecutionData[];

  /** Error details */
  error?: {
    message: string;
    stack?: string;
  };
}

/**
 * Execution log entry
 */
export interface ExecutionLogEntry {
  /** Timestamp */
  timestamp: string;

  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';

  /** Node ID (if node-specific) */
  nodeId?: string;

  /** Node name */
  nodeName?: string;

  /** Message */
  message: string;

  /** Additional data */
  data?: unknown;
}

/**
 * Toolbar action configuration
 */
export interface ToolbarAction {
  /** Unique action ID */
  id: string;

  /** Display label */
  label: string;

  /** Icon (Lucide icon name) */
  icon?: string;

  /** Tooltip text */
  tooltip?: string;

  /** Action handler */
  onClick: () => void;

  /** Whether action is disabled */
  disabled?: boolean;

  /** Whether action is loading */
  loading?: boolean;

  /** Keyboard shortcut */
  shortcut?: string;

  /** Button variant */
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive';

  /** Show separator before this action */
  separator?: boolean;

  /** Dropdown menu items */
  menu?: ToolbarMenuItem[];
}

/**
 * Toolbar menu item
 */
export interface ToolbarMenuItem {
  /** Item ID */
  id: string;

  /** Label */
  label: string;

  /** Icon */
  icon?: string;

  /** Shortcut */
  shortcut?: string;

  /** Handler */
  onClick: () => void;

  /** Disabled state */
  disabled?: boolean;

  /** Separator after this item */
  separator?: boolean;
}

/**
 * Context menu item configuration
 */
export interface ContextMenuItem {
  /** Item ID */
  id: string;

  /** Label */
  label: string;

  /** Icon (Lucide icon name) */
  icon?: string;

  /** Action handler */
  onClick: (context: ContextMenuContext) => void;

  /** Whether item is disabled */
  disabled?: boolean | ((context: ContextMenuContext) => boolean);

  /** Keyboard shortcut display */
  shortcut?: string;

  /** Show separator after this item */
  separator?: boolean;

  /** Sub-menu items */
  items?: ContextMenuItem[];

  /** Show only for specific contexts */
  showFor?: ('node' | 'edge' | 'canvas' | 'selection')[];
}

/**
 * Context menu context
 */
export interface ContextMenuContext {
  /** Type of element clicked */
  type: 'node' | 'edge' | 'canvas' | 'selection';

  /** Node if node was clicked */
  node?: WorkflowNode;

  /** Edge ID if edge was clicked */
  edgeId?: string;

  /** Mouse position */
  position: { x: number; y: number };

  /** Selected node IDs */
  selectedNodes: string[];

  /** Selected edge IDs */
  selectedEdges: string[];
}

/**
 * Panel configuration
 */
export interface PanelConfig {
  /** Node palette configuration */
  nodePalette?: {
    /** Show panel */
    show?: boolean;

    /** Position */
    position?: 'left' | 'right';

    /** Default width */
    width?: number;

    /** Collapsible */
    collapsible?: boolean;

    /** Default collapsed */
    defaultCollapsed?: boolean;
  };

  /** Properties panel configuration */
  propertiesPanel?: {
    /** Show panel */
    show?: boolean;

    /** Position */
    position?: 'left' | 'right';

    /** Default width */
    width?: number;

    /** Collapsible */
    collapsible?: boolean;

    /** Default collapsed */
    defaultCollapsed?: boolean;
  };

  /** Minimap configuration */
  minimap?: {
    /** Show minimap */
    show?: boolean;

    /** Position */
    position?: PanelPosition;

    /** Width */
    width?: number;

    /** Height */
    height?: number;
  };

  /** Controls configuration */
  controls?: {
    /** Show controls */
    show?: boolean;

    /** Position */
    position?: PanelPosition;

    /** Show zoom controls */
    showZoom?: boolean;

    /** Show fit view button */
    showFitView?: boolean;

    /** Show lock/unlock button */
    showLock?: boolean;
  };

  /** Toolbar configuration */
  toolbar?: {
    /** Show toolbar */
    show?: boolean;

    /** Position */
    position?: 'top' | 'bottom';
  };
}

/**
 * Keyboard shortcut configuration
 */
export interface ShortcutConfig {
  /** Delete selected elements */
  delete?: string;

  /** Copy selected elements */
  copy?: string;

  /** Paste elements */
  paste?: string;

  /** Cut selected elements */
  cut?: string;

  /** Undo */
  undo?: string;

  /** Redo */
  redo?: string;

  /** Select all */
  selectAll?: string;

  /** Deselect all */
  deselectAll?: string;

  /** Open node search */
  search?: string;

  /** Fit view */
  fitView?: string;

  /** Save workflow */
  save?: string;

  /** Execute workflow */
  execute?: string;

  /** Duplicate selected */
  duplicate?: string;

  /** Toggle node disable */
  toggleDisable?: string;

  /** Custom shortcuts */
  custom?: Record<string, ShortcutHandler>;
}

/**
 * Shortcut handler
 */
export interface ShortcutHandler {
  /** Key combination (e.g., "mod+shift+k") */
  keys: string;

  /** Handler function */
  handler: () => void;

  /** Description for help */
  description?: string;

  /** When this shortcut is active */
  when?: 'always' | 'canvas-focused' | 'node-selected';
}

/**
 * Default shortcut configuration
 */
export const defaultShortcuts: Required<Omit<ShortcutConfig, 'custom'>> = {
  delete: 'Backspace',
  copy: 'mod+c',
  paste: 'mod+v',
  cut: 'mod+x',
  undo: 'mod+z',
  redo: 'mod+shift+z',
  selectAll: 'mod+a',
  deselectAll: 'Escape',
  search: 'mod+k',
  fitView: 'mod+1',
  save: 'mod+s',
  execute: 'mod+Enter',
  duplicate: 'mod+d',
  toggleDisable: 'd',
};

/**
 * Workflow designer ref handle
 */
export interface WorkflowDesignerRef {
  /** Get current workflow */
  getWorkflow: () => Workflow;

  /** Set workflow */
  setWorkflow: (workflow: Workflow) => void;

  /** Add node at position */
  addNode: (type: string, position?: { x: number; y: number }) => WorkflowNode;

  /** Remove node */
  removeNode: (nodeId: string) => void;

  /** Update node */
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;

  /** Select node */
  selectNode: (nodeId: string) => void;

  /** Deselect all */
  deselectAll: () => void;

  /** Fit view */
  fitView: () => void;

  /** Zoom to */
  zoomTo: (zoom: number) => void;

  /** Get viewport */
  getViewport: () => WorkflowViewport;

  /** Set viewport */
  setViewport: (viewport: WorkflowViewport) => void;

  /** Execute workflow */
  execute: (options?: ExecutionOptions) => Promise<WorkflowExecutionData>;

  /** Open dialog */
  openDialog: (config: DialogConfig) => void;

  /** Close dialog */
  closeDialog: (id: string) => void;

  /** Undo */
  undo: () => void;

  /** Redo */
  redo: () => void;

  /** Can undo */
  canUndo: () => boolean;

  /** Can redo */
  canRedo: () => boolean;

  /** Export workflow to JSON */
  exportWorkflow: () => string;

  /** Import workflow from JSON */
  importWorkflow: (json: string) => void;
}
