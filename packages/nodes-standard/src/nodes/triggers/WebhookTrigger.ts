import type { NodeTypeDefinition, DataSchema } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeOutputType,
  WebhookMethod,
  WebhookResponseMode,
  createSchema,
  stringProperty,
  objectProperty,
  anyProperty,
} from '@kerdar/core';

/**
 * Output schema for Webhook Trigger
 * Describes the structure of data produced when a webhook is received
 */
const webhookOutputSchema: DataSchema = createSchema(
  {
    headers: objectProperty(
      {},
      {
        displayName: 'Headers',
        description: 'HTTP request headers',
        additionalProperties: stringProperty(),
        example: {
          'content-type': 'application/json',
          'user-agent': 'Webhook-Client/1.0',
        },
      }
    ),
    params: objectProperty(
      {},
      {
        displayName: 'URL Parameters',
        description: 'URL path parameters',
        additionalProperties: stringProperty(),
      }
    ),
    query: objectProperty(
      {},
      {
        displayName: 'Query Parameters',
        description: 'Query string parameters',
        additionalProperties: anyProperty(),
        example: { page: '1', limit: '10' },
      }
    ),
    body: anyProperty({
      displayName: 'Body',
      description: 'Request body (parsed JSON or raw)',
      example: { message: 'Hello', data: { id: 1 } },
    }),
    webhookUrl: stringProperty({
      displayName: 'Webhook URL',
      description: 'The full URL that was called',
      format: 'url',
      example: 'https://your-domain.com/webhook/my-endpoint',
    }),
    executionMode: stringProperty({
      displayName: 'Execution Mode',
      description: 'How the webhook was triggered',
      enum: ['webhook', 'manual'],
      example: 'webhook',
    }),
  },
  {
    displayName: 'Webhook Data',
    description: 'Data received from incoming webhook request',
    example: {
      headers: { 'content-type': 'application/json' },
      params: {},
      query: {},
      body: {},
      webhookUrl: 'https://your-domain.com/webhook/test',
      executionMode: 'webhook',
    },
  }
);

/**
 * Webhook Trigger Node
 * Starts workflow when an HTTP request is received
 */
export const WebhookTriggerNode: NodeTypeDefinition = {
  type: 'webhook-trigger',
  name: 'webhookTrigger',
  displayName: 'Webhook',
  description: 'Starts the workflow when a webhook is called',
  category: NodeCategory.Trigger,
  group: ['trigger'],
  version: 1,
  icon: 'webhook',
  iconColor: '#6366f1',

  inputs: [],
  outputs: [
    {
      type: NodeOutputType.Main,
      displayName: 'Output',
    },
  ],

  // Schema defining what data this node produces
  outputSchema: webhookOutputSchema,

  properties: [
    {
      name: 'httpMethod',
      displayName: 'HTTP Method',
      type: PropertyType.Options,
      default: WebhookMethod.POST,
      required: true,
      description: 'The HTTP method to listen for',
      options: [
        { name: 'GET', value: WebhookMethod.GET },
        { name: 'POST', value: WebhookMethod.POST },
        { name: 'PUT', value: WebhookMethod.PUT },
        { name: 'PATCH', value: WebhookMethod.PATCH },
        { name: 'DELETE', value: WebhookMethod.DELETE },
        { name: 'HEAD', value: WebhookMethod.HEAD },
      ],
    },
    {
      name: 'path',
      displayName: 'Path',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'webhook-path',
      description: 'The path to listen on (will be appended to the base URL)',
    },
    {
      name: 'responseMode',
      displayName: 'Response Mode',
      type: PropertyType.Options,
      default: WebhookResponseMode.OnReceived,
      description: 'When and how to respond to the webhook',
      options: [
        {
          name: 'When Received',
          value: WebhookResponseMode.OnReceived,
          description: 'Respond immediately when webhook is called',
        },
        {
          name: 'Last Node',
          value: WebhookResponseMode.LastNode,
          description: 'Respond with data from the last node',
        },
        {
          name: 'Response Node',
          value: WebhookResponseMode.ResponseNode,
          description: 'Respond using a Respond to Webhook node',
        },
      ],
    },
    {
      name: 'responseCode',
      displayName: 'Response Code',
      type: PropertyType.Number,
      default: 200,
      description: 'The HTTP response code to return',
      displayOptions: {
        show: {
          responseMode: [WebhookResponseMode.OnReceived],
        },
      },
    },
    {
      name: 'responseData',
      displayName: 'Response Data',
      type: PropertyType.Options,
      default: 'firstEntryJson',
      description: 'What data to return',
      displayOptions: {
        show: {
          responseMode: [WebhookResponseMode.LastNode],
        },
      },
      options: [
        { name: 'First Entry JSON', value: 'firstEntryJson' },
        { name: 'First Entry Binary', value: 'firstEntryBinary' },
        { name: 'All Entries', value: 'allEntries' },
        { name: 'No Response Body', value: 'noData' },
      ],
    },
    {
      name: 'options',
      displayName: 'Options',
      type: PropertyType.Collection,
      default: {},
      values: [
        {
          name: 'binaryData',
          displayName: 'Binary Data',
          type: PropertyType.Boolean,
          default: false,
          description: 'Set to true if webhook will receive binary data',
        },
        {
          name: 'rawBody',
          displayName: 'Raw Body',
          type: PropertyType.Boolean,
          default: false,
          description: 'Raw body (binary)',
        },
        {
          name: 'responseContentType',
          displayName: 'Response Content-Type',
          type: PropertyType.String,
          default: 'application/json',
          description: 'Set the content-type header of the response',
        },
        {
          name: 'responseHeaders',
          displayName: 'Response Headers',
          type: PropertyType.Json,
          default: '{}',
          description: 'Additional response headers as JSON',
        },
      ],
    },
  ],

  async execute(_context) {
    // Webhook triggers are started externally, this is for manual testing
    const webhookData = {
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Webhook-Test/1.0',
      },
      params: {},
      query: {},
      body: {},
      webhookUrl: 'https://your-domain.com/webhook/test',
      executionMode: 'webhook',
    };

    return { outputData: [[{ json: webhookData }]] };
  },
};
