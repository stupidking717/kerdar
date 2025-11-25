import type { CredentialTypeDefinition } from '@kerdar/core';
import { PropertyType, CredentialAuthMethod } from '@kerdar/core';

/**
 * HTTP Header Auth Credential Type
 * For HTTP requests with custom header authentication
 */
export const HttpHeaderAuthCredential: CredentialTypeDefinition = {
  name: 'httpHeaderAuth',
  displayName: 'HTTP Header Auth',
  description: 'Custom header authentication for HTTP requests',
  icon: 'key',

  authenticate: {
    type: CredentialAuthMethod.Generic,
  },

  properties: [
    {
      name: 'headerName',
      displayName: 'Header Name',
      type: PropertyType.String,
      default: 'Authorization',
      required: true,
      placeholder: 'Authorization',
      description: 'The name of the header to add',
    },
    {
      name: 'headerValue',
      displayName: 'Header Value',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'Bearer your-token-here',
      description: 'The value of the header',
      typeOptions: {
        password: true,
      },
    },
  ],
};
