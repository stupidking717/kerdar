import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Limit Node
 * Limits the number of items passed through
 */
export const LimitNode: NodeTypeDefinition = {
  name: 'limit',
  displayName: 'Limit',
  description: 'Limit the number of items',
  type: 'limit',
  group: ['data'],
  category: NodeCategory.Data,
  version: 1,
  icon: 'minus-square',
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
      name: 'maxItems',
      displayName: 'Max Items',
      type: PropertyType.Number,
      default: 10,
      required: true,
      description: 'Maximum number of items to keep',
      typeOptions: {
        minValue: 1,
      },
    },
    {
      name: 'keep',
      displayName: 'Keep',
      type: PropertyType.Options,
      default: 'first',
      description: 'Which items to keep',
      options: [
        {
          name: 'First Items',
          value: 'first',
          description: 'Keep the first N items',
        },
        {
          name: 'Last Items',
          value: 'last',
          description: 'Keep the last N items',
        },
      ],
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const items = inputData[0] || [];
    const maxItems = (parameters.maxItems as number) || 10;
    const keep = parameters.keep as string;

    let result: INodeExecutionData[];

    if (keep === 'last') {
      result = items.slice(-maxItems);
    } else {
      result = items.slice(0, maxItems);
    }

    return { outputData: [result] };
  },
};
