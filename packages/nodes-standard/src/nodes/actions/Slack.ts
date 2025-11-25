import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Slack Node
 * Send messages to Slack (simulated, requires backend integration)
 */
export const SlackNode: NodeTypeDefinition = {
  name: 'slack',
  displayName: 'Slack',
  description: 'Send messages to Slack channels',
  type: 'slack',
  group: ['communication'],
  category: NodeCategory.Communication,
  version: 1,
  icon: 'message-square',
  iconColor: '#4a154b',

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
      name: 'slackApi',
      required: true,
      displayName: 'Slack API',
    },
  ],

  properties: [
    {
      name: 'resource',
      displayName: 'Resource',
      type: PropertyType.Options,
      default: 'message',
      description: 'The resource to operate on',
      options: [
        { name: 'Message', value: 'message' },
        { name: 'Channel', value: 'channel' },
        { name: 'User', value: 'user' },
        { name: 'File', value: 'file' },
      ],
    },
    {
      name: 'operation',
      displayName: 'Operation',
      type: PropertyType.Options,
      default: 'post',
      description: 'The operation to perform',
      displayOptions: {
        show: {
          resource: ['message'],
        },
      },
      options: [
        { name: 'Post', value: 'post' },
        { name: 'Update', value: 'update' },
        { name: 'Delete', value: 'delete' },
        { name: 'Get Permalink', value: 'getPermalink' },
      ],
    },
    {
      name: 'channelOperation',
      displayName: 'Operation',
      type: PropertyType.Options,
      default: 'get',
      description: 'The operation to perform',
      displayOptions: {
        show: {
          resource: ['channel'],
        },
      },
      options: [
        { name: 'Get', value: 'get' },
        { name: 'Get Many', value: 'getMany' },
        { name: 'Create', value: 'create' },
        { name: 'Archive', value: 'archive' },
      ],
    },
    {
      name: 'channel',
      displayName: 'Channel',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: '#general or C1234567890',
      description: 'The channel to post to (name or ID)',
      displayOptions: {
        show: {
          resource: ['message'],
          operation: ['post', 'update', 'delete'],
        },
      },
    },
    {
      name: 'text',
      displayName: 'Text',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'Hello, world!',
      description: 'The message text to send',
      displayOptions: {
        show: {
          resource: ['message'],
          operation: ['post', 'update'],
        },
      },
      typeOptions: {
        rows: 3,
      },
    },
    {
      name: 'messageTs',
      displayName: 'Message Timestamp',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: '1234567890.123456',
      description: 'The timestamp of the message to update/delete',
      displayOptions: {
        show: {
          resource: ['message'],
          operation: ['update', 'delete', 'getPermalink'],
        },
      },
    },
    {
      name: 'options',
      displayName: 'Options',
      type: PropertyType.Collection,
      default: {},
      displayOptions: {
        show: {
          resource: ['message'],
          operation: ['post'],
        },
      },
      values: [
        {
          name: 'username',
          displayName: 'Username',
          type: PropertyType.String,
          default: '',
          description: 'Override the bot username',
        },
        {
          name: 'iconEmoji',
          displayName: 'Icon Emoji',
          type: PropertyType.String,
          default: '',
          placeholder: ':robot_face:',
          description: 'Emoji to use as the icon',
        },
        {
          name: 'iconUrl',
          displayName: 'Icon URL',
          type: PropertyType.String,
          default: '',
          description: 'URL to an image to use as the icon',
        },
        {
          name: 'threadTs',
          displayName: 'Thread Timestamp',
          type: PropertyType.String,
          default: '',
          description: 'Post as a reply in a thread',
        },
        {
          name: 'unfurlLinks',
          displayName: 'Unfurl Links',
          type: PropertyType.Boolean,
          default: true,
          description: 'Enable unfurling of links',
        },
        {
          name: 'unfurlMedia',
          displayName: 'Unfurl Media',
          type: PropertyType.Boolean,
          default: true,
          description: 'Enable unfurling of media',
        },
      ],
    },
    {
      name: 'blocksJson',
      displayName: 'Blocks (JSON)',
      type: PropertyType.Json,
      default: '[]',
      description: 'Block Kit blocks as JSON array',
      displayOptions: {
        show: {
          resource: ['message'],
          operation: ['post', 'update'],
        },
      },
    },
    {
      name: 'attachmentsJson',
      displayName: 'Attachments (JSON)',
      type: PropertyType.Json,
      default: '[]',
      description: 'Message attachments as JSON array',
      displayOptions: {
        show: {
          resource: ['message'],
          operation: ['post', 'update'],
        },
      },
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const items = inputData[0] || [{ json: {} }];
    const resource = parameters.resource as string;
    const operation = (parameters.operation || parameters.channelOperation) as string;

    const results: INodeExecutionData[] = [];

    for (const item of items) {
      let responseData: Record<string, unknown>;

      if (resource === 'message') {
        switch (operation) {
          case 'post':
            responseData = {
              ok: true,
              channel: parameters.channel,
              ts: `${Date.now() / 1000}`,
              message: {
                text: parameters.text,
                username: (parameters.options as { username?: string })?.username || 'Bot',
                type: 'message',
                ts: `${Date.now() / 1000}`,
              },
            };
            break;

          case 'update':
            responseData = {
              ok: true,
              channel: parameters.channel,
              ts: parameters.messageTs,
              text: parameters.text,
            };
            break;

          case 'delete':
            responseData = {
              ok: true,
              channel: parameters.channel,
              ts: parameters.messageTs,
            };
            break;

          case 'getPermalink':
            responseData = {
              ok: true,
              permalink: `https://workspace.slack.com/archives/${parameters.channel}/p${String(parameters.messageTs).replace('.', '')}`,
            };
            break;

          default:
            responseData = { ok: false, error: 'Unknown operation' };
        }
      } else if (resource === 'channel') {
        switch (operation) {
          case 'get':
          case 'getMany':
            responseData = {
              ok: true,
              channels: [
                { id: 'C1234567890', name: 'general', is_channel: true },
                { id: 'C0987654321', name: 'random', is_channel: true },
              ],
            };
            break;

          case 'create':
            responseData = {
              ok: true,
              channel: {
                id: `C${Date.now()}`,
                name: 'new-channel',
                is_channel: true,
              },
            };
            break;

          default:
            responseData = { ok: true };
        }
      } else {
        responseData = { ok: true, resource, operation };
      }

      results.push({
        json: {
          ...item.json,
          slack: responseData,
          note: 'Slack API is simulated in frontend-only mode. Configure a backend handler for real Slack integration.',
        },
      });
    }

    return { outputData: [results] };
  },
};
