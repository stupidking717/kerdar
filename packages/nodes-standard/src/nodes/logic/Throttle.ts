import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Throttle Node
 * Limits the rate at which items pass through
 */
export const ThrottleNode: NodeTypeDefinition = {
  name: 'throttle',
  displayName: 'Throttle',
  description: 'Limit the rate at which items pass through (rate limiting)',
  type: 'throttle',
  group: ['logic'],
  category: NodeCategory.Logic,
  version: 1,
  icon: 'gauge',
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
    {
      type: NodeOutputType.Main,
      displayName: 'Dropped',
    },
  ],

  properties: [
    {
      name: 'rateLimit',
      displayName: 'Rate Limit (items/second)',
      type: PropertyType.Number,
      default: 10,
      required: true,
      description: 'Maximum number of items to allow per second',
      typeOptions: {
        minValue: 1,
        maxValue: 1000,
      },
    },
    {
      name: 'interval',
      displayName: 'Interval (ms)',
      type: PropertyType.Number,
      default: 1000,
      required: true,
      description: 'Time window for the rate limit',
      typeOptions: {
        minValue: 100,
        maxValue: 60000,
      },
    },
    {
      name: 'mode',
      displayName: 'Overflow Mode',
      type: PropertyType.Options,
      default: 'drop',
      description: 'What to do with items that exceed the rate limit',
      options: [
        {
          name: 'Drop',
          value: 'drop',
          description: 'Discard items that exceed the rate limit',
        },
        {
          name: 'Queue',
          value: 'queue',
          description: 'Queue items and process them later (max 100)',
        },
        {
          name: 'Error',
          value: 'error',
          description: 'Throw an error when rate limit is exceeded',
        },
      ],
    },
    {
      name: 'batchSize',
      displayName: 'Batch Size',
      type: PropertyType.Number,
      default: 1,
      description: 'Number of items to process at once',
      typeOptions: {
        minValue: 1,
        maxValue: 100,
      },
    },
    {
      name: 'groupBy',
      displayName: 'Group By',
      type: PropertyType.String,
      default: '',
      placeholder: 'field.name',
      description: 'Field to apply throttling per group (empty = global)',
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const items = inputData[0] || [];
    const rateLimit = (parameters.rateLimit as number) || 10;
    const interval = (parameters.interval as number) || 1000;
    const mode = parameters.mode as string;
    const batchSize = Math.min((parameters.batchSize as number) || 1, 100);

    // Calculate allowed items in this interval
    const allowedItems = Math.ceil(rateLimit * (interval / 1000));

    const allowedResults: INodeExecutionData[] = [];
    const droppedResults: INodeExecutionData[] = [];

    // Process items in batches up to rate limit
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      if (allowedResults.length / batchSize < allowedItems) {
        // Allow these items through
        allowedResults.push(
          ...batch.map((item) => ({
            json: {
              ...item.json,
              _throttled: false,
              _throttleTimestamp: Date.now(),
            },
            binary: item.binary,
          }))
        );
      } else {
        // Handle overflow
        switch (mode) {
          case 'drop':
            droppedResults.push(
              ...batch.map((item) => ({
                json: {
                  ...item.json,
                  _throttled: true,
                  _throttleReason: 'dropped',
                },
                binary: item.binary,
              }))
            );
            break;

          case 'queue':
            // In real implementation, items would be queued for later processing
            droppedResults.push(
              ...batch.map((item) => ({
                json: {
                  ...item.json,
                  _throttled: true,
                  _throttleReason: 'queued',
                  _queuePosition: droppedResults.length + 1,
                },
                binary: item.binary,
              }))
            );
            break;

          case 'error':
            throw new Error(
              `Rate limit exceeded: ${items.length} items exceed limit of ${allowedItems} items per ${interval}ms`
            );
        }
      }
    }

    // Add throttle metadata summary
    const summary = {
      _throttle: {
        rateLimit,
        interval,
        allowedCount: allowedResults.length,
        droppedCount: droppedResults.length,
        totalCount: items.length,
        timestamp: Date.now(),
      },
    };

    // Add summary to first allowed item if exists
    if (allowedResults.length > 0) {
      allowedResults[0].json = {
        ...allowedResults[0].json,
        ...summary,
      };
    }

    return {
      outputData: [allowedResults, droppedResults],
    };
  },
};
