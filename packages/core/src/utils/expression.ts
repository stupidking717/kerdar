import type { WorkflowNode, INodeExecutionData } from '../types';

/**
 * Expression evaluation context
 */
export interface ExpressionContext {
  /** Input data */
  $input: INodeExecutionData[];

  /** Current item (in per-item execution) */
  $item: INodeExecutionData | null;

  /** Item index */
  $itemIndex: number;

  /** Current node */
  $node: WorkflowNode;

  /** All nodes data */
  $nodes: Record<string, NodeData>;

  /** Workflow variables */
  $vars: Record<string, unknown>;

  /** Environment variables */
  $env: Record<string, string>;

  /** Execution info */
  $execution: {
    id: string;
    mode: string;
    resumeUrl?: string;
  };

  /** Current date/time helpers */
  $now: Date;
  $today: string;

  /** JSON path accessor */
  $json: Record<string, unknown>;

  /** Binary data accessor */
  $binary: Record<string, unknown>;
}

/**
 * Node data in expression context
 */
export interface NodeData {
  name: string;
  type: string;
  json: Record<string, unknown>;
  binary?: Record<string, unknown>;
  parameters: Record<string, unknown>;
}

/**
 * Check if a string contains an expression
 */
export function containsExpression(value: string): boolean {
  return /\{\{.*?\}\}|=.*/.test(value);
}

/**
 * Check if a string is an expression (starts with =)
 */
export function isExpression(value: string): boolean {
  return value.startsWith('=');
}

/**
 * Extract expression from string (removes = prefix or {{ }} wrapper)
 */
export function extractExpression(value: string): string {
  if (value.startsWith('=')) {
    return value.slice(1).trim();
  }

  // Extract from {{ }} wrapper
  const match = value.match(/\{\{(.*?)\}\}/);
  if (match) {
    return match[1].trim();
  }

  return value;
}

/**
 * Evaluate an expression
 * NOTE: This is a simplified implementation. In production, use a proper
 * expression parser/evaluator with sandboxing for security.
 */
export function evaluateExpression<T = unknown>(
  expression: string,
  context: ExpressionContext
): T {
  // Handle simple property access
  const cleanExpression = extractExpression(expression);

  // Create a sandboxed evaluation context
  const sandbox = {
    ...context,
    // Add common helpers
    JSON,
    Math,
    String,
    Number,
    Boolean,
    Array,
    Object,
    Date,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent,
    encodeURI,
    decodeURI,
  };

  try {
    // Create function with sandboxed context
    const fn = new Function(
      ...Object.keys(sandbox),
      `"use strict"; return (${cleanExpression});`
    );

    return fn(...Object.values(sandbox)) as T;
  } catch (error) {
    console.error('Expression evaluation error:', error);
    throw new Error(`Failed to evaluate expression: ${cleanExpression}`);
  }
}

/**
 * Resolve all expressions in a value (recursive)
 */
export function resolveExpressions<T>(
  value: T,
  context: ExpressionContext
): T {
  if (typeof value === 'string') {
    if (!containsExpression(value)) {
      return value;
    }

    if (isExpression(value)) {
      return evaluateExpression(value, context);
    }

    // Replace {{ }} expressions in string
    return value.replace(/\{\{(.*?)\}\}/g, (_, expr) => {
      const result = evaluateExpression(expr, context);
      return String(result);
    }) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveExpressions(item, context)) as T;
  }

  if (value !== null && typeof value === 'object') {
    const resolved: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      resolved[key] = resolveExpressions(val, context);
    }
    return resolved as T;
  }

  return value;
}

/**
 * Get available variables for expression editor
 */
export function getExpressionVariables(
  _node: WorkflowNode,
  inputData: INodeExecutionData[],
  nodesData: Record<string, NodeData>
): Array<{
  name: string;
  displayName: string;
  description: string;
  type: string;
  properties?: Array<{ name: string; type: string }>;
}> {
  const variables = [];

  // $input
  variables.push({
    name: '$input',
    displayName: 'Input Data',
    description: 'All input data items',
    type: 'array',
    properties: inputData[0]
      ? Object.keys(inputData[0].json).map((key) => ({
          name: key,
          type: typeof inputData[0].json[key],
        }))
      : [],
  });

  // $json (shortcut for $input.item.json)
  variables.push({
    name: '$json',
    displayName: 'Current Item JSON',
    description: 'JSON data of the current input item',
    type: 'object',
    properties: inputData[0]
      ? Object.keys(inputData[0].json).map((key) => ({
          name: key,
          type: typeof inputData[0].json[key],
        }))
      : [],
  });

  // $node
  variables.push({
    name: '$node',
    displayName: 'Current Node',
    description: 'The current node being executed',
    type: 'object',
    properties: [
      { name: 'name', type: 'string' },
      { name: 'type', type: 'string' },
      { name: 'parameters', type: 'object' },
    ],
  });

  // $nodes (other nodes)
  Object.entries(nodesData).forEach(([nodeName, data]) => {
    variables.push({
      name: `$nodes["${nodeName}"]`,
      displayName: nodeName,
      description: `Output from ${nodeName} node`,
      type: 'object',
      properties: Object.keys(data.json).map((key) => ({
        name: key,
        type: typeof data.json[key],
      })),
    });
  });

  // Helper variables
  variables.push(
    {
      name: '$now',
      displayName: 'Current Date/Time',
      description: 'Current date and time as Date object',
      type: 'Date',
    },
    {
      name: '$today',
      displayName: 'Today',
      description: 'Current date as ISO string (YYYY-MM-DD)',
      type: 'string',
    },
    {
      name: '$itemIndex',
      displayName: 'Item Index',
      description: 'Index of the current item being processed',
      type: 'number',
    },
    {
      name: '$execution',
      displayName: 'Execution',
      description: 'Current execution information',
      type: 'object',
      properties: [
        { name: 'id', type: 'string' },
        { name: 'mode', type: 'string' },
      ],
    }
  );

  return variables;
}

/**
 * Format expression for display
 */
export function formatExpression(expression: string): string {
  if (!expression) return '';

  // Highlight different parts
  return expression
    .replace(/\$[a-zA-Z_][a-zA-Z0-9_]*/g, '<span class="expression-variable">$&</span>')
    .replace(/\[\s*["']([^"']+)["']\s*\]/g, '<span class="expression-accessor">[$1]</span>')
    .replace(/\.[a-zA-Z_][a-zA-Z0-9_]*/g, '<span class="expression-property">$&</span>');
}

/**
 * Validate expression syntax
 */
export function validateExpression(expression: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const cleanExpression = extractExpression(expression);
    // Try to parse as JavaScript (basic syntax check)
    new Function(`return (${cleanExpression})`);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid expression syntax',
    };
  }
}
