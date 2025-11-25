import type { NodeTypeDefinition, NodeExecutionContext } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Split In Batches Node
 * Splits data into batches for processing
 */
export const SplitInBatchesNode: NodeTypeDefinition = {
  name: 'splitInBatches',
  displayName: 'Split In Batches',
  description: 'Split data into batches to process items in smaller groups',
  type: 'split-in-batches',
  group: ['logic'],
  category: NodeCategory.Logic,
  version: 1,
  icon: 'layers',
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
      displayName: 'Loop',
    },
    {
      type: NodeOutputType.Main,
      displayName: 'Done',
    },
  ],

  properties: [
    {
      name: 'batchSize',
      displayName: 'Batch Size',
      type: PropertyType.Number,
      default: 10,
      required: true,
      description: 'The number of items to process in each batch',
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
          description: 'Reset batch processing to start from the beginning',
        },
      ],
    },
  ],

  // This node has internal state for batch tracking
  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters, nodeData } = context;
    const items = inputData[0] || [];
    const batchSize = (parameters.batchSize as number) || 10;
    const reset = (parameters.options as { reset?: boolean })?.reset || false;

    // Get or initialize batch state
    let currentIndex = (nodeData?.batchIndex as number) || 0;

    if (reset) {
      currentIndex = 0;
    }

    // Calculate batch
    const startIndex = currentIndex;
    const endIndex = Math.min(startIndex + batchSize, items.length);
    const batch = items.slice(startIndex, endIndex);

    // Update index for next iteration
    const nextIndex = endIndex;
    const isDone = nextIndex >= items.length;

    // Note: State management for batch tracking would require workflow static data
    // For frontend-only demo, each execution is independent

    if (isDone) {
      // All batches processed - output to "Done"
      return { outputData: [[], batch] };
    } else {
      // More batches to process - output to "Loop"
      return { outputData: [batch, []] };
    }
  },
};
