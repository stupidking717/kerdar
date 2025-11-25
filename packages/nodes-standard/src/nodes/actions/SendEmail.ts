import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
  CodeLanguage,
} from '@kerdar/core';

/**
 * Send Email Node
 * Send emails (simulated in frontend, requires backend integration)
 */
export const SendEmailNode: NodeTypeDefinition = {
  name: 'sendEmail',
  displayName: 'Send Email',
  description: 'Send email messages',
  type: 'send-email',
  group: ['communication'],
  category: NodeCategory.Communication,
  version: 1,
  icon: 'mail',
  iconColor: '#3b82f6',

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
      name: 'smtp',
      required: true,
      displayName: 'SMTP Account',
    },
  ],

  properties: [
    {
      name: 'fromEmail',
      displayName: 'From Email',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'sender@example.com',
      description: 'The email address to send from',
    },
    {
      name: 'toEmail',
      displayName: 'To Email',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'recipient@example.com',
      description: 'The email address to send to',
    },
    {
      name: 'subject',
      displayName: 'Subject',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'Email Subject',
      description: 'The email subject line',
    },
    {
      name: 'emailFormat',
      displayName: 'Email Format',
      type: PropertyType.Options,
      default: 'text',
      description: 'The format of the email body',
      options: [
        { name: 'Text', value: 'text' },
        { name: 'HTML', value: 'html' },
      ],
    },
    {
      name: 'text',
      displayName: 'Text',
      type: PropertyType.String,
      default: '',
      placeholder: 'Email body text',
      description: 'Plain text body',
      displayOptions: {
        show: {
          emailFormat: ['text'],
        },
      },
      typeOptions: {
        rows: 5,
      },
    },
    {
      name: 'html',
      displayName: 'HTML',
      type: PropertyType.Code,
      default: '',
      placeholder: '<p>Email body HTML</p>',
      description: 'HTML body content',
      displayOptions: {
        show: {
          emailFormat: ['html'],
        },
      },
      typeOptions: {
        language: CodeLanguage.HTML,
      },
    },
    {
      name: 'options',
      displayName: 'Options',
      type: PropertyType.Collection,
      default: {},
      values: [
        {
          name: 'ccEmail',
          displayName: 'CC',
          type: PropertyType.String,
          default: '',
          placeholder: 'cc@example.com',
          description: 'CC recipients (comma-separated)',
        },
        {
          name: 'bccEmail',
          displayName: 'BCC',
          type: PropertyType.String,
          default: '',
          placeholder: 'bcc@example.com',
          description: 'BCC recipients (comma-separated)',
        },
        {
          name: 'replyTo',
          displayName: 'Reply To',
          type: PropertyType.String,
          default: '',
          placeholder: 'reply@example.com',
          description: 'Reply-to email address',
        },
        {
          name: 'attachmentPropertyName',
          displayName: 'Attachment Property',
          type: PropertyType.String,
          default: '',
          description: 'Name of the binary property containing attachments',
        },
      ],
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const items = inputData[0] || [{ json: {} }];

    const results: INodeExecutionData[] = [];

    for (const item of items) {
      const emailData = {
        from: parameters.fromEmail as string,
        to: parameters.toEmail as string,
        subject: parameters.subject as string,
        format: parameters.emailFormat as string,
        body: parameters.emailFormat === 'html'
          ? parameters.html as string
          : parameters.text as string,
        cc: (parameters.options as { ccEmail?: string })?.ccEmail,
        bcc: (parameters.options as { bccEmail?: string })?.bccEmail,
        replyTo: (parameters.options as { replyTo?: string })?.replyTo,
      };

      // In frontend-only mode, we simulate email sending
      // Real implementation would call a backend API
      results.push({
        json: {
          ...item.json,
          email: emailData,
          status: 'simulated',
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          note: 'Email sending is simulated in frontend-only mode. Configure a backend handler to actually send emails.',
        },
      });
    }

    return { outputData: [results] };
  },
};
