import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  WorkflowExecutionData,
  NodeExecutionStatusData,
  ExecutionLogEntry,
  INodeExecutionData,
} from '../types';
import { NodeExecutionStatus, ExecutionMode } from '../types';

/**
 * Execution state
 */
interface ExecutionState {
  // Current execution
  currentExecutionId: string | null;
  isExecuting: boolean;
  executionMode: ExecutionMode;

  // Execution status
  executionStatus: 'idle' | 'running' | 'success' | 'error' | 'canceled';
  executionProgress: number; // 0-100

  // Node execution status
  nodeStatus: Record<string, NodeExecutionStatusData>;

  // Execution data/results
  executionData: Record<string, WorkflowExecutionData>;
  nodeOutputData: Record<string, INodeExecutionData[][]>;

  // Execution log
  executionLog: ExecutionLogEntry[];
  maxLogEntries: number;

  // Debug mode
  debugMode: boolean;
  breakpoints: string[]; // Node IDs with breakpoints
  pausedAtNode: string | null;

  // Step execution
  stepMode: boolean;
  canStepForward: boolean;
  canStepBackward: boolean;
}

/**
 * Execution actions
 */
interface ExecutionActions {
  // Execution control
  startExecution: (executionId: string, mode: ExecutionMode) => void;
  completeExecution: (status: 'success' | 'error' | 'canceled') => void;
  cancelExecution: () => void;
  resetExecution: () => void;

  // Node status
  setNodeStatus: (nodeId: string, status: Partial<NodeExecutionStatusData>) => void;
  setNodeRunning: (nodeId: string) => void;
  setNodeSuccess: (nodeId: string, outputData?: INodeExecutionData[][]) => void;
  setNodeError: (nodeId: string, error: { message: string; description?: string; stack?: string }) => void;
  setNodeSkipped: (nodeId: string) => void;
  clearNodeStatus: () => void;

  // Output data
  setNodeOutputData: (nodeId: string, data: INodeExecutionData[][]) => void;
  getNodeOutputData: (nodeId: string) => INodeExecutionData[][] | undefined;
  clearOutputData: () => void;

  // Execution data
  setExecutionData: (executionId: string, data: WorkflowExecutionData) => void;
  getExecutionData: (executionId: string) => WorkflowExecutionData | undefined;

  // Progress
  setProgress: (progress: number) => void;
  incrementProgress: (amount: number) => void;

  // Logging
  addLogEntry: (entry: Omit<ExecutionLogEntry, 'timestamp'>) => void;
  clearLog: () => void;
  setMaxLogEntries: (max: number) => void;

  // Debug mode
  setDebugMode: (enabled: boolean) => void;
  toggleBreakpoint: (nodeId: string) => void;
  hasBreakpoint: (nodeId: string) => boolean;
  clearBreakpoints: () => void;
  pauseAtNode: (nodeId: string) => void;
  resume: () => void;

  // Step execution
  setStepMode: (enabled: boolean) => void;
  stepForward: () => void;
  stepBackward: () => void;
}

/**
 * Execution store
 */
export const useExecutionStore = create<ExecutionState & ExecutionActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      currentExecutionId: null,
      isExecuting: false,
      executionMode: ExecutionMode.Manual,
      executionStatus: 'idle',
      executionProgress: 0,
      nodeStatus: {},
      executionData: {},
      nodeOutputData: {},
      executionLog: [],
      maxLogEntries: 1000,
      debugMode: false,
      breakpoints: [],
      pausedAtNode: null,
      stepMode: false,
      canStepForward: false,
      canStepBackward: false,

      // Execution control
      startExecution: (executionId, mode) => {
        set((state) => {
          state.currentExecutionId = executionId;
          state.isExecuting = true;
          state.executionMode = mode;
          state.executionStatus = 'running';
          state.executionProgress = 0;
          state.nodeStatus = {};
          state.nodeOutputData = {};
          state.pausedAtNode = null;
        });

        get().addLogEntry({
          level: 'info',
          message: `Execution started (${mode})`,
        });
      },

      completeExecution: (status) => {
        set((state) => {
          state.isExecuting = false;
          state.executionStatus = status;
          state.executionProgress = 100;
          state.pausedAtNode = null;
        });

        get().addLogEntry({
          level: status === 'success' ? 'info' : 'error',
          message: `Execution ${status}`,
        });
      },

      cancelExecution: () => {
        set((state) => {
          state.isExecuting = false;
          state.executionStatus = 'canceled';
          state.pausedAtNode = null;
        });

        get().addLogEntry({
          level: 'warn',
          message: 'Execution canceled by user',
        });
      },

      resetExecution: () => {
        set((state) => {
          state.currentExecutionId = null;
          state.isExecuting = false;
          state.executionStatus = 'idle';
          state.executionProgress = 0;
          state.nodeStatus = {};
          state.nodeOutputData = {};
          state.pausedAtNode = null;
        });
      },

      // Node status
      setNodeStatus: (nodeId, status) => {
        set((state) => {
          state.nodeStatus[nodeId] = {
            ...state.nodeStatus[nodeId],
            nodeId,
            ...status,
          } as NodeExecutionStatusData;
        });
      },

      setNodeRunning: (nodeId) => {
        set((state) => {
          state.nodeStatus[nodeId] = {
            nodeId,
            status: 'running',
            startedAt: new Date().toISOString(),
          };
        });

        get().addLogEntry({
          level: 'debug',
          nodeId,
          message: 'Node execution started',
        });
      },

      setNodeSuccess: (nodeId, outputData) => {
        const startedAt = get().nodeStatus[nodeId]?.startedAt;
        const finishedAt = new Date().toISOString();
        const executionTime = startedAt
          ? new Date(finishedAt).getTime() - new Date(startedAt).getTime()
          : 0;

        set((state) => {
          state.nodeStatus[nodeId] = {
            ...state.nodeStatus[nodeId],
            nodeId,
            status: 'success',
            finishedAt,
            executionTime,
            itemsProcessed: outputData?.[0]?.length ?? 0,
          };

          if (outputData) {
            state.nodeOutputData[nodeId] = outputData;
          }
        });

        get().addLogEntry({
          level: 'info',
          nodeId,
          message: `Node completed successfully (${executionTime}ms)`,
        });
      },

      setNodeError: (nodeId, error) => {
        const startedAt = get().nodeStatus[nodeId]?.startedAt;
        const finishedAt = new Date().toISOString();
        const executionTime = startedAt
          ? new Date(finishedAt).getTime() - new Date(startedAt).getTime()
          : 0;

        set((state) => {
          state.nodeStatus[nodeId] = {
            ...state.nodeStatus[nodeId],
            nodeId,
            status: 'error',
            finishedAt,
            executionTime,
            error,
          };
        });

        get().addLogEntry({
          level: 'error',
          nodeId,
          message: error.message,
          data: { description: error.description, stack: error.stack },
        });
      },

      setNodeSkipped: (nodeId) => {
        set((state) => {
          state.nodeStatus[nodeId] = {
            nodeId,
            status: 'skipped',
          };
        });

        get().addLogEntry({
          level: 'debug',
          nodeId,
          message: 'Node skipped',
        });
      },

      clearNodeStatus: () => {
        set((state) => {
          state.nodeStatus = {};
        });
      },

      // Output data
      setNodeOutputData: (nodeId, data) => {
        set((state) => {
          state.nodeOutputData[nodeId] = data;
        });
      },

      getNodeOutputData: (nodeId) => get().nodeOutputData[nodeId],

      clearOutputData: () => {
        set((state) => {
          state.nodeOutputData = {};
        });
      },

      // Execution data
      setExecutionData: (executionId, data) => {
        set((state) => {
          state.executionData[executionId] = data;
        });
      },

      getExecutionData: (executionId) => get().executionData[executionId],

      // Progress
      setProgress: (progress) => {
        set((state) => {
          state.executionProgress = Math.min(Math.max(progress, 0), 100);
        });
      },

      incrementProgress: (amount) => {
        set((state) => {
          state.executionProgress = Math.min(state.executionProgress + amount, 100);
        });
      },

      // Logging
      addLogEntry: (entry) => {
        set((state) => {
          const newEntry: ExecutionLogEntry = {
            ...entry,
            timestamp: new Date().toISOString(),
          };

          state.executionLog.push(newEntry);

          // Trim log if exceeds max
          if (state.executionLog.length > state.maxLogEntries) {
            state.executionLog = state.executionLog.slice(-state.maxLogEntries);
          }
        });
      },

      clearLog: () => {
        set((state) => {
          state.executionLog = [];
        });
      },

      setMaxLogEntries: (max) => {
        set((state) => {
          state.maxLogEntries = max;
          if (state.executionLog.length > max) {
            state.executionLog = state.executionLog.slice(-max);
          }
        });
      },

      // Debug mode
      setDebugMode: (enabled) => {
        set((state) => {
          state.debugMode = enabled;
          if (!enabled) {
            state.pausedAtNode = null;
            state.stepMode = false;
          }
        });
      },

      toggleBreakpoint: (nodeId) => {
        set((state) => {
          const index = state.breakpoints.indexOf(nodeId);
          if (index === -1) {
            state.breakpoints.push(nodeId);
          } else {
            state.breakpoints.splice(index, 1);
          }
        });
      },

      hasBreakpoint: (nodeId) => get().breakpoints.includes(nodeId),

      clearBreakpoints: () => {
        set((state) => {
          state.breakpoints = [];
        });
      },

      pauseAtNode: (nodeId) => {
        set((state) => {
          state.pausedAtNode = nodeId;
          state.canStepForward = true;
        });

        get().addLogEntry({
          level: 'debug',
          nodeId,
          message: 'Execution paused at breakpoint',
        });
      },

      resume: () => {
        set((state) => {
          state.pausedAtNode = null;
        });

        get().addLogEntry({
          level: 'debug',
          message: 'Execution resumed',
        });
      },

      // Step execution
      setStepMode: (enabled) => {
        set((state) => {
          state.stepMode = enabled;
        });
      },

      stepForward: () => {
        // This would be connected to the actual execution engine
        set((state) => {
          state.canStepBackward = true;
        });

        get().addLogEntry({
          level: 'debug',
          message: 'Stepped forward',
        });
      },

      stepBackward: () => {
        // This would be connected to the actual execution engine
        get().addLogEntry({
          level: 'debug',
          message: 'Stepped backward',
        });
      },
    }))
  )
);

/**
 * Selector hooks
 */
export const useIsExecuting = () => useExecutionStore((state) => state.isExecuting);
export const useExecutionStatus = () => useExecutionStore((state) => state.executionStatus);
export const useExecutionProgress = () => useExecutionStore((state) => state.executionProgress);
export const useNodeStatus = (nodeId: string) =>
  useExecutionStore((state) => state.nodeStatus[nodeId]);
export const useAllNodeStatus = () => useExecutionStore((state) => state.nodeStatus);
export const useExecutionLog = () => useExecutionStore((state) => state.executionLog);
export const useDebugMode = () => useExecutionStore((state) => state.debugMode);
export const useBreakpoints = () => useExecutionStore((state) => state.breakpoints);
export const usePausedAtNode = () => useExecutionStore((state) => state.pausedAtNode);

/**
 * Get node execution status enum value
 */
export function getNodeStatusEnum(nodeId: string): NodeExecutionStatus {
  const status = useExecutionStore.getState().nodeStatus[nodeId]?.status;

  switch (status) {
    case 'running':
      return NodeExecutionStatus.Running;
    case 'success':
      return NodeExecutionStatus.Success;
    case 'error':
      return NodeExecutionStatus.Error;
    case 'skipped':
      return NodeExecutionStatus.Skipped;
    case 'pending':
      return NodeExecutionStatus.Waiting;
    default:
      return NodeExecutionStatus.Idle;
  }
}
