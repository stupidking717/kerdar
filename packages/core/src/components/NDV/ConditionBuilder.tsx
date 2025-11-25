import { memo, useCallback, useState } from 'react';
import { Plus, Trash2, GripVertical, FolderPlus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ExpressionEditor, isExpression, type ExpressionContext } from './ExpressionEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select';
import { ComparisonOperation, CombineConditionMode } from '../../types';

/**
 * Single condition structure
 */
export interface Condition {
  value1: string;
  operation: ComparisonOperation;
  value2: string;
}

/**
 * Condition group - can contain conditions or nested groups
 */
export interface ConditionGroup {
  id: string;
  combineMode: CombineConditionMode;
  conditions: Condition[];
  groups: ConditionGroup[];
}

/**
 * Props for ConditionBuilder
 */
export interface ConditionBuilderProps {
  /** Array of conditions (legacy flat format) */
  conditions: Condition[];
  /** Combine mode (AND/OR) - for legacy flat format */
  combineMode: CombineConditionMode;
  /** Called when conditions change */
  onConditionsChange: (conditions: Condition[]) => void;
  /** Called when combine mode changes */
  onCombineModeChange: (mode: CombineConditionMode) => void;
  /** Root condition group (for nested groups) */
  rootGroup?: ConditionGroup;
  /** Called when root group changes (for nested groups) */
  onRootGroupChange?: (group: ConditionGroup) => void;
  /** Expression context for autocomplete */
  expressionContext?: ExpressionContext;
  /** Node ID for schema-aware autocomplete */
  nodeId?: string;
  /** Enable nested groups feature */
  enableGroups?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Operations that don't need a second value
 */
const UNARY_OPERATIONS = [
  ComparisonOperation.IsEmpty,
  ComparisonOperation.IsNotEmpty,
  ComparisonOperation.IsTrue,
  ComparisonOperation.IsFalse,
];

/**
 * Operation labels for display
 */
const OPERATION_LABELS: Record<ComparisonOperation, string> = {
  [ComparisonOperation.Equals]: 'equals',
  [ComparisonOperation.NotEquals]: 'does not equal',
  [ComparisonOperation.Contains]: 'contains',
  [ComparisonOperation.NotContains]: 'does not contain',
  [ComparisonOperation.StartsWith]: 'starts with',
  [ComparisonOperation.EndsWith]: 'ends with',
  [ComparisonOperation.Regex]: 'matches regex',
  [ComparisonOperation.IsEmpty]: 'is empty',
  [ComparisonOperation.IsNotEmpty]: 'is not empty',
  [ComparisonOperation.GreaterThan]: 'is greater than',
  [ComparisonOperation.GreaterThanOrEqual]: 'is greater than or equal to',
  [ComparisonOperation.LessThan]: 'is less than',
  [ComparisonOperation.LessThanOrEqual]: 'is less than or equal to',
  [ComparisonOperation.IsTrue]: 'is true',
  [ComparisonOperation.IsFalse]: 'is false',
  [ComparisonOperation.Exists]: 'exists',
  [ComparisonOperation.DoesNotExist]: 'does not exist',
};

/**
 * Generate unique ID for groups
 */
function generateId(): string {
  return `group_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create an empty condition
 */
function createEmptyCondition(): Condition {
  return {
    value1: '',
    operation: ComparisonOperation.Equals,
    value2: '',
  };
}

/**
 * Create an empty group
 */
function createEmptyGroup(combineMode: CombineConditionMode = CombineConditionMode.And): ConditionGroup {
  return {
    id: generateId(),
    combineMode,
    conditions: [createEmptyCondition()],
    groups: [],
  };
}

/**
 * ConditionBuilder - n8n-style condition builder UI with optional nested groups
 */
export const ConditionBuilder = memo<ConditionBuilderProps>(({
  conditions,
  combineMode,
  onConditionsChange,
  onCombineModeChange,
  rootGroup,
  onRootGroupChange,
  expressionContext,
  nodeId,
  enableGroups = false,
  className,
}) => {
  // If enableGroups is true and rootGroup is provided, use nested mode
  // Otherwise, use flat conditions mode for backward compatibility
  const [localRootGroup, setLocalRootGroup] = useState<ConditionGroup | null>(() => {
    if (enableGroups && rootGroup) {
      return rootGroup;
    }
    return null;
  });

  const useNestedMode = enableGroups && (rootGroup || localRootGroup);

  // For nested mode: handle root group changes
  const handleRootGroupChange = useCallback((newGroup: ConditionGroup) => {
    if (onRootGroupChange) {
      onRootGroupChange(newGroup);
    } else {
      setLocalRootGroup(newGroup);
    }
  }, [onRootGroupChange]);

  // Convert from flat to nested
  const convertToNested = useCallback(() => {
    const newGroup: ConditionGroup = {
      id: generateId(),
      combineMode,
      conditions: conditions.length > 0 ? conditions : [createEmptyCondition()],
      groups: [],
    };
    handleRootGroupChange(newGroup);
  }, [conditions, combineMode, handleRootGroupChange]);

  // For flat mode: condition handlers
  const handleAddCondition = useCallback(() => {
    onConditionsChange([...conditions, createEmptyCondition()]);
  }, [conditions, onConditionsChange]);

  const handleRemoveCondition = useCallback((index: number) => {
    onConditionsChange(conditions.filter((_, i) => i !== index));
  }, [conditions, onConditionsChange]);

  const handleUpdateCondition = useCallback((index: number, updates: Partial<Condition>) => {
    onConditionsChange(
      conditions.map((cond, i) => (i === index ? { ...cond, ...updates } : cond))
    );
  }, [conditions, onConditionsChange]);

  // Render nested group mode
  if (useNestedMode && (rootGroup || localRootGroup)) {
    const group = rootGroup || localRootGroup!;
    return (
      <div className={cn('space-y-3', className)}>
        <ConditionGroupComponent
          group={group}
          onChange={handleRootGroupChange}
          expressionContext={expressionContext}
          nodeId={nodeId}
          isRoot
        />
      </div>
    );
  }

  // Render flat conditions mode (backward compatible)
  return (
    <div className={cn('space-y-3', className)}>
      {/* Combine Mode Selector */}
      {conditions.length > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Match</span>
          <Select value={combineMode} onValueChange={onCombineModeChange}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CombineConditionMode.And}>All (AND)</SelectItem>
              <SelectItem value={CombineConditionMode.Or}>Any (OR)</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-gray-600 dark:text-gray-400">of the following conditions</span>
        </div>
      )}

      {/* Conditions List */}
      <div className="space-y-2">
        {conditions.map((condition, index) => (
          <ConditionRow
            key={index}
            condition={condition}
            index={index}
            showCombiner={index > 0}
            combineMode={combineMode}
            onChange={(updates) => handleUpdateCondition(index, updates)}
            onRemove={() => handleRemoveCondition(index)}
            expressionContext={expressionContext}
            nodeId={nodeId}
            canRemove={conditions.length > 1}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleAddCondition}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 flex-1',
            'text-sm text-blue-600 dark:text-blue-400 font-medium',
            'border border-dashed border-gray-300 dark:border-slate-600',
            'rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
            'transition-colors'
          )}
        >
          <Plus className="w-4 h-4" />
          Add Condition
        </button>

        {enableGroups && (
          <button
            type="button"
            onClick={convertToNested}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2',
              'text-sm text-purple-600 dark:text-purple-400 font-medium',
              'border border-dashed border-gray-300 dark:border-slate-600',
              'rounded-lg hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
              'transition-colors'
            )}
            title="Enable condition groups for complex logic"
          >
            <FolderPlus className="w-4 h-4" />
            Add Group
          </button>
        )}
      </div>
    </div>
  );
});

ConditionBuilder.displayName = 'ConditionBuilder';

/**
 * Props for ConditionGroupComponent
 */
interface ConditionGroupComponentProps {
  group: ConditionGroup;
  onChange: (group: ConditionGroup) => void;
  onRemove?: () => void;
  expressionContext?: ExpressionContext;
  nodeId?: string;
  isRoot?: boolean;
  parentCombineMode?: CombineConditionMode;
}

/**
 * Recursive condition group component
 */
const ConditionGroupComponent = memo<ConditionGroupComponentProps>(({
  group,
  onChange,
  onRemove,
  expressionContext,
  nodeId,
  isRoot = false,
  parentCombineMode,
}) => {
  // Update a condition within this group
  const handleConditionChange = useCallback((index: number, updates: Partial<Condition>) => {
    const newConditions = group.conditions.map((cond, i) =>
      i === index ? { ...cond, ...updates } : cond
    );
    onChange({ ...group, conditions: newConditions });
  }, [group, onChange]);

  // Add a new condition to this group
  const handleAddCondition = useCallback(() => {
    onChange({
      ...group,
      conditions: [...group.conditions, createEmptyCondition()],
    });
  }, [group, onChange]);

  // Remove a condition from this group
  const handleRemoveCondition = useCallback((index: number) => {
    const newConditions = group.conditions.filter((_, i) => i !== index);
    // Ensure at least one condition or sub-group remains
    if (newConditions.length === 0 && group.groups.length === 0) {
      newConditions.push(createEmptyCondition());
    }
    onChange({ ...group, conditions: newConditions });
  }, [group, onChange]);

  // Add a nested group
  const handleAddGroup = useCallback(() => {
    // Alternate combine mode for nested groups
    const nestedMode = group.combineMode === CombineConditionMode.And
      ? CombineConditionMode.Or
      : CombineConditionMode.And;
    onChange({
      ...group,
      groups: [...group.groups, createEmptyGroup(nestedMode)],
    });
  }, [group, onChange]);

  // Update a nested group
  const handleGroupChange = useCallback((index: number, newGroup: ConditionGroup) => {
    const newGroups = group.groups.map((g, i) => (i === index ? newGroup : g));
    onChange({ ...group, groups: newGroups });
  }, [group, onChange]);

  // Remove a nested group
  const handleRemoveGroup = useCallback((index: number) => {
    const newGroups = group.groups.filter((_, i) => i !== index);
    // Ensure at least one condition or sub-group remains
    if (newGroups.length === 0 && group.conditions.length === 0) {
      onChange({ ...group, groups: newGroups, conditions: [createEmptyCondition()] });
    } else {
      onChange({ ...group, groups: newGroups });
    }
  }, [group, onChange]);

  // Change combine mode
  const handleCombineModeChange = useCallback((mode: CombineConditionMode) => {
    onChange({ ...group, combineMode: mode });
  }, [group, onChange]);

  const itemCount = group.conditions.length + group.groups.length;
  const canRemove = !isRoot && onRemove;

  return (
    <div className={cn(
      'rounded-lg border',
      isRoot
        ? 'border-gray-200 dark:border-slate-700'
        : group.combineMode === CombineConditionMode.And
          ? 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10'
          : 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10'
    )}>
      {/* Group Header */}
      <div className={cn(
        'flex items-center justify-between px-3 py-2 border-b',
        isRoot
          ? 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
          : group.combineMode === CombineConditionMode.And
            ? 'bg-blue-100/50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
            : 'bg-amber-100/50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800'
      )}>
        <div className="flex items-center gap-2">
          {!isRoot && parentCombineMode && (
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded',
              parentCombineMode === CombineConditionMode.And
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400'
            )}>
              {parentCombineMode === CombineConditionMode.And ? 'AND' : 'OR'}
            </span>
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Match
          </span>
          <Select value={group.combineMode} onValueChange={handleCombineModeChange}>
            <SelectTrigger className="w-28 h-7 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CombineConditionMode.And}>All (AND)</SelectItem>
              <SelectItem value={CombineConditionMode.Or}>Any (OR)</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            of {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Remove group"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Group Content */}
      <div className="p-3 space-y-2">
        {/* Conditions */}
        {group.conditions.map((condition, index) => (
          <ConditionRow
            key={`cond-${index}`}
            condition={condition}
            index={index}
            showCombiner={index > 0 || group.groups.length > 0}
            combineMode={group.combineMode}
            onChange={(updates) => handleConditionChange(index, updates)}
            onRemove={() => handleRemoveCondition(index)}
            expressionContext={expressionContext}
            nodeId={nodeId}
            canRemove={group.conditions.length > 1 || group.groups.length > 0}
          />
        ))}

        {/* Nested Groups */}
        {group.groups.map((nestedGroup, index) => (
          <div key={nestedGroup.id} className="relative">
            {(group.conditions.length > 0 || index > 0) && (
              <div className="absolute -top-3 left-4 z-10">
                <span className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded',
                  group.combineMode === CombineConditionMode.And
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                )}>
                  {group.combineMode === CombineConditionMode.And ? 'AND' : 'OR'}
                </span>
              </div>
            )}
            <div className={cn(group.conditions.length > 0 || index > 0 ? 'mt-2' : '')}>
              <ConditionGroupComponent
                group={nestedGroup}
                onChange={(newGroup) => handleGroupChange(index, newGroup)}
                onRemove={() => handleRemoveGroup(index)}
                expressionContext={expressionContext}
                nodeId={nodeId}
                parentCombineMode={group.combineMode}
              />
            </div>
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleAddCondition}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 flex-1',
              'text-sm text-blue-600 dark:text-blue-400',
              'border border-dashed border-gray-300 dark:border-slate-600',
              'rounded hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
              'transition-colors'
            )}
          >
            <Plus className="w-3 h-3" />
            Condition
          </button>

          <button
            type="button"
            onClick={handleAddGroup}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5',
              'text-sm text-purple-600 dark:text-purple-400',
              'border border-dashed border-gray-300 dark:border-slate-600',
              'rounded hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
              'transition-colors'
            )}
          >
            <FolderPlus className="w-3 h-3" />
            Group
          </button>
        </div>
      </div>
    </div>
  );
});

ConditionGroupComponent.displayName = 'ConditionGroupComponent';

/**
 * Props for ConditionRow
 */
interface ConditionRowProps {
  condition: Condition;
  index: number;
  showCombiner: boolean;
  combineMode: CombineConditionMode;
  onChange: (updates: Partial<Condition>) => void;
  onRemove: () => void;
  expressionContext?: ExpressionContext;
  nodeId?: string;
  canRemove: boolean;
}

/**
 * Single condition row
 */
const ConditionRow = memo<ConditionRowProps>(({
  condition,
  showCombiner,
  combineMode,
  onChange,
  onRemove,
  expressionContext,
  nodeId,
  canRemove,
}) => {
  const isUnary = UNARY_OPERATIONS.includes(condition.operation);

  return (
    <div className="relative">
      {/* AND/OR Badge */}
      {showCombiner && (
        <div className="absolute -top-3 left-4 z-10">
          <span className={cn(
            'px-2 py-0.5 text-xs font-medium rounded',
            combineMode === CombineConditionMode.And
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          )}>
            {combineMode === CombineConditionMode.And ? 'AND' : 'OR'}
          </span>
        </div>
      )}

      {/* Condition Card */}
      <div className={cn(
        'flex items-start gap-2 p-3 rounded-lg',
        'bg-gray-50 dark:bg-slate-800',
        'border border-gray-200 dark:border-slate-700',
        showCombiner && 'mt-2'
      )}>
        {/* Drag Handle (visual only for now) */}
        <div className="pt-2 text-gray-300 dark:text-gray-600 cursor-grab">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Value 1 */}
        <div className="flex-1 min-w-0">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Value
          </label>
          {isExpression(condition.value1) ? (
            <ExpressionEditor
              value={condition.value1}
              onChange={(v) => onChange({ value1: v as string })}
              context={expressionContext}
              nodeId={nodeId}
              singleLine
              height="36px"
              placeholder="{{ $json.field }}"
            />
          ) : (
            <input
              type="text"
              value={condition.value1}
              onChange={(e) => onChange({ value1: e.target.value })}
              placeholder="{{ $json.field }} or value"
              className={cn(
                'w-full px-2 py-1.5 text-sm rounded',
                'border border-gray-300 dark:border-slate-600',
                'bg-white dark:bg-slate-700',
                'text-gray-900 dark:text-gray-100',
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              )}
            />
          )}
        </div>

        {/* Operation */}
        <div className="w-44 flex-shrink-0">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Operator
          </label>
          <Select
            value={condition.operation}
            onValueChange={(v) => onChange({ operation: v as ComparisonOperation })}
          >
            <SelectTrigger className="h-[34px] text-sm">
              <SelectValue>
                {OPERATION_LABELS[condition.operation]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ComparisonOperation.Equals}>equals</SelectItem>
              <SelectItem value={ComparisonOperation.NotEquals}>does not equal</SelectItem>
              <SelectItem value={ComparisonOperation.Contains}>contains</SelectItem>
              <SelectItem value={ComparisonOperation.NotContains}>does not contain</SelectItem>
              <SelectItem value={ComparisonOperation.StartsWith}>starts with</SelectItem>
              <SelectItem value={ComparisonOperation.EndsWith}>ends with</SelectItem>
              <SelectItem value={ComparisonOperation.Regex}>matches regex</SelectItem>
              <SelectItem value={ComparisonOperation.GreaterThan}>is greater than</SelectItem>
              <SelectItem value={ComparisonOperation.GreaterThanOrEqual}>≥ greater than or equal</SelectItem>
              <SelectItem value={ComparisonOperation.LessThan}>is less than</SelectItem>
              <SelectItem value={ComparisonOperation.LessThanOrEqual}>≤ less than or equal</SelectItem>
              <SelectItem value={ComparisonOperation.IsEmpty}>is empty</SelectItem>
              <SelectItem value={ComparisonOperation.IsNotEmpty}>is not empty</SelectItem>
              <SelectItem value={ComparisonOperation.IsTrue}>is true</SelectItem>
              <SelectItem value={ComparisonOperation.IsFalse}>is false</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Value 2 (hidden for unary operations) */}
        {!isUnary && (
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Compare to
            </label>
            {isExpression(condition.value2) ? (
              <ExpressionEditor
                value={condition.value2}
                onChange={(v) => onChange({ value2: v as string })}
                context={expressionContext}
                nodeId={nodeId}
                singleLine
                height="36px"
                placeholder="{{ $json.field }}"
              />
            ) : (
              <input
                type="text"
                value={condition.value2}
                onChange={(e) => onChange({ value2: e.target.value })}
                placeholder="Value or {{ expression }}"
                className={cn(
                  'w-full px-2 py-1.5 text-sm rounded',
                  'border border-gray-300 dark:border-slate-600',
                  'bg-white dark:bg-slate-700',
                  'text-gray-900 dark:text-gray-100',
                  'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                )}
              />
            )}
          </div>
        )}

        {/* Delete Button */}
        <div className="pt-5">
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            className={cn(
              'p-1.5 rounded transition-colors',
              canRemove
                ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                : 'text-gray-200 dark:text-gray-700 cursor-not-allowed'
            )}
            title={canRemove ? 'Remove condition' : 'Cannot remove last condition'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

ConditionRow.displayName = 'ConditionRow';

export default ConditionBuilder;
