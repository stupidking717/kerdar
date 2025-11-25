# KERDAR Implementation Progress

## Recently Completed: Input/Output Schema System

### Phase 1: Schema Type System ✅
- Created `/packages/core/src/types/schema.ts` with comprehensive types
- `SchemaProperty`, `DataSchema`, `SchemaContext`, `SchemaSuggestion` types
- Builder helpers: `stringProperty()`, `numberProperty()`, `objectProperty()`, etc.
- Dynamic schema functions (`DynamicSchemaFn`) for runtime schema computation
- Added `inputSchema` and `outputSchema` to `NodeTypeDefinition`

### Phase 2: Schema-Aware Expression Editor ✅
- Added `nodeId` prop to `ExpressionEditor` for schema context
- Integrated `useSchemaSuggestions` hook for autocomplete
- Monaco completion provider shows schema-based suggestions first
- Visual indicator when schema context is available (blue highlight)
- Updated `ParameterInput` and `NodeDetailsView` to pass nodeId

### Phase 3: Schema Context Tracking ✅
- Created `/packages/core/src/store/schema-context-store.ts`
- BFS graph traversal to collect upstream node schemas
- Caches schema contexts with auto-invalidation on workflow changes
- React hooks: `useSchemaContext`, `useSchemaSuggestions`, `useMockData`
- Non-hook functions: `getSchemaContext`, `getSchemaSuggestions`, `getMockDataForNode`

### Phase 4: Workflow Simulation Engine ✅
- Created `/packages/core/src/engine/simulator.ts`
- `WorkflowSimulator` class for mock data simulation
- `simulateWorkflow()` function for easy simulation
- `getNodeMockDataPreview()` for single node preview
- `previewSimulationDataFlow()` for visualization
- Configurable delays for visualization
- Custom mock data overrides and error simulation

---

## Current Sprint: UI/UX Improvements & Node Enhancements

### Task 1: Documentation Update
**Status:** ✅ Complete
- [x] Update README.md with schema system features
- [x] Update workflow.md with implementation status
- [x] Create git commit with all changes

### Task 2: Node Authentication Review
**Status:** ✅ Complete

**Audit Results:**

| Node | Credential Type | Status |
|------|----------------|--------|
| HTTP Request | httpBasicAuth, httpHeaderAuth | ✅ Has auth with displayOptions |
| Send Email | smtp | ✅ Properly configured |
| Slack | slackApi | ✅ Properly configured |
| Redis | redis | ✅ Properly configured |
| RabbitMQ | rabbitmq | ✅ Properly configured |
| MinIO | minio | ✅ Both node and trigger |
| MinIO Trigger | minio | ✅ Properly configured |

**Available Credential Types (10):**
1. HttpBasicAuthCredential
2. HttpHeaderAuthCredential
3. ApiKeyCredential
4. SmtpCredential
5. SlackApiCredential
6. BearerTokenCredential
7. OAuth2Credential
8. RedisCredential
9. RabbitMQCredential
10. MinIOCredential

**Nodes Requiring Authentication:**
- **HTTP Request**: Basic Auth, Header Auth, Bearer Token + custom headers/values with expression support
- **Send Email**: SMTP credentials for mail server
- **Slack**: Slack API token for API calls
- **Redis**: Connection credentials (host, port, password)
- **RabbitMQ**: Connection credentials (host, port, user, password)
- **MinIO**: Access key credentials (endpoint, accessKey, secretKey)

**Nodes NOT Requiring Authentication:**
- All Logic nodes (If, Switch, Merge, Loop, etc.) - pure data transformation
- All Data nodes (Filter, Sort, Transform, etc.) - pure data manipulation
- Manual Trigger, Schedule Trigger - no external connections
- Webhook Trigger - auth handled server-side

**HTTP Request Node Authentication Options:**
1. **None** - No authentication
2. **Basic Auth** - Username/password fields with Base64 encoding
3. **API Key** - Configurable key name, value, and location (header/query)
4. **Header Auth** - Custom header with credential
5. **Bearer Token** - OAuth-style bearer token in Authorization header

### Task 3: Credential Selector UI
**Status:** ✅ Complete
- [x] Created `CredentialSelect` component with n8n-style dropdown
- [x] Shows available credentials grouped by type
- [x] Visual indicator for required credentials
- [x] "Create new credential" button integration
- [x] Integrated into `NodeDetailsView` Parameters tab
- [x] Credentials section shows above parameters when node has credentials defined
- [x] Filters visible credentials based on `displayOptions` (conditional visibility)

**New Files:**
- `packages/core/src/components/NDV/CredentialSelect.tsx`

**Modified Files:**
- `packages/core/src/components/NDV/NodeDetailsView.tsx`
- `packages/core/src/components/NDV/index.ts`

### Task 4: Inline Node Name Editing
**Status:** ✅ Complete
- [x] Added `onNameChange` callback to `BaseNodeData` interface
- [x] Click on node name to edit inline
- [x] Shows pencil icon on hover
- [x] Enter to save, Escape to cancel
- [x] Click outside to save (blur)
- [x] Wired up in `WorkflowDesigner` to update workflow store

**Modified Files:**
- `packages/core/src/components/Nodes/BaseNode.tsx`
- `packages/core/src/components/WorkflowDesigner/WorkflowDesigner.tsx`

### Task 5: Example Workflow with Schema Demonstration
**Status:** 🔄 Pending
- [ ] Design a chat/messaging workflow example
- [ ] Include nodes that demonstrate schema binding
- [ ] Show data transformation with type safety
- [ ] Create mock data that flows through the workflow
- [ ] Test expression editor autocomplete with schema

**Proposed workflow:**
```
[Webhook Trigger] → [Transform Data] → [If Condition] → [HTTP Request] → [Set Variable]
                                    ↘ [Send Email]
```

### Task 5: FixedCollection and Collection Property Type Support
**Status:** ✅ Complete
- [x] Added FixedCollectionInput component for key-value pairs
- [x] Added CollectionInput component for collapsible options
- [x] Support add/remove items in FixedCollection
- [x] Grid layout for FixedCollection fields
- [x] Expandable/collapsible Collection with item count badge
- [x] Boolean, Number, Options, String support in nested fields

**Modified Files:**
- `packages/core/src/components/NDV/ParameterInput.tsx`

### Task 6: Documentation Update
**Status:** ✅ Complete
- [x] Updated README.md with new features (Schema, Credentials, Property Types)
- [x] Updated workflow.md with implementation status
- [x] Added Property Types section with examples
- [x] Added Credential System documentation
- [x] Added HTTP Request authentication options

### Task 7: n8n-Style Condition Builder
**Status:** 🔄 Pending
**Priority:** High

The condition builder must match n8n exactly:
- [ ] Research n8n's condition builder UI/UX
- [ ] Create `ConditionBuilder` component
- [ ] Support multiple conditions with AND/OR logic
- [ ] Implement comparison operations:
  - equals, not equals
  - contains, not contains
  - starts with, ends with
  - is empty, is not empty
  - greater than, less than, gte, lte
  - regex match
- [ ] Support expression values on both sides
- [ ] Add condition groups (nested AND/OR)
- [ ] Visual "Add Condition" and "Add Group" buttons
- [ ] Integrate with IF and Switch nodes

### Task 8: JSON Editor Expression Drop Fix
**Status:** 🔄 Pending
- [ ] Investigate current JSON editor implementation
- [ ] Add cursor position tracking on drop
- [ ] Insert expression at exact cursor position
- [ ] Support drag-drop from schema suggestions
- [ ] Test with nested JSON paths

### Task 9: Flow Control Nodes Implementation
**Status:** 🔄 Pending

**Lock Node:**
- [ ] Implement mutex/semaphore pattern
- [ ] Add lock name parameter
- [ ] Add timeout parameter
- [ ] Handle lock acquisition and release
- [ ] Support try-lock with fallback

**Parallel Node:**
- [ ] Execute multiple branches concurrently
- [ ] Collect results from all branches
- [ ] Support max concurrency limit
- [ ] Handle partial failures
- [ ] Aggregate outputs

**Sequence Node:**
- [ ] Execute branches in strict order
- [ ] Pass data between sequence steps
- [ ] Support break/continue logic
- [ ] Handle step failures

### Task 10: Add Workflow Node with Async Callback
**Status:** 🔄 Pending
- [ ] Create "Execute Workflow" node type
- [ ] Define async callback interface for workflow fetching
- [ ] Add workflow selector with async loading
- [ ] Support workflow parameters passing
- [ ] Handle sub-workflow execution
- [ ] Return sub-workflow output data

**Interface design:**
```typescript
interface WorkflowLoaderCallback {
  // List available workflows
  listWorkflows: () => Promise<{ id: string; name: string }[]>;
  // Get workflow by ID
  getWorkflow: (id: string) => Promise<Workflow>;
  // Optional: search workflows
  searchWorkflows?: (query: string) => Promise<{ id: string; name: string }[]>;
}
```

### Task 11: Internationalization (i18n)
**Status:** 🔄 Pending
- [ ] Choose i18n library (react-i18next recommended)
- [ ] Create translation infrastructure
- [ ] Extract all user-facing strings
- [ ] Add language switcher component
- [ ] Support RTL languages
- [ ] Create translation files for EN, FA, etc.

---

## File Changes Summary

### New Files Created:
- `packages/core/src/types/schema.ts`
- `packages/core/src/store/schema-context-store.ts`
- `packages/core/src/engine/simulator.ts`
- `packages/core/src/components/NDV/CredentialSelect.tsx`

### Modified Files:
- `packages/core/src/types/node.ts` (added inputSchema/outputSchema)
- `packages/core/src/types/index.ts` (exports)
- `packages/core/src/store/index.ts` (exports)
- `packages/core/src/engine/index.ts` (simulator exports)
- `packages/core/src/index.ts` (public API exports)
- `packages/core/src/components/NDV/ExpressionEditor.tsx` (schema autocomplete)
- `packages/core/src/components/NDV/ParameterInput.tsx` (FixedCollection, Collection support)
- `packages/core/src/components/NDV/NodeDetailsView.tsx` (credential selector integration)
- `packages/core/src/components/NDV/index.ts` (CredentialSelect export)
- `packages/core/src/components/Nodes/BaseNode.tsx` (inline name editing)
- `packages/core/src/components/WorkflowDesigner/WorkflowDesigner.tsx` (onNameChange handler)
- `packages/nodes-standard/src/nodes/triggers/WebhookTrigger.ts` (example schema)
- `packages/nodes-standard/src/nodes/actions/HttpRequest.ts` (Basic Auth, API Key auth)

---

## Notes

### Schema System Architecture
The schema system follows a three-layer approach:
1. **Definition Layer**: Schemas are defined on nodes (`outputSchema` property)
2. **Context Layer**: Schema context store tracks upstream schemas via graph traversal
3. **Presentation Layer**: Expression editor consumes suggestions for autocomplete

### Simulation vs Execution
- **Execution**: Runs actual node logic, makes real API calls
- **Simulation**: Uses mock data from schemas, no real side effects
- Both share the same workflow traversal logic

### Expression Variables
The expression system supports:
- `$json` - Current item's JSON data
- `$input` - Input from connected nodes
- `$node["NodeName"]` - Access specific upstream node data
- `$executionId`, `$itemIndex`, `$now`, `$today` - Built-in variables
