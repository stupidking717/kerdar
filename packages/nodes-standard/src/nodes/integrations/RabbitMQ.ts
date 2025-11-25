import type { NodeTypeDefinition, NodeExecutionContext } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * RabbitMQ Operation Types
 */
export enum RabbitMQOperation {
  // Exchange operations
  SendToExchange = 'sendToExchange',

  // Queue operations
  SendToQueue = 'sendToQueue',
  GetFromQueue = 'getFromQueue',
  AcknowledgeMessage = 'ack',
  RejectMessage = 'reject',

  // Queue management
  AssertQueue = 'assertQueue',
  DeleteQueue = 'deleteQueue',
  PurgeQueue = 'purgeQueue',

  // Exchange management
  AssertExchange = 'assertExchange',
  DeleteExchange = 'deleteExchange',
  BindQueue = 'bindQueue',
  UnbindQueue = 'unbindQueue',
}

/**
 * RabbitMQ Node
 * Perform RabbitMQ messaging operations
 */
export const RabbitMQNode: NodeTypeDefinition = {
  type: 'rabbitmq',
  name: 'rabbitmq',
  displayName: 'RabbitMQ',
  description: 'Perform RabbitMQ messaging operations',
  category: NodeCategory.Integration,
  group: ['integration', 'messaging'],
  version: 1,
  icon: 'message-square',
  iconColor: '#FF6600',

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

  credentials: [
    {
      name: 'rabbitmq',
      required: true,
    },
  ],

  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: PropertyType.Options,
      default: RabbitMQOperation.SendToQueue,
      required: true,
      description: 'The RabbitMQ operation to perform',
      options: [
        // Message operations
        { name: 'Send to Queue', value: RabbitMQOperation.SendToQueue, description: 'Send message directly to a queue' },
        { name: 'Send to Exchange', value: RabbitMQOperation.SendToExchange, description: 'Send message to an exchange' },
        { name: 'Get from Queue', value: RabbitMQOperation.GetFromQueue, description: 'Get message from a queue' },
        { name: 'Acknowledge Message', value: RabbitMQOperation.AcknowledgeMessage, description: 'Acknowledge message' },
        { name: 'Reject Message', value: RabbitMQOperation.RejectMessage, description: 'Reject/nack message' },

        // Queue management
        { name: 'Assert Queue', value: RabbitMQOperation.AssertQueue, description: 'Create queue if not exists' },
        { name: 'Delete Queue', value: RabbitMQOperation.DeleteQueue, description: 'Delete a queue' },
        { name: 'Purge Queue', value: RabbitMQOperation.PurgeQueue, description: 'Remove all messages from queue' },

        // Exchange management
        { name: 'Assert Exchange', value: RabbitMQOperation.AssertExchange, description: 'Create exchange if not exists' },
        { name: 'Delete Exchange', value: RabbitMQOperation.DeleteExchange, description: 'Delete an exchange' },
        { name: 'Bind Queue', value: RabbitMQOperation.BindQueue, description: 'Bind queue to exchange' },
        { name: 'Unbind Queue', value: RabbitMQOperation.UnbindQueue, description: 'Unbind queue from exchange' },
      ],
    },
    // Queue name
    {
      name: 'queue',
      displayName: 'Queue',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'my-queue',
      description: 'The queue name',
      displayOptions: {
        show: {
          operation: [
            RabbitMQOperation.SendToQueue,
            RabbitMQOperation.GetFromQueue,
            RabbitMQOperation.AssertQueue,
            RabbitMQOperation.DeleteQueue,
            RabbitMQOperation.PurgeQueue,
            RabbitMQOperation.BindQueue,
            RabbitMQOperation.UnbindQueue,
          ],
        },
      },
    },
    // Exchange name
    {
      name: 'exchange',
      displayName: 'Exchange',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'my-exchange',
      description: 'The exchange name',
      displayOptions: {
        show: {
          operation: [
            RabbitMQOperation.SendToExchange,
            RabbitMQOperation.AssertExchange,
            RabbitMQOperation.DeleteExchange,
            RabbitMQOperation.BindQueue,
            RabbitMQOperation.UnbindQueue,
          ],
        },
      },
    },
    // Exchange type
    {
      name: 'exchangeType',
      displayName: 'Exchange Type',
      type: PropertyType.Options,
      default: 'direct',
      description: 'The type of exchange',
      displayOptions: {
        show: {
          operation: [RabbitMQOperation.AssertExchange],
        },
      },
      options: [
        { name: 'Direct', value: 'direct', description: 'Route by exact routing key match' },
        { name: 'Topic', value: 'topic', description: 'Route by routing key pattern' },
        { name: 'Fanout', value: 'fanout', description: 'Broadcast to all bound queues' },
        { name: 'Headers', value: 'headers', description: 'Route by message headers' },
      ],
    },
    // Routing key
    {
      name: 'routingKey',
      displayName: 'Routing Key',
      type: PropertyType.String,
      default: '',
      placeholder: 'my.routing.key',
      description: 'The routing key for exchange routing',
      displayOptions: {
        show: {
          operation: [
            RabbitMQOperation.SendToExchange,
            RabbitMQOperation.BindQueue,
            RabbitMQOperation.UnbindQueue,
          ],
        },
      },
    },
    // Message content
    {
      name: 'message',
      displayName: 'Message',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: '{"key": "value"}',
      description: 'The message content to send',
      typeOptions: {
        rows: 4,
      },
      displayOptions: {
        show: {
          operation: [
            RabbitMQOperation.SendToQueue,
            RabbitMQOperation.SendToExchange,
          ],
        },
      },
    },
    // Content type
    {
      name: 'contentType',
      displayName: 'Content Type',
      type: PropertyType.Options,
      default: 'application/json',
      description: 'Message content type',
      displayOptions: {
        show: {
          operation: [
            RabbitMQOperation.SendToQueue,
            RabbitMQOperation.SendToExchange,
          ],
        },
      },
      options: [
        { name: 'JSON', value: 'application/json' },
        { name: 'Plain Text', value: 'text/plain' },
        { name: 'Binary', value: 'application/octet-stream' },
      ],
    },
    // Queue options
    {
      name: 'queueOptions',
      displayName: 'Queue Options',
      type: PropertyType.Collection,
      default: {},
      displayOptions: {
        show: {
          operation: [RabbitMQOperation.AssertQueue],
        },
      },
      values: [
        {
          name: 'durable',
          displayName: 'Durable',
          type: PropertyType.Boolean,
          default: true,
          description: 'Queue survives broker restart',
        },
        {
          name: 'exclusive',
          displayName: 'Exclusive',
          type: PropertyType.Boolean,
          default: false,
          description: 'Only accessible by current connection',
        },
        {
          name: 'autoDelete',
          displayName: 'Auto Delete',
          type: PropertyType.Boolean,
          default: false,
          description: 'Delete queue when last consumer disconnects',
        },
        {
          name: 'messageTtl',
          displayName: 'Message TTL (ms)',
          type: PropertyType.Number,
          default: 0,
          description: 'Message time-to-live in milliseconds (0 = no TTL)',
        },
        {
          name: 'maxLength',
          displayName: 'Max Length',
          type: PropertyType.Number,
          default: 0,
          description: 'Maximum number of messages (0 = unlimited)',
        },
        {
          name: 'deadLetterExchange',
          displayName: 'Dead Letter Exchange',
          type: PropertyType.String,
          default: '',
          description: 'Exchange for rejected/expired messages',
        },
      ],
    },
    // Message options
    {
      name: 'messageOptions',
      displayName: 'Message Options',
      type: PropertyType.Collection,
      default: {},
      displayOptions: {
        show: {
          operation: [
            RabbitMQOperation.SendToQueue,
            RabbitMQOperation.SendToExchange,
          ],
        },
      },
      values: [
        {
          name: 'persistent',
          displayName: 'Persistent',
          type: PropertyType.Boolean,
          default: true,
          description: 'Message survives broker restart',
        },
        {
          name: 'priority',
          displayName: 'Priority',
          type: PropertyType.Number,
          default: 0,
          description: 'Message priority (0-9)',
        },
        {
          name: 'correlationId',
          displayName: 'Correlation ID',
          type: PropertyType.String,
          default: '',
          description: 'Correlation ID for RPC patterns',
        },
        {
          name: 'replyTo',
          displayName: 'Reply To',
          type: PropertyType.String,
          default: '',
          description: 'Reply queue name for RPC patterns',
        },
        {
          name: 'expiration',
          displayName: 'Expiration (ms)',
          type: PropertyType.String,
          default: '',
          description: 'Message expiration in milliseconds',
        },
      ],
    },
  ],

  async execute(context: NodeExecutionContext) {
    const items = context.getInputData();
    const operation = context.getNodeParameter('operation') as RabbitMQOperation;

    const getParam = <T>(name: string, defaultValue?: T): T => {
      return context.getNodeParameter(name, defaultValue) as T;
    };

    const simulateRabbitMQ = async (): Promise<unknown> => {
      const queue = getParam<string>('queue', '');
      const exchange = getParam<string>('exchange', '');
      const message = getParam<string>('message', '');

      switch (operation) {
        case RabbitMQOperation.SendToQueue:
          return {
            success: true,
            queue,
            message,
            messageId: `msg-${Date.now()}`,
            timestamp: new Date().toISOString(),
          };

        case RabbitMQOperation.SendToExchange:
          return {
            success: true,
            exchange,
            routingKey: getParam<string>('routingKey', ''),
            message,
            messageId: `msg-${Date.now()}`,
            timestamp: new Date().toISOString(),
          };

        case RabbitMQOperation.GetFromQueue:
          return {
            success: true,
            queue,
            message: {
              content: { sample: 'data', id: 1 },
              properties: {
                contentType: 'application/json',
                deliveryTag: 12345,
                redelivered: false,
              },
            },
            messageCount: 5,
          };

        case RabbitMQOperation.AcknowledgeMessage:
          return {
            success: true,
            action: 'acknowledged',
          };

        case RabbitMQOperation.RejectMessage:
          return {
            success: true,
            action: 'rejected',
          };

        case RabbitMQOperation.AssertQueue:
          return {
            success: true,
            queue,
            messageCount: 0,
            consumerCount: 0,
          };

        case RabbitMQOperation.DeleteQueue:
          return {
            success: true,
            queue,
            messageCount: 0,
          };

        case RabbitMQOperation.PurgeQueue:
          return {
            success: true,
            queue,
            messageCount: 10,
          };

        case RabbitMQOperation.AssertExchange:
          return {
            success: true,
            exchange,
            type: getParam<string>('exchangeType', 'direct'),
          };

        case RabbitMQOperation.DeleteExchange:
          return {
            success: true,
            exchange,
          };

        case RabbitMQOperation.BindQueue:
          return {
            success: true,
            queue,
            exchange,
            routingKey: getParam<string>('routingKey', ''),
          };

        case RabbitMQOperation.UnbindQueue:
          return {
            success: true,
            queue,
            exchange,
            routingKey: getParam<string>('routingKey', ''),
          };

        default:
          return { error: `Unknown operation: ${operation}` };
      }
    };

    const results = [];
    for (const item of items) {
      const result = await simulateRabbitMQ();
      results.push({
        json: {
          ...item.json,
          rabbitmq: result,
        },
        binary: item.binary,
      });
    }

    return { outputData: [results] };
  },
};

/**
 * RabbitMQ Trigger Node
 * Consume messages from RabbitMQ queues
 */
export const RabbitMQTriggerNode: NodeTypeDefinition = {
  type: 'rabbitmq-trigger',
  name: 'rabbitmqTrigger',
  displayName: 'RabbitMQ Trigger',
  description: 'Trigger workflow when messages arrive in RabbitMQ queue',
  category: NodeCategory.Trigger,
  group: ['trigger', 'integration'],
  version: 1,
  icon: 'message-square',
  iconColor: '#FF6600',

  inputs: [],
  outputs: [
    {
      type: NodeOutputType.Main,
      displayName: 'Output',
    },
  ],

  credentials: [
    {
      name: 'rabbitmq',
      required: true,
    },
  ],

  properties: [
    {
      name: 'queue',
      displayName: 'Queue',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'my-queue',
      description: 'The queue to consume messages from',
    },
    {
      name: 'autoAck',
      displayName: 'Auto Acknowledge',
      type: PropertyType.Boolean,
      default: true,
      description: 'Automatically acknowledge messages when received',
    },
    {
      name: 'prefetchCount',
      displayName: 'Prefetch Count',
      type: PropertyType.Number,
      default: 1,
      description: 'Number of unacknowledged messages to prefetch',
    },
    {
      name: 'parseJson',
      displayName: 'Parse JSON',
      type: PropertyType.Boolean,
      default: true,
      description: 'Automatically parse JSON message content',
    },
    {
      name: 'options',
      displayName: 'Options',
      type: PropertyType.Collection,
      default: {},
      values: [
        {
          name: 'exclusive',
          displayName: 'Exclusive',
          type: PropertyType.Boolean,
          default: false,
          description: 'Only this consumer can access the queue',
        },
        {
          name: 'noLocal',
          displayName: 'No Local',
          type: PropertyType.Boolean,
          default: false,
          description: 'Do not receive messages published by this connection',
        },
      ],
    },
  ],

  async execute(_context: NodeExecutionContext) {
    // Simulated trigger - returns sample message
    return {
      outputData: [[
        {
          json: {
            queue: 'sample-queue',
            message: {
              content: { type: 'notification', data: { userId: 123, action: 'login' } },
              properties: {
                contentType: 'application/json',
                deliveryTag: 67890,
                redelivered: false,
                timestamp: new Date().toISOString(),
              },
            },
          },
        },
      ]],
    };
  },
};
