/**
 * Node category enum - defines the type/category of a node
 * Used for visual styling and organization in the node palette
 */
export enum NodeCategory {
  /** Trigger nodes start workflow execution */
  Trigger = 'trigger',
  /** Action nodes perform operations */
  Action = 'action',
  /** Logic nodes control flow (IF, Switch, etc.) */
  Logic = 'logic',
  /** Data nodes transform/manipulate data */
  Data = 'data',
  /** Integration nodes connect to external services */
  Integration = 'integration',
  /** AI nodes for machine learning operations */
  AI = 'ai',
  /** Database nodes for data storage operations */
  Database = 'database',
  /** Communication nodes for messaging (email, slack, etc.) */
  Communication = 'communication',
  /** Custom nodes created by developers */
  Custom = 'custom',
}

/**
 * Property type enum - defines the type of a node parameter/property
 * Determines which field component is rendered in the UI
 */
export enum PropertyType {
  /** Single line text input */
  String = 'string',
  /** Numeric input with optional min/max */
  Number = 'number',
  /** Toggle switch/checkbox */
  Boolean = 'boolean',
  /** Single selection dropdown */
  Options = 'options',
  /** Multiple selection dropdown */
  MultiOptions = 'multiOptions',
  /** Color picker input */
  Color = 'color',
  /** Date and time picker */
  DateTime = 'dateTime',
  /** JSON editor with syntax highlighting */
  Json = 'json',
  /** Code editor with language support */
  Code = 'code',
  /** Informational notice (non-editable) */
  Notice = 'notice',
  /** Nested collection of properties */
  Collection = 'collection',
  /** Fixed collection with multiple groups */
  FixedCollection = 'fixedCollection',
  /** Credential selector dropdown */
  CredentialsSelect = 'credentialsSelect',
  /** Dynamic resource locator/picker */
  ResourceLocator = 'resourceLocator',
  /** Expression editor with variable support */
  Expression = 'expression',
  /** Hidden field (not shown in UI) */
  Hidden = 'hidden',
}

/**
 * Node input type enum - defines the type of input port
 */
export enum NodeInputType {
  /** Main data input */
  Main = 'main',
  /** Trigger input (receives trigger events) */
  Trigger = 'trigger',
}

/**
 * Node output type enum - defines the type of output port
 */
export enum NodeOutputType {
  /** Main data output */
  Main = 'main',
  /** Error output (for error handling flows) */
  Error = 'error',
}

/**
 * Edge type enum - visual style of connections
 */
export enum EdgeType {
  /** Default bezier curve */
  Default = 'default',
  /** Smooth bezier with more curve */
  Smooth = 'smooth',
  /** Step/orthogonal connections */
  Step = 'step',
  /** Straight lines */
  Straight = 'straight',
  /** Animated flowing edge */
  Animated = 'animated',
}

/**
 * Node execution status enum
 */
export enum NodeExecutionStatus {
  /** Node hasn't been executed */
  Idle = 'idle',
  /** Node is currently executing */
  Running = 'running',
  /** Node execution succeeded */
  Success = 'success',
  /** Node execution failed */
  Error = 'error',
  /** Node was skipped */
  Skipped = 'skipped',
  /** Node is waiting for input */
  Waiting = 'waiting',
}

/**
 * Workflow execution mode enum
 */
export enum ExecutionMode {
  /** Manual execution triggered by user */
  Manual = 'manual',
  /** Triggered by a trigger node */
  Trigger = 'trigger',
  /** Integrated execution from external system */
  Integrated = 'integrated',
  /** Test execution (sandbox mode) */
  Test = 'test',
}

/**
 * Dialog type enum - types of dialogs in the system
 */
export enum DialogType {
  /** Credential management dialog */
  Credentials = 'credentials',
  /** Node parameters configuration dialog */
  Parameters = 'parameters',
  /** Node settings dialog */
  Settings = 'settings',
  /** Custom developer-defined dialog */
  Custom = 'custom',
  /** Confirmation dialog */
  Confirm = 'confirm',
  /** Alert/info dialog */
  Alert = 'alert',
}

/**
 * Dialog size enum
 */
export enum DialogSize {
  Small = 'sm',
  Medium = 'md',
  Large = 'lg',
  ExtraLarge = 'xl',
  Full = 'full',
}

/**
 * Validation rule type enum
 */
export enum ValidationType {
  /** Regular expression validation */
  Regex = 'regex',
  /** Minimum string length */
  MinLength = 'minLength',
  /** Maximum string length */
  MaxLength = 'maxLength',
  /** Minimum numeric value */
  Min = 'min',
  /** Maximum numeric value */
  Max = 'max',
  /** Custom validation function */
  Custom = 'custom',
  /** Required field validation */
  Required = 'required',
  /** Email format validation */
  Email = 'email',
  /** URL format validation */
  Url = 'url',
}

/**
 * Theme mode enum
 */
export enum ThemeMode {
  Light = 'light',
  Dark = 'dark',
  System = 'system',
}

/**
 * Border radius preset enum
 */
export enum BorderRadius {
  None = 'none',
  Small = 'sm',
  Medium = 'md',
  Large = 'lg',
  ExtraLarge = 'xl',
  Full = 'full',
}

/**
 * HTTP method enum for HTTP Request node
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

/**
 * Authentication type enum
 */
export enum AuthenticationType {
  None = 'none',
  BasicAuth = 'basicAuth',
  HeaderAuth = 'headerAuth',
  QueryAuth = 'queryAuth',
  OAuth2 = 'oauth2',
  ApiKey = 'apiKey',
  DigestAuth = 'digestAuth',
  BearerToken = 'bearerToken',
}

/**
 * Credential authentication method enum
 */
export enum CredentialAuthMethod {
  Generic = 'generic',
  Predefined = 'predefined',
  OAuth2 = 'oauth2',
}

/**
 * Execution order version enum
 */
export enum ExecutionOrderVersion {
  /** Legacy execution order */
  V0 = 'v0',
  /** New execution order with better branch handling */
  V1 = 'v1',
}

/**
 * Data save mode enum
 */
export enum DataSaveMode {
  /** Save all data */
  All = 'all',
  /** Don't save any data */
  None = 'none',
}

/**
 * Merge mode enum for Merge node
 */
export enum MergeMode {
  /** Append items from both inputs */
  Append = 'append',
  /** Combine by index */
  CombineByIndex = 'combineByIndex',
  /** Combine by field */
  CombineByField = 'combineByField',
  /** Keep only items from input 1 */
  KeepInput1 = 'keepInput1',
  /** Keep only items from input 2 */
  KeepInput2 = 'keepInput2',
  /** Wait for all inputs */
  Wait = 'wait',
}

/**
 * Comparison operation enum for IF/Filter nodes
 */
export enum ComparisonOperation {
  Equals = 'equals',
  NotEquals = 'notEquals',
  Contains = 'contains',
  NotContains = 'notContains',
  StartsWith = 'startsWith',
  EndsWith = 'endsWith',
  Regex = 'regex',
  IsEmpty = 'isEmpty',
  IsNotEmpty = 'isNotEmpty',
  GreaterThan = 'greaterThan',
  GreaterThanOrEqual = 'greaterThanOrEqual',
  LessThan = 'lessThan',
  LessThanOrEqual = 'lessThanOrEqual',
  IsTrue = 'isTrue',
  IsFalse = 'isFalse',
  Exists = 'exists',
  DoesNotExist = 'doesNotExist',
}

/**
 * Combine condition mode enum
 */
export enum CombineConditionMode {
  /** All conditions must be true */
  And = 'and',
  /** Any condition can be true */
  Or = 'or',
}

/**
 * Sort order enum
 */
export enum SortOrder {
  Ascending = 'asc',
  Descending = 'desc',
}

/**
 * Item list operation enum
 */
export enum ItemListOperation {
  /** Remove duplicate items */
  RemoveDuplicates = 'removeDuplicates',
  /** Sort items */
  Sort = 'sort',
  /** Limit number of items */
  Limit = 'limit',
  /** Split into batches */
  Split = 'split',
  /** Concatenate items */
  Concatenate = 'concatenate',
  /** Get unique items by field */
  UniqueByField = 'uniqueByField',
  /** Flatten nested arrays */
  Flatten = 'flatten',
  /** Aggregate items */
  Aggregate = 'aggregate',
}

/**
 * Code language enum
 */
export enum CodeLanguage {
  JavaScript = 'javascript',
  TypeScript = 'typescript',
  Python = 'python',
  JSON = 'json',
  HTML = 'html',
  CSS = 'css',
  SQL = 'sql',
}

/**
 * Code execution mode enum
 */
export enum CodeExecutionMode {
  /** Run once for all items */
  RunOnceForAllItems = 'runOnceForAllItems',
  /** Run once for each item */
  RunOnceForEachItem = 'runOnceForEachItem',
}

/**
 * Webhook method enum
 */
export enum WebhookMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
}

/**
 * Webhook response mode enum
 */
export enum WebhookResponseMode {
  /** Respond immediately when webhook is called */
  OnReceived = 'onReceived',
  /** Respond after workflow completes */
  LastNode = 'lastNode',
  /** Respond using a Respond to Webhook node */
  ResponseNode = 'responseNode',
}

/**
 * Schedule trigger interval enum
 */
export enum ScheduleInterval {
  Seconds = 'seconds',
  Minutes = 'minutes',
  Hours = 'hours',
  Days = 'days',
  Weeks = 'weeks',
  Months = 'months',
  Cron = 'cron',
}

/**
 * Panel position enum
 */
export enum PanelPosition {
  TopLeft = 'top-left',
  TopCenter = 'top-center',
  TopRight = 'top-right',
  BottomLeft = 'bottom-left',
  BottomCenter = 'bottom-center',
  BottomRight = 'bottom-right',
  Left = 'left',
  Right = 'right',
}

/**
 * Context menu action enum
 */
export enum ContextMenuAction {
  Rename = 'rename',
  Configure = 'configure',
  Duplicate = 'duplicate',
  Copy = 'copy',
  Paste = 'paste',
  Cut = 'cut',
  Delete = 'delete',
  Disable = 'disable',
  Enable = 'enable',
  ChangeColor = 'changeColor',
  AddNote = 'addNote',
  ExecuteNode = 'executeNode',
  OpenDocumentation = 'openDocumentation',
  AddLabel = 'addLabel',
  SelectAll = 'selectAll',
  FitView = 'fitView',
  AddNode = 'addNode',
}
