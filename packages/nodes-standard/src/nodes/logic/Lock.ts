import type { NodeTypeDefinition, NodeExecutionContext } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Lock Node
 * Prevents concurrent executions of downstream workflow parts
 */
export const LockNode: NodeTypeDefinition = {
  name: 'lock',
  displayName: 'Lock',
  description: 'Prevent concurrent execution of workflow section (serializes execution)',
  type: 'lock',
  group: ['logic'],
  category: NodeCategory.Logic,
  version: 1,
  icon: 'lock',
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
      name: 'lockKey',
      displayName: 'Lock Key',
      type: PropertyType.String,
      default: 'default',
      required: true,
      placeholder: 'my-lock-key',
      description: 'A unique key to identify this lock. Same key = same lock.',
    },
    {
      name: 'timeout',
      displayName: 'Lock Timeout (ms)',
      type: PropertyType.Number,
      default: 30000,
      description: 'Maximum time to hold the lock before automatic release',
      typeOptions: {
        minValue: 1000,
      },
    },
    {
      name: 'waitTimeout',
      displayName: 'Wait Timeout (ms)',
      type: PropertyType.Number,
      default: 60000,
      description: 'Maximum time to wait to acquire the lock',
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
          name: 'failOnTimeout',
          displayName: 'Fail on Timeout',
          type: PropertyType.Boolean,
          default: true,
          description: 'Throw an error if lock cannot be acquired within the wait timeout',
        },
      ],
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const items = inputData[0] || [];
    const lockKey = parameters.lockKey as string;

    // In a frontend-only implementation, locks are simulated
    // A real implementation would use a backend lock service
    const lockInfo = {
      lockKey,
      acquired: true,
      acquiredAt: new Date().toISOString(),
      timeout: parameters.timeout as number,
      note: 'Lock mechanism is simulated in frontend-only mode',
    };

    // Pass through items with lock metadata
    return {
      outputData: [
        items.map((item) => ({
          json: {
            ...item.json,
            _lockInfo: lockInfo,
          },
          binary: item.binary,
        })),
      ],
    };
  },
};
