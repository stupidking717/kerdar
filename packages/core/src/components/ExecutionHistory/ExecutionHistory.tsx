import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  Play,
  RefreshCw,
  Trash2,
  MinusCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Execution record interface
 */
export interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  startedAt: string;
  finishedAt?: string;
  duration?: number;
  mode: 'manual' | 'webhook' | 'schedule' | 'retry';
  error?: string;
  nodeResults?: {
    nodeId: string;
    nodeName: string;
    status: 'success' | 'error' | 'skipped';
    duration: number;
    outputItems?: number;
  }[];
}

/**
 * Props for ExecutionHistory component
 */
export interface ExecutionHistoryProps {
  /** Function to fetch execution history */
  onFetchHistory?: () => Promise<ExecutionRecord[]>;
  /** Called when an execution is selected */
  onExecutionSelect?: (execution: ExecutionRecord) => void;
  /** Called when retry is requested */
  onRetry?: (executionId: string) => void;
  /** Called when delete is requested */
  onDelete?: (executionId: string) => void;
  /** Whether the panel is collapsed */
  collapsed?: boolean;
  /** Called when collapse state changes */
  onCollapseChange?: (collapsed: boolean) => void;
  /** Additional class name */
  className?: string;
}

/**
 * Mock execution data generator
 */
function generateMockExecutions(): ExecutionRecord[] {
  const statuses: ExecutionRecord['status'][] = ['success', 'error', 'success', 'success', 'error'];
  const modes: ExecutionRecord['mode'][] = ['manual', 'webhook', 'schedule', 'manual', 'webhook'];

  return Array.from({ length: 10 }, (_, i) => {
    const startTime = new Date(Date.now() - i * 3600000 - Math.random() * 1800000);
    const duration = Math.floor(Math.random() * 5000) + 500;
    const status = statuses[i % statuses.length];

    return {
      id: `exec-${Date.now() - i * 1000}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId: 'demo-workflow-1',
      workflowName: 'Sample API Workflow',
      status,
      startedAt: startTime.toISOString(),
      finishedAt: new Date(startTime.getTime() + duration).toISOString(),
      duration,
      mode: modes[i % modes.length],
      error: status === 'error' ? 'Connection timeout: Failed to connect to external API' : undefined,
      nodeResults: [
        { nodeId: 'node-1', nodeName: 'Start', status: 'success', duration: 10, outputItems: 1 },
        { nodeId: 'node-2', nodeName: 'Fetch Data', status: status === 'error' && i % 2 === 1 ? 'error' : 'success', duration: duration - 100, outputItems: status === 'error' ? 0 : 25 },
        { nodeId: 'node-3', nodeName: 'Filter Posts', status: status === 'error' ? 'skipped' : 'success', duration: 50, outputItems: status === 'error' ? 0 : 10 },
      ],
    };
  });
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

/**
 * Format timestamp for display
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Status icon component - handles both execution and node statuses
 */
function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'running':
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'waiting':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'skipped':
      return <MinusCircle className="w-4 h-4 text-gray-400" />;
    default:
      return null;
  }
}

/**
 * Mode badge component
 */
function ModeBadge({ mode }: { mode: ExecutionRecord['mode'] }) {
  const colors = {
    manual: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    webhook: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    schedule: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    retry: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <span className={cn('px-1.5 py-0.5 text-xs rounded', colors[mode])}>
      {mode}
    </span>
  );
}

/**
 * ExecutionHistory component - displays workflow execution history
 */
export function ExecutionHistory({
  onFetchHistory,
  onExecutionSelect,
  onRetry,
  onDelete,
  collapsed = false,
  onCollapseChange,
  className,
}: ExecutionHistoryProps) {
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch executions
  const fetchExecutions = useCallback(async () => {
    setIsLoading(true);
    try {
      if (onFetchHistory) {
        const data = await onFetchHistory();
        setExecutions(data);
      } else {
        // Use mock data with simulated delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        setExecutions(generateMockExecutions());
      }
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onFetchHistory]);

  // Initial fetch
  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  // Toggle expanded state
  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  if (collapsed) {
    return (
      <div
        className={cn(
          'w-12 h-full bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700',
          'flex flex-col items-center py-4',
          className
        )}
      >
        <button
          onClick={() => onCollapseChange?.(false)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
          title="Show execution history"
        >
          <Clock className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-80 h-full bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700',
        'flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Execution History
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchExecutions}
              disabled={isLoading}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
            <button
              onClick={() => onCollapseChange?.(true)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400"
              title="Collapse"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Execution list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : executions.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No executions yet
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {executions.map((execution) => {
              const isExpanded = expandedId === execution.id;

              return (
                <div key={execution.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  {/* Execution header */}
                  <button
                    className="w-full p-3 text-left"
                    onClick={() => {
                      toggleExpanded(execution.id);
                      onExecutionSelect?.(execution);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <StatusIcon status={execution.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {execution.workflowName}
                          </span>
                          <ModeBadge mode={execution.mode} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatTime(execution.startedAt)}</span>
                          {execution.duration && (
                            <>
                              <span>•</span>
                              <span>{formatDuration(execution.duration)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pl-9">
                      {/* Error message */}
                      {execution.error && (
                        <div className="mb-2 p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {execution.error}
                          </p>
                        </div>
                      )}

                      {/* Node results */}
                      {execution.nodeResults && (
                        <div className="space-y-1 mb-2">
                          {execution.nodeResults.map((node) => (
                            <div
                              key={node.nodeId}
                              className="flex items-center gap-2 text-xs"
                            >
                              <StatusIcon status={node.status} />
                              <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                                {node.nodeName}
                              </span>
                              <span className="text-gray-400">
                                {formatDuration(node.duration)}
                              </span>
                              {node.outputItems !== undefined && (
                                <span className="text-gray-400">
                                  ({node.outputItems} items)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                        {execution.status === 'error' && onRetry && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRetry(execution.id);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          >
                            <Play className="w-3 h-3" />
                            Retry
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(execution.id);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ExecutionHistory;
