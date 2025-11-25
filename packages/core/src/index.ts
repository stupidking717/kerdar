// Main component
export { WorkflowDesigner } from './components/WorkflowDesigner';

// Node components
export { BaseNode, type BaseNodeData, type BaseNodeProps } from './components/Nodes';
export { NodeIcon, type NodeIconProps, getAvailableIcons, getIconPickerItems } from './components/Nodes';

// Edge components
export { CustomEdge, AnimatedEdge, edgeTypes, type CustomEdgeData } from './components/Edges';

// Dialog components
export { BaseDialog, DialogHeader, DialogBody, DialogFooter } from './components/Dialogs';
export { NodeParametersDialog, type NodeParametersDialogProps } from './components/Dialogs';

// UI components
export { Button, buttonVariants, type ButtonProps } from './components/ui';

// Sidebar components
export { NodeSidebar, type NodeSidebarProps } from './components/NodeSidebar';

// Stores
export {
  // Workflow store
  useWorkflowStore,
  useWorkflow,
  useNodes,
  useEdges,
  useSelectedNodeIds,
  useSelectedEdgeIds,
  useSelectedNodes,
  useSelectedNode,
  useViewport,
  useIsDirty,

  // Execution store
  useExecutionStore,
  useIsExecuting,
  useExecutionStatus,
  useExecutionProgress,
  useNodeStatus,
  useAllNodeStatus,
  useExecutionLog,
  useDebugMode,
  useBreakpoints,
  usePausedAtNode,
  getNodeStatusEnum,

  // Dialog store
  useDialogStore,
  useDialogs,
  useActiveDialogId,
  useHasOpenDialogs,
  useDialog,
  useIsDialogOpen,
  useIsDialogLoading,
  useDialogError,
  useDialogActions,

  // Credential store
  useCredentialStore,
  useCredentials,
  useCredentialTypes,
  useIsCredentialsLoading,
  useCredential,
  useCredentialType,
  useCredentialsByType,
  useCredentialActions,

  // Theme store
  useThemeStore,
  useTheme,
  useThemeConfig,
  useThemeMode,
  useEffectiveThemeMode,
  useNodeColors,
  useNodeColor,
  useThemeActions,
  initializeTheme,

  // Node registry store
  useNodeRegistryStore,
  useNodeTypes,
  useNodeType,
  useNodeCategories,
  useNodeTypesByCategory,
  useNodeRegistryActions,
  registerNode,
  registerNodes,
  getNodeType,
} from './store';

// Execution engine
export { WorkflowExecutor, executeWorkflow } from './engine';

// Types - Enums
export {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
  EdgeType,
  NodeExecutionStatus,
  ExecutionMode,
  DialogType,
  DialogSize,
  ValidationType,
  ThemeMode,
  BorderRadius,
  HttpMethod,
  AuthenticationType,
  CredentialAuthMethod,
  ExecutionOrderVersion,
  DataSaveMode,
  MergeMode,
  ComparisonOperation,
  CombineConditionMode,
  SortOrder,
  ItemListOperation,
  CodeLanguage,
  CodeExecutionMode,
  WebhookMethod,
  WebhookResponseMode,
  ScheduleInterval,
  PanelPosition,
  ContextMenuAction,
} from './types';

// Types - Interfaces
export type {
  // Node types
  NodeTypeDefinition,
  NodeInput,
  NodeOutput,
  NodeProperty,
  DisplayOptions,
  PropertyOption,
  TypeOptions,
  ValidationRule,
  CredentialTypeConfig,
  NodeCustomization,
  WorkflowNode,
  NodeCredential,
  Position,
  NodeRenderContext,
  NodeExecutionContext,
  TriggerContext,
  LoadOptionsContext,
  ResourceLocatorContext,
  ResourceLocatorResult,
  NodeExecutionResult,
  INodeExecutionData,
  IBinaryData,
  NodeError,
  ExecutionHelpers,
  RequestOptions,
  Logger,
  CredentialTestResult,
  CredentialData,

  // Workflow types
  WorkflowEdge,
  WorkflowEdgeData,
  Workflow,
  WorkflowSettings,
  WorkflowTag,
  WorkflowMetadata,
  WorkflowExecutionStatus,
  NodeExecutionStatusData,
  WorkflowExecutionData,
  NodeExecutionRunData,
  ExecutionError,
  WorkflowTemplate,
  StickyNote,
  WorkflowViewport,

  // Credential types
  CredentialTypeDefinition,
  CredentialAuthentication,
  CredentialAuthProperties,
  CredentialTestRequest,
  Credential,
  CredentialStore,
  CredentialFilter,
  OAuth2CredentialConfig,
  OAuth2TokenData,
  ApiKeyAuthConfig,
  BasicAuthConfig,
  HeaderAuthConfig,

  // Dialog types
  BaseDialogConfig,
  CredentialsDialogConfig,
  NodeParametersDialogConfig,
  NodeSettingsDialogConfig,
  NodeSettings,
  CustomDialogConfig,
  CustomDialogContentProps,
  CustomDialogFooterProps,
  ConfirmDialogConfig,
  AlertDialogConfig,
  DialogConfig,
  DialogState,
  DialogActions,
  DialogValidationResult,
  DialogFormState,
  ExpressionEditorDialogConfig,
  ExpressionVariable,
  CodeEditorDialogConfig,
  JsonEditorDialogConfig,

  // Theme types
  ThemeConfig,
  StatusColors,
  LightThemeColors,
  DarkThemeColors,
  CanvasStyle,
  EdgeStyle,
  NodeStyle,
  Theme,

  // Config types
  WorkflowDesignerProps,
  WhiteLabelConfig,
  CustomDialogProps,
  NodePaletteGroup,
  ExecutionEngineConfig,
  ExecutionOptions,
  NodeExecutionOptions,
  NodeProgressStatus,
  ExecutionLogEntry,
  ToolbarAction,
  ToolbarMenuItem,
  ContextMenuItem,
  ContextMenuContext,
  PanelConfig,
  ShortcutConfig,
  ShortcutHandler,
  WorkflowDesignerRef,
} from './types';

// Theme defaults
export {
  defaultNodeColors,
  defaultStatusColors,
  defaultLightColors,
  defaultDarkColors,
  defaultLightCanvasStyle,
  defaultDarkCanvasStyle,
  defaultLightEdgeStyle,
  defaultDarkEdgeStyle,
  defaultNodeStyle,
  defaultLightTheme,
  defaultDarkTheme,
  getTheme,
  mergeThemeConfig,
  defaultShortcuts,
} from './types';

// Built-in credential types
export {
  PredefinedCredentialType,
  httpBasicAuthCredential,
  httpHeaderAuthCredential,
  apiKeyAuthCredential,
  bearerTokenCredential,
} from './types';

// Utilities
export {
  nanoid,
  uuid,
  shortId,
  nodeId,
  edgeId,
  workflowId,
  credentialId,
  executionId,
  cn,
  containsExpression,
  isExpression,
  extractExpression,
  evaluateExpression,
  resolveExpressions,
  getExpressionVariables,
  formatExpression,
  validateExpression,
} from './utils';
