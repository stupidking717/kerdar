# Project: KERDAR - Modern React Workflow Designer Library

## Mission
Create a production-ready, open-source React workflow designer library using ReactFlow that developers will love to embed in their applications. Think "the Stripe of workflow designers" - beautiful, flexible, and developer-friendly. Inspired by n8n's powerful node system while providing a modern, customizable UI/UX.

---

## Implementation Status

### Completed Features

#### Core Infrastructure
- [x] Monorepo structure with pnpm workspaces
- [x] `@kerdar/core` - Main workflow designer library
- [x] `@kerdar/nodes-standard` - Standard node library
- [x] Demo application with live preview
- [x] TypeScript throughout with comprehensive type definitions
- [x] Zustand state management (workflow, execution, theme, dialog, credential, node-registry stores)

#### Workflow Designer Component
- [x] ReactFlow-based canvas with pan/zoom
- [x] Drag & drop node creation from sidebar
- [x] Visual node connections with animated edges
- [x] Node selection (single and multi-select)
- [x] Context menus (node, canvas, edge)
- [x] Minimap for navigation
- [x] Toolbar with undo/redo, zoom controls
- [x] Keyboard shortcuts
- [x] Light/Dark theme support

#### Node Details View (NDV)
- [x] n8n-style slide-out panel
- [x] INPUT | PARAMETERS tabs
- [x] Input data preview with JSON tree view
- [x] Sample data indicator
- [x] Parameter form rendering
- [x] Expression editor with Monaco
- [x] Real-time expression preview
- [x] Nested property autocomplete in expressions

#### Input/Output Schema System
- [x] Schema type system (`DataSchema`, `SchemaProperty`, `SchemaSuggestion`)
- [x] Schema builder helpers (`stringProperty()`, `numberProperty()`, `objectProperty()`, etc.)
- [x] Static and dynamic schema definitions on nodes (`outputSchema`)
- [x] Schema context tracking with BFS graph traversal
- [x] Schema-aware expression editor autocomplete
- [x] Visual indicator when schema context available
- [x] Workflow simulation engine with mock data generation
- [x] `simulateWorkflow()` for testing without real API calls
- [x] `previewSimulationDataFlow()` for data flow visualization

#### Node System
- [x] Node type registration system
- [x] Category-based organization
- [x] Dynamic parameter rendering
- [x] Conditional field visibility (displayOptions)
- [x] Multiple property types (string, number, boolean, options, multiOptions, json, code, collection, fixedCollection)
- [x] FixedCollection property type with add/remove items (key-value pairs for headers, query params)
- [x] Collection property type with collapsible options groups
- [x] Styled dropdown components (Radix UI Select)
- [x] Multi-select dropdown component
- [x] Inline node name editing on canvas (click to edit)

#### Execution Engine
- [x] Client-side workflow execution
- [x] Node execution status tracking
- [x] Execution progress visualization
- [x] Debug mode with step-by-step execution
- [x] Breakpoint support
- [x] Execution history panel

#### Standard Nodes (34 nodes)

**Trigger Nodes (6):**
- Manual Trigger - Start workflow manually
- Schedule Trigger - Cron-based scheduling
- Webhook Trigger - HTTP endpoint trigger
- Redis Trigger - Redis pub/sub listener
- RabbitMQ Trigger - Message queue listener
- MinIO Trigger - Object storage events

**Action Nodes (5):**
- HTTP Request - Full HTTP client
- Code - JavaScript execution
- Execute Command - Shell commands
- Send Email - SMTP email
- Slack - Slack API integration

**Logic Nodes (11):**
- If - Conditional branching
- Switch - Multi-way routing
- Merge - Combine data streams
- Split In Batches - Batch processing
- Loop - Iteration
- Lock - Concurrency control
- Parallel - Parallel execution
- Sequence - Sequential execution
- Error Handler - Error management
- Debounce - Rate limiting
- Throttle - Request throttling

**Data Nodes (10):**
- Set Variable - Set workflow variables
- Filter - Filter items
- Sort - Sort items
- Limit - Limit items
- Item Lists - Array operations
- Transform - Data mapping
- No Op - Pass-through
- Wait - Delay execution
- DateTime - Date/time operations
- Crypto - Encryption/hashing

**Integration Nodes (3):**
- Redis - Redis operations
- RabbitMQ - Message queue operations
- MinIO - Object storage operations

#### Credential Types (10)
- HTTP Basic Auth
- HTTP Header Auth
- API Key
- Bearer Token
- OAuth2
- SMTP
- Slack API
- Redis
- RabbitMQ
- MinIO

#### UI Components
- [x] Styled Select dropdown (Radix UI)
- [x] Multi-select dropdown
- [x] Code editor (Monaco)
- [x] Expression editor with autocomplete
- [x] JSON tree viewer
- [x] Node sidebar with search
- [x] Execution history panel
- [x] Button component with variants
- [x] Credential selector component (n8n-style dropdown)
- [x] FixedCollection input component (add/remove items)
- [x] Collection input component (collapsible options)

### Pending Features

#### High Priority
- [ ] n8n-style condition builder (exact match)
- [ ] Execute Workflow node with async callback data fetching
- [ ] JSON editor expression drop at cursor position fix
- [ ] Proper Lock, Parallel, Sequence node implementations
- [ ] i18n internationalization support

#### Medium Priority
- [ ] Credential storage integration
- [ ] Workflow templates
- [ ] Example workflow demonstrating schema binding

#### Low Priority
- [ ] Undo/redo history persistence
- [ ] Workflow import/export UI
- [ ] Node search (Cmd+K)
- [ ] Comments/sticky notes
- [ ] Workflow versioning

---

## Core Requirements

### 1. Technology Stack
- **Framework**: React 18+ with TypeScript
- **Workflow Engine**: ReactFlow (latest version)
- **Styling**: Tailwind CSS + CSS Variables for theming
- **State Management**: Zustand (lightweight, perfect for this use case)
- **Icons**: Lucide React (modern, consistent)
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Monorepo**: Turborepo (for demo + library)
- **Form Handling**: React Hook Form (for node parameters & dialogs)
- **Validation**: Zod (for parameter validation)

### 2. Project Structure
```
KERDAR/
├── packages/
│   ├── core/                    # @KERDAR/core - Main library
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── WorkflowDesigner/
│   │   │   │   ├── Nodes/
│   │   │   │   │   ├── BaseNode.tsx
│   │   │   │   │   ├── NodeRenderer.tsx
│   │   │   │   │   └── NodeRegistry.tsx
│   │   │   │   ├── Edges/
│   │   │   │   ├── Panels/      # Toolbar, minimap, controls
│   │   │   │   ├── Dialogs/     # Reusable dialog system
│   │   │   │   │   ├── BaseDialog.tsx
│   │   │   │   │   ├── CredentialsDialog.tsx
│   │   │   │   │   ├── NodeParametersDialog.tsx
│   │   │   │   │   ├── NodeSettingsDialog.tsx
│   │   │   │   │   └── CustomDialog.tsx
│   │   │   │   └── Fields/      # Form field components
│   │   │   │       ├── StringField.tsx
│   │   │   │       ├── NumberField.tsx
│   │   │   │       ├── DropdownField.tsx
│   │   │   │       ├── CredentialField.tsx
│   │   │   │       ├── CodeEditor.tsx
│   │   │   │       └── ExpressionEditor.tsx
│   │   │   ├── hooks/           # useWorkflow, useExecution, useTheme
│   │   │   ├── store/           # Zustand stores
│   │   │   ├── engine/          # Execution engine
│   │   │   │   ├── executor.ts
│   │   │   │   ├── node-executor.ts
│   │   │   │   └── data-transformer.ts
│   │   │   ├── nodes/           # Built-in node definitions
│   │   │   │   ├── trigger/
│   │   │   │   ├── action/
│   │   │   │   ├── logic/
│   │   │   │   └── data/
│   │   │   ├── credentials/     # Credential types & management
│   │   │   ├── types/           # TypeScript definitions
│   │   │   ├── theme/           # Theme system
│   │   │   └── utils/
│   │   └── package.json
│   ├── nodes-standard/          # @KERDAR/nodes-standard - n8n-like standard nodes
│   │   ├── src/
│   │   │   ├── nodes/
│   │   │   │   ├── HttpRequest/
│   │   │   │   ├── Webhook/
│   │   │   │   ├── Code/
│   │   │   │   ├── If/
│   │   │   │   ├── Switch/
│   │   │   │   ├── Merge/
│   │   │   │   ├── SplitInBatches/
│   │   │   │   ├── SetVariable/
│   │   │   │   └── ...
│   │   │   └── credentials/
│   │   │       ├── HttpBasicAuth/
│   │   │       ├── HttpHeaderAuth/
│   │   │       ├── OAuth2/
│   │   │       └── ApiKey/
│   │   └── package.json
│   └── demo/                    # Demo application
│       ├── src/
│       │   ├── examples/        # Various use cases
│       │   ├── custom-nodes/    # Example custom nodes
│       │   └── App.tsx
│       └── package.json
├── docs/                        # Documentation site
└── package.json
```

### 3. Core Data Structure

```typescript
// ==================== NODE SYSTEM ====================

/**
 * Node Type Definition (similar to n8n's INodeType)
 * This is what developers use to define custom nodes
 */
export interface NodeTypeDefinition {
  type: string;                    // Unique identifier
  version: number;                 // Node version for backward compatibility
  name: string;                    // Display name
  displayName: string;             // Pretty name for UI
  description: string;
  icon?: string;                   // Lucide icon name or custom SVG
  iconColor?: string;
  category: NodeCategory;
  subtitle?: string | ((node: WorkflowNode) => string);
  group: string[];                 // For grouping in palette

  // Input/Output configuration
  inputs: NodeInput[];
  outputs: NodeOutput[];

  // Credentials
  credentials?: CredentialTypeConfig[];

  // Node parameters (configuration fields)
  properties: NodeProperty[];

  // Execution function
  execute: (context: NodeExecutionContext) => Promise<NodeExecutionResult>;

  // Hooks
  hooks?: {
    activate?: () => void;
    deactivate?: () => void;
  };

  // UI customization
  customization?: {
    width?: number;
    height?: number;
    color?: string;
    renderPreview?: (node: WorkflowNode) => React.ReactNode;
  };
}

/**
 * Node Categories
 */
export type NodeCategory =
  | 'trigger'
  | 'action'
  | 'logic'
  | 'data'
  | 'integration'
  | 'ai'
  | 'database'
  | 'communication'
  | 'custom';

/**
 * Node Input Configuration (like n8n)
 */
export interface NodeInput {
  type: 'main' | 'trigger';
  displayName?: string;
  maxConnections?: number;         // -1 for unlimited, 1 for single
  required?: boolean;
}

/**
 * Node Output Configuration (like n8n)
 */
export interface NodeOutput {
  type: 'main' | 'error';
  displayName?: string;
}

/**
 * Node Property (Parameter) Definition
 * Supports various field types like n8n
 */
export interface NodeProperty {
  name: string;
  displayName: string;
  type: PropertyType;
  default?: any;
  required?: boolean;
  description?: string;
  placeholder?: string;
  hint?: string;

  // Conditional display
  displayOptions?: {
    show?: Record<string, any[]>;
    hide?: Record<string, any[]>;
  };

  // Type-specific options
  options?: PropertyOption[];       // For dropdown, multiOptions
  typeOptions?: {
    minValue?: number;
    maxValue?: number;
    rows?: number;                  // For textarea
    multipleValues?: boolean;
    multipleValueButtonText?: string;
    password?: boolean;             // For string
    alwaysOpenEditWindow?: boolean;
    editor?: 'json' | 'code' | 'html';
    loadOptionsMethod?: string;     // Dynamic options loading
  };

  // Credential selector
  credentialTypes?: string[];

  // Collections & Fixed collections (n8n style)
  values?: NodeProperty[];          // For collection type

  // Validation
  validation?: ValidationRule[];
}

export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'options'           // Dropdown
  | 'multiOptions'      // Multi-select
  | 'color'
  | 'dateTime'
  | 'json'
  | 'code'              // Code editor
  | 'notice'            // Info message
  | 'collection'        // Nested properties
  | 'fixedCollection'   // Multiple collections
  | 'credentialsSelect'
  | 'resourceLocator'   // Dynamic resource picker
  | 'expression';       // Expression editor with variable support

export interface PropertyOption {
  name: string;
  value: any;
  description?: string;
  icon?: string;
}

export interface ValidationRule {
  type: 'regex' | 'minLength' | 'maxLength' | 'min' | 'max' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

/**
 * Workflow Node Instance
 */
export interface WorkflowNode {
  id: string;
  type: string;                    // References NodeTypeDefinition.type
  name: string;                    // Instance name (user-editable)
  position: { x: number; y: number };
  disabled?: boolean;
  notes?: string;

  // Node parameters (values set by user)
  parameters: Record<string, any>;

  // Credentials reference
  credentials?: Record<string, { id: string; name: string }>;

  // UI state
  color?: string;
  alwaysOutputData?: boolean;
  executeOnce?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;

  // Custom data
  metadata?: Record<string, any>;
}

/**
 * Workflow Edge
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;           // Output index (e.g., "output-0", "output-1")
  targetHandle?: string;           // Input index (e.g., "input-0")
  type?: 'default' | 'smooth' | 'step' | 'animated';
  data?: {
    label?: string;
    condition?: string;
  };
}

/**
 * Complete Workflow Schema
 */
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  active?: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  settings?: WorkflowSettings;
  staticData?: Record<string, any>;  // Persistent data across executions
  metadata?: {
    createdAt: string;
    updatedAt: string;
    author?: string;
    tags?: string[];
  };
}

export interface WorkflowSettings {
  executionOrder?: 'v0' | 'v1';
  saveManualExecutions?: boolean;
  saveExecutionProgress?: boolean;
  saveDataSuccessExecution?: 'all' | 'none';
  saveDataErrorExecution?: 'all' | 'none';
  timezone?: string;
}

// ==================== EXECUTION SYSTEM ====================

/**
 * Node Execution Context (passed to node's execute function)
 */
export interface NodeExecutionContext {
  // Input data from connected nodes
  getInputData(inputIndex?: number): INodeExecutionData[];

  // Node configuration
  getNodeParameter<T = any>(parameterName: string, fallback?: T): T;

  // Credentials
  getCredentials<T = any>(type: string): Promise<T>;

  // Workflow data
  getWorkflowStaticData(type: string): any;

  // Helpers
  helpers: {
    request: (options: RequestOptions) => Promise<any>;
    requestWithAuthentication: (type: string, options: RequestOptions) => Promise<any>;
    returnJsonArray: (data: any[]) => INodeExecutionData[];
    prepareBinaryData: (data: Buffer, filename?: string, mimeType?: string) => IBinaryData;
  };

  // Context
  node: WorkflowNode;
  workflow: Workflow;

  // Execution metadata
  executionId: string;
  mode: 'manual' | 'trigger' | 'integrated';

  // Logging
  logger: {
    debug: (message: string, data?: any) => void;
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
  };
}

/**
 * Node Execution Data (data passed between nodes)
 */
export interface INodeExecutionData {
  json: Record<string, any>;       // Main data
  binary?: Record<string, IBinaryData>;
  pairedItem?: {
    item: number;
    input?: number;
  };
  error?: NodeApiError;
}

export interface IBinaryData {
  data: string;                    // Base64 encoded
  mimeType: string;
  fileName?: string;
  fileExtension?: string;
  fileSize?: number;
}

/**
 * Node Execution Result
 */
export interface NodeExecutionResult {
  // Output data per output connection
  outputData: INodeExecutionData[][];

  // Execution metadata
  executionTime?: number;
  executionStatus?: 'success' | 'error';

  // Additional info
  metadata?: {
    [key: string]: any;
  };
}

// ==================== CREDENTIALS SYSTEM ====================

/**
 * Credential Type Definition
 */
export interface CredentialTypeDefinition {
  name: string;                    // Unique identifier
  displayName: string;
  documentationUrl?: string;
  icon?: string;
  iconColor?: string;

  // Credential properties
  properties: NodeProperty[];

  // Authentication
  authenticate?: {
    type: 'generic' | 'predefined';
    properties?: Record<string, any>;
  };

  // Test function
  test?: (credentials: CredentialData) => Promise<{ status: 'OK' | 'Error'; message?: string }>;
}

/**
 * Credential Configuration for Node
 */
export interface CredentialTypeConfig {
  name: string;                    // References CredentialTypeDefinition.name
  required?: boolean;
  displayOptions?: {
    show?: Record<string, any[]>;
    hide?: Record<string, any[]>;
  };
}

/**
 * Credential Instance
 */
export interface Credential {
  id: string;
  name: string;                    // User-defined name
  type: string;                    // References CredentialTypeDefinition.name
  data: CredentialData;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialData {
  [key: string]: any;
}

// ==================== DIALOG SYSTEM ====================

/**
 * Base Dialog Configuration
 */
export interface DialogConfig {
  id: string;
  type: 'credentials' | 'parameters' | 'settings' | 'custom';
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;

  // Actions
  onSave?: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;

  // Validation
  validate?: (data: any) => ValidationResult;
}

/**
 * Credentials Dialog Configuration
 */
export interface CredentialsDialogConfig extends DialogConfig {
  type: 'credentials';
  credentialType: string;          // References CredentialTypeDefinition.name
  existingCredential?: Credential;
  allowCreate?: boolean;
  allowSelect?: boolean;
}

/**
 * Node Parameters Dialog Configuration
 */
export interface NodeParametersDialogConfig extends DialogConfig {
  type: 'parameters';
  node: WorkflowNode;
  nodeType: NodeTypeDefinition;
  currentParameters: Record<string, any>;

  // Dynamic options loading
  loadOptions?: (property: string, search?: string) => Promise<PropertyOption[]>;
}

/**
 * Custom Dialog Configuration
 */
export interface CustomDialogConfig extends DialogConfig {
  type: 'custom';
  content: React.ReactNode | ((props: CustomDialogProps) => React.ReactNode);
  footer?: React.ReactNode | ((props: CustomDialogProps) => React.ReactNode);
  data?: Record<string, any>;
}

export interface CustomDialogProps {
  data: Record<string, any>;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

// ==================== THEME SYSTEM ====================

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  accentColor: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fontFamily?: string;

  // Node colors by category
  nodeColors?: {
    trigger?: string;
    action?: string;
    logic?: string;
    data?: string;
    integration?: string;
    ai?: string;
    database?: string;
    communication?: string;
    custom?: string;
  };

  customCSS?: string;
}

// ==================== WHITE LABEL CONFIGURATION ====================

export interface WhiteLabelConfig {
  branding: {
    logo?: string;
    name?: string;
    primaryColor?: string;
    accentColor?: string;
  };

  features: {
    showMinimap?: boolean;
    showControls?: boolean;
    showToolbar?: boolean;
    showNodePalette?: boolean;
    allowExport?: boolean;
    allowImport?: boolean;
    allowExecute?: boolean;
    allowCredentials?: boolean;
  };

  // Custom node types to include
  includeNodeTypes?: string[];
  excludeNodeTypes?: string[];

  // Custom dialogs
  customDialogs?: Record<string, CustomDialogConfig>;
}
```

### 4. UI/UX Design Requirements

#### Visual Design Principles

1. **Modern & Unique**:
   - Glassmorphism effects for panels (subtle backdrop blur)
   - Smooth animations (Framer Motion for complex animations)
   - Gradient accents (not overused)
   - Neumorphism for nodes (soft shadows, elevated look)
   - Floating action buttons with smooth hover effects

2. **Color System**:
   - Light mode: Clean whites, soft grays (#F8FAFC, #F1F5F9)
   - Dark mode: Deep dark (#0F172A, #1E293B) with bright accents
   - Semantic colors: success (#10B981), error (#EF4444), warning (#F59E0B), info (#3B82F6)
   - Category-specific colors:
     - Trigger: #8B5CF6 (Purple)
     - Action: #3B82F6 (Blue)
     - Logic: #F59E0B (Amber)
     - Data: #10B981 (Green)
     - Integration: #EC4899 (Pink)
     - AI: #6366F1 (Indigo)
     - Database: #14B8A6 (Teal)
     - Communication: #F97316 (Orange)

3. **Typography**:
   - Primary: Inter or Geist (modern, clean)
   - Monospace: Fira Code or JetBrains Mono (for code/config)
   - Scale: text-xs to text-2xl

4. **Spacing & Layout**:
   - Consistent 8px grid system
   - Generous whitespace
   - Responsive to container size

#### Component Design Specs

**Nodes** (n8n-inspired functional design):

```
┌─────────────────────────────────────┐
│ ● │ 🔷 Node Name          [•••]    │ ← Header (icon, name, menu)
├───┴─────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐│
│ │  Brief preview of config/state  ││ ← Body (collapsed state)
│ └─────────────────────────────────┘│
│                                     │
│ ○ Input 1           Output 1 ○     │ ← Ports (inputs left, outputs right)
│ ○ Input 2           Output 2 ○     │
└─────────────────────────────────────┘
```

**Node Specifications**:
- Size: Adaptive (min 220x100px, expands based on content)
- Style: Rounded corners (12px), subtle shadow, category-colored left border (4px)
- Header:
  - Left: Connection dot (shows if connected)
  - Icon: Category-colored icon
  - Label: Node name (editable on double-click)
  - Right: Three-dot menu (settings, disable, delete, duplicate)
  - Status indicator (small dot): idle (gray), running (blue pulse), success (green), error (red)
- Body:
  - Collapsed: Shows 1-line summary of key parameters
  - Expanded: Shows key parameters inline (mini form)
  - Click anywhere to open full parameters dialog
- Ports:
  - Inputs: Left side, vertically stacked
  - Outputs: Right side, vertically stacked
  - Port style: Colored circles (6px diameter)
    - Main: Blue (#3B82F6)
    - Trigger: Purple (#8B5CF6)
    - Error: Red (#EF4444)
  - Port labels: Show on hover
  - Hover effect: Enlarge + show compatible connections
- States:
  - Hover: Elevate with larger shadow, slightly brighten
  - Selected: Accent color border (2px), glow effect
  - Disabled: 50% opacity, grayscale
  - Running: Pulsing glow animation
  - Error: Red glow + shake animation
  - Success: Green glow (temporary)
- Badges:
  - Top-right corner badges for: credentials (🔑), notes (📝), errors (⚠️)

**Edges** (Connections):
- Default: Smooth bezier curves
- Width: 2px (3px on hover)
- Color:
  - Default: Border color (#E2E8F0 light, #334155 dark)
  - Success flow: Green gradient
  - Error flow: Red
  - Active execution: Animated blue gradient flowing
- Hover: Thicker, show delete button (× in circle at midpoint)
- Selected: Accent color, show label if exists
- Types:
  - Solid for main connections
  - Dashed for conditional branches
  - Dotted for disabled nodes

**Dialogs** (Core of the system):

1. **Credentials Dialog**:
```
┌──────────────────────────────────────────┐
│ 🔑 HTTP Basic Auth              [X]     │
├──────────────────────────────────────────┤
│                                          │
│ Select existing or create new:          │
│                                          │
│ ┌──────────────────────────────────────┐│
│ │ ○ Existing: [My API Credentials ▼]  ││
│ │ ● Create new                         ││
│ └──────────────────────────────────────┘│
│                                          │
│ Credential Name *                        │
│ ┌──────────────────────────────────────┐│
│ │ My Production API                    ││
│ └──────────────────────────────────────┘│
│                                          │
│ Username *                               │
│ ┌──────────────────────────────────────┐│
│ │ admin                                ││
│ └──────────────────────────────────────┘│
│                                          │
│ Password *                               │
│ ┌──────────────────────────────────────┐│
│ │ ••••••••                             ││
│ └──────────────────────────────────────┘│
│                                          │
│ ℹ️ This credential will be encrypted    │
│    and stored securely                   │
│                                          │
├──────────────────────────────────────────┤
│              [Test] [Cancel] [Save]      │
└──────────────────────────────────────────┘
```

2. **Node Parameters Dialog**:
```
┌──────────────────────────────────────────┐
│ ⚙️  HTTP Request Settings        [X]     │
├──────────────────────────────────────────┤
│ [Parameters] [Settings] [HTTP]           │ ← Tabs
├──────────────────────────────────────────┤
│                                          │
│ Method *                                 │
│ ┌──────────────────────────────────────┐│
│ │ GET                              ▼   ││
│ └──────────────────────────────────────┘│
│                                          │
│ URL *                                    │
│ ┌──────────────────────────────────────┐│
│ │ https://api.example.com/users    🔧 ││ ← 🔧 = Expression editor
│ └──────────────────────────────────────┘│
│                                          │
│ Authentication                           │
│ ┌──────────────────────────────────────┐│
│ │ Generic Credential Type          ▼   ││
│ └──────────────────────────────────────┘│
│ 🔑 [Select Credential...]                │
│                                          │
│ ⊕ Add Query Parameter                   │
│ ⊕ Add Header                            │
│                                          │
│ ⚙️ Options ▼                             │
│ ┌──────────────────────────────────────┐│
│ │ ☐ Ignore SSL Issues                  ││
│ │ ☐ Follow Redirects                   ││
│ │ Timeout: [10000] ms                  ││
│ └──────────────────────────────────────┘│
│                                          │
├──────────────────────────────────────────┤
│                   [Cancel] [Execute] [Save]│
└──────────────────────────────────────────┘
```

3. **Custom Dialog Template**:
   - Provides `<Dialog>`, `<DialogHeader>`, `<DialogContent>`, `<DialogFooter>` components
   - Developers can compose custom dialogs easily
   - Supports all standard form fields
   - Auto-handles validation, loading states, error display

**Toolbar** (Top):
```
┌──────────────────────────────────────────────────────┐
│ [◀️] [▶️] | [⊞] [🔍+] [🔍-] | [▶️ Execute] [💾] [⋯] │
│  Undo Redo  Fit  Zoom         Execute    Save  More  │
└──────────────────────────────────────────────────────┘
```
- Floating glass panel
- Auto-hide on scroll (reappear on hover)
- Actions: Undo, Redo, Zoom to fit, Zoom in/out, Execute workflow, Save, Export/Import, Settings

**Node Palette** (Left):
```
┌─────────────────────┐
│ ⌘K Search nodes...  │
├─────────────────────┤
│ ▼ Triggers          │
│   🔔 Webhook         │
│   ⏰ Schedule        │
│   📧 Email Trigger   │
│                     │
│ ▼ Actions           │
│   🌐 HTTP Request    │
│   ✉️  Send Email     │
│   💾 Set Variable    │
│                     │
│ ▼ Logic             │
│   ⚖️  IF              │
│   🔀 Switch          │
│   🔁 Loop            │
└─────────────────────┘
```
- Collapsible sidebar (can hide completely)
- Search with Cmd+K (opens command palette)
- Categorized with expand/collapse
- Drag & drop onto canvas
- Show node description on hover

**Properties Panel** (Right):
```
┌─────────────────────────────────┐
│ HTTP Request                    │
│ Node: http-1                    │
├─────────────────────────────────┤
│ [Parameters] [Settings] [Notes] │
├─────────────────────────────────┤
│                                 │
│ Quick Edit:                     │
│ Method: GET                     │
│ URL: https://api...             │
│                                 │
│ [Open Full Editor...]           │
│                                 │
│ ─────────────────────────       │
│                                 │
│ Execution:                      │
│ ☑ Always Output Data            │
│ ☐ Execute Once                  │
│ ☐ Retry On Fail                 │
│                                 │
│ ─────────────────────────       │
│                                 │
│ Notes:                          │
│ ┌─────────────────────────────┐│
│ │ This calls the user API... ││
│ └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```
- Context-aware (shows selected node or edge)
- Smooth slide-in/out animation
- Quick edit for common parameters
- Full editor button for complex configuration
- Execution options
- Notes section

**Minimap** (Bottom-right):
- Glass effect background
- Colored rectangles for nodes (category-based colors)
- Draggable viewport indicator
- Click to navigate
- Toggle button to show/hide

**Context Menus**:
- Right-click on node:
  - ✏️ Rename
  - ⚙️ Configure
  - 📋 Duplicate
  - 🔗 Copy
  - 🔒 Disable/Enable
  - 🎨 Change Color
  - 🗑️ Delete
- Right-click on canvas:
  - ➕ Add Node
  - 📋 Paste
  - 🎯 Zoom to Fit
- Right-click on edge:
  - ✏️ Add Label
  - 🗑️ Delete

### 5. Standard Node Library (n8n-inspired)

#### Trigger Nodes

1. **Manual Trigger**
   - Simple start node
   - Allows manual execution
   - Outputs: 1 main

2. **Webhook**
   - HTTP endpoint trigger
   - Parameters: Method, Path, Response mode
   - Authentication options
   - Outputs: 1 main

3. **Schedule**
   - Cron-based trigger
   - Visual cron builder + expression editor
   - Timezone support
   - Outputs: 1 main

4. **Email Trigger**
   - IMAP email receiver
   - Filters: Subject, sender, etc.
   - Credentials: IMAP
   - Outputs: 1 main

#### Action Nodes

5. **HTTP Request**
   - Full-featured HTTP client
   - Parameters:
     - Method (GET, POST, PUT, PATCH, DELETE, etc.)
     - URL (with expression support)
     - Authentication (dropdown)
     - Query parameters (collection)
     - Headers (collection)
     - Body (JSON, Form, Raw)
     - Options (SSL, redirects, timeout, etc.)
   - Credentials: Various HTTP auth types
   - Inputs: 1 main
   - Outputs: 1 main

6. **Code**
   - JavaScript/TypeScript execution
   - Access to input data
   - Code editor with syntax highlighting
   - Auto-complete for available variables
   - Parameters:
     - Language (JavaScript/Python)
     - Code (editor)
     - Mode (Run Once for All Items / Run Once for Each Item)
   - Inputs: 1 main
   - Outputs: 1 main

7. **Set Variable**
   - Set workflow variables
   - Parameters:
     - Mode (Set, Append, Remove)
     - Variables (collection of key-value pairs)
     - Expression support
   - Inputs: 1 main
   - Outputs: 1 main

8. **Execute Command**
   - Shell command execution
   - Security warnings
   - Parameters: Command, arguments
   - Inputs: 1 main
   - Outputs: 1 main, 1 error

#### Logic Nodes

9. **IF**
   - Conditional branching
   - Parameters:
     - Conditions (collection)
       - Value 1 (expression)
       - Operation (equals, not equals, contains, regex, etc.)
       - Value 2 (expression)
     - Combine conditions (AND/OR)
   - Inputs: 1 main
   - Outputs: 2 main (true, false)

10. **Switch**
    - Multiple condition routing
    - Parameters:
      - Mode (Expression, Rules)
      - Routes (collection of conditions)
    - Inputs: 1 main
    - Outputs: N main (one per route + default)

11. **Merge**
    - Combine data from multiple inputs
    - Parameters:
      - Mode (Append, Combine, etc.)
      - Options
    - Inputs: 2+ main
    - Outputs: 1 main

12. **Split In Batches**
    - Process items in batches
    - Parameters:
      - Batch size
      - Options
    - Inputs: 1 main
    - Outputs: 1 main (loops)

13. **Loop**
    - For each iteration
    - Parameters:
      - Items source (input data, range, expression)
    - Inputs: 1 main
    - Outputs: 1 main (per iteration)

#### Data Nodes

14. **Filter**
    - Filter items based on conditions
    - Similar to IF but filters items
    - Parameters: Conditions
    - Inputs: 1 main
    - Outputs: 1 main

15. **Sort**
    - Sort items
    - Parameters:
      - Field to sort by
      - Order (ascending/descending)
    - Inputs: 1 main
    - Outputs: 1 main

16. **Limit**
    - Limit number of items
    - Parameters:
      - Max items
      - Keep (first/last)
    - Inputs: 1 main
    - Outputs: 1 main

17. **Item Lists**
    - Array operations
    - Parameters:
      - Operation (unique, flatten, split, etc.)
    - Inputs: 1 main
    - Outputs: 1 main

18. **Transform**
    - Map/transform data
    - Parameters:
      - Mappings (collection)
    - Inputs: 1 main
    - Outputs: 1 main

#### Communication Nodes

19. **Send Email**
    - SMTP email sender
    - Parameters:
      - To, CC, BCC
      - Subject
      - Body (HTML/Text)
      - Attachments
    - Credentials: SMTP
    - Inputs: 1 main
    - Outputs: 1 main

20. **Slack**
    - Slack integration
    - Parameters:
      - Operation (post message, update message, etc.)
      - Channel
      - Text
    - Credentials: Slack OAuth2
    - Inputs: 1 main
    - Outputs: 1 main

### 6. Standard Credential Types

1. **HTTP Basic Auth**
   - Properties: Username, Password

2. **HTTP Header Auth**
   - Properties: Name, Value

3. **OAuth2**
   - Properties: Grant Type, Auth URL, Access Token URL, Client ID, Client Secret, Scope
   - Auto-handles token refresh

4. **API Key**
   - Properties: Key, Value, Add To (Header/Query)

5. **SMTP**
   - Properties: Host, Port, User, Password, SSL/TLS

6. **IMAP**
   - Properties: Host, Port, User, Password, SSL/TLS

7. **Database Credentials**
   - Properties: Host, Port, Database, User, Password, SSL options

### 7. API Design (Developer Experience)

```tsx
import {
  WorkflowDesigner,
  useWorkflow,
  registerNode,
  registerCredential,
  useDialog
} from '@KERDAR/core';
import { standardNodes, standardCredentials } from '@KERDAR/nodes-standard';
import '@KERDAR/core/dist/style.css';

// Register standard nodes
standardNodes.forEach(node => registerNode(node));
standardCredentials.forEach(cred => registerCredential(cred));

// Register custom node
registerNode({
  type: 'my-custom-api',
  version: 1,
  name: 'myCustomApi',
  displayName: 'My Custom API',
  description: 'Calls my custom API endpoint',
  icon: 'Zap',
  iconColor: '#FF6B6B',
  category: 'action',
  group: ['custom'],

  inputs: [{ type: 'main', displayName: 'Input' }],
  outputs: [{ type: 'main', displayName: 'Output' }],

  credentials: [
    {
      name: 'myCustomApiAuth',
      required: true,
    },
  ],

  properties: [
    {
      name: 'endpoint',
      displayName: 'Endpoint',
      type: 'options',
      options: [
        { name: 'Get Users', value: '/users' },
        { name: 'Get Products', value: '/products' },
      ],
      default: '/users',
      required: true,
    },
    {
      name: 'userId',
      displayName: 'User ID',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          endpoint: ['/users'],
        },
      },
    },
  ],

  async execute(context) {
    const endpoint = context.getNodeParameter('endpoint');
    const userId = context.getNodeParameter('userId', '');
    const credentials = await context.getCredentials('myCustomApiAuth');

    const response = await context.helpers.requestWithAuthentication(
      'myCustomApiAuth',
      {
        method: 'GET',
        url: `https://api.example.com${endpoint}`,
        qs: userId ? { id: userId } : {},
      }
    );

    return {
      outputData: [
        context.helpers.returnJsonArray([response])
      ],
    };
  },
});

function App() {
  const [workflow, setWorkflow] = useState<Workflow>({
    id: 'workflow-1',
    name: 'My Workflow',
    version: '1.0.0',
    nodes: [],
    edges: [],
  });

  const { openDialog } = useDialog();

  return (
    <WorkflowDesigner
      workflow={workflow}
      onChange={setWorkflow}

      // Theme
      theme={{
        mode: 'dark',
        primaryColor: '#3B82F6',
        accentColor: '#8B5CF6',
      }}

      // White label
      whiteLabel={{
        branding: {
          name: 'My App Workflows',
          primaryColor: '#3B82F6',
        },
        features: {
          showMinimap: true,
          showToolbar: true,
          allowExecute: true,
          allowCredentials: true,
        },
      }}

      // Callbacks
      onExecute={async (workflow) => {
        console.log('Executing workflow...', workflow);
        // Execute via your backend or built-in engine
      }}

      onNodeSelect={(node) => {
        console.log('Selected:', node);
      }}

      onNodeDoubleClick={(node) => {
        // Open custom dialog
        openDialog({
          type: 'parameters',
          node,
          nodeType: getNodeType(node.type),
          currentParameters: node.parameters,
          onSave: (parameters) => {
            updateNodeParameters(node.id, parameters);
          },
        });
      }}

      // Credential management
      credentialStore={{
        list: async () => {
          // Fetch from your backend
          return await api.getCredentials();
        },
        get: async (id) => {
          return await api.getCredential(id);
        },
        create: async (credential) => {
          return await api.createCredential(credential);
        },
        update: async (id, credential) => {
          return await api.updateCredential(id, credential);
        },
        delete: async (id) => {
          await api.deleteCredential(id);
        },
        test: async (credentialType, credentialData) => {
          return await api.testCredential(credentialType, credentialData);
        },
      }}

      // Execution
      executionEngine={{
        execute: async (workflow, options) => {
          // Use built-in engine or custom backend
          return await executeWorkflow(workflow, options);
        },
        onProgress: (nodeId, status) => {
          console.log(`Node ${nodeId}: ${status}`);
        },
      }}
    />
  );
}
```

### 8. Custom Dialogs Hook

```tsx
import { useDialog } from '@KERDAR/core';

function MyComponent() {
  const { openDialog, closeDialog } = useDialog();

  const handleOpenCustomDialog = () => {
    openDialog({
      type: 'custom',
      id: 'my-custom-dialog',
      title: 'Import Data',
      size: 'lg',
      content: ({ data, onSave, onCancel }) => (
        <div>
          <p>Custom dialog content here</p>
          <input
            type="file"
            onChange={(e) => {
              // Handle file upload
              const file = e.target.files[0];
              onSave({ file });
            }}
          />
        </div>
      ),
      footer: ({ data, onSave, onCancel }) => (
        <>
          <button onClick={onCancel}>Cancel</button>
          <button onClick={() => onSave(data)}>Import</button>
        </>
      ),
      onSave: (data) => {
        console.log('Saved:', data);
        closeDialog('my-custom-dialog');
      },
    });
  };

  return (
    <button onClick={handleOpenCustomDialog}>
      Open Custom Dialog
    </button>
  );
}
```

### 9. Field Components

All field components are exportable and reusable:

```tsx
import {
  StringField,
  NumberField,
  DropdownField,
  CodeEditor,
  ExpressionEditor,
  CredentialField,
  CollectionField,
} from '@KERDAR/core';

<StringField
  name="username"
  label="Username"
  placeholder="Enter username"
  required
  value={value}
  onChange={setValue}
  error={error}
/>

<CodeEditor
  language="javascript"
  value={code}
  onChange={setCode}
  height={300}
  theme="dark"
/>

<ExpressionEditor
  value={expression}
  onChange={setExpression}
  availableVariables={[
    { name: '$input', description: 'Input data' },
    { name: '$node', description: 'Current node' },
  ]}
/>

<CredentialField
  credentialType="httpBasicAuth"
  value={credentialId}
  onChange={setCredentialId}
  onCreateNew={() => openCredentialDialog('httpBasicAuth')}
/>
```

### 10. Animation Guidelines

- Node drag: 0ms (instant feedback)
- Panel slide: 200ms ease-out
- Dialog open: 200ms cubic-bezier(0.4, 0, 0.2, 1)
- Dialog backdrop: 150ms ease-in (fade)
- Hover effects: 150ms ease-in-out
- Node execution pulse: 1s infinite
- Edge draw: 300ms ease-in-out
- Port highlight: 100ms ease-out
- Tooltip appear: 200ms delay, 100ms fade-in

### 11. Execution Engine Features

1. **Step-by-step execution**:
   - Visual highlight of current node
   - Pause/resume controls
   - Step forward/backward

2. **Real-time updates**:
   - Node status changes (running → success/error)
   - Progress indicators
   - Execution time per node

3. **Error handling**:
   - Errors displayed on node
   - Error output to dedicated output port
   - Retry logic with exponential backoff
   - Error stack traces in execution log

4. **Execution log**:
   - Panel showing all logs
   - Filterable by node, log level
   - Exportable

5. **Data inspection**:
   - View input/output data per node
   - JSON viewer with syntax highlighting
   - Binary data preview

### 12. Testing Requirements

- **Unit tests**: Vitest + Testing Library
  - All hooks (>90% coverage)
  - Store logic (100% coverage)
  - Execution engine (100% coverage)
  - Utilities (>90% coverage)

- **Integration tests**:
  - Node registration
  - Workflow execution
  - Dialog system
  - Credential management

- **E2E tests**: Playwright
  - Create workflow
  - Add nodes
  - Connect nodes
  - Configure node parameters
  - Add credentials
  - Execute workflow
  - Export/import workflow

- **Visual regression**: Chromatic
  - All components in Storybook
  - Light/dark themes
  - Different screen sizes

### 13. Documentation

1. **README.md**:
   - Hero section with animated demo GIF
   - Features showcase
   - Quick start (install, basic example)
   - Comparison with alternatives
   - Live demo link

2. **Docs site** (Docusaurus/Nextra):
   - Getting Started
   - Core Concepts
   - API Reference
   - Node Development Guide
   - Credential Development Guide
   - Custom Dialog Guide
   - Theming Guide
   - White Labeling Guide
   - Examples & Recipes
   - Migration Guide

3. **Storybook**:
   - All components
   - All field types
   - All node types
   - All dialog types
   - Theming examples

4. **TypeDoc**:
   - Auto-generated API docs
   - All interfaces, types, functions

5. **Examples**:
   - Basic workflow
   - API orchestration
   - Data pipeline
   - ETL process
   - Custom nodes
   - Custom credentials
   - Custom dialogs
   - White label example
   - Backend integration

### 14. GitHub Repository Setup

**README Structure**:
```markdown
# 🔷 KERDAR - Modern React Workflow Designer

[Animated GIF demo]

Build powerful workflow automation into your app in minutes.

[![npm version](badge)]
[![bundle size](badge)]
[![license](badge)]
[![GitHub stars](badge)]

## ✨ Features

- 🎨 Beautiful, modern UI with light/dark mode
- 🔌 20+ pre-built nodes (HTTP, Email, Logic, Data, etc.)
- 🔑 Built-in credential management
- 🎯 Type-safe with TypeScript
- 📦 Tiny bundle size (<100KB gzipped)
- 🎨 Fully themeable and white-labelable
- 🔧 Easy to extend with custom nodes
- ♿ Accessible (WCAG 2.1 AA)
- 📱 Responsive design

## 🚀 Quick Start

[3-step installation + basic example]

## 📚 Documentation

[Link to docs site]

## 🎯 Who's Using KERDAR?

[Logos/links to companies using it]

## 🆚 Comparison

| Feature | KERDAR | n8n | Node-RED |
|---------|--------|-----|----------|
| ...     | ...    | ... | ...      |

## 🤝 Contributing

[Link to contributing guide]

## 📄 License

MIT
```

**Issue Templates**:
- Bug report
- Feature request
- Custom node request
- Documentation improvement

**PR Template**:
- Description
- Type of change (bug fix, feature, docs, etc.)
- Checklist (tests, docs, changelog)

**Contributing Guide**:
- Code of conduct
- Development setup
- Project structure
- Commit conventions
- PR process

### 15. Unique Selling Points

1. **Zero Backend Required**: Pure frontend, works standalone or with any backend
2. **Developer-First**: Amazing DX with TypeScript, docs, examples
3. **Production-Ready**: Built-in error handling, validation, testing
4. **Beautiful by Default**: No configuration needed for great UI
5. **Fully Extensible**: Custom nodes, dialogs, credentials, themes
6. **White Label Ready**: Rebrand completely for your product
7. **Tiny Bundle**: <100KB gzipped (vs n8n's full stack)
8. **Framework-Specific**: Optimized for React (not generic web components)

### 16. Success Metrics

- **GitHub stars**: 1K+ in 3 months, 5K+ in 1 year
- **NPM downloads**: 1K+/week after 6 months
- **Bundle size**: <100KB gzipped
- **Performance**: 60fps with 100+ nodes
- **Lighthouse score**: >90
- **Test coverage**: >80%
- **Documentation**: 100% API coverage

### 17. Release Strategy

**Phase 1: Alpha (Weeks 1-4)**
- Core workflow designer
- 5 basic nodes
- Basic execution engine
- Basic documentation

**Phase 2: Beta (Weeks 5-8)**
- 20+ nodes
- Credential system
- Dialog system
- Comprehensive docs
- Storybook

**Phase 3: RC (Weeks 9-10)**
- Performance optimization
- Accessibility audit
- Security audit
- Full test coverage
- Migration guide

**Phase 4: v1.0 (Week 11-12)**
- Public launch
- Blog post
- Video demo
- Reddit/HN post
- Discord community

### 18. Additional Features (Post v1.0)

- [ ] Workflow templates library
- [ ] Undo/redo with time travel
- [ ] Multi-user collaboration (operational transform)
- [ ] Workflow versioning
- [ ] A/B testing workflows
- [ ] Analytics dashboard
- [ ] Mobile support (view-only)
- [ ] CLI for workflow management
- [ ] VS Code extension
- [ ] AI-powered node suggestions
- [ ] Workflow marketplace

---

## 🎯 GENERATE THIS PROJECT NOW

Create a modern, production-ready, GitHub-popular React workflow designer that:

1. **Matches n8n's power** with functional nodes, inputs/outputs, credentials, and dialogs
2. **Exceeds n8n's UX** with modern, beautiful, smooth UI
3. **Provides better DX** with TypeScript, great docs, easy extension
4. **Is embeddable** in any React app with zero backend requirement
5. **Is white-labelable** for SaaS products
6. **Gets 1K+ GitHub stars** in first 3 months

Every detail matters:
- ✅ Smooth animations (60fps)
- ✅ Perfect TypeScript types
- ✅ Comprehensive documentation
- ✅ Beautiful default theme
- ✅ Accessible (keyboard + screen reader)
- ✅ Fast (<1s initial load)
- ✅ Small bundle (<100KB)
- ✅ Extensible architecture
- ✅ Production-ready error handling
- ✅ 80%+ test coverage

The end result should make developers say:
> "This is exactly what I needed! How do I contribute?"

And immediately:
1. ⭐ Star the repository
2. 📦 Install the package
3. 🚀 Build something amazing
4. 💬 Share with their team
