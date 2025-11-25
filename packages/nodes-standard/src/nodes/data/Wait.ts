import type { NodeTypeDefinition, NodeExecutionContext } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Wait Node
 * Pause workflow execution for a specified time
 */
export const WaitNode: NodeTypeDefinition = {
  name: 'wait',
  displayName: 'Wait',
  description: 'Pause workflow execution for a specified time',
  type: 'wait',
  group: ['data'],
  category: NodeCategory.Data,
  version: 1,
  icon: 'clock',
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
      name: 'unit',
      displayName: 'Wait Unit',
      type: PropertyType.Options,
      default: 'seconds',
      description: 'The unit of time to wait',
      options: [
        { name: 'Milliseconds', value: 'milliseconds' },
        { name: 'Seconds', value: 'seconds' },
        { name: 'Minutes', value: 'minutes' },
        { name: 'Hours', value: 'hours' },
      ],
    },
    {
      name: 'amount',
      displayName: 'Amount',
      type: PropertyType.Number,
      default: 1,
      required: true,
      description: 'The amount of time to wait',
      typeOptions: {
        minValue: 0,
      },
    },
    {
      name: 'options',
      displayName: 'Options',
      type: PropertyType.Collection,
      default: {},
      values: [
        {
          name: 'addToWaitTime',
          displayName: 'Add Wait Time to Output',
          type: PropertyType.Boolean,
          default: false,
          description: 'Add the wait time information to the output data',
        },
      ],
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const items = inputData[0] || [];
    const unit = parameters.unit as string;
    const amount = (parameters.amount as number) || 0;
    const addToWaitTime = (parameters.options as { addToWaitTime?: boolean })?.addToWaitTime || false;

    // Convert to milliseconds
    let waitMs = amount;
    switch (unit) {
      case 'seconds':
        waitMs = amount * 1000;
        break;
      case 'minutes':
        waitMs = amount * 60 * 1000;
        break;
      case 'hours':
        waitMs = amount * 60 * 60 * 1000;
        break;
    }

    // Cap at 10 seconds for frontend simulation
    const maxWait = 10000;
    const actualWait = Math.min(waitMs, maxWait);

    // Perform the wait
    await new Promise((resolve) => setTimeout(resolve, actualWait));

    // Return items with optional wait info
    if (addToWaitTime) {
      return {
        outputData: [
          items.map((item) => ({
            json: {
              ...item.json,
              _waitInfo: {
                requestedWait: waitMs,
                actualWait,
                unit,
                amount,
                capped: waitMs > maxWait,
              },
            },
            binary: item.binary,
          })),
        ],
      };
    }

    return { outputData: [items] };
  },
};
