import React, { memo, useCallback, useMemo, useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
  MoreHorizontal,
  StickyNote,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Ban,
  Key,
  Trash2,
  Copy,
  Settings,
  Power,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNodeType } from '../../store/node-registry-store';
import { useNodeStatus } from '../../store/execution-store';
import { useTheme } from '../../store/theme-store';
import type { WorkflowNode, NodeTypeDefinition } from '../../types';
import { NodeCategory, NodeInputType, NodeOutputType } from '../../types';
import { NodeIcon } from './NodeIcon';

/**
 * Base node data passed from ReactFlow
 */
export interface BaseNodeData extends WorkflowNode {
  selected?: boolean;
  onConfigure?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggleDisable?: () => void;
  onExecute?: () => void;
}

/**
 * Props for the BaseNode component
 */
export interface BaseNodeProps extends NodeProps<BaseNodeData> {}

/**
 * Get color for node category
 */
function getCategoryColor(category: NodeCategory): string {
  const colors: Record<NodeCategory, string> = {
    [NodeCategory.Trigger]: 'var(--kd-node-trigger, #8B5CF6)',
    [NodeCategory.Action]: 'var(--kd-node-action, #3B82F6)',
    [NodeCategory.Logic]: 'var(--kd-node-logic, #F59E0B)',
    [NodeCategory.Data]: 'var(--kd-node-data, #10B981)',
    [NodeCategory.Integration]: 'var(--kd-node-integration, #EC4899)',
    [NodeCategory.AI]: 'var(--kd-node-ai, #6366F1)',
    [NodeCategory.Database]: 'var(--kd-node-database, #14B8A6)',
    [NodeCategory.Communication]: 'var(--kd-node-communication, #F97316)',
    [NodeCategory.Custom]: 'var(--kd-node-custom, #64748B)',
  };
  return colors[category] || colors[NodeCategory.Custom];
}

/**
 * Get status icon component
 */
function StatusIndicator({ status }: { status?: string }) {
  switch (status) {
    case 'running':
      return (
        <div className="animate-pulse-glow">
          <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
        </div>
      );
    case 'success':
      return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-3 h-3 text-red-500" />;
    case 'skipped':
      return <Ban className="w-3 h-3 text-gray-400" />;
    default:
      return null;
  }
}

/**
 * Node handle (port) component
 */
interface NodeHandleProps {
  type: 'source' | 'target';
  position: Position;
  id: string;
  handleType: NodeInputType | NodeOutputType;
  label?: string;
  isConnected?: boolean;
  style?: React.CSSProperties;
}

function NodeHandle({
  type,
  position,
  id,
  handleType,
  label: _label,
  isConnected,
  style,
}: NodeHandleProps) {
  const isError = handleType === NodeOutputType.Error;

  return (
    <Handle
      type={type}
      position={position}
      id={id}
      className={cn(
        '!w-3 !h-3 rounded-full border-2 transition-colors duration-150',
        'hover:border-blue-500',
        isError
          ? 'bg-red-500 border-red-600 hover:border-red-400'
          : isConnected
          ? 'bg-blue-500 border-blue-600'
          : 'bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600'
      )}
      style={style}
    />
  );
}

/**
 * BaseNode component - renders workflow nodes in n8n style
 */
export const BaseNode = memo<BaseNodeProps>(({ data, selected, dragging }) => {
  const [showMenu, setShowMenu] = useState(false);
  const nodeType = useNodeType(data.type);
  const executionStatus = useNodeStatus(data.id);
  useTheme(); // Subscribe to theme changes for re-render

  const categoryColor = useMemo(() => {
    if (data.color) return data.color;
    if (nodeType?.category) return getCategoryColor(nodeType.category);
    return getCategoryColor(NodeCategory.Custom);
  }, [data.color, nodeType?.category]);

  // Get subtitle
  const subtitle = useMemo(() => {
    if (!nodeType?.subtitle) return null;
    if (typeof nodeType.subtitle === 'function') {
      return nodeType.subtitle(data);
    }
    return nodeType.subtitle;
  }, [nodeType?.subtitle, data]);

  // Generate handles
  const { inputHandles, outputHandles } = useMemo(() => {
    const inputs = nodeType?.inputs ?? [{ type: NodeInputType.Main }];
    const outputs = nodeType?.outputs ?? [{ type: NodeOutputType.Main }];

    const inputHandles = inputs.map((input, index) => ({
      id: `input-${index}`,
      type: input.type,
      label: input.displayName,
    }));

    const outputHandles = outputs.map((output, index) => ({
      id: `output-${index}`,
      type: output.type,
      label: output.displayName,
    }));

    return { inputHandles, outputHandles };
  }, [nodeType]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowMenu(true);
    },
    []
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      data.onConfigure?.();
    },
    [data]
  );

  const handleMenuAction = useCallback(
    (action: 'configure' | 'delete' | 'duplicate' | 'disable') => {
      setShowMenu(false);
      switch (action) {
        case 'configure':
          data.onConfigure?.();
          break;
        case 'delete':
          data.onDelete?.();
          break;
        case 'duplicate':
          data.onDuplicate?.();
          break;
        case 'disable':
          data.onToggleDisable?.();
          break;
      }
    },
    [data]
  );

  const isDisabled = data.disabled ?? false;
  const hasCredentials = data.credentials && Object.keys(data.credentials).length > 0;
  const hasNotes = !!data.notes;
  const hasError = executionStatus?.status === 'error';

  return (
    <div
      className={cn(
        'group relative',
        'w-[200px]',
        'rounded-lg',
        'bg-white dark:bg-slate-800',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200',
        selected && 'ring-2 ring-primary ring-offset-1 dark:ring-offset-slate-900',
        isDisabled && 'opacity-50',
        dragging && 'cursor-grabbing shadow-lg scale-105',
        hasError && 'ring-2 ring-red-500'
      )}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      style={{
        '--node-color': categoryColor,
      } as React.CSSProperties}
    >
      {/* Icon Badge - Top Left */}
      <div
        className="absolute -top-3 -left-3 w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
        style={{ backgroundColor: categoryColor }}
      >
        <NodeIcon
          icon={nodeType?.icon}
          color="#ffffff"
          className="w-5 h-5"
        />
      </div>

      {/* Node Content */}
      <div className="pt-5 pb-3 px-3 pl-8">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {data.name}
            </div>
            {subtitle && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {subtitle}
              </div>
            )}
          </div>

          {/* Status & Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {executionStatus?.status && (
              <StatusIndicator status={executionStatus.status} />
            )}
            {hasCredentials && (
              <Key className="w-3 h-3 text-amber-500" />
            )}
            {hasNotes && (
              <StickyNote className="w-3 h-3 text-blue-500" />
            )}

            {/* Menu button */}
            <button
              className={cn(
                'p-1 rounded opacity-0 group-hover:opacity-100',
                'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                'hover:bg-gray-100 dark:hover:bg-slate-700',
                'transition-all'
              )}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Parameter Preview */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {nodeType?.customization?.renderPreview ? (
            nodeType.customization.renderPreview(data)
          ) : (
            <ParameterPreview node={data} nodeType={nodeType} />
          )}
        </div>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <>
          {/* Invisible overlay to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
            }}
          />
          <div
            className="absolute top-full right-0 mt-1 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 min-w-[140px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                handleMenuAction('configure');
              }}
            >
              <Settings className="w-4 h-4" />
              Configure
            </button>
            <button
              className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                handleMenuAction('duplicate');
              }}
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <button
              className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                handleMenuAction('disable');
              }}
            >
              <Power className="w-4 h-4" />
              {isDisabled ? 'Enable' : 'Disable'}
            </button>
            <div className="border-t border-gray-200 dark:border-slate-700 my-1" />
            <button
              className="w-full px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                handleMenuAction('delete');
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Input handles */}
      {inputHandles.map((handle, index) => (
        <NodeHandle
          key={handle.id}
          type="target"
          position={Position.Left}
          id={handle.id}
          handleType={handle.type}
          label={handle.label}
          style={{
            top: `${((index + 1) / (inputHandles.length + 1)) * 100}%`,
          }}
        />
      ))}

      {/* Output handles */}
      {outputHandles.map((handle, index) => (
        <NodeHandle
          key={handle.id}
          type="source"
          position={Position.Right}
          id={handle.id}
          handleType={handle.type}
          label={handle.label}
          style={{
            top: `${((index + 1) / (outputHandles.length + 1)) * 100}%`,
          }}
        />
      ))}

      {/* Disabled overlay */}
      {isDisabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10 dark:bg-gray-900/30 rounded-lg">
          <Ban className="w-6 h-6 text-gray-400" />
        </div>
      )}

      {/* Running glow effect */}
      {executionStatus?.status === 'running' && (
        <div
          className="absolute inset-0 rounded-lg animate-pulse pointer-events-none"
          style={{
            boxShadow: `0 0 15px 3px ${categoryColor}50`,
          }}
        />
      )}

      {/* Success indicator */}
      {executionStatus?.status === 'success' && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Error indicator */}
      {executionStatus?.status === 'error' && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <AlertCircle className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
});

BaseNode.displayName = 'BaseNode';

/**
 * Parameter preview component
 */
interface ParameterPreviewProps {
  node: WorkflowNode;
  nodeType?: NodeTypeDefinition;
}

function ParameterPreview({ node, nodeType }: ParameterPreviewProps) {
  if (!nodeType || !nodeType.properties.length) {
    return (
      <div className="text-xs text-gray-400 italic">
        Click to configure
      </div>
    );
  }

  // Show first 2-3 important parameters
  const previewParams = nodeType.properties
    .filter((p) => p.required || p.default !== undefined)
    .slice(0, 3);

  if (previewParams.length === 0) {
    return (
      <div className="text-xs text-gray-400 italic">
        Click to configure
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {previewParams.map((param) => {
        const value = node.parameters[param.name];
        const displayValue = formatPreviewValue(value);

        return (
          <div
            key={param.name}
            className="flex items-center gap-2 text-xs"
          >
            <span className="text-gray-500 dark:text-gray-400">
              {param.displayName}:
            </span>
            <span className="text-gray-700 dark:text-gray-200 truncate max-w-[140px]">
              {displayValue || (
                <span className="italic text-gray-400">not set</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Format value for preview display
 */
function formatPreviewValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    // Truncate long strings
    if (value.length > 30) {
      return value.slice(0, 30) + '...';
    }
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  if (typeof value === 'object') {
    return '{...}';
  }
  return String(value);
}

export default BaseNode;
