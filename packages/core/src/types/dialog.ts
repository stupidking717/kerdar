import type { ReactNode } from 'react';
import type { DialogType, DialogSize } from './enums';
import type { WorkflowNode, NodeTypeDefinition, PropertyOption } from './node';
import type { Credential, CredentialTypeDefinition } from './credential';

/**
 * Base dialog configuration
 */
export interface BaseDialogConfig {
  /** Unique dialog ID */
  id: string;

  /** Dialog type */
  type: DialogType;

  /** Dialog title */
  title: string;

  /** Dialog size */
  size?: DialogSize;

  /** Whether dialog can be closed */
  closable?: boolean;

  /** Whether to show overlay */
  showOverlay?: boolean;

  /** CSS class for the dialog */
  className?: string;

  /** Z-index for stacking */
  zIndex?: number;

  /** Called when dialog is closed */
  onClose?: () => void;
}

/**
 * Credentials dialog configuration
 */
export interface CredentialsDialogConfig extends BaseDialogConfig {
  type: DialogType.Credentials;

  /** Credential type to create/edit */
  credentialType: string;

  /** Credential type definition */
  credentialTypeDefinition?: CredentialTypeDefinition;

  /** Existing credential to edit (if editing) */
  existingCredential?: Credential;

  /** Allow creating new credentials */
  allowCreate?: boolean;

  /** Allow selecting existing credentials */
  allowSelect?: boolean;

  /** Node that needs this credential (for context) */
  node?: WorkflowNode;

  /** Called when credential is saved */
  onSave?: (credential: Credential) => void | Promise<void>;

  /** Called when credential is selected */
  onSelect?: (credential: Credential) => void;

  /** Called when cancel is clicked */
  onCancel?: () => void;
}

/**
 * Node parameters dialog configuration
 */
export interface NodeParametersDialogConfig extends BaseDialogConfig {
  type: DialogType.Parameters;

  /** Node being configured */
  node: WorkflowNode;

  /** Node type definition */
  nodeType: NodeTypeDefinition;

  /** Current parameter values */
  currentParameters: Record<string, unknown>;

  /** Available credentials for credential fields */
  availableCredentials?: Record<string, Credential[]>;

  /** Load options for dynamic dropdowns */
  loadOptions?: (propertyName: string, search?: string) => Promise<PropertyOption[]>;

  /** Called when parameters are saved */
  onSave?: (parameters: Record<string, unknown>) => void | Promise<void>;

  /** Called when cancel is clicked */
  onCancel?: () => void;

  /** Called when execute is clicked (for testing) */
  onExecute?: () => void | Promise<void>;

  /** Initial tab to show */
  initialTab?: 'parameters' | 'settings' | 'notes';
}

/**
 * Node settings dialog configuration
 */
export interface NodeSettingsDialogConfig extends BaseDialogConfig {
  type: DialogType.Settings;

  /** Node being configured */
  node: WorkflowNode;

  /** Current settings */
  currentSettings: NodeSettings;

  /** Called when settings are saved */
  onSave?: (settings: NodeSettings) => void | Promise<void>;

  /** Called when cancel is clicked */
  onCancel?: () => void;
}

/**
 * Node settings (execution behavior)
 */
export interface NodeSettings {
  /** Always output data even on error */
  alwaysOutputData?: boolean;

  /** Execute only once for all items */
  executeOnce?: boolean;

  /** Retry on fail */
  retryOnFail?: boolean;

  /** Max retry attempts */
  maxTries?: number;

  /** Wait between retries (ms) */
  waitBetweenTries?: number;

  /** Continue workflow on error */
  continueOnFail?: boolean;

  /** Notes */
  notes?: string;

  /** Node color */
  color?: string;
}

/**
 * Custom dialog configuration
 */
export interface CustomDialogConfig extends BaseDialogConfig {
  type: DialogType.Custom;

  /** Dialog content */
  content: ReactNode | ((props: CustomDialogContentProps) => ReactNode);

  /** Dialog footer */
  footer?: ReactNode | ((props: CustomDialogFooterProps) => ReactNode);

  /** Custom data passed to content/footer */
  data?: Record<string, unknown>;

  /** Called when save/confirm is clicked */
  onSave?: (data: unknown) => void | Promise<void>;

  /** Called when cancel is clicked */
  onCancel?: () => void;

  /** Initial loading state */
  isLoading?: boolean;
}

/**
 * Props passed to custom dialog content renderer
 */
export interface CustomDialogContentProps {
  /** Custom data */
  data: Record<string, unknown>;

  /** Update data */
  setData: (data: Record<string, unknown>) => void;

  /** Call to save and close */
  onSave: (data: unknown) => void;

  /** Call to cancel and close */
  onCancel: () => void;

  /** Loading state */
  isLoading: boolean;

  /** Set loading state */
  setLoading: (loading: boolean) => void;

  /** Close the dialog */
  close: () => void;
}

/**
 * Props passed to custom dialog footer renderer
 */
export interface CustomDialogFooterProps extends CustomDialogContentProps {}

/**
 * Confirmation dialog configuration
 */
export interface ConfirmDialogConfig extends BaseDialogConfig {
  type: DialogType.Confirm;

  /** Confirmation message */
  message: string;

  /** Description/details */
  description?: string;

  /** Confirm button text */
  confirmText?: string;

  /** Cancel button text */
  cancelText?: string;

  /** Confirm button variant */
  confirmVariant?: 'default' | 'destructive';

  /** Called when confirmed */
  onConfirm?: () => void | Promise<void>;

  /** Called when canceled */
  onCancel?: () => void;
}

/**
 * Alert dialog configuration
 */
export interface AlertDialogConfig extends BaseDialogConfig {
  type: DialogType.Alert;

  /** Alert message */
  message: string;

  /** Description/details */
  description?: string;

  /** Alert variant */
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error';

  /** OK button text */
  okText?: string;

  /** Called when OK is clicked */
  onOk?: () => void;
}

/**
 * Union type for all dialog configs
 */
export type DialogConfig =
  | CredentialsDialogConfig
  | NodeParametersDialogConfig
  | NodeSettingsDialogConfig
  | CustomDialogConfig
  | ConfirmDialogConfig
  | AlertDialogConfig;

/**
 * Dialog state
 */
export interface DialogState {
  /** Currently open dialogs */
  dialogs: DialogConfig[];

  /** Active dialog ID */
  activeDialogId: string | null;
}

/**
 * Dialog context actions
 */
export interface DialogActions {
  /** Open a dialog */
  open: (config: DialogConfig) => void;

  /** Close a dialog by ID */
  close: (id: string) => void;

  /** Close all dialogs */
  closeAll: () => void;

  /** Update dialog config */
  update: (id: string, config: Partial<DialogConfig>) => void;

  /** Check if dialog is open */
  isOpen: (id: string) => boolean;
}

/**
 * Validation result for dialog forms
 */
export interface DialogValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Field-specific errors */
  errors?: Record<string, string>;

  /** General error message */
  message?: string;
}

/**
 * Dialog form state
 */
export interface DialogFormState<T = Record<string, unknown>> {
  /** Form values */
  values: T;

  /** Field errors */
  errors: Record<string, string>;

  /** Touched fields */
  touched: Record<string, boolean>;

  /** Whether form is dirty */
  isDirty: boolean;

  /** Whether form is valid */
  isValid: boolean;

  /** Whether form is submitting */
  isSubmitting: boolean;
}

/**
 * Expression editor dialog config
 */
export interface ExpressionEditorDialogConfig extends BaseDialogConfig {
  type: DialogType.Custom;

  /** Current expression value */
  value: string;

  /** Available variables */
  variables: ExpressionVariable[];

  /** Property being edited */
  propertyName: string;

  /** Expected return type */
  returnType?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';

  /** Called when expression is saved */
  onSave?: (expression: string) => void;
}

/**
 * Expression variable for expression editor
 */
export interface ExpressionVariable {
  /** Variable name (e.g., "$input", "$node", "$json") */
  name: string;

  /** Display name */
  displayName: string;

  /** Description */
  description?: string;

  /** Type of the variable */
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'any';

  /** Child properties if object */
  properties?: ExpressionVariable[];

  /** Example value */
  example?: string;
}

/**
 * Code editor dialog config
 */
export interface CodeEditorDialogConfig extends BaseDialogConfig {
  type: DialogType.Custom;

  /** Current code value */
  value: string;

  /** Code language */
  language: string;

  /** Whether read-only */
  readOnly?: boolean;

  /** Called when code is saved */
  onSave?: (code: string) => void;
}

/**
 * JSON editor dialog config
 */
export interface JsonEditorDialogConfig extends BaseDialogConfig {
  type: DialogType.Custom;

  /** Current JSON value */
  value: unknown;

  /** JSON schema for validation */
  schema?: Record<string, unknown>;

  /** Whether read-only */
  readOnly?: boolean;

  /** Called when JSON is saved */
  onSave?: (json: unknown) => void;
}
