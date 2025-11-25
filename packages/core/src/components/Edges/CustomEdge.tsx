import React, { memo, useCallback, useMemo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from 'reactflow';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useWorkflowStore } from '../../store/workflow-store';
import { useExecutionStore } from '../../store/execution-store';
import type { WorkflowEdgeData } from '../../types';
import { EdgeType } from '../../types';

/**
 * Custom edge data
 */
export interface CustomEdgeData extends WorkflowEdgeData {
  animated?: boolean;
  selected?: boolean;
  type?: EdgeType;
}

/**
 * Custom edge component that renders workflow connections
 * Supports different edge types, labels, and animated flow visualization
 */
export const CustomEdge = memo<EdgeProps<CustomEdgeData>>(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  selected,
  markerEnd,
}) => {
  const removeEdge = useWorkflowStore((state) => state.removeEdge);
  const executionStatus = useExecutionStore((state) => state.executionStatus);
  const isExecuting = useExecutionStore((state) => state.isExecuting);

  // Determine edge type and calculate path
  const edgeType = data?.type ?? EdgeType.Default;

  const { path, labelX, labelY } = useMemo(() => {
    let edgePath: string;
    let labelX: number;
    let labelY: number;

    switch (edgeType) {
      case EdgeType.Step:
        [edgePath, labelX, labelY] = getSmoothStepPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
          sourcePosition,
          targetPosition,
          borderRadius: 8,
        });
        break;
      case EdgeType.Straight:
        [edgePath, labelX, labelY] = getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        });
        break;
      case EdgeType.Smooth:
      case EdgeType.Default:
      default:
        [edgePath, labelX, labelY] = getBezierPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
          sourcePosition,
          targetPosition,
          curvature: 0.25,
        });
        break;
    }

    return { path: edgePath, labelX, labelY };
  }, [edgeType, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  // Handle edge deletion
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      removeEdge(id);
    },
    [id, removeEdge]
  );

  // Determine edge color and animation
  const isAnimated = data?.animated || (isExecuting && executionStatus === 'running');
  const showLabel = !!data?.label;

  // Edge styles
  const edgeStyles = useMemo(() => {
    const baseStyles: React.CSSProperties = {
      strokeWidth: selected ? 3 : 2,
      stroke: selected
        ? 'var(--kd-edge-selected, #3B82F6)'
        : 'var(--kd-edge-color, #94A3B8)',
      ...style,
    };

    if (isAnimated) {
      baseStyles.strokeDasharray = '5 5';
      baseStyles.animation = 'flow 0.5s linear infinite';
    }

    return baseStyles;
  }, [selected, style, isAnimated]);

  return (
    <>
      {/* Invisible wider path for easier selection */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
      />

      {/* Actual edge */}
      <BaseEdge
        id={id}
        path={path}
        style={edgeStyles}
        markerEnd={markerEnd}
      />

      {/* Edge label and controls */}
      <EdgeLabelRenderer>
        {/* Delete button (shown on hover/selection) */}
        <div
          className={cn(
            'absolute pointer-events-auto nodrag nopan',
            'flex items-center justify-center',
            'opacity-0 hover:opacity-100 transition-opacity',
            selected && 'opacity-100'
          )}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          <button
            onClick={handleDelete}
            className={cn(
              'p-1 rounded-full',
              'bg-white dark:bg-slate-800',
              'border border-gray-200 dark:border-slate-700',
              'shadow-sm hover:shadow-md',
              'text-gray-500 hover:text-red-500',
              'transition-all'
            )}
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Edge label */}
        {showLabel && (
          <div
            className={cn(
              'absolute pointer-events-auto nodrag nopan',
              'px-2 py-0.5 rounded',
              'bg-white dark:bg-slate-800',
              'border border-gray-200 dark:border-slate-700',
              'text-xs text-gray-600 dark:text-gray-300',
              'shadow-sm'
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 20}px)`,
            }}
          >
            {data.label}
          </div>
        )}

        {/* Condition indicator */}
        {data?.condition && (
          <div
            className={cn(
              'absolute pointer-events-none',
              'px-1.5 py-0.5 rounded-full',
              'bg-amber-100 dark:bg-amber-900/30',
              'text-xs text-amber-700 dark:text-amber-400',
              'border border-amber-300 dark:border-amber-700'
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + 15}px)`,
            }}
          >
            {data.condition}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
});

CustomEdge.displayName = 'CustomEdge';

/**
 * Animated edge for execution visualization
 */
export const AnimatedEdge = memo<EdgeProps<CustomEdgeData>>((props) => {
  return <CustomEdge {...props} data={{ ...props.data, animated: true }} />;
});

AnimatedEdge.displayName = 'AnimatedEdge';

/**
 * Error edge (red colored)
 */
export const ErrorEdge = memo<EdgeProps<CustomEdgeData>>((props) => {
  return (
    <CustomEdge
      {...props}
      style={{
        ...props.style,
        stroke: 'var(--kd-status-error, #EF4444)',
      }}
    />
  );
});

ErrorEdge.displayName = 'ErrorEdge';

/**
 * Success edge (green colored)
 */
export const SuccessEdge = memo<EdgeProps<CustomEdgeData>>((props) => {
  return (
    <CustomEdge
      {...props}
      style={{
        ...props.style,
        stroke: 'var(--kd-status-success, #10B981)',
      }}
    />
  );
});

SuccessEdge.displayName = 'SuccessEdge';

/**
 * Edge types map for ReactFlow
 */
export const edgeTypes = {
  default: CustomEdge,
  custom: CustomEdge,
  animated: AnimatedEdge,
  error: ErrorEdge,
  success: SuccessEdge,
};

export default CustomEdge;
