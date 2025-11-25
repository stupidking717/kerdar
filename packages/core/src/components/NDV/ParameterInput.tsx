import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Code, Type, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ExpressionEditor, isExpression, wrapAsExpression, type ExpressionContext } from './ExpressionEditor';
import { CodeEditor } from '../ui/CodeEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select';
import type { NodeProperty } from '../../types';
import { PropertyType } from '../../types';

/**
 * Props for ParameterInput
 */
export interface ParameterInputProps {
  /** Property definition */
  property: NodeProperty;
  /** Current value */
  value: unknown;
  /** Called when value changes */
  onChange: (value: unknown) => void;
  /** Expression context for resolving expressions */
  expressionContext?: ExpressionContext;
  /** Node ID for schema-aware autocomplete */
  nodeId?: string;
  /** Whether the field is being dragged over */
  isDragOver?: boolean;
  /** Called when drag enters the field */
  onDragEnter?: () => void;
  /** Called when drag leaves the field */
  onDragLeave?: () => void;
  /** Called when drop occurs */
  onDrop?: (path: string) => void;
  /** Additional class names */
  className?: string;
}

/**
 * ParameterInput - Individual parameter field with Fixed/Expression toggle
 * Supports all n8n property types with expression mode
 */
export const ParameterInput = memo<ParameterInputProps>(({
  property,
  value,
  onChange,
  expressionContext,
  nodeId,
  isDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  className,
}) => {
  const { name, displayName, type, description, placeholder, required, options, typeOptions } = property;

  // Determine if current value is an expression
  const [expressionMode, setExpressionMode] = useState(() => isExpression(value));
  const dropRef = useRef<HTMLDivElement>(null);

  // Update expression mode when value changes
  useEffect(() => {
    if (isExpression(value)) {
      setExpressionMode(true);
    }
  }, [value]);

  // Toggle between Fixed and Expression mode
  const toggleMode = useCallback(() => {
    if (expressionMode) {
      // Switch to fixed - clear the expression
      setExpressionMode(false);
      onChange('');
    } else {
      // Switch to expression mode
      setExpressionMode(true);
      // Convert current value to expression if it's a string
      if (typeof value === 'string' && value) {
        onChange(`{{ "${value}" }}`);
      } else {
        onChange('{{ }}');
      }
    }
  }, [expressionMode, value, onChange]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle drag enter
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDragEnter?.();
  }, [onDragEnter]);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only trigger if leaving the actual element
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
      onDragLeave?.();
    }
  }, [onDragLeave]);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDragLeave?.();

    try {
      const data = e.dataTransfer.getData('application/kerdar-expression');
      if (data) {
        const { path } = JSON.parse(data);
        // Set to expression mode and create expression from path
        setExpressionMode(true);
        onChange(wrapAsExpression(path));
        onDrop?.(path);
      }
    } catch (err) {
      console.error('Failed to handle drop:', err);
    }
  }, [onChange, onDrop, onDragLeave]);

  // Common field wrapper classes
  const fieldWrapperClasses = cn(
    'relative rounded-lg transition-all',
    isDragOver && 'ring-2 ring-blue-400 ring-offset-1 bg-blue-50 dark:bg-blue-900/20'
  );

  // Common input classes
  const inputClasses = cn(
    'w-full px-3 py-2 rounded-lg',
    'border border-gray-300 dark:border-slate-600',
    'bg-white dark:bg-slate-800',
    'text-gray-900 dark:text-gray-100 text-sm',
    'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'placeholder:text-gray-400 dark:placeholder:text-gray-500'
  );

  // Render the appropriate input based on type and mode
  const renderInput = () => {
    // Expression mode - show expression editor for most types
    if (expressionMode && type !== PropertyType.Boolean && type !== PropertyType.Code) {
      return (
        <ExpressionEditor
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          context={expressionContext}
          nodeId={nodeId}
          singleLine={type !== PropertyType.String || !typeOptions?.rows}
          height={typeOptions?.rows ? `${typeOptions.rows * 24}px` : '100px'}
          placeholder={`Enter expression... e.g. {{ $json.${name} }}`}
        />
      );
    }

    // Fixed mode - render type-specific input
    switch (type) {
      case PropertyType.String:
        if (typeOptions?.password) {
          return (
            <input
              type="password"
              id={name}
              value={formatValueForInput(value)}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              required={required}
              className={inputClasses}
            />
          );
        }
        if (typeOptions?.rows && typeOptions.rows > 1) {
          return (
            <textarea
              id={name}
              value={formatValueForInput(value)}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              required={required}
              rows={typeOptions.rows}
              className={cn(inputClasses, 'resize-y')}
            />
          );
        }
        return (
          <input
            type="text"
            id={name}
            value={formatValueForInput(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className={inputClasses}
          />
        );

      case PropertyType.Number:
        return (
          <input
            type="number"
            id={name}
            value={(value as number) ?? ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={placeholder}
            required={required}
            min={typeOptions?.minValue}
            max={typeOptions?.maxValue}
            step={typeOptions?.numberStepSize}
            className={inputClasses}
          />
        );

      case PropertyType.Boolean:
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                id={name}
                checked={(value as boolean) ?? false}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className={cn(
                'w-10 h-6 bg-gray-200 dark:bg-slate-600 rounded-full',
                'peer-checked:bg-blue-500',
                'transition-colors'
              )} />
              <div className={cn(
                'absolute left-1 top-1 w-4 h-4 bg-white rounded-full',
                'peer-checked:translate-x-4',
                'transition-transform shadow-sm'
              )} />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {value ? 'True' : 'False'}
            </span>
          </label>
        );

      case PropertyType.Options:
        return (
          <Select
            value={getOptionValue(value)}
            onValueChange={(val) => {
              const selectedOpt = options?.find((opt) => getOptionValue(opt.value) === val);
              onChange(selectedOpt?.value ?? val);
            }}
          >
            <SelectTrigger id={name}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options?.map((opt) => (
                <SelectItem
                  key={getOptionValue(opt.value)}
                  value={getOptionValue(opt.value)}
                >
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case PropertyType.MultiOptions:
        const selectedValues = ((value as unknown[]) ?? []).map(getOptionValue);
        return (
          <MultiSelectDropdown
            options={options ?? []}
            selectedValues={selectedValues}
            onChange={(selected) => {
              const values = selected.map((val) => {
                const foundOpt = options?.find((o) => getOptionValue(o.value) === val);
                return foundOpt?.value ?? val;
              });
              onChange(values);
            }}
            placeholder="Select options..."
          />
        );

      case PropertyType.Json:
        return (
          <textarea
            id={name}
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            }}
            placeholder={placeholder || '{\n  \n}'}
            rows={6}
            className={cn(inputClasses, 'font-mono text-xs resize-y')}
          />
        );

      case PropertyType.Code:
        return (
          <CodeEditor
            value={(value as string) ?? ''}
            onChange={(v) => onChange(v)}
            language={typeOptions?.language || 'javascript'}
            height={typeOptions?.rows ? `${typeOptions.rows * 24}px` : '300px'}
            placeholder={placeholder}
          />
        );

      case PropertyType.DateTime:
        return (
          <input
            type="datetime-local"
            id={name}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className={inputClasses}
          />
        );

      case PropertyType.Color:
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              id={name}
              value={(value as string) ?? '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={(value as string) ?? ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className={cn(inputClasses, 'flex-1')}
            />
          </div>
        );

      case PropertyType.Notice:
        return (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {description || displayName}
            </p>
          </div>
        );

      default:
        return (
          <input
            type="text"
            id={name}
            value={formatValueForInput(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className={inputClasses}
          />
        );
    }
  };

  // Don't show toggle for boolean, code, or notice types
  const showToggle = type !== PropertyType.Boolean &&
    type !== PropertyType.Code &&
    type !== PropertyType.Notice;

  // Don't show label for boolean (inline) or notice (self-descriptive)
  const showLabel = type !== PropertyType.Boolean && type !== PropertyType.Notice;

  return (
    <div
      ref={dropRef}
      className={cn('space-y-1', fieldWrapperClasses, className)}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {showLabel && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={name}
            className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {displayName}
            {required && <span className="text-red-500">*</span>}
          </label>

          {/* Fixed/Expression Toggle */}
          {showToggle && (
            <div className="flex items-center">
              <button
                type="button"
                onClick={toggleMode}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                  'transition-colors',
                  expressionMode
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                )}
                title={expressionMode ? 'Switch to Fixed value' : 'Switch to Expression'}
              >
                {expressionMode ? (
                  <>
                    <Code className="w-3 h-3" />
                    Expression
                  </>
                ) : (
                  <>
                    <Type className="w-3 h-3" />
                    Fixed
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {renderInput()}

      {description && type !== PropertyType.Notice && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}

      {/* Drag hint */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-lg pointer-events-none">
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Drop to insert expression
          </span>
        </div>
      )}
    </div>
  );
});

ParameterInput.displayName = 'ParameterInput';

/**
 * MultiSelectDropdown - Custom multi-select using Popover
 */
interface MultiSelectDropdownProps {
  options: Array<{ name: string; value: unknown; description?: string }>;
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select...',
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);

  const toggleOption = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  const selectedLabels = selectedValues
    .map((v) => options.find((opt) => getOptionValue(opt.value) === v)?.name)
    .filter(Boolean);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2',
          'rounded-lg border border-gray-300 bg-white px-3 py-2',
          'text-sm text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          'dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100',
          'dark:focus:ring-blue-400 dark:focus:ring-offset-slate-900'
        )}
      >
        <span className={cn(
          'truncate',
          selectedLabels.length === 0 && 'text-gray-400 dark:text-gray-500'
        )}>
          {selectedLabels.length > 0
            ? selectedLabels.length === 1
              ? selectedLabels[0]
              : `${selectedLabels.length} selected`
            : placeholder}
        </span>
        <svg
          className={cn(
            'h-4 w-4 opacity-50 shrink-0 transition-transform',
            open && 'rotate-180'
          )}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div
            className={cn(
              'absolute z-[9999] mt-1 w-full max-h-60 overflow-auto',
              'rounded-lg border border-gray-200 bg-white shadow-lg',
              'dark:border-slate-700 dark:bg-slate-800',
              'animate-in fade-in-0 zoom-in-95'
            )}
          >
            <div className="p-1">
              {options.map((opt) => {
                const optValue = getOptionValue(opt.value);
                const isSelected = selectedValues.includes(optValue);
                return (
                  <button
                    key={optValue}
                    type="button"
                    onClick={() => toggleOption(optValue)}
                    className={cn(
                      'relative flex w-full items-center gap-2',
                      'rounded-md py-2 px-3 text-sm text-left',
                      'text-gray-900 dark:text-gray-100',
                      'hover:bg-gray-100 dark:hover:bg-slate-700',
                      'focus:outline-none focus:bg-gray-100 dark:focus:bg-slate-700'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center',
                        'rounded border',
                        isSelected
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 dark:border-slate-600'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span>{opt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Get option value as string for comparison
 */
function getOptionValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/**
 * Format value for text input display
 * Properly serializes objects to avoid [object Object]
 */
function formatValueForInput(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export default ParameterInput;
