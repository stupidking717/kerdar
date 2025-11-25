import type { CredentialTypeDefinition } from '@kerdar/core';
import { PropertyType, CredentialAuthMethod } from '@kerdar/core';

/**
 * RabbitMQ Credential Type
 * For connecting to RabbitMQ servers
 */
export const RabbitMQCredential: CredentialTypeDefinition = {
  name: 'rabbitmq',
  displayName: 'RabbitMQ',
  description: 'Connect to a RabbitMQ server',
  icon: 'message-square',
  documentationUrl: 'https://www.rabbitmq.com/documentation.html',

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
      description: 'RabbitMQ server hostname',
    },
    {
      name: 'port',
      displayName: 'Port',
      type: PropertyType.Number,
      default: 5672,
      required: true,
      description: 'RabbitMQ server port (default: 5672)',
    },
    {
      name: 'username',
      displayName: 'Username',
      type: PropertyType.String,
      default: 'guest',
      required: true,
      placeholder: 'guest',
      description: 'RabbitMQ username',
    },
    {
      name: 'password',
      displayName: 'Password',
      type: PropertyType.String,
      default: 'guest',
      required: true,
      description: 'RabbitMQ password',
      typeOptions: {
        password: true,
      },
    },
    {
      name: 'vhost',
      displayName: 'Virtual Host',
      type: PropertyType.String,
      default: '/',
      description: 'RabbitMQ virtual host (default: /)',
    },
    {
      name: 'ssl',
      displayName: 'Use SSL/TLS',
      type: PropertyType.Boolean,
      default: false,
      description: 'Use SSL/TLS for the connection',
    },
  ],

  test: {
    request: {
      url: 'simulate://rabbitmq-test',
      method: 'POST',
    },
  },
};
