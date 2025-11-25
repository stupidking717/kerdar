import type { CredentialTypeDefinition } from '@kerdar/core';
import { PropertyType, CredentialAuthMethod } from '@kerdar/core';

/**
 * SMTP Credential Type
 * For sending emails via SMTP server
 */
export const SmtpCredential: CredentialTypeDefinition = {
  name: 'smtp',
  displayName: 'SMTP',
  description: 'Connect to an SMTP server to send emails',
  icon: 'mail',

  authenticate: {
    type: CredentialAuthMethod.Generic,
  },

  properties: [
    {
      name: 'host',
      displayName: 'SMTP Host',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'smtp.example.com',
      description: 'The SMTP server hostname',
    },
    {
      name: 'port',
      displayName: 'Port',
      type: PropertyType.Number,
      default: 587,
      required: true,
      description: 'The SMTP server port (typically 25, 465, or 587)',
    },
    {
      name: 'secure',
      displayName: 'Use SSL/TLS',
      type: PropertyType.Boolean,
      default: true,
      description: 'Use SSL/TLS for the connection',
    },
    {
      name: 'user',
      displayName: 'Username',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'user@example.com',
      description: 'The SMTP username (usually your email address)',
    },
    {
      name: 'password',
      displayName: 'Password',
      type: PropertyType.String,
      default: '',
      required: true,
      description: 'The SMTP password or app-specific password',
      typeOptions: {
        password: true,
      },
    },
  ],

  test: {
    request: {
      url: 'simulate://smtp-test',
      method: 'POST',
    },
  },
};
