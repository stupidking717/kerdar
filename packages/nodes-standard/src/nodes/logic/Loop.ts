import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Loop Over Items Node
 * Iterates over each item individually
 */
export const LoopNode: NodeTypeDefinition = {
  name: 'loop',
  displayName: 'Loop Over Items',
  description: 'Loop over each item and process them one at a time',
  type: 'loop',
  group: ['logic'],
  category: NodeCategory.Logic,
  version: 1,
  icon: 'repeat',
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
      displayName: 'Loop Body',
    },
    {
      type: NodeOutputType.Main,
      displayName: 'Done',
    },
  ],

  properties: [
    {
      name: 'mode',
      displayName: 'Mode',
      type: PropertyType.Options,
      default: 'each',
      description: 'How to iterate over items',
      options: [
        {
          name: 'Each Item',
          value: 'each',
          description: 'Process each item individually',
        },
        {
          name: 'Count',
          value: 'count',
          description: 'Loop a specific number of times',
        },
      ],
    },
    {
      name: 'loopCount',
      displayName: 'Loop Count',
      type: PropertyType.Number,
      default: 10,
      required: true,
      description: 'Number of times to loop',
      displayOptions: {
        show: {
          mode: ['count'],
        },
      },
      typeOptions: {
        minValue: 1,
      },
    },
    {
      name: 'options',
      displayName: 'Options',
      type: PropertyType.Collection,
      default: {},
      values: [
        {
          name: 'reset',
          displayName: 'Reset',
          type: PropertyType.Boolean,
          default: false,
          description: 'Reset the loop to start from the beginning',
        },
        {
          name: 'doneAfterRuns',
          displayName: 'Max Iterations',
          type: PropertyType.Number,
          default: 0,
          description: 'Maximum number of iterations (0 = no limit)',
        },
      ],
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters, nodeData } = context;
    const items = inputData[0] || [];
    const mode = parameters.mode as string;
    const reset = (parameters.options as { reset?: boolean })?.reset || false;
    const maxIterations = (parameters.options as { doneAfterRuns?: number })?.doneAfterRuns || 0;

    // Get or initialize loop state
    let currentIndex = (nodeData?.loopIndex as number) || 0;
    let iterationCount = (nodeData?.iterationCount as number) || 0;

    if (reset) {
      currentIndex = 0;
      iterationCount = 0;
    }

    // Check max iterations
    if (maxIterations > 0 && iterationCount >= maxIterations) {
      // Note: State management for loop tracking would require workflow static data
      return { outputData: [[], items] }; // Output all items to "Done"
    }

    let currentItem: INodeExecutionData | null = null;
    let isDone = false;

    if (mode === 'each') {
      // Each item mode
      if (currentIndex < items.length) {
        currentItem = items[currentIndex];
        currentIndex++;
      }
      isDone = currentIndex >= items.length;
    } else {
      // Count mode
      const loopCount = (parameters.loopCount as number) || 10;
      if (currentIndex < loopCount) {
        currentItem = items[0] || { json: { index: currentIndex } };
        // Add loop index to the item
        currentItem = {
          ...currentItem,
          json: {
            ...currentItem.json,
            $loopIndex: currentIndex,
            $loopIteration: iterationCount + 1,
          },
        };
        currentIndex++;
      }
      isDone = currentIndex >= loopCount;
    }

    iterationCount++;

    // Note: State management for loop tracking would require workflow static data
    // For frontend-only demo, each execution is independent

    if (isDone) {
      // Loop complete - output to "Done"
      return { outputData: [[], currentItem ? [currentItem] : []] };
    } else {
      // Continue looping - output to "Loop Body"
      return { outputData: [currentItem ? [currentItem] : [], []] };
    }
  },
};
