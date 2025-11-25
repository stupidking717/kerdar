import type { CredentialTypeDefinition } from '@kerdar/core';
import { PropertyType, CredentialAuthMethod } from '@kerdar/core';

/**
 * Bearer Token Credential Type
 * For HTTP requests with Bearer Token authentication
 */
export const BearerTokenCredential: CredentialTypeDefinition = {
  name: 'bearerToken',
  displayName: 'Bearer Token',
  description: 'Bearer token authentication (OAuth2 access token)',
  icon: 'shield',

  authenticate: {
    type: CredentialAuthMethod.Generic,
  },

  properties: [
    {
      name: 'token',
      displayName: 'Token',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'your-bearer-token',
      description: 'The bearer token (sent as "Authorization: Bearer {token}")',
      typeOptions: {
        password: true,
      },
    },
  ],
};
