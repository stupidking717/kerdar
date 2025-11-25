import type { NodeTypeDefinition, NodeExecutionContext } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Sequence Node
 * Ensures items are processed in order, one at a time
 */
export const SequenceNode: NodeTypeDefinition = {
  name: 'sequence',
  displayName: 'Sequence',
  description: 'Process items sequentially, ensuring order is maintained',
  type: 'sequence',
  group: ['logic'],
  category: NodeCategory.Logic,
  version: 1,
  icon: 'arrow-right-circle',
  iconColor: '#f59e0b',

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
      default: 'passThrough',
      description: 'How to handle the sequence',
      options: [
        {
          name: 'Pass Through',
          value: 'passThrough',
          description: 'Pass items through maintaining order',
        },
        {
          name: 'One at a Time',
          value: 'oneAtATime',
          description: 'Output items one at a time (simulated)',
        },
        {
          name: 'Delay Between',
          value: 'delay',
          description: 'Add a delay between items',
        },
      ],
    },
    {
      name: 'delayMs',
      displayName: 'Delay (ms)',
      type: PropertyType.Number,
      default: 100,
      description: 'Delay between items in milliseconds',
      displayOptions: {
        show: {
          mode: ['delay'],
        },
      },
      typeOptions: {
        minValue: 0,
        maxValue: 10000,
      },
    },
    {
      name: 'options',
      displayName: 'Options',
      type: PropertyType.Collection,
      default: {},
      values: [
        {
          name: 'addSequenceIndex',
          displayName: 'Add Sequence Index',
          type: PropertyType.Boolean,
          default: true,
          description: 'Add sequence index to each item',
        },
        {
          name: 'reverse',
          displayName: 'Reverse Order',
          type: PropertyType.Boolean,
          default: false,
          description: 'Process items in reverse order',
        },
      ],
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    let items = [...(inputData[0] || [])];
    const mode = parameters.mode as string;
    const addSequenceIndex = (parameters.options as { addSequenceIndex?: boolean })?.addSequenceIndex ?? true;
    const reverse = (parameters.options as { reverse?: boolean })?.reverse ?? false;

    if (reverse) {
      items = items.reverse();
    }

    // Apply delay if configured
    if (mode === 'delay') {
      const delayMs = Math.min((parameters.delayMs as number) || 100, 1000); // Cap at 1 second for demo
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    // Add sequence information
    const results = items.map((item, index) => {
      if (addSequenceIndex) {
        return {
          json: {
            ...item.json,
            _sequenceIndex: index,
            _sequenceTotal: items.length,
            _sequenceMode: mode,
          },
          binary: item.binary,
        };
      }
      return item;
    });

    return { outputData: [results] };
  },
};
