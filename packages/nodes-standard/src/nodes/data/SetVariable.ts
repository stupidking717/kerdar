import type { NodeTypeDefinition, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  NodeInputType,
  NodeOutputType,
  PropertyType,
} from '@kerdar/core';

/**
 * Set Variable Node
 * Set or modify data values
 */
export const SetVariableNode: NodeTypeDefinition = {
  type: 'set-variable',
  version: 1,
  name: 'setVariable',
  displayName: 'Set',
  description: 'Set values in your data',
  icon: 'Variable',
  iconColor: '#10B981',
  category: NodeCategory.Data,
  group: ['data', 'transform', 'set'],
  defaults: {
    name: 'Set',
  },

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
      options: [
        {
          name: 'Manual Mapping',
          value: 'manual',
          description: 'Define fields manually',
        },
        {
          name: 'JSON',
          value: 'json',
          description: 'Use JSON to define all fields at once',
        },
      ],
    },
    {
      name: 'keepOnlySet',
      displayName: 'Keep Only Set Fields',
      type: PropertyType.Boolean,
      default: false,
      description: 'If enabled, only the fields you set will be in the output. Otherwise, input fields are preserved.',
    },
    {
      name: 'fields',
      displayName: 'Fields',
      type: PropertyType.FixedCollection,
      default: {
        values: [],
      },
      typeOptions: {
        multipleValues: true,
        multipleValueButtonText: 'Add Field',
      },
      displayOptions: {
        show: {
          mode: ['manual'],
        },
      },
      values: [
        {
          name: 'name',
          displayName: 'Name',
          type: PropertyType.String,
          default: '',
          placeholder: 'fieldName',
          description: 'Name of the field to set',
        },
        {
          name: 'type',
          displayName: 'Type',
          type: PropertyType.Options,
          default: 'string',
          options: [
            { name: 'String', value: 'string' },
            { name: 'Number', value: 'number' },
            { name: 'Boolean', value: 'boolean' },
            { name: 'JSON', value: 'json' },
          ],
        },
        {
          name: 'stringValue',
          displayName: 'Value',
          type: PropertyType.String,
          default: '',
          displayOptions: {
            show: {
              type: ['string'],
            },
          },
        },
        {
          name: 'numberValue',
          displayName: 'Value',
          type: PropertyType.Number,
          default: 0,
          displayOptions: {
            show: {
              type: ['number'],
            },
          },
        },
        {
          name: 'booleanValue',
          displayName: 'Value',
          type: PropertyType.Boolean,
          default: false,
          displayOptions: {
            show: {
              type: ['boolean'],
            },
          },
        },
        {
          name: 'jsonValue',
          displayName: 'Value',
          type: PropertyType.Json,
          default: '{}',
          displayOptions: {
            show: {
              type: ['json'],
            },
          },
        },
      ],
    },
    {
      name: 'jsonData',
      displayName: 'JSON Data',
      type: PropertyType.Json,
      default: '{}',
      displayOptions: {
        show: {
          mode: ['json'],
        },
      },
      description: 'JSON object to merge with or replace the input data',
    },
  ],

  async execute(context) {
    const items = context.getInputData();
    const mode = context.getNodeParameter<string>('mode', 'manual');
    const keepOnlySet = context.getNodeParameter<boolean>('keepOnlySet', false);

    const outputItems: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let newJson: Record<string, unknown>;

      if (keepOnlySet) {
        newJson = {};
      } else {
        newJson = { ...item.json };
      }

      if (mode === 'manual') {
        const fieldsConfig = context.getNodeParameter<{
          values: Array<{
            name: string;
            type: string;
            stringValue?: string;
            numberValue?: number;
            booleanValue?: boolean;
            jsonValue?: string;
          }>;
        }>('fields', { values: [] });

        for (const field of fieldsConfig.values || []) {
          if (!field.name) continue;

          let value: unknown;
          switch (field.type) {
            case 'string':
              value = field.stringValue ?? '';
              break;
            case 'number':
              value = field.numberValue ?? 0;
              break;
            case 'boolean':
              value = field.booleanValue ?? false;
              break;
            case 'json':
              try {
                value = typeof field.jsonValue === 'string'
                  ? JSON.parse(field.jsonValue)
                  : field.jsonValue;
              } catch {
                value = field.jsonValue;
              }
              break;
            default:
              value = field.stringValue ?? '';
          }

          // Support dot notation for nested fields
          setNestedValue(newJson, field.name, value);
        }
      } else {
        // JSON mode
        const jsonData = context.getNodeParameter<string>('jsonData', '{}');
        try {
          const parsedJson = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
          if (keepOnlySet) {
            newJson = parsedJson;
          } else {
            newJson = { ...newJson, ...parsedJson };
          }
        } catch {
          context.logger.warn('Failed to parse JSON data');
        }
      }

      outputItems.push({
        json: newJson,
        binary: item.binary,
        pairedItem: { item: i },
      });
    }

    return {
      outputData: [outputItems],
    };
  },
};

/**
 * Set a nested value using dot notation
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

export default SetVariableNode;
