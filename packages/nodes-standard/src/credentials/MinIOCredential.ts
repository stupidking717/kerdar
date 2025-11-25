import type { CredentialTypeDefinition } from '@kerdar/core';
import { PropertyType, CredentialAuthMethod } from '@kerdar/core';

/**
 * MinIO/S3 Credential Type
 * For connecting to MinIO or S3-compatible object storage
 */
export const MinIOCredential: CredentialTypeDefinition = {
  name: 'minio',
  displayName: 'MinIO / S3',
  description: 'Connect to MinIO or S3-compatible object storage',
  icon: 'hard-drive',
  documentationUrl: 'https://min.io/docs',

  authenticate: {
    type: CredentialAuthMethod.Generic,
  },

  properties: [
    {
      name: 'endpoint',
      displayName: 'Endpoint',
      type: PropertyType.String,
      default: 'localhost',
      required: true,
      placeholder: 'localhost or s3.amazonaws.com',
      description: 'MinIO/S3 server endpoint (without protocol)',
    },
    {
      name: 'port',
      displayName: 'Port',
      type: PropertyType.Number,
      default: 9000,
      description: 'Server port (9000 for MinIO, 443 for S3)',
    },
    {
      name: 'useSSL',
      displayName: 'Use SSL/TLS',
      type: PropertyType.Boolean,
      default: false,
      description: 'Use HTTPS for the connection',
    },
    {
      name: 'accessKey',
      displayName: 'Access Key',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'AKIAIOSFODNN7EXAMPLE',
      description: 'Access key ID',
    },
    {
      name: 'secretKey',
      displayName: 'Secret Key',
      type: PropertyType.String,
      default: '',
      required: true,
      description: 'Secret access key',
      typeOptions: {
        password: true,
      },
    },
    {
      name: 'region',
      displayName: 'Region',
      type: PropertyType.String,
      default: 'us-east-1',
      description: 'AWS region (default: us-east-1)',
    },
    {
      name: 'sessionToken',
      displayName: 'Session Token',
      type: PropertyType.String,
      default: '',
      description: 'Temporary session token (optional, for STS)',
      typeOptions: {
        password: true,
      },
    },
  ],

  test: {
    request: {
      url: 'simulate://minio-test',
      method: 'POST',
    },
  },
};
