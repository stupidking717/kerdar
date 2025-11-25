import type { EdgeType, ExecutionOrderVersion, DataSaveMode } from './enums';
import type { WorkflowNode } from './node';

/**
 * Workflow edge - connection between nodes
 */
export interface WorkflowEdge {
  /** Unique ID for this edge */
  id: string;

  /** Source node ID */
  source: string;

  /** Target node ID */
  target: string;

  /** Source handle/port ID (e.g., "output-0", "output-1") */
  sourceHandle?: string;

  /** Target handle/port ID (e.g., "input-0") */
  targetHandle?: string;

  /** Edge visual type */
  type?: EdgeType;

  /** Edge data */
  data?: WorkflowEdgeData;

  /** Whether edge is animated */
  animated?: boolean;

  /** Edge style */
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
}

/**
 * Edge data
 */
export interface WorkflowEdgeData {
  /** Label shown on edge */
  label?: string;

  /** Condition for this edge (for conditional routing) */
  condition?: string;

  /** Source output index */
  sourceOutputIndex?: number;

  /** Target input index */
  targetInputIndex?: number;
}

/**
 * Complete workflow definition
 */
export interface Workflow {
  /** Unique workflow ID */
  id: string;

  /** Workflow name */
  name: string;

  /** Workflow description */
  description?: string;

  /** Workflow version */
  version: string;

  /** Whether workflow is active (for trigger nodes) */
  active?: boolean;

  /** Array of nodes in the workflow */
  nodes: WorkflowNode[];

  /** Array of edges connecting nodes */
  edges: WorkflowEdge[];

  /** Workflow settings */
  settings?: WorkflowSettings;

  /** Static data persisted across executions */
  staticData?: Record<string, unknown>;

  /** Tags for organization */
  tags?: WorkflowTag[];

  /** Workflow metadata */
  metadata?: WorkflowMetadata;

  /** Pinned data for testing */
  pinData?: Record<string, unknown[]>;
}

/**
 * Workflow settings
 */
export interface WorkflowSettings {
  /** Execution order version */
  executionOrder?: ExecutionOrderVersion;

  /** Save manual executions */
  saveManualExecutions?: boolean;

  /** Save execution progress */
  saveExecutionProgress?: boolean;

  /** Save data on success */
  saveDataSuccessExecution?: DataSaveMode;

  /** Save data on error */
  saveDataErrorExecution?: DataSaveMode;

  /** Timezone for schedule triggers */
  timezone?: string;

  /** Error workflow ID to run on error */
  errorWorkflow?: string;

  /** Max timeout per execution (ms) */
  executionTimeout?: number;

  /** Max timeout per single node (ms) */
  maxNodeExecutionTime?: number;

  /** Caller policy */
  callerPolicy?: 'any' | 'none' | 'workflowsFromAList' | 'workflowsFromSameOwner';

  /** Allowed caller IDs */
  callerIds?: string;
}

/**
 * Workflow tag
 */
export interface WorkflowTag {
  id: string;
  name: string;
  color?: string;
}

/**
 * Workflow metadata
 */
export interface WorkflowMetadata {
  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;

  /** Author/owner ID */
  author?: string;

  /** Instance ID */
  instanceId?: string;

  /** Template ID if created from template */
  templateId?: string;

  /** Template version */
  templateVersion?: string;
}

/**
 * Workflow execution status
 */
export interface WorkflowExecutionStatus {
  /** Workflow ID */
  workflowId: string;

  /** Execution ID */
  executionId: string;

  /** Overall status */
  status: 'running' | 'success' | 'error' | 'waiting' | 'canceled';

  /** Start time */
  startedAt: string;

  /** End time */
  finishedAt?: string;

  /** Mode of execution */
  mode: 'manual' | 'trigger' | 'integrated';

  /** Node-specific execution data */
  nodeExecutionStatus: Record<string, NodeExecutionStatusData>;

  /** Error if failed */
  error?: {
    message: string;
    node?: string;
    timestamp: string;
  };
}

/**
 * Node execution status data
 */
export interface NodeExecutionStatusData {
  /** Node ID */
  nodeId: string;

  /** Execution status */
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';

  /** Start time */
  startedAt?: string;

  /** End time */
  finishedAt?: string;

  /** Execution time in ms */
  executionTime?: number;

  /** Number of items processed */
  itemsProcessed?: number;

  /** Output data preview */
  outputDataPreview?: Record<string, unknown>[];

  /** Error details */
  error?: {
    message: string;
    description?: string;
    stack?: string;
  };

  /** Retry attempt number */
  retryAttempt?: number;
}

/**
 * Workflow execution data - complete execution result
 */
export interface WorkflowExecutionData {
  /** Execution ID */
  id: string;

  /** Workflow ID */
  workflowId: string;

  /** Workflow data at time of execution */
  workflowData: Workflow;

  /** Start time */
  startedAt: string;

  /** Finish time */
  finishedAt?: string;

  /** Execution status */
  status: 'running' | 'success' | 'error' | 'waiting' | 'canceled';

  /** Execution mode */
  mode: 'manual' | 'trigger' | 'integrated' | 'test';

  /** Result data per node */
  data: {
    resultData: {
      runData: Record<string, NodeExecutionRunData[]>;
      lastNodeExecuted?: string;
      error?: ExecutionError;
    };
    executionData?: {
      contextData: Record<string, unknown>;
      nodeExecutionStack: Array<{
        node: WorkflowNode;
        data: Record<string, unknown>;
        source: Array<{
          previousNode: string;
          previousNodeOutput?: number;
        }> | null;
      }>;
      waitingExecution: Record<string, Record<string, unknown>>;
      waitingExecutionSource: Record<string, Record<string, unknown>>;
    };
  };

  /** Static data at time of execution */
  staticData?: Record<string, unknown>;

  /** Retry of execution ID */
  retryOf?: string;

  /** Retry success execution ID */
  retrySuccessId?: string;
}

/**
 * Node execution run data
 */
export interface NodeExecutionRunData {
  /** Start time */
  startTime: number;

  /** Execution time in ms */
  executionTime: number;

  /** Execution status */
  executionStatus?: 'success' | 'error' | 'canceled';

  /** Source data */
  source: Array<{
    previousNode: string;
    previousNodeOutput?: number;
    previousNodeRun?: number;
  }> | null;

  /** Output data */
  data: {
    main: Array<Array<{
      json: Record<string, unknown>;
      binary?: Record<string, {
        data: string;
        mimeType: string;
        fileName?: string;
      }>;
      pairedItem?: {
        item: number;
        input?: number;
      };
    }> | null>;
  };

  /** Error */
  error?: ExecutionError;
}

/**
 * Execution error
 */
export interface ExecutionError {
  /** Error message */
  message: string;

  /** Error description */
  description?: string;

  /** Stack trace */
  stack?: string;

  /** Node that caused the error */
  node?: {
    name: string;
    type: string;
    position?: { x: number; y: number };
  };

  /** HTTP code if applicable */
  httpCode?: number;

  /** Timestamp */
  timestamp?: string;

  /** Execution ID */
  executionId?: string;

  /** Cause */
  cause?: unknown;
}

/**
 * Workflow template
 */
export interface WorkflowTemplate {
  /** Template ID */
  id: string;

  /** Template name */
  name: string;

  /** Description */
  description: string;

  /** Category */
  category: string;

  /** Preview image */
  image?: string;

  /** Workflow data */
  workflow: Workflow;

  /** Required credentials types */
  requiredCredentials?: string[];

  /** Creator info */
  creator?: {
    name: string;
    avatar?: string;
  };

  /** Usage count */
  usageCount?: number;

  /** Star rating */
  rating?: number;
}

/**
 * Sticky note element (for annotations)
 */
export interface StickyNote {
  /** Unique ID */
  id: string;

  /** Position */
  position: { x: number; y: number };

  /** Size */
  size: { width: number; height: number };

  /** Content */
  content: string;

  /** Background color */
  color?: string;

  /** Z-index for layering */
  zIndex?: number;
}

/**
 * Workflow canvas viewport
 */
export interface WorkflowViewport {
  x: number;
  y: number;
  zoom: number;
}
