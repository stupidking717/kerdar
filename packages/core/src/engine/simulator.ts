/**
 * Workflow Simulator
 *
 * Simulates workflow execution using mock data generated from node schemas.
 * This allows testing workflows without making actual API calls.
 */

import type {
  Workflow,
  WorkflowNode,
  INodeExecutionData,
  WorkflowExecutionData,
  ExecutionLogEntry,
  NodeTypeDefinition,
  NodeExecutionRunData,
} from '../types';
import { ExecutionMode, NodeCategory } from '../types';
import { useNodeRegistryStore } from '../store/node-registry-store';
import { useExecutionStore } from '../store/execution-store';
import { executionId as generateExecutionId } from '../utils/nanoid';
import { resolveSchema, generateMockData } from '../types/schema';

/**
 * Simulation options
 */
export interface SimulationOptions {
  /** Delay between node executions (ms) for visualization */
  nodeDelay?: number;

  /** Custom mock data overrides by node ID */
  mockDataOverrides?: Record<string, Record<string, unknown>>;

  /** Whether to simulate errors for specific nodes */
  simulateErrors?: Record<string, string>;

  /** Callback for execution progress */
  onProgress?: (nodeId: string, status: string, data?: unknown) => void;

  /** Callback for log entries */
  onLog?: (entry: ExecutionLogEntry) => void;

  /** Callback when data flows to next node */
  onDataFlow?: (sourceNodeId: string, targetNodeId: string, data: INodeExecutionData[]) => void;
}

/**
 * Node simulation state
 */
interface NodeSimulationState {
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  inputData: INodeExecutionData[];
  outputData: INodeExecutionData[][] | null;
  mockData: Record<string, unknown> | null;
  error: Error | null;
  startTime: number | null;
  endTime: number | null;
}

/**
 * Simulation result for a single node
 */
export interface NodeSimulationResult {
  nodeId: string;
  nodeName: string;
  status: 'success' | 'error' | 'skipped';
  inputData: INodeExecutionData[];
  outputData: INodeExecutionData[][];
  mockData: Record<string, unknown>;
  executionTime: number;
  error?: { message: string; stack?: string };
}

/**
 * Complete simulation result
 */
export interface SimulationResult extends WorkflowExecutionData {
  simulationMode: true;
  nodeResults: NodeSimulationResult[];
}

/**
 * Workflow simulator class
 */
export class WorkflowSimulator {
  private workflow: Workflow;
  private options: SimulationOptions;
  private nodeRegistry: typeof useNodeRegistryStore;
  private executionStore: typeof useExecutionStore;
  private nodeStates: Map<string, NodeSimulationState>;
  private nodeResults: NodeSimulationResult[];

  constructor(workflow: Workflow, options: SimulationOptions = {}) {
    this.workflow = workflow;
    this.options = {
      nodeDelay: 500,
      mockDataOverrides: {},
      simulateErrors: {},
      ...options,
    };
    this.nodeRegistry = useNodeRegistryStore;
    this.executionStore = useExecutionStore;
    this.nodeStates = new Map();
    this.nodeResults = [];
  }

  /**
   * Simulate the workflow execution
   */
  async simulate(): Promise<SimulationResult> {
    const execId = generateExecutionId();
    const mode = ExecutionMode.Manual;
    const startTime = new Date().toISOString();

    // Start execution in store (for UI updates)
    this.executionStore.getState().startExecution(execId, mode);

    this.log('info', `Starting workflow simulation: ${this.workflow.name}`);

    // Initialize node states
    this.workflow.nodes.forEach((node) => {
      this.nodeStates.set(node.id, {
        status: 'pending',
        inputData: [],
        outputData: null,
        mockData: null,
        error: null,
        startTime: null,
        endTime: null,
      });
    });

    // Find start nodes (trigger nodes or nodes with no inputs)
    const startNodes = this.findStartNodes();

    if (startNodes.length === 0) {
      throw new Error('No start nodes found in workflow');
    }

    try {
      // Execute from start nodes
      for (const startNode of startNodes) {
        // Generate initial mock data for trigger nodes
        const initialData = this.generateInitialData(startNode);
        await this.simulateNode(startNode, initialData, execId);
      }

      // Check if any nodes failed
      const failedNodes = Array.from(this.nodeStates.entries())
        .filter(([, state]) => state.status === 'error');

      const status = failedNodes.length > 0 ? 'error' : 'success';
      this.executionStore.getState().completeExecution(status);

      this.log('info', `Workflow simulation completed: ${status}`);

      // Build simulation result
      const result: SimulationResult = {
        id: execId,
        workflowId: this.workflow.id,
        workflowData: this.workflow,
        startedAt: startTime,
        finishedAt: new Date().toISOString(),
        status,
        mode: 'manual',
        simulationMode: true,
        nodeResults: this.nodeResults,
        data: {
          resultData: {
            runData: this.buildRunData(),
            lastNodeExecuted: this.getLastExecutedNode(),
          },
        },
        staticData: {},
      };

      return result;
    } catch (error) {
      this.executionStore.getState().completeExecution('error');
      this.log('error', `Workflow simulation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Generate initial mock data for a start/trigger node
   */
  private generateInitialData(node: WorkflowNode): INodeExecutionData[] {
    // Check for custom mock data override
    if (this.options.mockDataOverrides?.[node.id]) {
      return [{
        json: this.options.mockDataOverrides[node.id],
        pairedItem: { item: 0 },
      }];
    }

    // Get node type definition
    const nodeType = this.nodeRegistry.getState().getNodeType(node.type);
    if (!nodeType?.outputSchema) {
      // No schema defined, return empty data
      return [{ json: {}, pairedItem: { item: 0 } }];
    }

    // Resolve and generate mock data from schema
    const mockData = this.generateMockFromSchema(nodeType, node);
    return [{
      json: mockData,
      pairedItem: { item: 0 },
    }];
  }

  /**
   * Generate mock data from a node's output schema
   */
  private generateMockFromSchema(
    nodeType: NodeTypeDefinition,
    node: WorkflowNode
  ): Record<string, unknown> {
    if (!nodeType.outputSchema) {
      return {};
    }

    const schema = resolveSchema(nodeType.outputSchema, node.parameters, node);
    if (!schema) {
      return {};
    }

    return generateMockData(schema);
  }

  /**
   * Simulate a single node execution
   */
  private async simulateNode(
    node: WorkflowNode,
    inputData: INodeExecutionData[],
    executionId: string
  ): Promise<void> {
    const nodeState = this.nodeStates.get(node.id);
    if (!nodeState) return;

    // Skip disabled nodes
    if (node.disabled) {
      nodeState.status = 'skipped';
      this.executionStore.getState().setNodeSkipped(node.id);
      this.nodeResults.push({
        nodeId: node.id,
        nodeName: node.name,
        status: 'skipped',
        inputData: [],
        outputData: [],
        mockData: {},
        executionTime: 0,
      });
      await this.simulateDownstreamNodes(node, [[]], executionId);
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

    // Check for simulated errors
    if (this.options.simulateErrors?.[node.id]) {
      nodeState.status = 'error';
      nodeState.error = new Error(this.options.simulateErrors[node.id]);
      this.executionStore.getState().setNodeError(node.id, {
        message: nodeState.error.message,
      });
      this.log('error', `Node simulation error: ${node.name}`, {
        error: nodeState.error.message,
      });
      this.nodeResults.push({
        nodeId: node.id,
        nodeName: node.name,
        status: 'error',
        inputData,
        outputData: [],
        mockData: {},
        executionTime: 0,
        error: { message: nodeState.error.message },
      });
      return;
    }

    // Update state
    nodeState.status = 'running';
    nodeState.inputData = inputData;
    nodeState.startTime = Date.now();
    this.executionStore.getState().setNodeRunning(node.id);

    this.log('debug', `Simulating node: ${node.name}`, { nodeType: node.type });
    this.options.onProgress?.(node.id, 'running');

    // Simulate processing delay for visualization
    if (this.options.nodeDelay) {
      await this.delay(this.options.nodeDelay);
    }

    try {
      // Generate mock output data from schema
      const mockData = this.options.mockDataOverrides?.[node.id]
        ?? this.generateMockFromSchema(nodeType, node);

      // Transform input data through the node (simulate processing)
      const outputData = this.transformData(inputData, mockData, node, nodeType);

      // Update state with results
      nodeState.status = 'success';
      nodeState.outputData = [outputData];
      nodeState.mockData = mockData;
      nodeState.endTime = Date.now();

      this.executionStore.getState().setNodeSuccess(node.id, [outputData]);
      this.options.onProgress?.(node.id, 'success', { outputData, mockData });

      const executionTime = nodeState.endTime - (nodeState.startTime ?? 0);
      this.log('info', `Node simulation completed: ${node.name}`, {
        itemsProcessed: outputData.length,
        executionTime,
      });

      // Store result
      this.nodeResults.push({
        nodeId: node.id,
        nodeName: node.name,
        status: 'success',
        inputData,
        outputData: [outputData],
        mockData,
        executionTime,
      });

      // Execute downstream nodes
      await this.simulateDownstreamNodes(node, [outputData], executionId);
    } catch (error) {
      nodeState.status = 'error';
      nodeState.error = error as Error;
      nodeState.endTime = Date.now();

      this.executionStore.getState().setNodeError(node.id, {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      this.options.onProgress?.(node.id, 'error', { error });

      this.log('error', `Node simulation failed: ${node.name}`, {
        error: (error as Error).message,
      });

      this.nodeResults.push({
        nodeId: node.id,
        nodeName: node.name,
        status: 'error',
        inputData,
        outputData: [],
        mockData: {},
        executionTime: nodeState.endTime - (nodeState.startTime ?? 0),
        error: { message: (error as Error).message },
      });
    }
  }

  /**
   * Transform input data through a node
   * This simulates how data would flow through the node
   */
  private transformData(
    inputData: INodeExecutionData[],
    mockOutput: Record<string, unknown>,
    _node: WorkflowNode,
    nodeType: NodeTypeDefinition
  ): INodeExecutionData[] {
    // Different transformation strategies based on node category
    switch (nodeType.category) {
      case NodeCategory.Trigger:
        // Triggers generate new data from schema
        return [{
          json: mockOutput,
          pairedItem: { item: 0 },
        }];

      case NodeCategory.Action:
      case NodeCategory.Integration:
      case NodeCategory.Communication:
      case NodeCategory.Database:
        // Action-like nodes transform data - merge input with mock output
        return inputData.map((item, index) => ({
          json: {
            ...item.json,
            ...mockOutput,
          },
          pairedItem: { item: index },
        }));

      case NodeCategory.Data:
        // Data/Transform nodes modify data structure
        if (nodeType.type === 'set') {
          // Set node: use schema output if available, otherwise keep input
          return inputData.map((item, index) => ({
            json: Object.keys(mockOutput).length > 0 ? mockOutput : item.json,
            pairedItem: { item: index },
          }));
        }
        // Default transform: merge
        return inputData.map((item, index) => ({
          json: { ...item.json, ...mockOutput },
          pairedItem: { item: index },
        }));

      case NodeCategory.Logic:
        // Logic/Flow control nodes pass data through
        return inputData;

      case NodeCategory.AI:
      case NodeCategory.Custom:
        // AI and Custom nodes - use mock output or pass through
        if (Object.keys(mockOutput).length > 0) {
          return [{
            json: mockOutput,
            pairedItem: { item: 0 },
          }];
        }
        return inputData;

      default:
        // Default: merge input with mock output
        return inputData.map((item, index) => ({
          json: { ...item.json, ...mockOutput },
          pairedItem: { item: index },
        }));
    }
  }

  /**
   * Simulate downstream nodes
   */
  private async simulateDownstreamNodes(
    node: WorkflowNode,
    outputData: INodeExecutionData[][],
    executionId: string
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

      // Notify about data flow
      this.options.onDataFlow?.(node.id, targetNode.id, dataForTarget);

      // Simulate target node
      await this.simulateNode(targetNode, dataForTarget, executionId);
    }
  }

  /**
   * Find start nodes
   */
  private findStartNodes(): WorkflowNode[] {
    // Find nodes with no incoming edges (roots)
    const nodesWithIncoming = new Set(this.workflow.edges.map((e) => e.target));
    return this.workflow.nodes.filter((n) => !nodesWithIncoming.has(n.id));
  }

  /**
   * Build run data for execution result
   */
  private buildRunData(): Record<string, NodeExecutionRunData[]> {
    const runData: Record<string, NodeExecutionRunData[]> = {};

    this.nodeStates.forEach((state, nodeId) => {
      if (state.status !== 'pending') {
        const executionStatus = state.status === 'success' ? 'success'
          : state.status === 'error' ? 'error' : undefined;

        runData[nodeId] = [{
          startTime: state.startTime ?? Date.now(),
          executionTime: state.endTime ? state.endTime - (state.startTime ?? 0) : 0,
          executionStatus,
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
   * Delay helper for visualization
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
 * Simulate a workflow execution with mock data
 */
export async function simulateWorkflow(
  workflow: Workflow,
  options: SimulationOptions = {}
): Promise<SimulationResult> {
  const simulator = new WorkflowSimulator(workflow, options);
  return simulator.simulate();
}

/**
 * Get mock data preview for a specific node
 * Useful for showing what data would be available during simulation
 */
export function getNodeMockDataPreview(
  node: WorkflowNode,
  nodeType: NodeTypeDefinition | undefined
): Record<string, unknown> {
  if (!nodeType?.outputSchema) {
    return {};
  }

  const schema = resolveSchema(nodeType.outputSchema, node.parameters, node);
  if (!schema) {
    return {};
  }

  return generateMockData(schema);
}

/**
 * Get simulation data flow for visualization
 * Returns the expected data at each node without actually running simulation
 */
export function previewSimulationDataFlow(
  workflow: Workflow
): Map<string, { input: Record<string, unknown>[]; output: Record<string, unknown>[] }> {
  const dataFlow = new Map<string, { input: Record<string, unknown>[]; output: Record<string, unknown>[] }>();
  const nodeRegistry = useNodeRegistryStore.getState();

  // Find start nodes
  const nodesWithIncoming = new Set(workflow.edges.map((e) => e.target));
  const startNodes = workflow.nodes.filter((n) => !nodesWithIncoming.has(n.id));

  // BFS to propagate data
  const queue: Array<{ node: WorkflowNode; inputData: Record<string, unknown>[] }> = [];
  const visited = new Set<string>();

  // Initialize start nodes
  startNodes.forEach((node) => {
    const nodeType = nodeRegistry.getNodeType(node.type);
    const mockOutput = nodeType?.outputSchema
      ? generateMockData(resolveSchema(nodeType.outputSchema, node.parameters, node)!)
      : {};

    dataFlow.set(node.id, {
      input: [{}],
      output: [mockOutput],
    });

    queue.push({ node, inputData: [mockOutput] });
  });

  // Process nodes in BFS order
  while (queue.length > 0) {
    const { node, inputData } = queue.shift()!;

    if (visited.has(node.id)) continue;
    visited.add(node.id);

    // Find downstream nodes
    const outgoingEdges = workflow.edges.filter((e) => e.source === node.id);

    for (const edge of outgoingEdges) {
      const targetNode = workflow.nodes.find((n) => n.id === edge.target);
      if (!targetNode) continue;

      const nodeType = nodeRegistry.getNodeType(targetNode.type);
      const mockOutput = nodeType?.outputSchema
        ? generateMockData(resolveSchema(nodeType.outputSchema, targetNode.parameters, targetNode)!)
        : {};

      // Merge input with mock output for action nodes
      const outputData = nodeType?.category === NodeCategory.Trigger
        ? [mockOutput]
        : inputData.map((item) => ({ ...item, ...mockOutput }));

      dataFlow.set(targetNode.id, {
        input: inputData,
        output: outputData,
      });

      queue.push({ node: targetNode, inputData: outputData });
    }
  }

  return dataFlow;
}

export default WorkflowSimulator;
