import type { CredentialTypeDefinition } from '@kerdar/core';
import { PropertyType, CredentialAuthMethod } from '@kerdar/core';

/**
 * API Key Credential Type
 * For HTTP requests with API Key authentication
 */
export const ApiKeyCredential: CredentialTypeDefinition = {
  name: 'apiKey',
  displayName: 'API Key',
  description: 'API Key authentication (header, query, or body)',
  icon: 'key',

  authenticate: {
    type: CredentialAuthMethod.Generic,
  },

  properties: [
    {
      name: 'apiKey',
      displayName: 'API Key',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'your-api-key',
      description: 'The API key value',
      typeOptions: {
        password: true,
      },
    },
    {
      name: 'sendIn',
      displayName: 'Send In',
      type: PropertyType.Options,
      default: 'header',
      description: 'Where to send the API key',
      options: [
        {
          name: 'Header',
          value: 'header',
          description: 'Send as a HTTP header',
        },
        {
          name: 'Query String',
          value: 'query',
          description: 'Send as a query parameter',
        },
        {
          name: 'Body',
          value: 'body',
          description: 'Send in the request body',
        },
      ],
    },
    {
      name: 'parameterName',
      displayName: 'Parameter Name',
      type: PropertyType.String,
      default: 'X-API-Key',
      required: true,
      placeholder: 'X-API-Key',
      description: 'The name of the header or query parameter',
    },
  ],
};
