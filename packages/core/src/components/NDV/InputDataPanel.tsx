import { memo, useState, useCallback, useMemo } from 'react';
import { Table, Code, GitBranch, ChevronRight, ChevronDown, GripVertical, Play, AlertCircle, Database } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { DataSchema, SchemaProperty } from '../../types';

/**
 * Input data item structure
 */
export interface InputDataItem {
  json: Record<string, unknown>;
  binary?: Record<string, unknown>;
  pairedItem?: { item: number; input?: number };
}

/**
 * Props for InputDataPanel
 */
export interface InputDataPanelProps {
  /** Input data from previous nodes */
  data: InputDataItem[];
  /** Source node name */
  sourceNodeName?: string;
  /** Whether data has been loaded (workflow executed) */
  hasData: boolean;
  /** Whether showing sample/mock data instead of real execution data */
  isSampleData?: boolean;
  /** Schema from connected input node (shown when no data available) */
  inputSchema?: DataSchema;
  /** Called when user wants to run the workflow to get data */
  onRunWorkflow?: () => void;
  /** Called when a field is dragged */
  onDragStart?: (path: string, value: unknown) => void;
  /** Current view mode */
  viewMode?: 'table' | 'json' | 'schema';
  /** Whether workflow is currently executing */
  isLoading?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * InputDataPanel - Shows input data from previous nodes with Table/JSON/Schema views
 * Supports drag and drop of fields to parameter inputs
 */
export const InputDataPanel = memo<InputDataPanelProps>(({
  data,
  sourceNodeName,
  hasData,
  isSampleData = false,
  inputSchema,
  onRunWorkflow,
  onDragStart,
  viewMode: initialViewMode = 'table',
  isLoading = false,
  className,
}) => {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  // Get current item
  const currentItem = data[selectedItemIndex] ?? { json: {} };

  // Handle drag start for a field
  const handleDragStart = useCallback((path: string, value: unknown) => (e: React.DragEvent) => {
    e.dataTransfer.setData('application/kerdar-expression', JSON.stringify({ path, value }));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart?.(path, value);
  }, [onDragStart]);

  if (!hasData) {
    // If we have an input schema, show it instead of the empty state
    if (inputSchema && inputSchema.properties && Object.keys(inputSchema.properties).length > 0) {
      return (
        <div className={cn('flex flex-col h-full bg-gray-50 dark:bg-slate-900', className)}>
          <PanelHeader
            title="INPUT"
            sourceNodeName={sourceNodeName}
            viewMode="schema"
            onViewModeChange={() => {}} // Schema only when no data
          />
          {/* Schema available banner */}
          <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400">
              <Database className="w-3.5 h-3.5" />
              <span>Showing expected input schema from connected node</span>
            </div>
            {onRunWorkflow && (
              <button
                onClick={onRunWorkflow}
                disabled={isLoading}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                  'bg-blue-500 hover:bg-blue-600 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors'
                )}
              >
                {isLoading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    Run
                  </>
                )}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            <InputSchemaView schema={inputSchema} onDragStart={handleDragStart} />
          </div>
        </div>
      );
    }

    return (
      <div className={cn('flex flex-col h-full bg-gray-50 dark:bg-slate-900', className)}>
        <PanelHeader
          title="INPUT"
          sourceNodeName={sourceNodeName}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            No input data available.<br />
            Run the workflow to see data from previous nodes.
          </p>
          {onRunWorkflow && (
            <button
              onClick={onRunWorkflow}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg',
                'bg-blue-500 hover:bg-blue-600 text-white',
                'text-sm font-medium transition-colors'
              )}
            >
              <Play className="w-4 h-4" />
              Run Workflow
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-gray-50 dark:bg-slate-900', className)}>
      <PanelHeader
        title="INPUT"
        sourceNodeName={sourceNodeName}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        itemCount={data.length}
        selectedItem={selectedItemIndex}
        onSelectItem={setSelectedItemIndex}
      />

      {/* Sample data banner */}
      {isSampleData && (
        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Showing sample data. Run workflow for real data.</span>
          </div>
          {onRunWorkflow && (
            <button
              onClick={onRunWorkflow}
              disabled={isLoading}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                'bg-amber-500 hover:bg-amber-600 text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors'
              )}
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Run
                </>
              )}
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {viewMode === 'table' && (
          <TableView
            data={currentItem.json}
            onDragStart={handleDragStart}
          />
        )}
        {viewMode === 'json' && (
          <JsonView
            data={currentItem.json}
            onDragStart={handleDragStart}
          />
        )}
        {viewMode === 'schema' && (
          <SchemaView
            data={currentItem.json}
            onDragStart={handleDragStart}
          />
        )}
      </div>
    </div>
  );
});

InputDataPanel.displayName = 'InputDataPanel';

/**
 * Panel header with view mode switcher
 */
interface PanelHeaderProps {
  title: string;
  sourceNodeName?: string;
  viewMode: 'table' | 'json' | 'schema';
  onViewModeChange: (mode: 'table' | 'json' | 'schema') => void;
  itemCount?: number;
  selectedItem?: number;
  onSelectItem?: (index: number) => void;
}

function PanelHeader({
  title,
  sourceNodeName,
  viewMode,
  onViewModeChange,
  itemCount = 0,
  selectedItem = 0,
  onSelectItem,
}: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </span>
        {sourceNodeName && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            from {sourceNodeName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Item selector */}
        {itemCount > 1 && onSelectItem && (
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={() => onSelectItem(Math.max(0, selectedItem - 1))}
              disabled={selectedItem === 0}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <ChevronRight className="w-3 h-3 rotate-180" />
            </button>
            <span className="text-xs text-gray-500 min-w-[50px] text-center">
              {selectedItem + 1} / {itemCount}
            </span>
            <button
              onClick={() => onSelectItem(Math.min(itemCount - 1, selectedItem + 1))}
              disabled={selectedItem === itemCount - 1}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* View mode switcher */}
        <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5">
          <ViewModeButton
            active={viewMode === 'table'}
            onClick={() => onViewModeChange('table')}
            icon={<Table className="w-3.5 h-3.5" />}
            title="Table"
          />
          <ViewModeButton
            active={viewMode === 'json'}
            onClick={() => onViewModeChange('json')}
            icon={<Code className="w-3.5 h-3.5" />}
            title="JSON"
          />
          <ViewModeButton
            active={viewMode === 'schema'}
            onClick={() => onViewModeChange('schema')}
            icon={<GitBranch className="w-3.5 h-3.5" />}
            title="Schema"
          />
        </div>
      </div>
    </div>
  );
}

function ViewModeButton({
  active,
  onClick,
  icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        active
          ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      )}
    >
      {icon}
    </button>
  );
}

/**
 * Table view - shows data as a flat table
 */
interface DataViewProps {
  data: Record<string, unknown>;
  onDragStart: (path: string, value: unknown) => (e: React.DragEvent) => void;
  parentPath?: string;
}

function TableView({ data, onDragStart, parentPath = '$json' }: DataViewProps) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-400">
        No data
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 dark:bg-slate-800 sticky top-0">
          <tr>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 w-8"></th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Field</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value]) => {
            const path = `${parentPath}.${key}`;
            const displayValue = formatValue(value);

            return (
              <tr
                key={key}
                draggable
                onDragStart={onDragStart(path, value)}
                className="border-b border-gray-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-grab active:cursor-grabbing group"
              >
                <td className="px-2 py-2">
                  <GripVertical className="w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100" />
                </td>
                <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                  {key}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                  {displayValue}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * JSON view - shows raw JSON with syntax highlighting
 */
function JsonView({ data, onDragStart, parentPath = '$json' }: DataViewProps) {
  return (
    <div className="p-3">
      <JsonTree data={data} onDragStart={onDragStart} path={parentPath} level={0} />
    </div>
  );
}

interface JsonTreeProps {
  data: unknown;
  onDragStart: (path: string, value: unknown) => (e: React.DragEvent) => void;
  path: string;
  level: number;
}

function JsonTree({ data, onDragStart, path, level }: JsonTreeProps) {
  const [expanded, setExpanded] = useState(level < 2);

  if (data === null) {
    return <span className="text-gray-400">null</span>;
  }

  if (typeof data === 'undefined') {
    return <span className="text-gray-400">undefined</span>;
  }

  if (typeof data === 'string') {
    return <span className="text-green-600 dark:text-green-400">"{data}"</span>;
  }

  if (typeof data === 'number') {
    return <span className="text-blue-600 dark:text-blue-400">{data}</span>;
  }

  if (typeof data === 'boolean') {
    return <span className="text-purple-600 dark:text-purple-400">{data.toString()}</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-gray-500">[]</span>;
    }

    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center text-gray-500 hover:text-gray-700"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="text-gray-400 ml-1">[{data.length}]</span>
        </button>
        {expanded && (
          <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
            {data.map((item, index) => (
              <div
                key={index}
                draggable
                onDragStart={onDragStart(`${path}[${index}]`, item)}
                className="py-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-grab"
              >
                <span className="text-gray-400 mr-2">{index}:</span>
                <JsonTree data={item} onDragStart={onDragStart} path={`${path}[${index}]`} level={level + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) {
      return <span className="text-gray-500">{'{}'}</span>;
    }

    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center text-gray-500 hover:text-gray-700"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="text-gray-400 ml-1">{'{...}'}</span>
        </button>
        {expanded && (
          <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
            {entries.map(([key, value]) => (
              <div
                key={key}
                draggable
                onDragStart={onDragStart(`${path}.${key}`, value)}
                className="py-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-grab"
              >
                <span className="text-amber-600 dark:text-amber-400 mr-1">"{key}"</span>
                <span className="text-gray-400 mr-1">:</span>
                <JsonTree data={value} onDragStart={onDragStart} path={`${path}.${key}`} level={level + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <span className="text-gray-500">{String(data)}</span>;
}

/**
 * Schema view - shows data structure/schema
 */
function SchemaView({ data, onDragStart, parentPath = '$json' }: DataViewProps) {
  const schema = useMemo(() => inferSchema(data), [data]);

  return (
    <div className="p-3">
      <SchemaTree schema={schema} onDragStart={onDragStart} path={parentPath} level={0} />
    </div>
  );
}

interface SchemaNode {
  type: string;
  properties?: Record<string, SchemaNode>;
  items?: SchemaNode;
}

function inferSchema(data: unknown): SchemaNode {
  if (data === null) return { type: 'null' };
  if (typeof data === 'undefined') return { type: 'undefined' };
  if (typeof data === 'string') return { type: 'string' };
  if (typeof data === 'number') return { type: 'number' };
  if (typeof data === 'boolean') return { type: 'boolean' };

  if (Array.isArray(data)) {
    return {
      type: 'array',
      items: data.length > 0 ? inferSchema(data[0]) : { type: 'unknown' },
    };
  }

  if (typeof data === 'object') {
    const properties: Record<string, SchemaNode> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      properties[key] = inferSchema(value);
    }
    return { type: 'object', properties };
  }

  return { type: 'unknown' };
}

interface SchemaTreeProps {
  schema: SchemaNode;
  onDragStart: (path: string, value: unknown) => (e: React.DragEvent) => void;
  path: string;
  level: number;
}

function SchemaTree({ schema, onDragStart, path, level }: SchemaTreeProps) {
  const [expanded, setExpanded] = useState(level < 3);

  const typeColors: Record<string, string> = {
    string: 'text-green-600 dark:text-green-400',
    number: 'text-blue-600 dark:text-blue-400',
    boolean: 'text-purple-600 dark:text-purple-400',
    null: 'text-gray-400',
    undefined: 'text-gray-400',
    array: 'text-amber-600 dark:text-amber-400',
    object: 'text-pink-600 dark:text-pink-400',
    unknown: 'text-gray-400',
  };

  if (schema.type === 'object' && schema.properties) {
    const entries = Object.entries(schema.properties);

    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center text-gray-500 hover:text-gray-700"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className={cn('ml-1 text-xs', typeColors.object)}>object</span>
        </button>
        {expanded && (
          <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
            {entries.map(([key, propSchema]) => (
              <div
                key={key}
                draggable
                onDragStart={onDragStart(`${path}.${key}`, null)}
                className="py-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-grab flex items-center gap-2"
              >
                <GripVertical className="w-3 h-3 text-gray-300" />
                <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">{key}</span>
                <span className="text-gray-400">:</span>
                <SchemaTree schema={propSchema} onDragStart={onDragStart} path={`${path}.${key}`} level={level + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (schema.type === 'array' && schema.items) {
    return (
      <div className="inline-flex items-center gap-1">
        <span className={cn('text-xs', typeColors.array)}>array</span>
        <span className="text-gray-400">&lt;</span>
        <SchemaTree schema={schema.items} onDragStart={onDragStart} path={`${path}[0]`} level={level + 1} />
        <span className="text-gray-400">&gt;</span>
      </div>
    );
  }

  return <span className={cn('text-xs', typeColors[schema.type] || typeColors.unknown)}>{schema.type}</span>;
}

/**
 * Format value for display
 */
function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value.length > 50 ? value.slice(0, 50) + '...' : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return '{...}';
  return String(value);
}

/**
 * Input schema view - shows schema from connected node's output schema
 */
interface InputSchemaViewProps {
  schema: DataSchema;
  onDragStart: (path: string, value: unknown) => (e: React.DragEvent) => void;
  parentPath?: string;
}

function InputSchemaView({ schema, onDragStart, parentPath = '$json' }: InputSchemaViewProps) {
  return (
    <div className="p-3">
      <DataSchemaTree
        properties={schema.properties}
        onDragStart={onDragStart}
        path={parentPath}
        level={0}
      />
    </div>
  );
}

interface DataSchemaTreeProps {
  properties: Record<string, SchemaProperty>;
  onDragStart: (path: string, value: unknown) => (e: React.DragEvent) => void;
  path: string;
  level: number;
}

function DataSchemaTree({ properties, onDragStart, path, level }: DataSchemaTreeProps) {
  const typeColors: Record<string, string> = {
    string: 'text-green-600 dark:text-green-400',
    number: 'text-blue-600 dark:text-blue-400',
    integer: 'text-blue-600 dark:text-blue-400',
    boolean: 'text-purple-600 dark:text-purple-400',
    null: 'text-gray-400',
    array: 'text-amber-600 dark:text-amber-400',
    object: 'text-pink-600 dark:text-pink-400',
  };

  const entries = Object.entries(properties);

  return (
    <div className={cn(level > 0 && 'ml-4 border-l border-gray-200 dark:border-gray-700 pl-2')}>
      {entries.map(([key, prop]) => {
        const propPath = `${path}.${key}`;

        return (
          <SchemaPropertyRow
            key={key}
            name={key}
            property={prop}
            path={propPath}
            level={level}
            onDragStart={onDragStart}
            typeColors={typeColors}
          />
        );
      })}
    </div>
  );
}

interface SchemaPropertyRowProps {
  name: string;
  property: SchemaProperty;
  path: string;
  level: number;
  onDragStart: (path: string, value: unknown) => (e: React.DragEvent) => void;
  typeColors: Record<string, string>;
}

function SchemaPropertyRow({ name, property, path, level, onDragStart, typeColors }: SchemaPropertyRowProps) {
  const [expanded, setExpanded] = useState(level < 2);

  const propType = Array.isArray(property.type) ? property.type[0] : property.type;
  const isObject = propType === 'object' && property.properties;
  const isArray = propType === 'array' && property.items;
  const isExpandable = isObject || isArray;

  return (
    <div className="py-0.5">
      <div
        draggable
        onDragStart={onDragStart(path, null)}
        className="hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-grab flex items-center gap-2 py-0.5 px-1 rounded"
      >
        <GripVertical className="w-3 h-3 text-gray-300" />
        {isExpandable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        )}
        <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">{name}</span>
        {property.required && <span className="text-red-500 text-xs">*</span>}
        <span className="text-gray-400">:</span>
        <span className={cn('text-xs', typeColors[propType] || 'text-gray-400')}>
          {propType}
          {isArray && property.items && (
            <>
              <span className="text-gray-400">&lt;</span>
              {Array.isArray(property.items.type) ? property.items.type[0] : property.items.type}
              <span className="text-gray-400">&gt;</span>
            </>
          )}
        </span>
        {property.example !== undefined && (
          <span className="text-gray-400 ml-2 text-xs">
            (e.g., {formatValue(property.example)})
          </span>
        )}
      </div>

      {/* Nested properties for objects */}
      {isObject && expanded && property.properties && (
        <DataSchemaTree
          properties={property.properties}
          onDragStart={onDragStart}
          path={path}
          level={level + 1}
        />
      )}

      {/* Array item properties */}
      {isArray && expanded && property.items?.properties && (
        <DataSchemaTree
          properties={property.items.properties}
          onDragStart={onDragStart}
          path={`${path}[0]`}
          level={level + 1}
        />
      )}
    </div>
  );
}

export default InputDataPanel;
