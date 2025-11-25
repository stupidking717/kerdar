import type { CredentialTypeDefinition } from '@kerdar/core';
import { PropertyType, CredentialAuthMethod } from '@kerdar/core';

/**
 * HTTP Basic Auth Credential Type
 * For HTTP requests with Basic Authentication
 */
export const HttpBasicAuthCredential: CredentialTypeDefinition = {
  name: 'httpBasicAuth',
  displayName: 'HTTP Basic Auth',
  description: 'Basic username/password authentication for HTTP requests',
  icon: 'lock',

  authenticate: {
    type: CredentialAuthMethod.Generic,
  },

  properties: [
    {
      name: 'username',
      displayName: 'Username',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'username',
      description: 'The username for authentication',
    },
    {
      name: 'password',
      displayName: 'Password',
      type: PropertyType.String,
      default: '',
      required: true,
      description: 'The password for authentication',
      typeOptions: {
        password: true,
      },
    },
  ],
};
