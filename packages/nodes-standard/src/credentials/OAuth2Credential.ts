import type { CredentialTypeDefinition } from '@kerdar/core';
import { PropertyType, CredentialAuthMethod } from '@kerdar/core';

/**
 * OAuth2 API Credential Type
 * Generic OAuth2 authentication
 */
export const OAuth2Credential: CredentialTypeDefinition = {
  name: 'oauth2Api',
  displayName: 'OAuth2 API',
  description: 'Generic OAuth2 authentication',
  icon: 'shield',
  documentationUrl: 'https://oauth.net/2/',

  authenticate: {
    type: CredentialAuthMethod.OAuth2,
    oauth2: {
      authorizationUrl: '={{$credentials.authorizationUrl}}',
      tokenUrl: '={{$credentials.tokenUrl}}',
      clientId: '={{$credentials.clientId}}',
      clientSecret: '={{$credentials.clientSecret}}',
      scope: '={{$credentials.scope}}',
      grantType: 'authorizationCode',
    },
  },

  properties: [
    {
      name: 'authorizationUrl',
      displayName: 'Authorization URL',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'https://example.com/oauth/authorize',
      description: 'The OAuth2 authorization endpoint URL',
    },
    {
      name: 'tokenUrl',
      displayName: 'Token URL',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'https://example.com/oauth/token',
      description: 'The OAuth2 token endpoint URL',
    },
    {
      name: 'clientId',
      displayName: 'Client ID',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'your-client-id',
      description: 'The OAuth2 client ID',
    },
    {
      name: 'clientSecret',
      displayName: 'Client Secret',
      type: PropertyType.String,
      default: '',
      required: true,
      description: 'The OAuth2 client secret',
      typeOptions: {
        password: true,
      },
    },
    {
      name: 'scope',
      displayName: 'Scope',
      type: PropertyType.String,
      default: '',
      placeholder: 'read write',
      description: 'Space-separated list of scopes to request',
    },
    {
      name: 'authQueryParameters',
      displayName: 'Auth Query Parameters',
      type: PropertyType.String,
      default: '',
      placeholder: 'access_type=offline&prompt=consent',
      description: 'Additional query parameters for authorization request',
    },
    {
      name: 'authentication',
      displayName: 'Authentication',
      type: PropertyType.Options,
      default: 'body',
      description: 'How to send client credentials',
      options: [
        {
          name: 'Body',
          value: 'body',
          description: 'Send in request body',
        },
        {
          name: 'Header',
          value: 'header',
          description: 'Send as Basic Auth header',
        },
      ],
    },
  ],
};
