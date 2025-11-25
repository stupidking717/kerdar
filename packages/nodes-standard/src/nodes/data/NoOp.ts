import type { NodeTypeDefinition } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * No Operation Node
 * Passes data through without modification
 */
export const NoOpNode: NodeTypeDefinition = {
  type: 'no-op',
  name: 'noOp',
  displayName: 'No Operation',
  description: 'Pass data through without any changes',
  category: NodeCategory.Data,
  group: ['data', 'utility'],
  version: 1,
  icon: 'arrow-right',
  iconColor: '#6b7280',

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
      name: 'notice',
      displayName: 'Notice',
      type: PropertyType.Notice,
      default: '',
      description: 'This node simply passes data through without modification. Useful for organizing workflows.',
    },
  ],

  async execute(context) {
    const items = context.getInputData();
    return { outputData: [items] };
  },
};
