import type { NodeTypeDefinition, INodeExecutionData, DynamicSchemaFn } from '@kerdar/core';
import {
  NodeCategory,
  NodeInputType,
  NodeOutputType,
  PropertyType,
  HttpMethod,
  AuthenticationType,
  createSchema,
  stringProperty,
  integerProperty,
  objectProperty,
  anyProperty,
} from '@kerdar/core';

/**
 * Dynamic output schema for HTTP Request node
 * Changes based on whether fullResponse option is enabled
 */
const httpRequestOutputSchema: DynamicSchemaFn = (params) => {
  const options = params.options as Record<string, unknown> | undefined;
  const fullResponse = options?.fullResponse as boolean;

  if (fullResponse) {
    // Full response schema includes headers and status code
    return createSchema(
      {
        data: anyProperty({
          displayName: 'Response Data',
          description: 'The response body from the HTTP request',
          example: { id: 1, name: 'Example' },
        }),
        statusCode: integerProperty({
          displayName: 'Status Code',
          description: 'HTTP response status code',
          example: 200,
          minimum: 100,
          maximum: 599,
        }),
        headers: objectProperty(
          {},
          {
            displayName: 'Response Headers',
            description: 'HTTP response headers',
            additionalProperties: stringProperty(),
            example: {
              'content-type': 'application/json',
              'x-request-id': '12345',
            },
          }
        ),
      },
      {
        displayName: 'HTTP Response (Full)',
        description: 'Complete HTTP response including headers and status',
        example: {
          data: { id: 1, name: 'Example' },
          statusCode: 200,
          headers: { 'content-type': 'application/json' },
        },
      }
    );
  }

  // Simple response schema - just the response body
  return createSchema(
    {
      // Response body fields depend on the API being called
      // Using 'any' type since we don't know the structure
    },
    {
      displayName: 'HTTP Response',
      description: 'Response body from the HTTP request',
      additionalProperties: anyProperty({
        description: 'API response fields vary based on the endpoint called',
      }),
    }
  );
};

/**
 * HTTP Request Node
 * Make HTTP requests to external APIs
 */
export const HttpRequestNode: NodeTypeDefinition = {
  type: 'http-request',
  version: 1,
  name: 'httpRequest',
  displayName: 'HTTP Request',
  description: 'Make HTTP requests to any URL',
  icon: 'Globe',
  iconColor: '#3B82F6',
  category: NodeCategory.Action,
  group: ['action', 'http', 'api'],
  defaults: {
    name: 'HTTP Request',
  },

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

  // Dynamic schema that changes based on fullResponse option
  outputSchema: httpRequestOutputSchema,

  credentials: [
    {
      name: 'httpBasicAuth',
      displayOptions: {
        show: {
          authentication: [AuthenticationType.BasicAuth],
        },
      },
    },
    {
      name: 'httpHeaderAuth',
      displayOptions: {
        show: {
          authentication: [AuthenticationType.HeaderAuth],
        },
      },
    },
  ],

  properties: [
    {
      name: 'method',
      displayName: 'Method',
      type: PropertyType.Options,
      default: HttpMethod.GET,
      required: true,
      options: [
        { name: 'GET', value: HttpMethod.GET },
        { name: 'POST', value: HttpMethod.POST },
        { name: 'PUT', value: HttpMethod.PUT },
        { name: 'PATCH', value: HttpMethod.PATCH },
        { name: 'DELETE', value: HttpMethod.DELETE },
        { name: 'HEAD', value: HttpMethod.HEAD },
        { name: 'OPTIONS', value: HttpMethod.OPTIONS },
      ],
    },
    {
      name: 'url',
      displayName: 'URL',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'https://api.example.com/endpoint',
      description: 'The URL to make the request to',
    },
    {
      name: 'authentication',
      displayName: 'Authentication',
      type: PropertyType.Options,
      default: AuthenticationType.None,
      options: [
        { name: 'None', value: AuthenticationType.None },
        { name: 'Basic Auth', value: AuthenticationType.BasicAuth },
        { name: 'Header Auth', value: AuthenticationType.HeaderAuth },
        { name: 'Bearer Token', value: AuthenticationType.BearerToken },
      ],
    },
    {
      name: 'bearerToken',
      displayName: 'Bearer Token',
      type: PropertyType.String,
      default: '',
      typeOptions: {
        password: true,
      },
      displayOptions: {
        show: {
          authentication: [AuthenticationType.BearerToken],
        },
      },
    },
    {
      name: 'sendHeaders',
      displayName: 'Send Headers',
      type: PropertyType.Boolean,
      default: false,
    },
    {
      name: 'headerParameters',
      displayName: 'Header Parameters',
      type: PropertyType.FixedCollection,
      default: {},
      typeOptions: {
        multipleValues: true,
      },
      displayOptions: {
        show: {
          sendHeaders: [true],
        },
      },
      values: [
        {
          name: 'name',
          displayName: 'Name',
          type: PropertyType.String,
          default: '',
        },
        {
          name: 'value',
          displayName: 'Value',
          type: PropertyType.String,
          default: '',
        },
      ],
    },
    {
      name: 'sendQuery',
      displayName: 'Send Query Parameters',
      type: PropertyType.Boolean,
      default: false,
    },
    {
      name: 'queryParameters',
      displayName: 'Query Parameters',
      type: PropertyType.FixedCollection,
      default: {},
      typeOptions: {
        multipleValues: true,
      },
      displayOptions: {
        show: {
          sendQuery: [true],
        },
      },
      values: [
        {
          name: 'name',
          displayName: 'Name',
          type: PropertyType.String,
          default: '',
        },
        {
          name: 'value',
          displayName: 'Value',
          type: PropertyType.String,
          default: '',
        },
      ],
    },
    {
      name: 'sendBody',
      displayName: 'Send Body',
      type: PropertyType.Boolean,
      default: false,
      displayOptions: {
        show: {
          method: [HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH],
        },
      },
    },
    {
      name: 'bodyContentType',
      displayName: 'Body Content Type',
      type: PropertyType.Options,
      default: 'json',
      options: [
        { name: 'JSON', value: 'json' },
        { name: 'Form Data', value: 'form' },
        { name: 'Form URL Encoded', value: 'urlencoded' },
        { name: 'Raw', value: 'raw' },
      ],
      displayOptions: {
        show: {
          sendBody: [true],
        },
      },
    },
    {
      name: 'body',
      displayName: 'Body',
      type: PropertyType.Json,
      default: '{}',
      displayOptions: {
        show: {
          sendBody: [true],
          bodyContentType: ['json'],
        },
      },
    },
    {
      name: 'rawBody',
      displayName: 'Body',
      type: PropertyType.String,
      default: '',
      typeOptions: {
        rows: 5,
      },
      displayOptions: {
        show: {
          sendBody: [true],
          bodyContentType: ['raw'],
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
          name: 'timeout',
          displayName: 'Timeout (ms)',
          type: PropertyType.Number,
          default: 30000,
          description: 'Request timeout in milliseconds',
        },
        {
          name: 'followRedirects',
          displayName: 'Follow Redirects',
          type: PropertyType.Boolean,
          default: true,
        },
        {
          name: 'ignoreSSL',
          displayName: 'Ignore SSL Issues',
          type: PropertyType.Boolean,
          default: false,
          description: 'Ignore SSL certificate validation errors',
        },
        {
          name: 'fullResponse',
          displayName: 'Full Response',
          type: PropertyType.Boolean,
          default: false,
          description: 'Return the full response including headers and status',
        },
      ],
    },
  ],

  async execute(context) {
    const items = context.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const method = context.getNodeParameter<string>('method', HttpMethod.GET);
      const url = context.getNodeParameter<string>('url', '');
      const authentication = context.getNodeParameter<string>('authentication', AuthenticationType.None);
      const options = context.getNodeParameter<Record<string, unknown>>('options', {});

      if (!url) {
        throw new Error('URL is required');
      }

      // Build headers
      const headers: Record<string, string> = {
        'User-Agent': 'KERDAR/1.0',
      };

      // Authentication
      if (authentication === AuthenticationType.BearerToken) {
        const token = context.getNodeParameter<string>('bearerToken', '');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      // Custom headers
      const sendHeaders = context.getNodeParameter<boolean>('sendHeaders', false);
      if (sendHeaders) {
        const headerParams = context.getNodeParameter<{ parameters?: Array<{ name: string; value: string }> }>('headerParameters', {});
        headerParams.parameters?.forEach((param) => {
          if (param.name) {
            headers[param.name] = param.value;
          }
        });
      }

      // Query parameters
      const qs: Record<string, unknown> = {};
      const sendQuery = context.getNodeParameter<boolean>('sendQuery', false);
      if (sendQuery) {
        const queryParams = context.getNodeParameter<{ parameters?: Array<{ name: string; value: string }> }>('queryParameters', {});
        queryParams.parameters?.forEach((param) => {
          if (param.name) {
            qs[param.name] = param.value;
          }
        });
      }

      // Body
      let body: unknown = undefined;
      const sendBody = context.getNodeParameter<boolean>('sendBody', false);
      if (sendBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
        const bodyContentType = context.getNodeParameter<string>('bodyContentType', 'json');

        if (bodyContentType === 'json') {
          const jsonBody = context.getNodeParameter<string>('body', '{}');
          try {
            body = typeof jsonBody === 'string' ? JSON.parse(jsonBody) : jsonBody;
          } catch {
            body = jsonBody;
          }
          headers['Content-Type'] = 'application/json';
        } else if (bodyContentType === 'raw') {
          body = context.getNodeParameter<string>('rawBody', '');
        }
      }

      context.logger.debug(`Making ${method} request to ${url}`);

      try {
        const response = await context.helpers.request({
          method,
          url,
          headers,
          qs: Object.keys(qs).length > 0 ? qs : undefined,
          body,
          timeout: options.timeout as number,
          json: true,
        });

        const fullResponse = options.fullResponse as boolean;
        if (fullResponse) {
          returnData.push({
            json: {
              data: response,
              headers: {},
              statusCode: 200,
            },
            pairedItem: { item: i },
          });
        } else {
          returnData.push({
            json: typeof response === 'object' ? response as Record<string, unknown> : { data: response },
            pairedItem: { item: i },
          });
        }
      } catch (error) {
        if (context.node.continueOnFail) {
          returnData.push({
            json: {
              error: {
                message: (error as Error).message,
                name: (error as Error).name,
              },
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return {
      outputData: [returnData],
    };
  },
};

export default HttpRequestNode;
