import type { CredentialTypeDefinition } from '@kerdar/core';
import { PropertyType, CredentialAuthMethod } from '@kerdar/core';

/**
 * MinIO / S3 Compatible Storage Credential
 */
export const MinioCredential: CredentialTypeDefinition = {
  name: 'minio',
  displayName: 'MinIO / S3',
  description: 'Connect to MinIO or S3-compatible object storage',
  icon: 'database',
  documentationUrl: 'https://min.io/docs',

  authentication: {
    type: CredentialAuthMethod.Generic,
  },

  properties: [
    {
      name: 'endpoint',
      displayName: 'Endpoint',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'play.min.io or s3.amazonaws.com',
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
      displayName: 'Use SSL',
      type: PropertyType.Boolean,
      default: true,
      description: 'Use HTTPS for connections',
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
      placeholder: 'us-east-1',
      description: 'S3 region (optional for MinIO)',
    },
  ],

  test: {
    request: {
      url: 'simulate://minio-test',
      method: 'GET',
    },
  },
};
