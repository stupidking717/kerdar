import type { NodeTypeDefinition, CredentialTypeDefinition } from '@kerdar/core';

// Re-export credential types
export {
  standardCredentialTypes,
  registerStandardCredentialTypes,
  getCredentialType,
  SmtpCredential,
  SlackApiCredential,
  HttpBasicAuthCredential,
  HttpHeaderAuthCredential,
  ApiKeyCredential,
  BearerTokenCredential,
  OAuth2Credential,
  RedisCredential,
  RabbitMQCredential,
  MinIOCredential,
} from './credentials';

// Import trigger nodes
import { ManualTriggerNode } from './nodes/triggers/ManualTrigger';
import { ScheduleTriggerNode } from './nodes/triggers/ScheduleTrigger';
import { WebhookTriggerNode } from './nodes/triggers/WebhookTrigger';

// Import action nodes
import { HttpRequestNode } from './nodes/actions/HttpRequest';
import { CodeNode } from './nodes/actions/Code';
import { ExecuteCommandNode } from './nodes/actions/ExecuteCommand';
import { SendEmailNode } from './nodes/actions/SendEmail';
import { SlackNode } from './nodes/actions/Slack';

// Import logic nodes
import { IfNode } from './nodes/logic/If';
import { MergeNode } from './nodes/logic/Merge';
import { SwitchNode } from './nodes/logic/Switch';
import { SplitInBatchesNode } from './nodes/logic/SplitInBatches';
import { LoopNode } from './nodes/logic/Loop';
import { LockNode } from './nodes/logic/Lock';
import { ParallelNode } from './nodes/logic/Parallel';
import { SequenceNode } from './nodes/logic/Sequence';
import { ErrorHandlerNode } from './nodes/logic/ErrorHandler';
import { DebounceNode } from './nodes/logic/Debounce';

// Import data nodes
import { SetVariableNode } from './nodes/data/SetVariable';
import { FilterNode } from './nodes/data/Filter';
import { SortNode } from './nodes/data/Sort';
import { LimitNode } from './nodes/data/Limit';
import { ItemListsNode } from './nodes/data/ItemLists';
import { TransformNode } from './nodes/data/Transform';
import { NoOpNode } from './nodes/data/NoOp';
import { WaitNode } from './nodes/data/Wait';
import { DateTimeNode } from './nodes/data/DateTime';
import { CryptoNode } from './nodes/data/Crypto';

// Import integration nodes
import { RedisNode, RedisTriggerNode } from './nodes/integrations/Redis';
import { RabbitMQNode, RabbitMQTriggerNode } from './nodes/integrations/RabbitMQ';
import { MinIONode, MinIOTriggerNode } from './nodes/integrations/MinIO';

/**
 * All standard trigger nodes
 */
export const triggerNodes: NodeTypeDefinition[] = [
  ManualTriggerNode,
  ScheduleTriggerNode,
  WebhookTriggerNode,
  RedisTriggerNode,
  RabbitMQTriggerNode,
  MinIOTriggerNode,
];

/**
 * All standard action nodes
 */
export const actionNodes: NodeTypeDefinition[] = [
  HttpRequestNode,
  CodeNode,
  ExecuteCommandNode,
  SendEmailNode,
  SlackNode,
];

/**
 * All standard logic nodes
 */
export const logicNodes: NodeTypeDefinition[] = [
  IfNode,
  MergeNode,
  SwitchNode,
  SplitInBatchesNode,
  LoopNode,
  LockNode,
  ParallelNode,
  SequenceNode,
  ErrorHandlerNode,
  DebounceNode,
];

/**
 * All standard data nodes
 */
export const dataNodes: NodeTypeDefinition[] = [
  SetVariableNode,
  FilterNode,
  SortNode,
  LimitNode,
  ItemListsNode,
  TransformNode,
  NoOpNode,
  WaitNode,
  DateTimeNode,
  CryptoNode,
];

/**
 * All standard integration nodes
 */
export const integrationNodes: NodeTypeDefinition[] = [
  RedisNode,
  RabbitMQNode,
  MinIONode,
];

/**
 * All standard nodes combined
 */
export const standardNodes: NodeTypeDefinition[] = [
  ...triggerNodes,
  ...actionNodes,
  ...logicNodes,
  ...dataNodes,
  ...integrationNodes,
];

/**
 * Standard credential types
 */
export const standardCredentials: CredentialTypeDefinition[] = [];

// Re-export individual nodes for selective imports
export {
  // Triggers
  ManualTriggerNode,
  ScheduleTriggerNode,
  WebhookTriggerNode,
  // Actions
  HttpRequestNode,
  CodeNode,
  ExecuteCommandNode,
  SendEmailNode,
  SlackNode,
  // Logic
  IfNode,
  MergeNode,
  SwitchNode,
  SplitInBatchesNode,
  LoopNode,
  LockNode,
  ParallelNode,
  SequenceNode,
  ErrorHandlerNode,
  DebounceNode,
  // Data
  SetVariableNode,
  FilterNode,
  SortNode,
  LimitNode,
  ItemListsNode,
  TransformNode,
  NoOpNode,
  WaitNode,
  DateTimeNode,
  CryptoNode,
  // Integrations
  RedisNode,
  RedisTriggerNode,
  RabbitMQNode,
  RabbitMQTriggerNode,
  MinIONode,
  MinIOTriggerNode,
};

/**
 * Register all standard nodes with a node registry
 */
export function registerStandardNodes(
  registerFn: (node: NodeTypeDefinition) => void
): void {
  standardNodes.forEach(registerFn);
}

/**
 * Register all standard credentials with a credential registry
 */
export function registerStandardCredentials(
  registerFn: (credential: CredentialTypeDefinition) => void
): void {
  standardCredentials.forEach(registerFn);
}

/**
 * Get a node by name
 */
export function getStandardNode(name: string): NodeTypeDefinition | undefined {
  return standardNodes.find((node) => node.name === name);
}

/**
 * Get nodes by category
 */
export function getStandardNodesByCategory(
  category: string
): NodeTypeDefinition[] {
  return standardNodes.filter((node) => node.category === category);
}

export default standardNodes;
