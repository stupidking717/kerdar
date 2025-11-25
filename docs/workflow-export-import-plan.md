# Workflow Export/Import Plan

## Overview

This document outlines the strategy for exporting and importing workflows between Kerdar and popular workflow automation engines, with a primary focus on n8n compatibility. The goal is to allow customers to:

1. Design workflows in Kerdar's visual designer
2. Export to n8n format for production deployment
3. Import existing n8n workflows into Kerdar for editing
4. Support bidirectional sync for continuous workflow management

---

## Supported Workflow Engines

### Phase 1: Primary Support
| Engine | Version | Priority | Status |
|--------|---------|----------|--------|
| **n8n** | 1.x | High | Planned |
| **n8n Cloud** | Latest | High | Planned |

### Phase 2: Extended Support
| Engine | Version | Priority | Status |
|--------|---------|----------|--------|
| Apache Airflow | 2.x | Medium | Future |
| Temporal | 1.x | Medium | Future |
| Prefect | 2.x | Low | Future |
| Node-RED | 3.x | Low | Future |

---

## n8n Workflow Format Analysis

### n8n Workflow JSON Structure

```json
{
  "name": "My Workflow",
  "nodes": [
    {
      "id": "uuid-string",
      "name": "Node Display Name",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [250, 300],
      "parameters": {
        "url": "https://api.example.com",
        "method": "GET",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth"
      },
      "credentials": {
        "httpHeaderAuth": {
          "id": "credential-id",
          "name": "My API Key"
        }
      }
    }
  ],
  "connections": {
    "source-node-name": {
      "main": [
        [
          {
            "node": "target-node-name",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "callerPolicy": "workflowsFromSameOwner"
  },
  "staticData": null,
  "tags": [],
  "triggerCount": 1,
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "versionId": "uuid-version"
}
```

### Key n8n Concepts

1. **Nodes**: Processing units with parameters
2. **Connections**: Data flow between nodes (main/auxiliary outputs)
3. **Credentials**: Stored authentication data (referenced by ID)
4. **Expressions**: Dynamic values using `={{ $json.field }}` syntax
5. **Pinned Data**: Test data attached to nodes
6. **Static Data**: Persistent state across executions

---

## Kerdar Workflow Format

### Kerdar Workflow JSON Structure

```typescript
interface KerdarWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: KerdarNode[];
  edges: KerdarEdge[];
  settings: WorkflowSettings;
  variables?: Record<string, unknown>;
  metadata?: WorkflowMetadata;
}

interface KerdarNode {
  id: string;
  type: string;  // Node type identifier
  position: { x: number; y: number };
  data: {
    label: string;
    parameters: Record<string, unknown>;
    credentials?: CredentialReference[];
  };
}

interface KerdarEdge {
  id: string;
  source: string;      // Source node ID
  target: string;      // Target node ID
  sourceHandle?: string;  // Output handle (main, error, etc.)
  targetHandle?: string;  // Input handle
}
```

---

## Mapping Specifications

### Node Type Mapping

| Kerdar Node | n8n Node | Notes |
|-------------|----------|-------|
| `manualTrigger` | `n8n-nodes-base.manualTrigger` | Direct mapping |
| `scheduleTrigger` | `n8n-nodes-base.scheduleTrigger` | Cron format compatible |
| `webhookTrigger` | `n8n-nodes-base.webhook` | Path/method mapping |
| `httpRequest` | `n8n-nodes-base.httpRequest` | Version 4.2 format |
| `code` | `n8n-nodes-base.code` | Language mapping needed |
| `if` | `n8n-nodes-base.if` | Condition format differs |
| `switch` | `n8n-nodes-base.switch` | Multiple outputs |
| `merge` | `n8n-nodes-base.merge` | Mode mapping |
| `set` / `setVariable` | `n8n-nodes-base.set` | Field mapping |
| `filter` | `n8n-nodes-base.filter` | Condition mapping |
| `sort` | `n8n-nodes-base.sort` | Field/order mapping |
| `limit` | `n8n-nodes-base.limit` | Direct mapping |
| `crypto` | `n8n-nodes-base.crypto` | Algorithm mapping |
| `dateTime` | `n8n-nodes-base.dateTime` | Format conversion |
| `executeCommand` | `n8n-nodes-base.executeCommand` | Direct mapping |
| `noOp` | `n8n-nodes-base.noOp` | Pass-through |
| `sendEmail` | `n8n-nodes-base.emailSend` | SMTP credentials |
| `slack` | `n8n-nodes-base.slack` | API version differences |

### Credential Type Mapping

| Kerdar Credential | n8n Credential | Notes |
|-------------------|----------------|-------|
| `httpBasicAuth` | `httpBasicAuth` | Direct mapping |
| `httpHeaderAuth` | `httpHeaderAuth` | Direct mapping |
| `apiKey` | `httpQueryAuth` / `httpHeaderAuth` | Based on `sendIn` |
| `bearerToken` | `httpHeaderAuth` | Value: `Bearer {token}` |
| `oauth2Api` | `oAuth2Api` | Full OAuth2 config |
| `smtp` | `smtp` | Direct mapping |
| `slackApi` | `slackApi` | Token format same |

### Parameter Mapping Examples

#### HTTP Request Node

**Kerdar Format:**
```typescript
{
  type: 'httpRequest',
  data: {
    parameters: {
      method: 'POST',
      url: 'https://api.example.com/data',
      authentication: 'httpHeaderAuth',
      sendBody: true,
      bodyContentType: 'json',
      bodyParameters: {
        name: '={{ $json.userName }}',
        email: '={{ $json.email }}'
      },
      sendHeaders: true,
      headerParameters: {
        'Content-Type': 'application/json'
      }
    }
  }
}
```

**n8n Format:**
```json
{
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "parameters": {
    "method": "POST",
    "url": "https://api.example.com/data",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify({ name: $json.userName, email: $json.email }) }}",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    }
  }
}
```

#### If Node (Conditional)

**Kerdar Format:**
```typescript
{
  type: 'if',
  data: {
    parameters: {
      conditions: {
        rules: [
          {
            field: '={{ $json.status }}',
            operation: 'equals',
            value: 'active'
          }
        ],
        combinator: 'and'
      }
    }
  }
}
```

**n8n Format:**
```json
{
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "uuid",
          "leftValue": "={{ $json.status }}",
          "rightValue": "active",
          "operator": {
            "type": "string",
            "operation": "equals"
          }
        }
      ],
      "combinator": "and"
    }
  }
}
```

### Expression Syntax Conversion

| Kerdar Expression | n8n Expression | Notes |
|-------------------|----------------|-------|
| `{{ $json.field }}` | `{{ $json.field }}` | Same syntax |
| `{{ $node.name.json.field }}` | `{{ $node["name"].json.field }}` | Bracket notation |
| `{{ $env.VAR }}` | `{{ $env.VAR }}` | Same syntax |
| `{{ $execution.id }}` | `{{ $execution.id }}` | Same syntax |
| `{{ $now }}` | `{{ $now }}` | Same syntax |
| `{{ $today }}` | `{{ $today }}` | Same syntax |
| `{{ $credentials.field }}` | `{{ $credentials.field }}` | Same syntax |

### Connection Mapping

**Kerdar Edges → n8n Connections:**

```typescript
// Kerdar Format
const edges = [
  {
    id: 'edge-1',
    source: 'node-a',
    target: 'node-b',
    sourceHandle: 'main',
    targetHandle: 'main'
  },
  {
    id: 'edge-2',
    source: 'if-node',
    target: 'true-branch',
    sourceHandle: 'true',  // Conditional output
    targetHandle: 'main'
  }
];

// Converted to n8n Format
const connections = {
  "Node A Name": {
    "main": [
      [
        { "node": "Node B Name", "type": "main", "index": 0 }
      ]
    ]
  },
  "If Node Name": {
    "main": [
      // True branch (index 0)
      [
        { "node": "True Branch Name", "type": "main", "index": 0 }
      ],
      // False branch (index 1)
      [
        { "node": "False Branch Name", "type": "main", "index": 0 }
      ]
    ]
  }
};
```

---

## Implementation Architecture

### Export Service

```typescript
// packages/core/src/services/export/n8n-exporter.ts

export interface ExportOptions {
  includeCredentials: boolean;
  credentialMapping?: Record<string, string>;  // Kerdar ID → n8n ID
  includeSettings: boolean;
  includeStaticData: boolean;
  targetVersion: string;  // n8n version target
}

export interface ExportResult {
  workflow: N8nWorkflow;
  warnings: ExportWarning[];
  unsupportedNodes: string[];
  credentialReferences: CredentialReference[];
}

export class N8nExporter {
  export(workflow: KerdarWorkflow, options: ExportOptions): ExportResult;
  exportNode(node: KerdarNode): N8nNode;
  exportConnections(edges: KerdarEdge[], nodes: KerdarNode[]): N8nConnections;
  convertExpression(expr: string): string;
  mapCredentials(creds: CredentialReference[]): N8nCredentialRef[];
}
```

### Import Service

```typescript
// packages/core/src/services/import/n8n-importer.ts

export interface ImportOptions {
  positionOffset?: { x: number; y: number };
  nodeIdPrefix?: string;
  mergeCredentials: boolean;
  validateNodes: boolean;
}

export interface ImportResult {
  workflow: KerdarWorkflow;
  warnings: ImportWarning[];
  unsupportedNodes: UnsupportedNode[];
  credentialsToCreate: CredentialDefinition[];
}

export class N8nImporter {
  import(n8nWorkflow: N8nWorkflow, options: ImportOptions): ImportResult;
  importNode(n8nNode: N8nNode): KerdarNode;
  importConnections(connections: N8nConnections): KerdarEdge[];
  convertExpression(expr: string): string;
  extractCredentials(n8nWorkflow: N8nWorkflow): CredentialDefinition[];
}
```

### Node Type Registry

```typescript
// packages/core/src/services/export/node-type-registry.ts

export interface NodeTypeMapping {
  kerdarType: string;
  n8nType: string;
  n8nVersion: number;
  parameterMapper: (params: Record<string, unknown>) => Record<string, unknown>;
  reverseMapper: (params: Record<string, unknown>) => Record<string, unknown>;
  supported: boolean;
}

export class NodeTypeRegistry {
  private mappings: Map<string, NodeTypeMapping>;

  register(mapping: NodeTypeMapping): void;
  getN8nType(kerdarType: string): NodeTypeMapping | undefined;
  getKerdarType(n8nType: string): NodeTypeMapping | undefined;
  isSupported(type: string, direction: 'export' | 'import'): boolean;
}
```

---

## API Design

### Export API

```typescript
// POST /api/workflows/:id/export
interface ExportRequest {
  format: 'n8n' | 'airflow' | 'temporal';
  options: ExportOptions;
}

interface ExportResponse {
  success: boolean;
  data: {
    workflow: object;  // Format-specific workflow
    downloadUrl?: string;
  };
  warnings: Warning[];
  errors: Error[];
}
```

### Import API

```typescript
// POST /api/workflows/import
interface ImportRequest {
  format: 'n8n' | 'airflow' | 'temporal' | 'auto';
  workflow: object;  // Format-specific workflow
  options: ImportOptions;
}

interface ImportResponse {
  success: boolean;
  data: {
    workflowId: string;
    workflow: KerdarWorkflow;
  };
  warnings: Warning[];
  credentialsRequired: CredentialRequirement[];
}
```

### Validation API

```typescript
// POST /api/workflows/validate-import
interface ValidateImportRequest {
  format: 'n8n' | 'auto';
  workflow: object;
}

interface ValidateImportResponse {
  valid: boolean;
  format: string;
  version: string;
  nodeCount: number;
  supportedNodes: number;
  unsupportedNodes: UnsupportedNode[];
  credentialsRequired: string[];
  warnings: Warning[];
}
```

---

## Credential Handling Strategy

### Export Credentials

1. **Reference Only (Default)**: Export credential references, not actual values
2. **Placeholder Values**: Export with placeholder values for manual replacement
3. **Encrypted Export**: Export encrypted credentials (requires shared key)

```typescript
interface CredentialExportStrategy {
  type: 'reference' | 'placeholder' | 'encrypted';

  // For 'reference' - just export the ID
  referenceFormat?: 'id' | 'name';

  // For 'placeholder' - export structure with placeholders
  placeholderPrefix?: string;  // Default: '{{CREDENTIAL_'

  // For 'encrypted' - requires encryption key
  encryptionKey?: string;
}
```

### Import Credentials

1. **Create New**: Create new credentials in Kerdar from imported data
2. **Map Existing**: Map to existing credentials by name/type
3. **Prompt User**: Require user to manually map credentials

```typescript
interface CredentialImportStrategy {
  type: 'create' | 'map' | 'prompt';

  // For 'map' - mapping of n8n credential names to Kerdar IDs
  credentialMap?: Record<string, string>;

  // For 'create' - whether to import credential values
  importValues?: boolean;
}
```

---

## Error Handling

### Export Errors

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `UNSUPPORTED_NODE` | Node type not supported in target format | Manual conversion needed |
| `INVALID_EXPRESSION` | Expression syntax cannot be converted | Review and fix expression |
| `MISSING_CREDENTIAL` | Referenced credential not found | Create credential first |
| `CIRCULAR_DEPENDENCY` | Workflow has circular connections | Remove circular reference |

### Import Errors

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `INVALID_FORMAT` | Workflow JSON is not valid | Check JSON structure |
| `UNSUPPORTED_VERSION` | n8n version not supported | Update n8n workflow |
| `UNKNOWN_NODE_TYPE` | Node type not recognized | Register custom node |
| `MISSING_REQUIRED_FIELD` | Required field missing in node | Add missing field |

---

## Testing Strategy

### Unit Tests

```typescript
describe('N8nExporter', () => {
  describe('exportNode', () => {
    it('should convert httpRequest node correctly');
    it('should handle conditional nodes with multiple outputs');
    it('should preserve expression syntax');
    it('should map credentials correctly');
  });

  describe('exportConnections', () => {
    it('should convert edges to n8n connections format');
    it('should handle multiple outputs from conditional nodes');
    it('should use node names instead of IDs');
  });
});

describe('N8nImporter', () => {
  describe('importNode', () => {
    it('should convert n8n node to Kerdar format');
    it('should extract credential references');
    it('should handle unknown node types gracefully');
  });

  describe('importConnections', () => {
    it('should convert n8n connections to Kerdar edges');
    it('should handle multiple input connections');
  });
});
```

### Integration Tests

```typescript
describe('Round-trip conversion', () => {
  it('should export and re-import workflow without data loss');
  it('should preserve node positions');
  it('should maintain connection integrity');
  it('should handle complex workflows with branches');
});
```

### E2E Tests

```typescript
describe('n8n Compatibility', () => {
  it('should import actual n8n workflow export');
  it('should export workflow that can be imported into n8n');
  it('should execute imported workflow correctly');
});
```

---

## Implementation Phases

### Phase 1: Core Export (Week 1-2)
- [ ] Implement `N8nExporter` class
- [ ] Create node type mapping for 15 core nodes
- [ ] Implement connection conversion
- [ ] Add expression syntax conversion
- [ ] Create export API endpoint

### Phase 2: Core Import (Week 2-3)
- [ ] Implement `N8nImporter` class
- [ ] Create reverse node type mapping
- [ ] Implement credential extraction
- [ ] Add import API endpoint
- [ ] Create import validation

### Phase 3: Credential Handling (Week 3-4)
- [ ] Implement credential export strategies
- [ ] Implement credential import strategies
- [ ] Add credential mapping UI
- [ ] Create credential validation

### Phase 4: Advanced Features (Week 4-5)
- [ ] Support for sub-workflows
- [ ] Support for pinned data
- [ ] Support for workflow settings
- [ ] Add batch import/export

### Phase 5: Testing & Polish (Week 5-6)
- [ ] Comprehensive unit tests
- [ ] Integration tests with real n8n workflows
- [ ] Documentation and examples
- [ ] Error handling improvements

---

## UI Integration

### Export Dialog

```tsx
interface ExportDialogProps {
  workflowId: string;
  onExport: (result: ExportResult) => void;
}

// Features:
// - Format selection (n8n, JSON)
// - Credential handling options
// - Preview exported workflow
// - Download or copy to clipboard
// - Warning display for unsupported nodes
```

### Import Dialog

```tsx
interface ImportDialogProps {
  onImport: (result: ImportResult) => void;
}

// Features:
// - File upload or paste JSON
// - Auto-detect format
// - Validation preview
// - Credential mapping UI
// - Warning display
// - Position adjustment options
```

---

## File Formats

### Export Filename Convention

```
{workflow-name}_{timestamp}_{format}.json
Example: my-workflow_2024-01-15_n8n.json
```

### Import Supported Formats

| Extension | Format | Auto-detect |
|-----------|--------|-------------|
| `.json` | n8n workflow export | Yes |
| `.n8n` | n8n workflow file | Yes |
| `.kerdar` | Kerdar native format | Yes |

---

## Security Considerations

1. **Credential Scrubbing**: Never include actual credential values in exports by default
2. **Input Validation**: Validate all imported JSON for malicious content
3. **Size Limits**: Limit import file size to prevent DoS
4. **Sanitization**: Sanitize node names and labels to prevent XSS
5. **Audit Logging**: Log all import/export operations

---

## Future Enhancements

1. **Live Sync**: Real-time sync with n8n instance via API
2. **Diff View**: Visual comparison between Kerdar and n8n versions
3. **Selective Export**: Export only selected nodes
4. **Template Library**: Import from n8n community templates
5. **Version Control**: Track changes between exports

---

## Appendix A: n8n Node Type Reference

### Trigger Nodes
- `n8n-nodes-base.manualTrigger`
- `n8n-nodes-base.scheduleTrigger`
- `n8n-nodes-base.webhook`
- `n8n-nodes-base.emailReadImap`

### Action Nodes
- `n8n-nodes-base.httpRequest`
- `n8n-nodes-base.code`
- `n8n-nodes-base.set`
- `n8n-nodes-base.if`
- `n8n-nodes-base.switch`
- `n8n-nodes-base.merge`
- `n8n-nodes-base.splitInBatches`
- `n8n-nodes-base.filter`
- `n8n-nodes-base.sort`
- `n8n-nodes-base.limit`
- `n8n-nodes-base.removeDuplicates`
- `n8n-nodes-base.crypto`
- `n8n-nodes-base.dateTime`
- `n8n-nodes-base.executeCommand`
- `n8n-nodes-base.function` (deprecated, use code)

### Integration Nodes
- `n8n-nodes-base.slack`
- `n8n-nodes-base.emailSend`
- `n8n-nodes-base.postgres`
- `n8n-nodes-base.mysql`
- `n8n-nodes-base.mongodb`
- `n8n-nodes-base.redis`
- `n8n-nodes-base.rabbitmq`

---

## Appendix B: Sample Workflows

### Simple HTTP Workflow

**Kerdar:**
```json
{
  "id": "wf-001",
  "name": "Fetch User Data",
  "nodes": [
    {
      "id": "trigger-1",
      "type": "manualTrigger",
      "position": { "x": 100, "y": 200 },
      "data": { "label": "Manual Trigger" }
    },
    {
      "id": "http-1",
      "type": "httpRequest",
      "position": { "x": 350, "y": 200 },
      "data": {
        "label": "Get Users",
        "parameters": {
          "method": "GET",
          "url": "https://api.example.com/users"
        }
      }
    }
  ],
  "edges": [
    {
      "id": "e-1",
      "source": "trigger-1",
      "target": "http-1"
    }
  ]
}
```

**n8n Equivalent:**
```json
{
  "name": "Fetch User Data",
  "nodes": [
    {
      "id": "uuid-1",
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [100, 200],
      "parameters": {}
    },
    {
      "id": "uuid-2",
      "name": "Get Users",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [350, 200],
      "parameters": {
        "method": "GET",
        "url": "https://api.example.com/users"
      }
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [
        [{ "node": "Get Users", "type": "main", "index": 0 }]
      ]
    }
  }
}
```
