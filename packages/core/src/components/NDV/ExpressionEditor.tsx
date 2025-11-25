import { memo, useCallback, useState, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useThemeMode } from '../../store/theme-store';
import { ThemeMode } from '../../types';

// Inject global CSS for Monaco autocomplete widgets z-index
const MONACO_STYLE_ID = 'kerdar-monaco-widgets-style';
function ensureMonacoStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(MONACO_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = MONACO_STYLE_ID;
  style.textContent = `
    /* Ensure Monaco editor widgets appear above the NDV modal (z-50) */
    .monaco-editor .overflow-guard {
      overflow: visible !important;
    }
    .monaco-editor .suggest-widget,
    .monaco-editor .monaco-hover,
    .monaco-editor .parameter-hints-widget,
    .monaco-editor .editor-widget {
      z-index: 9999 !important;
    }
    /* Fixed overflow widgets rendered in body */
    body > .monaco-editor.monaco-editor-overlaymessage,
    body > .monaco-editor .suggest-widget,
    body > .monaco-editor .monaco-hover,
    body > .monaco-editor .parameter-hints-widget {
      z-index: 9999 !important;
    }
  `;
  document.head.appendChild(style);
}

// Monaco types
type MonacoEditor = Parameters<OnMount>[0];
type Monaco = Parameters<OnMount>[1];

/**
 * Expression context for resolving values
 */
export interface ExpressionContext {
  /** Data from previous node ($json) */
  $json?: Record<string, unknown>;
  /** All input items ($input) */
  $input?: { all: () => unknown[]; first: () => unknown; last: () => unknown };
  /** Current item ($item) */
  $item?: Record<string, unknown>;
  /** Access other nodes by name */
  $node?: Record<string, { json: Record<string, unknown> }>;
  /** Workflow metadata */
  $workflow?: { id?: string; name?: string };
  /** Environment variables */
  $env?: Record<string, string>;
  /** Current timestamp */
  $now?: Date;
  /** Today's date */
  $today?: Date;
  /** Execution ID */
  $executionId?: string;
}

/**
 * Props for ExpressionEditor
 */
export interface ExpressionEditorProps {
  /** Expression value (with or without {{ }}) */
  value: string;
  /** Called when expression changes */
  onChange: (value: string) => void;
  /** Context for resolving expressions */
  context?: ExpressionContext;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show single line mode */
  singleLine?: boolean;
  /** Height (for multiline) */
  height?: string | number;
  /** Additional class names */
  className?: string;
  /** Show preview of resolved value */
  showPreview?: boolean;
  /** Error state */
  error?: string;
}

/**
 * ExpressionEditor - Monaco-based expression editor with real-time preview
 * Supports n8n-style expressions: {{ $json.field }}
 */
export const ExpressionEditor = memo<ExpressionEditorProps>(({
  value,
  onChange,
  context = {},
  placeholder = 'Enter expression... e.g. {{ $json.fieldName }}',
  singleLine = false,
  height = '100px',
  className,
  showPreview = true,
  error,
}) => {
  const mode = useThemeMode();
  const [preview, setPreview] = useState<{ value: unknown; error?: string } | null>(null);

  const isDark = mode === ThemeMode.Dark ||
    (mode === ThemeMode.System &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Inject Monaco widget styles on mount
  useEffect(() => {
    ensureMonacoStyles();
  }, []);

  // Evaluate expression and update preview
  useEffect(() => {
    if (!showPreview || !value) {
      setPreview(null);
      return;
    }

    try {
      const result = evaluateExpression(value, context);
      setPreview({ value: result });
    } catch (err) {
      setPreview({ value: undefined, error: err instanceof Error ? err.message : 'Invalid expression' });
    }
  }, [value, context, showPreview]);

  const handleChange = useCallback((newValue: string | undefined) => {
    onChange(newValue ?? '');
  }, [onChange]);

  const handleEditorMount: OnMount = useCallback((editor: MonacoEditor, monaco: Monaco) => {
    // Configure editor for expression editing
    editor.updateOptions({
      minimap: { enabled: false },
      lineNumbers: singleLine ? 'off' : 'on',
      fontSize: 13,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      padding: { top: 8, bottom: 8 },
      renderLineHighlight: singleLine ? 'none' : 'line',
      scrollbar: {
        vertical: singleLine ? 'hidden' : 'auto',
        horizontal: 'hidden',
      },
      folding: false,
      glyphMargin: false,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 3,
      // Fix for autocomplete widget being clipped by overflow
      fixedOverflowWidgets: true,
    });

    // Helper to get nested value from object by path
    const getNestedValue = (obj: unknown, path: string[]): unknown => {
      let current: unknown = obj;
      for (const key of path) {
        if (current === null || current === undefined) return undefined;
        if (typeof current !== 'object') return undefined;
        current = (current as Record<string, unknown>)[key];
      }
      return current;
    };

    // Helper to create suggestions from an object's properties
    const createPropertySuggestions = (
      obj: unknown,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      range: any
    ) => {
      if (obj === null || obj === undefined || typeof obj !== 'object') {
        return [];
      }

      return Object.keys(obj as Record<string, unknown>).map(key => {
        const value = (obj as Record<string, unknown>)[key];
        const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
        return {
          label: key,
          kind: isObject
            ? monaco.languages.CompletionItemKind.Module
            : monaco.languages.CompletionItemKind.Property,
          insertText: key,
          documentation: `Value: ${formatPreviewValue(value)}`,
          detail: Array.isArray(value) ? 'array' : typeof value,
          range,
          sortText: `0_${key}`, // Sort properties first
        };
      });
    };

    // Register expression language completions
    monaco.languages.registerCompletionItemProvider('javascript', {
      triggerCharacters: ['$', '.', '['],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        // Get the text before cursor to determine context
        const lineContent = model.getLineContent(position.lineNumber);
        const textBeforeCursor = lineContent.substring(0, position.column - 1);

        // Check if we're typing after a dot (e.g., "$json.user.")
        const pathMatch = textBeforeCursor.match(/(\$(?:json|item|input|node|workflow|env)(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\.$/);

        if (pathMatch) {
          const fullPath = pathMatch[1];
          const parts = fullPath.split('.');
          const rootVar = parts[0]; // e.g., "$json"
          const pathParts = parts.slice(1); // e.g., ["user"]

          // Get the base object for this root variable
          let baseObj: unknown = undefined;
          if (rootVar === '$json') {
            baseObj = context.$json;
          } else if (rootVar === '$item') {
            baseObj = context.$item ?? context.$json;
          } else if (rootVar === '$workflow') {
            baseObj = context.$workflow;
          } else if (rootVar === '$env') {
            baseObj = context.$env;
          }

          // Navigate to the nested object
          const targetObj = pathParts.length > 0
            ? getNestedValue(baseObj, pathParts)
            : baseObj;

          // Return suggestions for the target object's properties
          const suggestions = createPropertySuggestions(targetObj, range);

          if (suggestions.length > 0) {
            return { suggestions };
          }
        }

        // Base workflow expressions (shown when not in a path context)
        const baseExpressions = [
          {
            label: '$json',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$json',
            documentation: 'Access JSON data from input (shorthand for $input.item.json)',
            detail: 'object',
            range,
            sortText: '1_$json',
          },
          {
            label: '$input',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$input',
            documentation: 'Access all input data. Use $input.first(), $input.last(), $input.all()',
            detail: 'InputHelper',
            range,
            sortText: '1_$input',
          },
          {
            label: '$input.first()',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: '$input.first()',
            documentation: 'Get the first input item',
            detail: 'object',
            range,
            sortText: '1_$input_first',
          },
          {
            label: '$input.last()',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: '$input.last()',
            documentation: 'Get the last input item',
            detail: 'object',
            range,
            sortText: '1_$input_last',
          },
          {
            label: '$input.all()',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: '$input.all()',
            documentation: 'Get all input items as array',
            detail: 'array',
            range,
            sortText: '1_$input_all',
          },
          {
            label: '$item',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$item',
            documentation: 'Current item being processed',
            detail: 'object',
            range,
            sortText: '1_$item',
          },
          {
            label: '$node',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$node[""]',
            documentation: 'Access data from a specific node by name',
            detail: 'NodeAccess',
            range,
            sortText: '1_$node',
          },
          {
            label: '$workflow',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$workflow',
            documentation: 'Workflow metadata (id, name)',
            detail: 'object',
            range,
            sortText: '1_$workflow',
          },
          {
            label: '$workflow.id',
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: '$workflow.id',
            documentation: 'Current workflow ID',
            detail: 'string',
            range,
            sortText: '1_$workflow_id',
          },
          {
            label: '$workflow.name',
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: '$workflow.name',
            documentation: 'Current workflow name',
            detail: 'string',
            range,
            sortText: '1_$workflow_name',
          },
          {
            label: '$env',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$env',
            documentation: 'Access environment variables',
            detail: 'object',
            range,
            sortText: '1_$env',
          },
          {
            label: '$now',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$now',
            documentation: 'Current timestamp (Date object)',
            detail: 'Date',
            range,
            sortText: '1_$now',
          },
          {
            label: '$today',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$today',
            documentation: "Today's date at midnight",
            detail: 'Date',
            range,
            sortText: '1_$today',
          },
          {
            label: '$executionId',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '$executionId',
            documentation: 'Current execution ID',
            detail: 'string',
            range,
            sortText: '1_$executionId',
          },
        ];

        // Add top-level $json fields from context
        const jsonFields = context.$json ? Object.keys(context.$json).map(key => {
          const value = context.$json![key];
          const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
          return {
            label: `$json.${key}`,
            kind: isObject
              ? monaco.languages.CompletionItemKind.Module
              : monaco.languages.CompletionItemKind.Property,
            insertText: `$json.${key}`,
            documentation: `Value: ${formatPreviewValue(value)}`,
            detail: Array.isArray(value) ? 'array' : typeof value,
            range,
            sortText: `0_$json_${key}`,
          };
        }) : [];

        return {
          suggestions: [...jsonFields, ...baseExpressions],
        };
      },
    });
  }, [singleLine, context]);

  return (
    <div className={cn('rounded-lg overflow-hidden', className)}>
      {/* Editor */}
      <div
        className={cn(
          'border rounded-lg overflow-hidden',
          error
            ? 'border-red-300 dark:border-red-600'
            : 'border-amber-300 dark:border-amber-600',
          'bg-amber-50/50 dark:bg-amber-900/10'
        )}
      >
        <Editor
          height={singleLine ? '36px' : height}
          language="javascript"
          value={value}
          onChange={handleChange}
          onMount={handleEditorMount}
          theme={isDark ? 'vs-dark' : 'light'}
          options={{
            minimap: { enabled: false },
            lineNumbers: singleLine ? 'off' : 'on',
            fontSize: 13,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            fixedOverflowWidgets: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-slate-800">
              <div className="text-sm text-gray-500">Loading...</div>
            </div>
          }
        />
      </div>

      {/* Preview */}
      {showPreview && value && (
        <div
          className={cn(
            'mt-1 px-2 py-1 rounded text-xs flex items-center gap-1',
            preview?.error
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
          )}
        >
          {preview?.error ? (
            <>
              <AlertCircle className="w-3 h-3" />
              <span>{preview.error}</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-3 h-3" />
              <span className="font-mono">{formatPreviewValue(preview?.value)}</span>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-1 px-2 py-1 rounded text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}

      {/* Placeholder hint */}
      {!value && placeholder && (
        <div className="text-xs text-gray-400 mt-1 px-1">
          {placeholder}
        </div>
      )}
    </div>
  );
});

ExpressionEditor.displayName = 'ExpressionEditor';

/**
 * Evaluate an expression with the given context
 * Supports {{ expression }} syntax
 */
export function evaluateExpression(expression: string, context: ExpressionContext): unknown {
  // Extract expression from {{ }} if present
  let expr = expression.trim();
  if (expr.startsWith('{{') && expr.endsWith('}}')) {
    expr = expr.slice(2, -2).trim();
  } else if (expr.startsWith('=')) {
    expr = expr.slice(1).trim();
  }

  if (!expr) return undefined;

  // Create a safe evaluation context
  const evalContext = {
    $json: context.$json ?? {},
    $input: context.$input ?? {
      all: () => [],
      first: () => context.$json ?? {},
      last: () => context.$json ?? {},
    },
    $item: context.$item ?? context.$json ?? {},
    $node: context.$node ?? {},
    $workflow: context.$workflow ?? {},
    $env: context.$env ?? {},
    $now: context.$now ?? new Date(),
    $today: context.$today ?? new Date(new Date().setHours(0, 0, 0, 0)),
    $executionId: context.$executionId ?? '',
  };

  // Simple property access evaluation (safe subset)
  // This handles: $json.field, $json.nested.field, $json["field"], etc.
  try {
    // Use Function constructor for simple evaluation
    // In production, you'd want a proper expression parser
    const fn = new Function(
      ...Object.keys(evalContext),
      `"use strict"; return (${expr});`
    );
    return fn(...Object.values(evalContext));
  } catch {
    throw new Error(`Invalid expression: ${expr}`);
  }
}

/**
 * Check if a value is an expression
 */
export function isExpression(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return (trimmed.startsWith('{{') && trimmed.endsWith('}}')) || trimmed.startsWith('=');
}

/**
 * Wrap a path as an expression
 */
export function wrapAsExpression(path: string): string {
  return `{{ ${path} }}`;
}

/**
 * Format value for preview display
 */
function formatPreviewValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return value.length > 100 ? value.slice(0, 100) + '...' : `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 100);
  return String(value);
}

export default ExpressionEditor;
