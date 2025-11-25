import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Debounce Node
 * Delays execution until input stabilizes
 */
export const DebounceNode: NodeTypeDefinition = {
  name: 'debounce',
  displayName: 'Debounce',
  description: 'Delay execution until input stabilizes (wait for pause in input)',
  type: 'debounce',
  group: ['logic'],
  category: NodeCategory.Logic,
  version: 1,
  icon: 'timer',
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
      name: 'waitTime',
      displayName: 'Wait Time (ms)',
      type: PropertyType.Number,
      default: 1000,
      required: true,
      description: 'Time to wait after last input before processing',
      typeOptions: {
        minValue: 100,
        maxValue: 60000,
      },
    },
    {
      name: 'mode',
      displayName: 'Mode',
      type: PropertyType.Options,
      default: 'lastOnly',
      description: 'How to handle multiple items during debounce period',
      options: [
        {
          name: 'Last Only',
          value: 'lastOnly',
          description: 'Only output the last item received',
        },
        {
          name: 'First Only',
          value: 'firstOnly',
          description: 'Only output the first item received',
        },
        {
          name: 'Collect All',
          value: 'collectAll',
          description: 'Collect and output all items together',
        },
      ],
    },
    {
      name: 'groupBy',
      displayName: 'Group By',
      type: PropertyType.String,
      default: '',
      placeholder: 'field.name',
      description: 'Field to group debouncing by (empty = all items together)',
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const items = inputData[0] || [];
    const mode = parameters.mode as string;
    const waitTime = Math.min((parameters.waitTime as number) || 1000, 5000); // Cap for demo

    // Simulate debounce delay (capped for frontend demo)
    await new Promise((resolve) => setTimeout(resolve, Math.min(waitTime, 500)));

    let results: INodeExecutionData[];

    switch (mode) {
      case 'lastOnly':
        results = items.length > 0 ? [items[items.length - 1]] : [];
        break;

      case 'firstOnly':
        results = items.length > 0 ? [items[0]] : [];
        break;

      case 'collectAll':
        results = [
          {
            json: {
              items: items.map((item) => item.json),
              count: items.length,
              debounced: true,
              waitTime,
            },
          },
        ];
        break;

      default:
        results = items;
    }

    // Add debounce metadata
    return {
      outputData: [
        results.map((item) => ({
          json: {
            ...item.json,
            _debounced: true,
            _debounceMode: mode,
            _debounceWaitTime: waitTime,
          },
          binary: item.binary,
        })),
      ],
    };
  },
};
