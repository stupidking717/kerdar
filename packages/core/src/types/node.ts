import type { ReactNode } from 'react';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
  ValidationType,
  CodeLanguage,
} from './enums';

/**
 * Node Type Definition - defines a type of node that can be used in workflows
 * Similar to n8n's INodeType interface
 */
export interface NodeTypeDefinition {
  /** Unique identifier for this node type (e.g., 'http-request', 'if', 'code') */
  type: string;

  /** Version number for backward compatibility */
  version: number;

  /** Internal name (camelCase) */
  name: string;

  /** Display name shown in UI */
  displayName: string;

  /** Description of what this node does */
  description: string;

  /** Lucide icon name or custom SVG string */
  icon?: string;

  /** Icon color (hex or CSS color) */
  iconColor?: string;

  /** Category for organizing in palette */
  category: NodeCategory;

  /** Dynamic subtitle shown below node name */
  subtitle?: string | ((node: WorkflowNode) => string);

  /** Groups for filtering in palette */
  group: string[];

  /** Default name for new instances */
  defaults?: {
    name?: string;
    color?: string;
  };

  /** Input port configuration */
  inputs: NodeInput[];

  /** Output port configuration */
  outputs: NodeOutput[];

  /** Credentials this node can use */
  credentials?: CredentialTypeConfig[];

  /** Node parameters/properties */
  properties: NodeProperty[];

  /** Execution function */
  execute: (context: NodeExecutionContext) => Promise<NodeExecutionResult>;

  /** Optional trigger methods for trigger nodes */
  trigger?: {
    /** Called to start listening for triggers */
    activate?: (context: TriggerContext) => Promise<void>;
    /** Called to stop listening */
    deactivate?: (context: TriggerContext) => Promise<void>;
    /** Manual trigger for testing */
    manualTrigger?: (context: TriggerContext) => Promise<void>;
  };

  /** Lifecycle hooks */
  hooks?: {
    /** Called when node is added to workflow */
    onCreate?: (node: WorkflowNode) => void;
    /** Called when node is removed from workflow */
    onDelete?: (node: WorkflowNode) => void;
    /** Called when node parameters change */
    onParametersChange?: (node: WorkflowNode, changedParams: string[]) => void;
  };

  /** Methods for dynamic data loading */
  methods?: {
    /** Load options dynamically for dropdowns */
    loadOptions?: Record<string, (context: LoadOptionsContext) => Promise<PropertyOption[]>>;
    /** Credential test methods */
    credentialTest?: Record<string, (credential: CredentialData) => Promise<CredentialTestResult>>;
    /** Resource locator search */
    resourceLocatorSearch?: Record<string, (context: ResourceLocatorContext, filter: string) => Promise<ResourceLocatorResult[]>>;
  };

  /** UI customization options */
  customization?: NodeCustomization;

  /** Code generation templates */
  codex?: {
    /** Categories for AI suggestions */
    categories?: string[];
    /** Subcategories */
    subcategories?: Record<string, string[]>;
    /** Resources/documentation links */
    resources?: {
      primaryDocumentation?: { url: string };
      credentialDocumentation?: { url: string };
    };
    /** Alias names for search */
    alias?: string[];
  };
}

/**
 * Node input port configuration
 */
export interface NodeInput {
  /** Type of input */
  type: NodeInputType;

  /** Display name for the port */
  displayName?: string;

  /** Maximum connections allowed (-1 for unlimited) */
  maxConnections?: number;

  /** Whether this input is required for execution */
  required?: boolean;
}

/**
 * Node output port configuration
 */
export interface NodeOutput {
  /** Type of output */
  type: NodeOutputType;

  /** Display name for the port */
  displayName?: string;

  /** Category/color for this output */
  category?: NodeCategory;
}

/**
 * Node property (parameter) definition
 */
export interface NodeProperty {
  /** Property name (used in parameters object) */
  name: string;

  /** Display label */
  displayName: string;

  /** Property type determines the field component */
  type: PropertyType;

  /** Default value */
  default?: unknown;

  /** Whether this property is required */
  required?: boolean;

  /** Description/help text */
  description?: string;

  /** Placeholder text */
  placeholder?: string;

  /** Additional hint shown below field */
  hint?: string;

  /** Conditional display rules */
  displayOptions?: DisplayOptions;

  /** Options for dropdown types */
  options?: PropertyOption[];

  /** Type-specific options */
  typeOptions?: TypeOptions;

  /** Credential types this field can select */
  credentialTypes?: string[];

  /** Nested properties for collection types */
  values?: NodeProperty[];

  /** Validation rules */
  validation?: ValidationRule[];

  /** Whether this property supports expressions */
  noDataExpression?: boolean;

  /** Whether to extract value from expression result */
  extractValue?: {
    type: string;
    value: string;
  };

  /** Routing for API requests */
  routing?: {
    send?: {
      type: 'body' | 'query';
      property?: string;
      propertyInDotNotation?: boolean;
      value?: string;
      preSend?: (this: NodeExecutionContext, requestOptions: RequestOptions) => Promise<RequestOptions>;
    };
    output?: {
      postReceive?: (this: NodeExecutionContext, items: INodeExecutionData[], response: unknown) => Promise<INodeExecutionData[]>;
    };
    operations?: {
      pagination?: {
        type: 'offset' | 'cursor';
        properties?: Record<string, unknown>;
      };
    };
  };
}

/**
 * Display options for conditional property visibility
 */
export interface DisplayOptions {
  /** Show this property when these conditions are met */
  show?: Record<string, unknown[]>;

  /** Hide this property when these conditions are met */
  hide?: Record<string, unknown[]>;
}

/**
 * Property option for dropdown fields
 */
export interface PropertyOption {
  /** Display name */
  name: string;

  /** Alternative display name (alias for name) */
  displayName?: string;

  /** Value stored in parameters */
  value: unknown;

  /** Property type for nested properties in collections */
  type?: PropertyType;

  /** Default value */
  default?: unknown;

  /** Placeholder text */
  placeholder?: string;

  /** Description shown on hover */
  description?: string;

  /** Icon for this option */
  icon?: string;

  /** Action type for option (for resource locators) */
  action?: string;
}

/**
 * Type-specific options for properties
 */
export interface TypeOptions {
  /** Minimum numeric value */
  minValue?: number;

  /** Maximum numeric value */
  maxValue?: number;

  /** Number of rows for textarea */
  rows?: number;

  /** Allow multiple values */
  multipleValues?: boolean;

  /** Text for add button when multipleValues is true */
  multipleValueButtonText?: string;

  /** Render as password field */
  password?: boolean;

  /** Always open in edit window */
  alwaysOpenEditWindow?: boolean;

  /** Editor type for code/json fields */
  editor?: 'json' | 'code' | 'html' | 'sql' | 'codeNodeEditor';

  /** Code language */
  codeLanguage?: CodeLanguage;

  /** Code language (alias for codeLanguage) */
  language?: CodeLanguage;

  /** Method name for loading dynamic options */
  loadOptionsMethod?: string;

  /** Load previous executions options */
  loadOptionsDependsOn?: string[];

  /** Allowed file extensions */
  acceptedFileExtensions?: string;

  /** Number step for numeric inputs */
  numberStepSize?: number;

  /** Whether number allows decimals */
  numberPrecision?: number;

  /** Whether to allow expression in string fields */
  expressionEnabled?: boolean;

  /** Sorting for options */
  sortable?: boolean;
}

/**
 * Validation rule for property values
 */
export interface ValidationRule {
  /** Type of validation */
  type: ValidationType;

  /** Value for validation (e.g., regex pattern, min length) */
  value?: unknown;

  /** Error message to display */
  message: string;

  /** Custom validation function */
  validator?: (value: unknown, parameters: Record<string, unknown>) => boolean | string;
}

/**
 * Credential type configuration for a node
 */
export interface CredentialTypeConfig {
  /** Name of the credential type */
  name: string;

  /** Display name for the credential */
  displayName?: string;

  /** Whether this credential is required */
  required?: boolean;

  /** Conditional display options */
  displayOptions?: DisplayOptions;

  /** Test with this request */
  testedBy?: string;
}

/**
 * Node customization options
 */
export interface NodeCustomization {
  /** Custom width */
  width?: number;

  /** Custom height */
  height?: number;

  /** Custom node color */
  color?: string;

  /** Whether to show input labels */
  showInputLabels?: boolean;

  /** Whether to show output labels */
  showOutputLabels?: boolean;

  /** Custom preview renderer */
  renderPreview?: (node: WorkflowNode) => ReactNode;

  /** Custom body renderer */
  renderBody?: (node: WorkflowNode, context: NodeRenderContext) => ReactNode;

  /** Custom CSS class */
  className?: string;
}

/**
 * Workflow node instance - an instance of a node type in a workflow
 */
export interface WorkflowNode {
  /** Unique ID for this node instance */
  id: string;

  /** Type reference to NodeTypeDefinition.type */
  type: string;

  /** User-editable instance name */
  name: string;

  /** Position on canvas */
  position: Position;

  /** Whether this node is disabled */
  disabled?: boolean;

  /** Notes/comments for this node */
  notes?: string;

  /** Parameter values set by user */
  parameters: Record<string, unknown>;

  /** Credentials assigned to this node */
  credentials?: Record<string, NodeCredential>;

  /** Custom color override */
  color?: string;

  /** Always output data even if empty */
  alwaysOutputData?: boolean;

  /** Execute only once regardless of input items */
  executeOnce?: boolean;

  /** Retry on failure */
  retryOnFail?: boolean;

  /** Maximum retry attempts */
  maxTries?: number;

  /** Wait time between retries (ms) */
  waitBetweenTries?: number;

  /** Continue workflow on error */
  continueOnFail?: boolean;

  /** Custom metadata */
  metadata?: Record<string, unknown>;

  /** Whether this node was pinned during execution */
  pinned?: boolean;

  /** Pinned data */
  pinnedData?: INodeExecutionData[];

  /** Webhook ID for webhook nodes */
  webhookId?: string;
}

/**
 * Node credential reference
 */
export interface NodeCredential {
  /** Credential ID */
  id: string;

  /** Credential display name */
  name: string;
}

/**
 * Position on canvas
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Node render context passed to custom renderers
 */
export interface NodeRenderContext {
  /** Whether the node is selected */
  selected: boolean;

  /** Whether the node is being hovered */
  hovered: boolean;

  /** Current execution status */
  executionStatus?: import('./enums').NodeExecutionStatus;

  /** Current zoom level */
  zoom: number;

  /** Open node configuration dialog */
  openConfig: () => void;
}

// Forward declarations for execution types
export interface NodeExecutionContext {
  /** Get input data for a specific input index */
  getInputData(inputIndex?: number): INodeExecutionData[];
  /** Get a node parameter by name */
  getNodeParameter<T = unknown>(parameterName: string, fallback?: T): T;
  /** Get credentials for a specific type */
  getCredentials<T = unknown>(type: string): Promise<T>;
  /** Get static data for node or workflow */
  getWorkflowStaticData(type: 'node' | 'workflow'): Record<string, unknown>;
  /** Execution helpers */
  helpers: ExecutionHelpers;
  /** Current node definition */
  node: WorkflowNode;
  /** Workflow definition */
  workflow: import('./workflow').Workflow;
  /** Execution ID */
  executionId: string;
  /** Execution mode */
  mode: import('./enums').ExecutionMode;
  /** Logger instance */
  logger: Logger;
  /** Evaluate expression */
  evaluateExpression<T = unknown>(expression: string, itemIndex?: number): T;
  /** Get current item index */
  getItemIndex(): number;
  /** Get run index */
  getRunIndex(): number;

  // Convenience properties (alternative to methods)
  /** Direct access to input data (same as getInputData()) */
  inputData: INodeExecutionData[][];
  /** Direct access to parameters (keyed by parameter name) */
  parameters: Record<string, unknown>;
  /** Direct access to node-scoped data storage */
  nodeData?: Record<string, unknown>;
}

export interface TriggerContext {
  node: WorkflowNode;
  workflow: import('./workflow').Workflow;
  helpers: ExecutionHelpers;
  emit: (data: INodeExecutionData[][]) => void;
  logger: Logger;
  /** Direct access to parameters */
  parameters: Record<string, unknown>;
}

export interface LoadOptionsContext {
  node: WorkflowNode;
  credentials?: Record<string, unknown>;
  currentParameters: Record<string, unknown>;
}

export interface ResourceLocatorContext {
  node: WorkflowNode;
  credentials?: Record<string, unknown>;
  currentParameters: Record<string, unknown>;
}

export interface ResourceLocatorResult {
  name: string;
  value: string;
  url?: string;
}

export interface NodeExecutionResult {
  outputData: INodeExecutionData[][];
  executionTime?: number;
  executionStatus?: 'success' | 'error';
  metadata?: Record<string, unknown>;
}

export interface INodeExecutionData {
  json: Record<string, unknown>;
  binary?: Record<string, IBinaryData>;
  pairedItem?: {
    item: number;
    input?: number;
  };
  error?: NodeError;
}

export interface IBinaryData {
  data: string;
  mimeType: string;
  fileName?: string;
  fileExtension?: string;
  fileSize?: number;
  id?: string;
  directory?: string;
}

export interface NodeError {
  message: string;
  description?: string;
  httpCode?: number;
  stack?: string;
  cause?: unknown;
  node?: {
    name: string;
    type: string;
  };
}

export interface ExecutionHelpers {
  request: (options: RequestOptions) => Promise<unknown>;
  requestWithAuthentication: (credentialType: string, options: RequestOptions) => Promise<unknown>;
  returnJsonArray: (data: unknown[]) => INodeExecutionData[];
  prepareBinaryData: (data: Buffer | ArrayBuffer | string, fileName?: string, mimeType?: string) => Promise<IBinaryData>;
  binaryToBuffer: (binary: IBinaryData) => Promise<Buffer>;
  httpRequest: (options: RequestOptions) => Promise<unknown>;
  copyInputItems: (items: INodeExecutionData[], properties: string[]) => INodeExecutionData[];
  assertBinaryData: (itemIndex: number, propertyName?: string) => IBinaryData;
  getBinaryDataBuffer: (itemIndex: number, propertyName?: string) => Promise<Buffer>;
}

export interface RequestOptions {
  method?: string;
  url?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  body?: unknown;
  qs?: Record<string, unknown>;
  json?: boolean;
  encoding?: string;
  timeout?: number;
  proxy?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
  };
  returnFullResponse?: boolean;
  skipSslCertificateValidation?: boolean;
  followRedirect?: boolean;
  maxRedirects?: number;
}

export interface Logger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
}

export interface CredentialTestResult {
  status: 'OK' | 'Error';
  message?: string;
}

export interface CredentialData {
  [key: string]: unknown;
}
