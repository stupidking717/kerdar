import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
  CodeLanguage,
} from '@kerdar/core';

/**
 * Transform Node
 * Transform and reshape data
 */
export const TransformNode: NodeTypeDefinition = {
  name: 'transform',
  displayName: 'Transform',
  description: 'Transform and reshape data',
  type: 'transform',
  group: ['data'],
  category: NodeCategory.Data,
  version: 1,
  icon: 'shuffle',
  iconColor: '#8b5cf6',

  inputs: [
    {
      type: NodeInputType.Main,
      displayName: 'Input',
    },
  ],
  outputs: [
    {
      type: NodeOutputType.Main,
      displayName: 'Output',
    },
  ],

  properties: [
    {
      name: 'mode',
      displayName: 'Mode',
      type: PropertyType.Options,
      default: 'manual',
      description: 'Transformation mode',
      options: [
        {
          name: 'Manual Mapping',
          value: 'manual',
          description: 'Define field mappings manually',
        },
        {
          name: 'Expression',
          value: 'expression',
          description: 'Use an expression to transform data',
        },
        {
          name: 'Rename Keys',
          value: 'rename',
          description: 'Rename object keys',
        },
        {
          name: 'Keep Fields',
          value: 'keep',
          description: 'Keep only specified fields',
        },
        {
          name: 'Remove Fields',
          value: 'remove',
          description: 'Remove specified fields',
        },
      ],
    },
    // Manual mapping
    {
      name: 'mappings',
      displayName: 'Mappings',
      type: PropertyType.FixedCollection,
      default: { mappings: [] },
      description: 'Field mappings',
      displayOptions: {
        show: {
          mode: ['manual'],
        },
      },
      typeOptions: {
        multipleValues: true,
      },
      values: [
        {
          name: 'sourceField',
          displayName: 'Source Field',
          type: PropertyType.String,
          default: '',
          placeholder: 'originalField',
        },
        {
          name: 'targetField',
          displayName: 'Target Field',
          type: PropertyType.String,
          default: '',
          placeholder: 'newField',
        },
      ],
    },
    // Expression mode
    {
      name: 'expression',
      displayName: 'Expression',
      type: PropertyType.Code,
      default: '// Return the transformed item\nreturn {\n  ...item,\n  transformed: true\n}',
      description: 'JavaScript expression to transform each item. "item" contains the current item.',
      displayOptions: {
        show: {
          mode: ['expression'],
        },
      },
      typeOptions: {
        language: CodeLanguage.JavaScript,
      },
    },
    // Rename keys
    {
      name: 'renameFields',
      displayName: 'Rename Fields',
      type: PropertyType.FixedCollection,
      default: { fields: [] },
      displayOptions: {
        show: {
          mode: ['rename'],
        },
      },
      typeOptions: {
        multipleValues: true,
      },
      values: [
        {
          name: 'oldName',
          displayName: 'Current Name',
          type: PropertyType.String,
          default: '',
        },
        {
          name: 'newName',
          displayName: 'New Name',
          type: PropertyType.String,
          default: '',
        },
      ],
    },
    // Keep/Remove fields
    {
      name: 'fields',
      displayName: 'Fields',
      type: PropertyType.String,
      default: '',
      placeholder: 'field1, field2, field3',
      description: 'Comma-separated list of fields',
      displayOptions: {
        show: {
          mode: ['keep', 'remove'],
        },
      },
    },
    {
      name: 'options',
      displayName: 'Options',
      type: PropertyType.Collection,
      default: {},
      values: [
        {
          name: 'dotNotation',
          displayName: 'Support Dot Notation',
          type: PropertyType.Boolean,
          default: true,
          description: 'Allow accessing nested fields with dot notation',
        },
        {
          name: 'includeEmpty',
          displayName: 'Include Empty Values',
          type: PropertyType.Boolean,
          default: true,
          description: 'Include fields with null or undefined values',
        },
      ],
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const items = inputData[0] || [];
    const mode = parameters.mode as string;
    const includeEmpty = (parameters.options as { includeEmpty?: boolean })?.includeEmpty ?? true;

    const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
      return path.split('.').reduce<unknown>((current, key) => {
        if (current && typeof current === 'object') {
          return (current as Record<string, unknown>)[key];
        }
        return undefined;
      }, obj);
    };

    const setNestedValue = (
      obj: Record<string, unknown>,
      path: string,
      value: unknown
    ): void => {
      const keys = path.split('.');
      const lastKey = keys.pop()!;
      const target = keys.reduce<Record<string, unknown>>((current, key) => {
        if (!(key in current) || typeof current[key] !== 'object') {
          current[key] = {};
        }
        return current[key] as Record<string, unknown>;
      }, obj);
      target[lastKey] = value;
    };

    const results: INodeExecutionData[] = [];

    for (const item of items) {
      let transformed: Record<string, unknown>;

      switch (mode) {
        case 'manual': {
          const mappings = (parameters.mappings as { mappings?: Array<{
            sourceField: string;
            targetField: string;
          }> })?.mappings || [];

          transformed = {};
          for (const mapping of mappings) {
            const value = getNestedValue(item.json, mapping.sourceField);
            if (value !== undefined || includeEmpty) {
              setNestedValue(transformed, mapping.targetField, value);
            }
          }
          break;
        }

        case 'expression': {
          try {
            const expressionCode = parameters.expression as string;
            // Create a safe function context
            const fn = new Function('item', expressionCode);
            transformed = fn(item.json);
          } catch (error) {
            transformed = {
              ...item.json,
              _transformError: error instanceof Error ? error.message : 'Unknown error',
            };
          }
          break;
        }

        case 'rename': {
          const renameFields = (parameters.renameFields as { fields?: Array<{
            oldName: string;
            newName: string;
          }> })?.fields || [];

          transformed = { ...item.json };
          for (const field of renameFields) {
            if (field.oldName in transformed) {
              transformed[field.newName] = transformed[field.oldName];
              delete transformed[field.oldName];
            }
          }
          break;
        }

        case 'keep': {
          const fieldsStr = parameters.fields as string;
          const keepFields = fieldsStr.split(',').map((f) => f.trim()).filter(Boolean);

          transformed = {};
          for (const field of keepFields) {
            const value = getNestedValue(item.json, field);
            if (value !== undefined || includeEmpty) {
              setNestedValue(transformed, field, value);
            }
          }
          break;
        }

        case 'remove': {
          const fieldsStr = parameters.fields as string;
          const removeFields = fieldsStr.split(',').map((f) => f.trim()).filter(Boolean);

          transformed = { ...item.json };
          for (const field of removeFields) {
            delete transformed[field];
          }
          break;
        }

        default:
          transformed = item.json;
      }

      results.push({ json: transformed, binary: item.binary });
    }

    return { outputData: [results] };
  },
};
