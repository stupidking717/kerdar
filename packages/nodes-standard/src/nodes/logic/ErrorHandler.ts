import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Error Handler Node
 * Catches and handles errors from upstream nodes
 */
export const ErrorHandlerNode: NodeTypeDefinition = {
  name: 'errorHandler',
  displayName: 'Error Handler',
  description: 'Catch and handle errors from upstream nodes',
  type: 'error-handler',
  group: ['logic'],
  category: NodeCategory.Logic,
  version: 1,
  icon: 'alert-triangle',
  iconColor: '#ef4444',

  inputs: [
    {
      type: NodeInputType.Main,
      displayName: 'Success',
    },
    {
      type: NodeInputType.Main,
      displayName: 'Error',
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
      name: 'errorHandling',
      displayName: 'Error Handling',
      type: PropertyType.Options,
      default: 'continueWithData',
      description: 'How to handle incoming errors',
      options: [
        {
          name: 'Continue with Error Data',
          value: 'continueWithData',
          description: 'Pass error information downstream',
        },
        {
          name: 'Retry Failed',
          value: 'retry',
          description: 'Attempt to retry the failed operation',
        },
        {
          name: 'Use Default Data',
          value: 'useDefault',
          description: 'Use default data when an error occurs',
        },
        {
          name: 'Suppress Error',
          value: 'suppress',
          description: 'Suppress the error and continue with empty data',
        },
      ],
    },
    {
      name: 'retryCount',
      displayName: 'Retry Count',
      type: PropertyType.Number,
      default: 3,
      description: 'Number of times to retry on failure',
      displayOptions: {
        show: {
          errorHandling: ['retry'],
        },
      },
      typeOptions: {
        minValue: 1,
        maxValue: 10,
      },
    },
    {
      name: 'retryDelay',
      displayName: 'Retry Delay (ms)',
      type: PropertyType.Number,
      default: 1000,
      description: 'Delay between retry attempts',
      displayOptions: {
        show: {
          errorHandling: ['retry'],
        },
      },
    },
    {
      name: 'defaultData',
      displayName: 'Default Data',
      type: PropertyType.Json,
      default: '{}',
      description: 'Default data to use when an error occurs',
      displayOptions: {
        show: {
          errorHandling: ['useDefault'],
        },
      },
    },
    {
      name: 'options',
      displayName: 'Options',
      type: PropertyType.Collection,
      default: {},
      values: [
        {
          name: 'includeErrorDetails',
          displayName: 'Include Error Details',
          type: PropertyType.Boolean,
          default: true,
          description: 'Include error details in output',
        },
        {
          name: 'logErrors',
          displayName: 'Log Errors',
          type: PropertyType.Boolean,
          default: true,
          description: 'Log errors to the execution log',
        },
      ],
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const successItems = inputData[0] || [];
    const errorItems = inputData[1] || [];
    const errorHandling = parameters.errorHandling as string;
    const includeErrorDetails = (parameters.options as { includeErrorDetails?: boolean })?.includeErrorDetails ?? true;

    const results: INodeExecutionData[] = [];

    // Process success items (pass through)
    results.push(...successItems);

    // Process error items based on handling mode
    for (const errorItem of errorItems) {
      switch (errorHandling) {
        case 'continueWithData':
          results.push({
            json: {
              ...errorItem.json,
              _errorHandled: true,
              _errorHandlingMode: 'continueWithData',
            },
            binary: errorItem.binary,
          });
          break;

        case 'retry':
          // In a real implementation, this would trigger a retry
          // For simulation, we pass the item with retry info
          results.push({
            json: {
              ...errorItem.json,
              _retryAttempted: true,
              _retryCount: parameters.retryCount,
              _note: 'Retry mechanism is simulated in frontend-only mode',
            },
            binary: errorItem.binary,
          });
          break;

        case 'useDefault':
          try {
            const defaultData = JSON.parse(parameters.defaultData as string);
            results.push({
              json: {
                ...defaultData,
                _usedDefaultData: true,
                _originalError: includeErrorDetails ? errorItem.json : undefined,
              },
            });
          } catch {
            results.push({
              json: {
                _usedDefaultData: true,
                _parseError: 'Failed to parse default data',
              },
            });
          }
          break;

        case 'suppress':
          // Don't add anything - error is suppressed
          if (includeErrorDetails) {
            results.push({
              json: {
                _errorSuppressed: true,
                _suppressedError: errorItem.json,
              },
            });
          }
          break;

        default:
          results.push(errorItem);
      }
    }

    return { outputData: [results] };
  },
};
