import type { CredentialTypeDefinition } from '@kerdar/core';
import { PropertyType, CredentialAuthMethod } from '@kerdar/core';

/**
 * Redis Credential Type
 * For connecting to Redis servers
 */
export const RedisCredential: CredentialTypeDefinition = {
  name: 'redis',
  displayName: 'Redis',
  description: 'Connect to a Redis server',
  icon: 'database',
  documentationUrl: 'https://redis.io/docs/',

  authenticate: {
    type: CredentialAuthMethod.Generic,
  },

  properties: [
    {
      name: 'host',
      displayName: 'Host',
      type: PropertyType.String,
      default: 'localhost',
      required: true,
      placeholder: 'localhost',
      description: 'Redis server hostname',
    },
    {
      name: 'port',
      displayName: 'Port',
      type: PropertyType.Number,
      default: 6379,
      required: true,
      description: 'Redis server port',
    },
    {
      name: 'password',
      displayName: 'Password',
      type: PropertyType.String,
      default: '',
      description: 'Redis password (if authentication is enabled)',
      typeOptions: {
        password: true,
      },
    },
    {
      name: 'database',
      displayName: 'Database Index',
      type: PropertyType.Number,
      default: 0,
      description: 'Redis database index (0-15)',
    },
    {
      name: 'tls',
      displayName: 'Use TLS',
      type: PropertyType.Boolean,
      default: false,
      description: 'Use TLS/SSL for the connection',
    },
  ],

  test: {
    request: {
      url: 'simulate://redis-ping',
      method: 'POST',
    },
  },
};
