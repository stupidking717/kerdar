import type { NodeTypeDefinition, TriggerContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Integration Trigger Mode
 * Defines how external service triggers work
 */
export enum IntegrationTriggerMode {
  /** Webhook - external service calls our endpoint */
  Webhook = 'webhook',
  /** Polling - we periodically check for new data */
  Polling = 'polling',
  /** Push - real-time push via WebSocket (requires backend) */
  Push = 'push',
}

/**
 * Base properties for all integration triggers
 */
export const integrationTriggerBaseProperties = [
  {
    name: 'triggerMode',
    displayName: 'Trigger Mode',
    type: PropertyType.Options,
    default: IntegrationTriggerMode.Polling,
    description: 'How to receive events from the service',
    options: [
      {
        name: 'Webhook',
        value: IntegrationTriggerMode.Webhook,
        description: 'Service sends events to a webhook URL',
      },
      {
        name: 'Polling',
        value: IntegrationTriggerMode.Polling,
        description: 'Periodically check for new events',
      },
      {
        name: 'Push (Requires Backend)',
        value: IntegrationTriggerMode.Push,
        description: 'Real-time events via WebSocket connection',
      },
    ],
  },
  {
    name: 'pollingInterval',
    displayName: 'Polling Interval (seconds)',
    type: PropertyType.Number,
    default: 60,
    description: 'How often to check for new events',
    displayOptions: {
      show: {
        triggerMode: [IntegrationTriggerMode.Polling],
      },
    },
    typeOptions: {
      minValue: 10,
      maxValue: 3600,
    },
  },
  {
    name: 'webhookPath',
    displayName: 'Webhook Path',
    type: PropertyType.String,
    default: '',
    placeholder: 'minio-events',
    description: 'The webhook endpoint path',
    displayOptions: {
      show: {
        triggerMode: [IntegrationTriggerMode.Webhook],
      },
    },
  },
];

/**
 * Helper to create a base trigger execution function
 */
export function createIntegrationTriggerExecutor(
  serviceName: string,
  mockDataGenerator: (params: Record<string, unknown>) => Record<string, unknown>
) {
  return async (context: TriggerContext): Promise<INodeExecutionData[][]> => {
    const { parameters } = context;
    const triggerMode = parameters.triggerMode as IntegrationTriggerMode;

    // Generate mock event data for frontend simulation
    const eventData = mockDataGenerator(parameters);

    return [[{
      json: {
        ...eventData,
        _trigger: {
          service: serviceName,
          mode: triggerMode,
          timestamp: new Date().toISOString(),
          simulated: true,
          note: `${serviceName} trigger is simulated. Configure a backend handler for real events.`,
        },
      },
    }]];
  };
}
