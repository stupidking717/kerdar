import type {
  Workflow,
  WorkflowNode,
  NodeExecutionContext,
  INodeExecutionData,
  WorkflowExecutionData,
  ExecutionOptions,
  ExecutionLogEntry,
  RequestOptions,
  Logger,
} from '../types';
import { ExecutionMode } from '../types';
import { useNodeRegistryStore } from '../store/node-registry-store';
import { useExecutionStore } from '../store/execution-store';
import { executionId as generateExecutionId } from '../utils/nanoid';
import { resolveExpressions, type ExpressionContext } from '../utils/expression';

/**
 * Execution options with defaults
 */
interface ExecutorOptions {
  /** Timeout per node (ms) */
  nodeTimeout?: number;

  /** Max concurrent nodes */
  maxConcurrency?: number;

  /** Whether to stop on first error */
  stopOnError?: boolean;

  /** Callback for execution progress */
  onProgress?: (nodeId: string, status: string, data?: unknown) => void;

  /** Callback for log entries */
  onLog?: (entry: ExecutionLogEntry) => void;
}

/**
 * Node execution state
 */
interface NodeExecutionState {
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  inputData: INodeExecutionData[];
  outputData: INodeExecutionData[][] | null;
  error: Error | null;
  startTime: number | null;
  endTime: number | null;
}

/**
 * Create a logger for node execution
 */
function createLogger(nodeId: string, nodeName: string, onLog?: (entry: ExecutionLogEntry) => void): Logger {
  const log = (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown) => {
    const entry: ExecutionLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      nodeId,
      nodeName,
      message,
      data,
    };
    onLog?.(entry);
  };

  return {
    debug: (message, data) => log('debug', message, data),
    info: (message, data) => log('info', message, data),
    warn: (message, data) => log('warn', message, data),
    error: (message, data) => log('error', message, data),
  };
}

/**
 * Simple HTTP request helper
 */
async function makeRequest(options: RequestOptions): Promise<unknown> {
  const {
    method = 'GET',
    url,
    headers = {},
    body,
    qs,
    json = true,
    timeout = 30000,
  } = options;

  if (!url) {
    throw new Error('URL is required');
  }

  // Build URL with query string
  const urlObj = new URL(url);
  if (qs) {
    Object.entries(qs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.set(key, String(value));
      }
    });
  }

  // Build fetch options
  const fetchOptions: RequestInit = {
    method,
    headers: {
      ...headers,
      ...(json && body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? (json ? JSON.stringify(body) : String(body)) : undefined,
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  fetchOptions.signal = controller.signal;

  try {
    const response = await fetch(urlObj.toString(), fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Create execution context for a node
 */
function createExecutionContext(
  node: WorkflowNode,
  workflow: Workflow,
  inputData: INodeExecutionData[],
  executionId: string,
  mode: ExecutionMode,
  staticData: Record<string, unknown>,
  _nodesData: Record<string, INodeExecutionData[][]>,
  logger: Logger
): NodeExecutionContext {
  let currentItemIndex = 0;

  return {
    getInputData: (_inputIndex = 0) => {
      // For now, return all input data (single input)
      return inputData;
    },

    getNodeParameter: <T = unknown>(parameterName: string, fallback?: T): T => {
      const value = node.parameters[parameterName];
      if (value === undefined) {
        if (fallback !== undefined) return fallback;
        throw new Error(`Parameter "${parameterName}" is not defined`);
      }

      // Resolve expressions
      const context: ExpressionContext = {
        $input: inputData,
        $item: inputData[currentItemIndex] ?? null,
        $itemIndex: currentItemIndex,
        $node: node,
        $nodes: {},
        $vars: {},
        $env: {},
        $execution: {
          id: executionId,
          mode,
        },
        $now: new Date(),
        $today: new Date().toISOString().split('T')[0],
        $json: inputData[currentItemIndex]?.json ?? {},
        $binary: inputData[currentItemIndex]?.binary ?? {},
      };

      return resolveExpressions(value, context) as T;
    },

    getCredentials: async <T = unknown>(type: string): Promise<T> => {
      const credRef = node.credentials?.[type];
      if (!credRef) {
        throw new Error(`No credentials of type "${type}" configured`);
      }
      // In a real implementation, this would fetch from credential store
      return {} as T;
    },

    getWorkflowStaticData: (type: 'node' | 'workflow'): Record<string, unknown> => {
      if (type === 'node') {
        return (staticData[node.id] ?? {}) as Record<string, unknown>;
      }
      return staticData;
    },

    helpers: {
      request: makeRequest,

      requestWithAuthentication: async (_credentialType, options) => {
        // Get credentials and apply to request
        // Simplified - would need actual credential handling
        return makeRequest(options);
      },

      returnJsonArray: (data: unknown[]) => {
        return data.map((item, index) => ({
          json: typeof item === 'object' ? (item as Record<string, unknown>) : { data: item },
          pairedItem: { item: index },
        }));
      },

      prepareBinaryData: async (data, fileName, mimeType) => {
        const base64 = typeof data === 'string' ? data : Buffer.from(data as Uint8Array).toString('base64');
        return {
          data: base64,
          mimeType: mimeType ?? 'application/octet-stream',
          fileName,
        };
      },

      binaryToBuffer: async (binary) => {
        return Buffer.from(binary.data, 'base64');
      },

      httpRequest: makeRequest,

      copyInputItems: (items, properties) => {
        return items.map((item) => {
          const newItem: INodeExecutionData = { json: {} };
          properties.forEach((prop) => {
            if (item.json[prop] !== undefined) {
              newItem.json[prop] = item.json[prop];
            }
          });
          return newItem;
        });
      },

      assertBinaryData: (itemIndex, propertyName = 'data') => {
        const item = inputData[itemIndex];
        if (!item?.binary?.[propertyName]) {
          throw new Error(`No binary data found in property "${propertyName}"`);
        }
        return item.binary[propertyName];
      },

      getBinaryDataBuffer: async (itemIndex, propertyName = 'data') => {
        const binary = inputData[itemIndex]?.binary?.[propertyName];
        if (!binary) {
          throw new Error(`No binary data found`);
        }
        return Buffer.from(binary.data, 'base64');
      },
    },

    node,
    workflow,
    executionId,
    mode,
    logger,

    evaluateExpression: <T = unknown>(expression: string, itemIndex?: number): T => {
      const index = itemIndex ?? currentItemIndex;
      const context: ExpressionContext = {
        $input: inputData,
        $item: inputData[index] ?? null,
        $itemIndex: index,
        $node: node,
        $nodes: {},
        $vars: {},
        $env: {},
        $execution: { id: executionId, mode },
        $now: new Date(),
        $today: new Date().toISOString().split('T')[0],
        $json: inputData[index]?.json ?? {},
        $binary: inputData[index]?.binary ?? {},
      };
      return resolveExpressions(expression, context) as T;
    },

    getItemIndex: () => currentItemIndex,
    getRunIndex: () => 0,

    // Convenience properties
    inputData: [inputData],
    parameters: node.parameters,
    nodeData: (staticData[node.id] ?? {}) as Record<string, unknown>,
  };
}

/**
 * Workflow executor class
 */
export class WorkflowExecutor {
  private workflow: Workflow;
  private options: ExecutorOptions;
  private nodeRegistry: typeof useNodeRegistryStore;
  private executionStore: typeof useExecutionStore;
  private nodeStates: Map<string, NodeExecutionState>;
  private staticData: Record<string, unknown>;
  private nodesData: Record<string, INodeExecutionData[][]>;

  constructor(workflow: Workflow, options: ExecutorOptions = {}) {
    this.workflow = workflow;
    this.options = {
      nodeTimeout: 60000,
      maxConcurrency: 5,
      stopOnError: false,
      ...options,
    };
    this.nodeRegistry = useNodeRegistryStore;
    this.executionStore = useExecutionStore;
    this.nodeStates = new Map();
    this.staticData = workflow.staticData ?? {};
    this.nodesData = {};
  }

  /**
   * Execute the workflow
   */
  async execute(options: ExecutionOptions = {}): Promise<WorkflowExecutionData> {
    const execId = generateExecutionId();
    const mode = options.mode === 'trigger' ? ExecutionMode.Trigger : ExecutionMode.Manual;
    const startTime = new Date().toISOString();

    // Start execution in store
    this.executionStore.getState().startExecution(execId, mode);

    this.log('info', `Starting workflow execution: ${this.workflow.name}`);

    // Initialize node states
    this.workflow.nodes.forEach((node) => {
      this.nodeStates.set(node.id, {
        status: 'pending',
        inputData: [],
        outputData: null,
        error: null,
        startTime: null,
        endTime: null,
      });
    });

    // Find start nodes (trigger nodes or nodes with no inputs)
    const startNodes = this.findStartNodes(options.startNodeId);

    if (startNodes.length === 0) {
      throw new Error('No start nodes found in workflow');
    }

    // Prepare initial data
    const initialData: INodeExecutionData[] = options.inputData ?? [{ json: {} }];

    try {
      // Execute from start nodes
      for (const startNode of startNodes) {
        await this.executeNode(startNode, initialData, execId, mode);
      }

      // Check if any nodes failed
      const failedNodes = Array.from(this.nodeStates.entries())
        .filter(([, state]) => state.status === 'error');

      const status = failedNodes.length > 0 ? 'error' : 'success';
      this.executionStore.getState().completeExecution(status);

      this.log('info', `Workflow execution completed: ${status}`);

      // Build execution data
      const executionData: WorkflowExecutionData = {
        id: execId,
        workflowId: this.workflow.id,
        workflowData: this.workflow,
        startedAt: startTime,
        finishedAt: new Date().toISOString(),
        status,
        mode: mode === ExecutionMode.Manual ? 'manual' : 'trigger',
        data: {
          resultData: {
            runData: this.buildRunData(),
            lastNodeExecuted: this.getLastExecutedNode(),
          },
        },
        staticData: this.staticData,
      };

      return executionData;
    } catch (error) {
      this.executionStore.getState().completeExecution('error');
      this.log('error', `Workflow execution failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    node: WorkflowNode,
    inputData: INodeExecutionData[],
    executionId: string,
    mode: ExecutionMode
  ): Promise<void> {
    const nodeState = this.nodeStates.get(node.id);
    if (!nodeState) return;

    // Skip disabled nodes
    if (node.disabled) {
      nodeState.status = 'skipped';
      this.executionStore.getState().setNodeSkipped(node.id);
      // Continue to downstream nodes with empty data
      await this.executeDownstreamNodes(node, [[]], executionId, mode);
      return;
    }

    // Get node type definition
    const nodeType = this.nodeRegistry.getState().getNodeType(node.type);
    if (!nodeType) {
      nodeState.status = 'error';
      nodeState.error = new Error(`Unknown node type: ${node.type}`);
      this.executionStore.getState().setNodeError(node.id, {
        message: nodeState.error.message,
      });
      return;
    }

    // Update state
    nodeState.status = 'running';
    nodeState.inputData = inputData;
    nodeState.startTime = Date.now();
    this.executionStore.getState().setNodeRunning(node.id);

    this.log('debug', `Executing node: ${node.name}`, { nodeType: node.type });
    this.options.onProgress?.(node.id, 'running');

    try {
      // Create execution context
      const logger = createLogger(node.id, node.name, this.options.onLog);
      const context = createExecutionContext(
        node,
        this.workflow,
        inputData,
        executionId,
        mode,
        this.staticData,
        this.nodesData,
        logger
      );

      // Execute the node
      const result = await this.executeWithTimeout(
        () => nodeType.execute(context),
        this.options.nodeTimeout!
      );

      // Update state with results
      nodeState.status = 'success';
      nodeState.outputData = result.outputData;
      nodeState.endTime = Date.now();

      // Store node output data
      this.nodesData[node.id] = result.outputData;

      this.executionStore.getState().setNodeSuccess(node.id, result.outputData);
      this.options.onProgress?.(node.id, 'success', result);

      this.log('info', `Node completed: ${node.name}`, {
        itemsProcessed: result.outputData[0]?.length ?? 0,
        executionTime: nodeState.endTime - (nodeState.startTime ?? 0),
      });

      // Execute downstream nodes
      await this.executeDownstreamNodes(node, result.outputData, executionId, mode);
    } catch (error) {
      nodeState.status = 'error';
      nodeState.error = error as Error;
      nodeState.endTime = Date.now();

      this.executionStore.getState().setNodeError(node.id, {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      this.options.onProgress?.(node.id, 'error', { error });

      this.log('error', `Node failed: ${node.name}`, { error: (error as Error).message });

      // Handle continue on fail
      if (node.continueOnFail) {
        const errorData: INodeExecutionData[] = [{
          json: {
            error: {
              message: (error as Error).message,
              name: (error as Error).name,
            },
          },
          pairedItem: { item: 0 },
        }];
        await this.executeDownstreamNodes(node, [errorData], executionId, mode);
      } else if (this.options.stopOnError) {
        throw error;
      }
    }
  }

  /**
   * Execute downstream nodes
   */
  private async executeDownstreamNodes(
    node: WorkflowNode,
    outputData: INodeExecutionData[][],
    executionId: string,
    mode: ExecutionMode
  ): Promise<void> {
    // Find edges from this node
    const outgoingEdges = this.workflow.edges.filter((e) => e.source === node.id);

    for (const edge of outgoingEdges) {
      const targetNode = this.workflow.nodes.find((n) => n.id === edge.target);
      if (!targetNode) continue;

      // Get output index from edge
      const outputIndex = edge.sourceHandle
        ? parseInt(edge.sourceHandle.replace('output-', ''), 10)
        : 0;

      const dataForTarget = outputData[outputIndex] ?? [];

      // Execute target node
      await this.executeNode(targetNode, dataForTarget, executionId, mode);
    }
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(`Execution timeout (${timeout}ms)`)), timeout);
      }),
    ]);
  }

  /**
   * Find start nodes
   */
  private findStartNodes(startNodeId?: string): WorkflowNode[] {
    if (startNodeId) {
      const node = this.workflow.nodes.find((n) => n.id === startNodeId);
      return node ? [node] : [];
    }

    // Find nodes with no incoming edges (roots)
    const nodesWithIncoming = new Set(this.workflow.edges.map((e) => e.target));
    return this.workflow.nodes.filter((n) => !nodesWithIncoming.has(n.id));
  }

  /**
   * Build run data for execution result
   */
  private buildRunData(): Record<string, any[]> {
    const runData: Record<string, any[]> = {};

    this.nodeStates.forEach((state, nodeId) => {
      if (state.status !== 'pending') {
        runData[nodeId] = [{
          startTime: state.startTime ?? Date.now(),
          executionTime: state.endTime ? state.endTime - (state.startTime ?? 0) : 0,
          executionStatus: state.status,
          source: null,
          data: {
            main: state.outputData ?? [],
          },
          error: state.error ? {
            message: state.error.message,
            stack: state.error.stack,
          } : undefined,
        }];
      }
    });

    return runData;
  }

  /**
   * Get last executed node
   */
  private getLastExecutedNode(): string | undefined {
    let lastNode: string | undefined;
    let lastTime = 0;

    this.nodeStates.forEach((state, nodeId) => {
      if (state.endTime && state.endTime > lastTime) {
        lastTime = state.endTime;
        lastNode = nodeId;
      }
    });

    return lastNode;
  }

  /**
   * Log helper
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    this.options.onLog?.({
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    });
  }
}

/**
 * Execute a workflow
 */
export async function executeWorkflow(
  workflow: Workflow,
  options: ExecutionOptions & ExecutorOptions = {}
): Promise<WorkflowExecutionData> {
  const executor = new WorkflowExecutor(workflow, options);
  return executor.execute(options);
}

export default WorkflowExecutor;
