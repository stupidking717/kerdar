import type { CredentialAuthMethod } from './enums';
import type { NodeProperty, RequestOptions } from './node';

/**
 * Credential type definition - defines a type of credential
 */
export interface CredentialTypeDefinition {
  /** Unique identifier for this credential type */
  name: string;

  /** Display name shown in UI */
  displayName: string;

  /** Description of this credential type */
  description?: string;

  /** Documentation URL */
  documentationUrl?: string;

  /** Icon (Lucide icon name or SVG) */
  icon?: string;

  /** Icon color */
  iconColor?: string;

  /** Credential properties (form fields) */
  properties: NodeProperty[];

  /** Authentication configuration */
  authenticate?: CredentialAuthentication;

  /** Test function to verify credentials */
  test?: CredentialTestRequest;

  /** Extends another credential type */
  extends?: string[];

  /** Generic auth type for OAuth implementations */
  genericAuth?: boolean;

  /** Pre-authentication hook */
  preAuthentication?: (credentials: CredentialData) => Promise<CredentialData>;

  /** HTTP request defaults when using this credential */
  httpRequestNode?: {
    name?: string;
    docsUrl?: string;
    apiBaseUrl?: string;
  };
}

/**
 * Credential authentication configuration
 */
export interface CredentialAuthentication {
  /** Authentication type */
  type: CredentialAuthMethod;

  /** Authentication properties */
  properties?: CredentialAuthProperties;

  /** OAuth2 configuration (when type is OAuth2) */
  oauth2?: OAuth2AuthConfig;
}

/**
 * OAuth2 authentication configuration
 */
export interface OAuth2AuthConfig {
  /** Authorization URL (can use expression) */
  authorizationUrl: string;

  /** Token URL (can use expression) */
  tokenUrl: string;

  /** Client ID (can use expression) */
  clientId: string;

  /** Client Secret (can use expression) */
  clientSecret?: string;

  /** Scopes (can use expression) */
  scope?: string;

  /** Grant type */
  grantType: 'authorizationCode' | 'clientCredentials' | 'pkce';
}

/**
 * Credential authentication properties
 */
export interface CredentialAuthProperties {
  /** Header authentication */
  header?: Record<string, string>;

  /** Query parameter authentication */
  qs?: Record<string, string>;

  /** Body authentication */
  body?: Record<string, unknown>;

  /** Basic authentication */
  auth?: {
    username: string;
    password: string;
  };

  /** Bearer token */
  bearer?: string;
}

/**
 * Credential test request configuration
 */
export interface CredentialTestRequest {
  /** Test request configuration */
  request: RequestOptions & {
    /** Skip SSL certificate validation */
    skipSslCertificateValidation?: boolean;
  };

  /** Rules for checking the response */
  rules?: Array<{
    /** Type of rule */
    type: 'responseCode' | 'responseSuccessBody';
    /** Expected values */
    properties?: {
      value?: number | string;
      message?: string;
    };
  }>;
}

/**
 * Credential instance - a saved credential
 */
export interface Credential {
  /** Unique credential ID */
  id: string;

  /** User-defined name */
  name: string;

  /** Credential type reference */
  type: string;

  /** Credential data (encrypted at rest) */
  data: CredentialData;

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;

  /** Nodes using this credential */
  nodesAccess?: Array<{
    nodeType: string;
  }>;

  /** Shared with users/teams */
  sharedWith?: string[];
}

/**
 * Credential data storage
 */
export interface CredentialData {
  [key: string]: unknown;
}

/**
 * Credential store interface for external storage
 */
export interface CredentialStore {
  /** List all credentials */
  list: (filter?: CredentialFilter) => Promise<Credential[]>;

  /** Get a single credential by ID */
  get: (id: string) => Promise<Credential | null>;

  /** Get credential data (decrypted) */
  getData: (id: string) => Promise<CredentialData | null>;

  /** Create a new credential */
  create: (credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Credential>;

  /** Update an existing credential */
  update: (id: string, credential: Partial<Credential>) => Promise<Credential>;

  /** Delete a credential */
  delete: (id: string) => Promise<void>;

  /** Test a credential */
  test: (type: string, data: CredentialData) => Promise<CredentialTestResult>;
}

/**
 * Credential filter options
 */
export interface CredentialFilter {
  /** Filter by type */
  type?: string;

  /** Search by name */
  search?: string;

  /** Filter by node types that can use it */
  nodeType?: string;
}

/**
 * Credential test result
 */
export interface CredentialTestResult {
  /** Test status */
  status: 'OK' | 'Error';

  /** Message (especially for errors) */
  message?: string;

  /** Additional details */
  details?: Record<string, unknown>;
}

/**
 * OAuth2 credential configuration
 */
export interface OAuth2CredentialConfig {
  /** Grant type */
  grantType: 'authorizationCode' | 'clientCredentials' | 'pkce';

  /** Authorization URL */
  authorizationUrl: string;

  /** Access token URL */
  accessTokenUrl: string;

  /** Client ID */
  clientId: string;

  /** Client secret */
  clientSecret?: string;

  /** Scopes */
  scope?: string;

  /** Redirect URI */
  redirectUri?: string;

  /** Auth query parameters */
  authQueryParameters?: string;

  /** Token body */
  authentication?: 'body' | 'header';

  /** Custom PKCE verifier */
  pkceMethod?: 'S256' | 'plain';
}

/**
 * OAuth2 token data
 */
export interface OAuth2TokenData {
  /** Access token */
  access_token: string;

  /** Refresh token */
  refresh_token?: string;

  /** Token type */
  token_type: string;

  /** Expiration time */
  expires_in?: number;

  /** Expiration timestamp */
  expiresAt?: number;

  /** Scopes */
  scope?: string;
}

/**
 * API Key authentication configuration
 */
export interface ApiKeyAuthConfig {
  /** Where to send the API key */
  in: 'header' | 'query';

  /** Name of the header/query parameter */
  name: string;

  /** Value (with placeholder for the key) */
  value?: string;
}

/**
 * HTTP Basic auth configuration
 */
export interface BasicAuthConfig {
  /** Username field */
  username: string;

  /** Password field */
  password: string;
}

/**
 * HTTP Header auth configuration
 */
export interface HeaderAuthConfig {
  /** Header name */
  name: string;

  /** Header value */
  value: string;
}

/**
 * Predefined credential types available in the system
 */
export enum PredefinedCredentialType {
  HttpBasicAuth = 'httpBasicAuth',
  HttpHeaderAuth = 'httpHeaderAuth',
  HttpQueryAuth = 'httpQueryAuth',
  OAuth2Api = 'oAuth2Api',
  ApiKey = 'apiKey',
  BearerToken = 'bearerToken',
  Smtp = 'smtp',
  Imap = 'imap',
  Postgres = 'postgres',
  MySql = 'mysql',
  MongoDB = 'mongodb',
  Redis = 'redis',
  Slack = 'slackApi',
  Webhook = 'webhookAuth',
}

/**
 * Built-in HTTP Basic Auth credential type definition
 */
export const httpBasicAuthCredential: CredentialTypeDefinition = {
  name: PredefinedCredentialType.HttpBasicAuth,
  displayName: 'HTTP Basic Auth',
  documentationUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication',
  icon: 'Lock',
  iconColor: '#3B82F6',
  properties: [
    {
      name: 'username',
      displayName: 'Username',
      type: 'string' as any,
      default: '',
      required: true,
    },
    {
      name: 'password',
      displayName: 'Password',
      type: 'string' as any,
      default: '',
      required: true,
      typeOptions: {
        password: true,
      },
    },
  ],
  authenticate: {
    type: 'generic' as any,
    properties: {
      auth: {
        username: '={{$credentials.username}}',
        password: '={{$credentials.password}}',
      },
    },
  },
};

/**
 * Built-in HTTP Header Auth credential type definition
 */
export const httpHeaderAuthCredential: CredentialTypeDefinition = {
  name: PredefinedCredentialType.HttpHeaderAuth,
  displayName: 'HTTP Header Auth',
  documentationUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization',
  icon: 'Key',
  iconColor: '#8B5CF6',
  properties: [
    {
      name: 'name',
      displayName: 'Header Name',
      type: 'string' as any,
      default: 'Authorization',
      required: true,
    },
    {
      name: 'value',
      displayName: 'Header Value',
      type: 'string' as any,
      default: '',
      required: true,
      typeOptions: {
        password: true,
      },
    },
  ],
  authenticate: {
    type: 'generic' as any,
    properties: {
      header: {
        '={{$credentials.name}}': '={{$credentials.value}}',
      },
    },
  },
};

/**
 * Built-in API Key credential type definition
 */
export const apiKeyAuthCredential: CredentialTypeDefinition = {
  name: PredefinedCredentialType.ApiKey,
  displayName: 'API Key',
  icon: 'KeyRound',
  iconColor: '#F59E0B',
  properties: [
    {
      name: 'key',
      displayName: 'API Key',
      type: 'string' as any,
      default: '',
      required: true,
      typeOptions: {
        password: true,
      },
    },
    {
      name: 'in',
      displayName: 'Send In',
      type: 'options' as any,
      default: 'header',
      options: [
        { name: 'Header', value: 'header' },
        { name: 'Query String', value: 'query' },
      ],
    },
    {
      name: 'name',
      displayName: 'Key Name',
      type: 'string' as any,
      default: 'X-API-Key',
      description: 'Name of the header or query parameter',
    },
  ],
};

/**
 * Built-in Bearer Token credential type definition
 */
export const bearerTokenCredential: CredentialTypeDefinition = {
  name: PredefinedCredentialType.BearerToken,
  displayName: 'Bearer Token',
  icon: 'Shield',
  iconColor: '#10B981',
  properties: [
    {
      name: 'token',
      displayName: 'Token',
      type: 'string' as any,
      default: '',
      required: true,
      typeOptions: {
        password: true,
      },
    },
  ],
  authenticate: {
    type: 'generic' as any,
    properties: {
      header: {
        'Authorization': 'Bearer ={{$credentials.token}}',
      },
    },
  },
};
