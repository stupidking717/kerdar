import React, { useState, useMemo, useCallback } from 'react';
import { Search, ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNodeTypes } from '../../store/node-registry-store';
import { NodeIcon } from '../Nodes/NodeIcon';
import type { NodeTypeDefinition } from '../../types';

/**
 * Props for the NodeSidebar component
 */
export interface NodeSidebarProps {
  /** Called when a node is dragged from the sidebar */
  onNodeDragStart?: (nodeType: NodeTypeDefinition, event: React.DragEvent) => void;
  /** Called when a node is clicked to add it to the canvas */
  onNodeClick?: (nodeType: NodeTypeDefinition) => void;
  /** Whether the sidebar is collapsed */
  collapsed?: boolean;
  /** Called when collapse state changes */
  onCollapseChange?: (collapsed: boolean) => void;
  /** Additional class name */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

/**
 * Category display names and colors
 */
const categoryConfig: Record<string, { name: string; color: string }> = {
  trigger: { name: 'Triggers', color: '#8B5CF6' },
  action: { name: 'Actions', color: '#3B82F6' },
  logic: { name: 'Flow Control', color: '#F59E0B' },
  data: { name: 'Data', color: '#10B981' },
  integration: { name: 'Integrations', color: '#EC4899' },
  ai: { name: 'AI', color: '#6366F1' },
  database: { name: 'Database', color: '#14B8A6' },
  communication: { name: 'Communication', color: '#F97316' },
  custom: { name: 'Custom', color: '#64748B' },
};

/**
 * NodeSidebar component - displays available nodes organized by category
 */
export function NodeSidebar({
  onNodeDragStart,
  onNodeClick,
  collapsed = false,
  onCollapseChange,
  className,
  style,
}: NodeSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['trigger', 'action', 'logic']));

  const nodeTypes = useNodeTypes();

  // Filter nodes by search query
  const filteredNodeTypes = useMemo(() => {
    if (!searchQuery.trim()) return nodeTypes;

    const query = searchQuery.toLowerCase();
    return nodeTypes.filter(
      (node) =>
        node.displayName.toLowerCase().includes(query) ||
        node.description?.toLowerCase().includes(query) ||
        node.name.toLowerCase().includes(query)
    );
  }, [nodeTypes, searchQuery]);

  // Group filtered nodes by category
  const nodesByCategory = useMemo(() => {
    const grouped: Record<string, NodeTypeDefinition[]> = {};

    for (const node of filteredNodeTypes) {
      const category = node.category?.toLowerCase() || 'custom';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(node);
    }

    return grouped;
  }, [filteredNodeTypes]);

  // Toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Handle drag start
  const handleDragStart = useCallback(
    (nodeType: NodeTypeDefinition, event: React.DragEvent) => {
      event.dataTransfer.setData('application/kerdar-node', JSON.stringify({
        type: nodeType.type,
        name: nodeType.name,
      }));
      event.dataTransfer.effectAllowed = 'copy';
      onNodeDragStart?.(nodeType, event);
    },
    [onNodeDragStart]
  );

  // Handle node click
  const handleNodeClick = useCallback(
    (nodeType: NodeTypeDefinition) => {
      onNodeClick?.(nodeType);
    },
    [onNodeClick]
  );

  if (collapsed) {
    return (
      <div
        className={cn(
          'w-12 h-full bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700',
          'flex flex-col items-center py-4 gap-2',
          className
        )}
        style={style}
      >
        <button
          onClick={() => onCollapseChange?.(false)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
          title="Expand sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-64 h-full bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700',
        'flex flex-col',
        className
      )}
      style={style}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Nodes</h2>
          <button
            onClick={() => onCollapseChange?.(true)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400"
            title="Collapse sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-8 pr-3 py-2 text-sm rounded-lg',
              'bg-gray-100 dark:bg-slate-700',
              'border border-transparent',
              'focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
              'text-gray-900 dark:text-gray-100',
              'placeholder-gray-400 dark:placeholder-gray-500'
            )}
          />
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(nodesByCategory).map(([category, nodes]) => {
          const config = categoryConfig[category] || categoryConfig.custom;
          const isExpanded = expandedCategories.has(category) || searchQuery.trim() !== '';

          return (
            <div key={category} className="border-b border-gray-100 dark:border-slate-700 last:border-b-0">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2',
                  'hover:bg-gray-50 dark:hover:bg-slate-700/50',
                  'transition-colors'
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {config.name}
                </span>
                <span className="ml-auto text-xs text-gray-400">
                  {nodes.length}
                </span>
              </button>

              {/* Nodes in category */}
              {isExpanded && (
                <div className="pb-2">
                  {nodes.map((nodeType) => (
                    <NodeItem
                      key={nodeType.type}
                      nodeType={nodeType}
                      onDragStart={handleDragStart}
                      onClick={handleNodeClick}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {Object.keys(nodesByCategory).length === 0 && (
          <div className="p-4 text-center text-sm text-gray-400">
            {searchQuery ? 'No nodes match your search' : 'No nodes available'}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Props for NodeItem component
 */
interface NodeItemProps {
  nodeType: NodeTypeDefinition;
  onDragStart?: (nodeType: NodeTypeDefinition, event: React.DragEvent) => void;
  onClick?: (nodeType: NodeTypeDefinition) => void;
}

/**
 * Individual node item in the sidebar
 */
function NodeItem({ nodeType, onDragStart, onClick }: NodeItemProps) {
  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      onDragStart?.(nodeType, event);
    },
    [nodeType, onDragStart]
  );

  const handleClick = useCallback(() => {
    onClick?.(nodeType);
  }, [nodeType, onClick]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      className={cn(
        'mx-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing',
        'flex items-center gap-2',
        'hover:bg-gray-100 dark:hover:bg-slate-700',
        'transition-colors group'
      )}
    >
      <GripVertical className="w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      <NodeIcon
        icon={nodeType.icon}
        color={nodeType.iconColor}
        className="w-5 h-5 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-700 dark:text-gray-200 truncate">
          {nodeType.displayName}
        </div>
        {nodeType.description && (
          <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {nodeType.description}
          </div>
        )}
      </div>
    </div>
  );
}

export default NodeSidebar;
