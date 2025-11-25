/**
 * Schema System for KERDAR Workflow Designer
 *
 * Provides type definitions for node input/output schemas, enabling:
 * - Expression editor autocomplete with accurate type information
 * - Workflow simulation with mock data
 * - Type validation between node connections
 * - Domain-specific type utilization
 */

import type { WorkflowNode } from './node';

/**
 * Primitive types for schema properties
 */
export type SchemaPropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'integer'
  | 'array'
  | 'object'
  | 'null'
  | 'any';

/**
 * Format specifiers for string types
 */
export type SchemaStringFormat =
  | 'date'
  | 'datetime'
  | 'time'
  | 'email'
  | 'uri'
  | 'url'
  | 'uuid'
  | 'hostname'
  | 'ipv4'
  | 'ipv6'
  | 'phone'
  | 'credit-card'
  | 'color'
  | 'json'
  | 'binary'
  | 'base64';

/**
 * Defines a single property within a schema
 */
export interface SchemaProperty {
  /** Property type */
  type: SchemaPropertyType | SchemaPropertyType[];

  /** Display name for UI */
  displayName?: string;

  /** Description of this property */
  description?: string;

  /** Whether this property is required */
  required?: boolean;

  /** Default value if not provided */
  default?: unknown;

  /** Example value for documentation and mock data */
  example?: unknown;

  /** Fixed set of allowed values */
  enum?: unknown[];

  /** Human-readable labels for enum values */
  enumLabels?: string[];

  /** Format specifier for string types */
  format?: SchemaStringFormat;

  /** Minimum value for numbers */
  minimum?: number;

  /** Maximum value for numbers */
  maximum?: number;

  /** Minimum length for strings/arrays */
  minLength?: number;

  /** Maximum length for strings/arrays */
  maxLength?: number;

  /** Regex pattern for string validation */
  pattern?: string;

  /** Schema for array items (when type is 'array') */
  items?: SchemaProperty;

  /** Properties for nested objects (when type is 'object') */
  properties?: Record<string, SchemaProperty>;

  /** Required properties for nested objects */
  requiredProperties?: string[];

  /** Allow additional properties not defined in schema */
  additionalProperties?: boolean | SchemaProperty;

  /** Reference to a shared schema definition */
  $ref?: string;

  /** Union of multiple possible schemas (oneOf) */
  oneOf?: SchemaProperty[];

  /** All schemas must match (allOf) */
  allOf?: SchemaProperty[];

  /** Any schema can match (anyOf) */
  anyOf?: SchemaProperty[];

  /** Constant value (literal type) */
  const?: unknown;

  /** Whether this property is read-only */
  readOnly?: boolean;

  /** Whether this property is deprecated */
  deprecated?: boolean;

  /** Custom metadata for extensions */
  metadata?: Record<string, unknown>;
}

/**
 * Complete data schema definition
 * Describes the structure of data flowing through a node
 */
export interface DataSchema {
  /** Schema type (always 'object' for root schemas) */
  type: 'object';

  /** Display name for UI */
  displayName?: string;

  /** Description of this schema */
  description?: string;

  /** Properties in this schema */
  properties: Record<string, SchemaProperty>;

  /** List of required property names */
  required?: string[];

  /** Example data for simulation/mock generation */
  example?: Record<string, unknown>;

  /** Allow additional properties not defined in schema */
  additionalProperties?: boolean | SchemaProperty;

  /** Shared schema definitions that can be referenced via $ref */
  definitions?: Record<string, SchemaProperty>;

  /** Schema version for future compatibility */
  $schema?: string;

  /** Schema identifier */
  $id?: string;

  /** Custom metadata for extensions */
  metadata?: Record<string, unknown>;
}

/**
 * Function signature for dynamic schema generation
 * Allows schemas to be computed based on node parameters
 */
export type DynamicSchemaFn = (
  params: Record<string, unknown>,
  node?: WorkflowNode
) => DataSchema | null;

/**
 * Schema definition that can be static or dynamic
 */
export type SchemaDefinition = DataSchema | DynamicSchemaFn;

/**
 * Resolved schema with source information
 * Used in schema context tracking
 */
export interface ResolvedSchema {
  /** The resolved schema */
  schema: DataSchema;

  /** Source node ID */
  sourceNodeId: string;

  /** Source node name */
  sourceNodeName: string;

  /** Source node type */
  sourceNodeType: string;

  /** Output index (for nodes with multiple outputs) */
  outputIndex: number;
}

/**
 * Schema context for a node - all schemas available at that point in the workflow
 */
export interface SchemaContext {
  /** Current node ID */
  nodeId: string;

  /** Schemas from directly connected input nodes */
  inputSchemas: ResolvedSchema[];

  /** All schemas accessible via $node reference (previous nodes in workflow) */
  accessibleSchemas: Record<string, ResolvedSchema>;

  /** Merged schema representing all input data ($json, $input) */
  mergedInputSchema: DataSchema | null;
}

/**
 * Expression autocomplete suggestion derived from schema
 */
export interface SchemaSuggestion {
  /** The expression path (e.g., '$json.contact.name') */
  path: string;

  /** Display label for autocomplete */
  label: string;

  /** Property type */
  type: SchemaPropertyType | SchemaPropertyType[];

  /** Description */
  description?: string;

  /** Kind of suggestion for icon display */
  kind: 'property' | 'array' | 'object' | 'method' | 'variable';

  /** Source node name */
  sourceNode?: string;

  /** Detail text (shown inline) */
  detail?: string;

  /** Documentation text */
  documentation?: string;

  /** Insert text (may differ from label) */
  insertText?: string;

  /** Child suggestions for nested properties */
  children?: SchemaSuggestion[];
}

// ============================================================================
// Schema Builder Helpers
// ============================================================================

/**
 * Create a string property schema
 */
export function stringProperty(options?: Partial<Omit<SchemaProperty, 'type'>>): SchemaProperty {
  return { type: 'string', ...options };
}

/**
 * Create a number property schema
 */
export function numberProperty(options?: Partial<Omit<SchemaProperty, 'type'>>): SchemaProperty {
  return { type: 'number', ...options };
}

/**
 * Create an integer property schema
 */
export function integerProperty(options?: Partial<Omit<SchemaProperty, 'type'>>): SchemaProperty {
  return { type: 'integer', ...options };
}

/**
 * Create a boolean property schema
 */
export function booleanProperty(options?: Partial<Omit<SchemaProperty, 'type'>>): SchemaProperty {
  return { type: 'boolean', ...options };
}

/**
 * Create an array property schema
 */
export function arrayProperty(
  items: SchemaProperty,
  options?: Partial<Omit<SchemaProperty, 'type' | 'items'>>
): SchemaProperty {
  return { type: 'array', items, ...options };
}

/**
 * Create an object property schema
 */
export function objectProperty(
  properties: Record<string, SchemaProperty>,
  options?: Partial<Omit<SchemaProperty, 'type' | 'properties'>>
): SchemaProperty {
  return { type: 'object', properties, ...options };
}

/**
 * Create an 'any' type property schema
 */
export function anyProperty(options?: Partial<Omit<SchemaProperty, 'type'>>): SchemaProperty {
  return { type: 'any', ...options };
}

/**
 * Create a complete data schema
 */
export function createSchema(
  properties: Record<string, SchemaProperty>,
  options?: Partial<Omit<DataSchema, 'type' | 'properties'>>
): DataSchema {
  return {
    type: 'object',
    properties,
    ...options,
  };
}

// ============================================================================
// Common Schema Templates
// ============================================================================

/**
 * Common HTTP response schema
 */
export const httpResponseSchema: DataSchema = createSchema(
  {
    data: anyProperty({ description: 'Response body data' }),
    statusCode: integerProperty({ description: 'HTTP status code', example: 200 }),
    headers: objectProperty({}, {
      description: 'Response headers',
      additionalProperties: stringProperty(),
    }),
  },
  {
    displayName: 'HTTP Response',
    description: 'Standard HTTP response structure',
  }
);

/**
 * Common webhook request schema
 */
export const webhookRequestSchema: DataSchema = createSchema(
  {
    headers: objectProperty({}, {
      description: 'Request headers',
      additionalProperties: stringProperty(),
      example: { 'content-type': 'application/json' },
    }),
    query: objectProperty({}, {
      description: 'Query string parameters',
      additionalProperties: anyProperty(),
    }),
    body: anyProperty({
      description: 'Request body',
    }),
    method: stringProperty({
      description: 'HTTP method',
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      example: 'POST',
    }),
    path: stringProperty({
      description: 'Request path',
      example: '/webhook/my-endpoint',
    }),
  },
  {
    displayName: 'Webhook Request',
    description: 'Incoming webhook request structure',
  }
);

/**
 * Common pagination schema
 */
export const paginationSchema = objectProperty(
  {
    page: integerProperty({ description: 'Current page number', example: 1, minimum: 1 }),
    pageSize: integerProperty({ description: 'Items per page', example: 20, minimum: 1, maximum: 100 }),
    total: integerProperty({ description: 'Total number of items', example: 100 }),
    totalPages: integerProperty({ description: 'Total number of pages', example: 5 }),
    hasMore: booleanProperty({ description: 'Whether more pages exist', example: true }),
  },
  {
    displayName: 'Pagination',
    description: 'Standard pagination metadata',
  }
);

/**
 * Common timestamp schema
 */
export const timestampProperty = stringProperty({
  format: 'datetime',
  description: 'ISO 8601 timestamp',
  example: '2024-01-15T10:30:00.000Z',
});

/**
 * Common ID property
 */
export const idProperty = stringProperty({
  format: 'uuid',
  description: 'Unique identifier',
  example: '550e8400-e29b-41d4-a716-446655440000',
});

/**
 * Common email property
 */
export const emailProperty = stringProperty({
  format: 'email',
  description: 'Email address',
  example: 'user@example.com',
});

// ============================================================================
// Schema Utilities
// ============================================================================

/**
 * Check if a schema definition is dynamic (function)
 */
export function isDynamicSchema(schema: SchemaDefinition | undefined): schema is DynamicSchemaFn {
  return typeof schema === 'function';
}

/**
 * Resolve a schema definition to a concrete DataSchema
 */
export function resolveSchema(
  schema: SchemaDefinition | undefined,
  params: Record<string, unknown> = {},
  node?: WorkflowNode
): DataSchema | null {
  if (!schema) return null;
  if (isDynamicSchema(schema)) {
    return schema(params, node);
  }
  return schema;
}

/**
 * Get a property from a schema by path (e.g., 'contact.address.city')
 */
export function getPropertyByPath(
  schema: DataSchema,
  path: string
): SchemaProperty | null {
  const parts = path.split('.');
  let current: SchemaProperty | DataSchema = schema;

  for (const part of parts) {
    if (!current) return null;

    // Get properties from current schema/property
    const currentProps: Record<string, SchemaProperty> | undefined =
      'properties' in current ? current.properties : undefined;

    // Handle array index access (e.g., 'items[0]')
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, propName] = arrayMatch;
      if (!currentProps || !propName || !currentProps[propName]) return null;

      const arrayProp: SchemaProperty = currentProps[propName];
      if (arrayProp.type !== 'array' || !arrayProp.items) return null;
      current = arrayProp.items;
      continue;
    }

    // Regular property access
    if (!currentProps || !currentProps[part]) return null;
    current = currentProps[part];
  }

  return current as SchemaProperty;
}

/**
 * Merge multiple schemas into one
 * Later schemas override earlier ones for conflicting properties
 */
export function mergeSchemas(...schemas: (DataSchema | null | undefined)[]): DataSchema | null {
  const validSchemas = schemas.filter((s): s is DataSchema => s !== null && s !== undefined);
  if (validSchemas.length === 0) return null;
  if (validSchemas.length === 1) return validSchemas[0];

  const merged: DataSchema = {
    type: 'object',
    properties: {},
    required: [],
  };

  for (const schema of validSchemas) {
    Object.assign(merged.properties, schema.properties);
    if (schema.required) {
      merged.required = [...new Set([...(merged.required || []), ...schema.required])];
    }
  }

  return merged;
}

/**
 * Generate mock data from a schema
 */
export function generateMockData(schema: DataSchema): Record<string, unknown> {
  // If example is provided, use it
  if (schema.example) {
    return schema.example;
  }

  const result: Record<string, unknown> = {};

  for (const [key, prop] of Object.entries(schema.properties)) {
    result[key] = generateMockValue(prop);
  }

  return result;
}

/**
 * Generate a mock value for a schema property
 */
export function generateMockValue(prop: SchemaProperty): unknown {
  // Use example if provided
  if (prop.example !== undefined) return prop.example;

  // Use default if provided
  if (prop.default !== undefined) return prop.default;

  // Use const if provided
  if (prop.const !== undefined) return prop.const;

  // Use first enum value if provided
  if (prop.enum && prop.enum.length > 0) return prop.enum[0];

  // Generate based on type
  const type = Array.isArray(prop.type) ? prop.type[0] : prop.type;

  switch (type) {
    case 'string':
      return generateMockString(prop);
    case 'number':
      return prop.minimum ?? 0;
    case 'integer':
      return prop.minimum ?? 0;
    case 'boolean':
      return false;
    case 'array':
      if (prop.items) {
        return [generateMockValue(prop.items)];
      }
      return [];
    case 'object':
      if (prop.properties) {
        const obj: Record<string, unknown> = {};
        for (const [key, subProp] of Object.entries(prop.properties)) {
          obj[key] = generateMockValue(subProp);
        }
        return obj;
      }
      return {};
    case 'null':
      return null;
    case 'any':
    default:
      return null;
  }
}

/**
 * Generate a mock string value based on format
 */
function generateMockString(prop: SchemaProperty): string {
  switch (prop.format) {
    case 'date':
      return '2024-01-15';
    case 'datetime':
      return '2024-01-15T10:30:00.000Z';
    case 'time':
      return '10:30:00';
    case 'email':
      return 'user@example.com';
    case 'uri':
    case 'url':
      return 'https://example.com';
    case 'uuid':
      return '550e8400-e29b-41d4-a716-446655440000';
    case 'hostname':
      return 'example.com';
    case 'ipv4':
      return '192.168.1.1';
    case 'ipv6':
      return '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    case 'phone':
      return '+1-555-123-4567';
    case 'color':
      return '#3B82F6';
    default:
      return prop.displayName || 'sample text';
  }
}

/**
 * Convert a schema to autocomplete suggestions
 */
export function schemaToSuggestions(
  schema: DataSchema,
  prefix: string = '$json',
  sourceNode?: string
): SchemaSuggestion[] {
  const suggestions: SchemaSuggestion[] = [];

  for (const [key, prop] of Object.entries(schema.properties)) {
    const path = `${prefix}.${key}`;
    const type = Array.isArray(prop.type) ? prop.type[0] : prop.type;

    const suggestion: SchemaSuggestion = {
      path,
      label: key,
      type: prop.type,
      description: prop.description,
      sourceNode,
      kind: type === 'object' ? 'object' : type === 'array' ? 'array' : 'property',
      detail: formatTypeLabel(prop),
      insertText: path,
    };

    // Add children for nested objects
    if (type === 'object' && prop.properties) {
      suggestion.children = schemaToSuggestions(
        { type: 'object', properties: prop.properties },
        path,
        sourceNode
      );
    }

    // Add children for arrays with object items
    if (type === 'array' && prop.items?.type === 'object' && prop.items.properties) {
      suggestion.children = schemaToSuggestions(
        { type: 'object', properties: prop.items.properties },
        `${path}[0]`,
        sourceNode
      );
    }

    suggestions.push(suggestion);
  }

  return suggestions;
}

/**
 * Format a type label for display
 */
function formatTypeLabel(prop: SchemaProperty): string {
  const type = Array.isArray(prop.type) ? prop.type.join(' | ') : prop.type;

  if (prop.format) {
    return `${type} (${prop.format})`;
  }

  if (type === 'array' && prop.items) {
    const itemType = Array.isArray(prop.items.type) ? prop.items.type.join(' | ') : prop.items.type;
    return `${itemType}[]`;
  }

  return type;
}

/**
 * Validate data against a schema (basic validation)
 */
export function validateAgainstSchema(
  data: unknown,
  schema: DataSchema
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Data must be an object'] };
  }

  const dataObj = data as Record<string, unknown>;

  // Check required properties
  if (schema.required) {
    for (const required of schema.required) {
      if (!(required in dataObj)) {
        errors.push(`Missing required property: ${required}`);
      }
    }
  }

  // Validate each property
  for (const [key, value] of Object.entries(dataObj)) {
    const propSchema = schema.properties[key];
    if (!propSchema && !schema.additionalProperties) {
      errors.push(`Unknown property: ${key}`);
      continue;
    }
    if (propSchema) {
      const propErrors = validateProperty(value, propSchema, key);
      errors.push(...propErrors);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a single property value
 */
function validateProperty(value: unknown, schema: SchemaProperty, path: string): string[] {
  const errors: string[] = [];
  const type = Array.isArray(schema.type) ? schema.type : [schema.type];

  // Check type
  const actualType = getValueType(value);
  if (!type.includes(actualType) && !type.includes('any')) {
    errors.push(`${path}: expected ${type.join(' | ')}, got ${actualType}`);
  }

  // Check enum
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: value must be one of ${schema.enum.join(', ')}`);
  }

  // String validations
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path}: string length must be at least ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(`${path}: string length must be at most ${schema.maxLength}`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${path}: string must match pattern ${schema.pattern}`);
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${path}: value must be at least ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${path}: value must be at most ${schema.maximum}`);
    }
  }

  return errors;
}

/**
 * Get the schema type of a JavaScript value
 */
function getValueType(value: unknown): SchemaPropertyType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'any';
}
