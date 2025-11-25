import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * MinIO/S3 Operation Types
 */
export enum MinIOOperation {
  // Bucket operations
  ListBuckets = 'listBuckets',
  CreateBucket = 'createBucket',
  DeleteBucket = 'deleteBucket',
  BucketExists = 'bucketExists',

  // Object operations
  ListObjects = 'listObjects',
  GetObject = 'getObject',
  PutObject = 'putObject',
  CopyObject = 'copyObject',
  DeleteObject = 'deleteObject',
  DeleteObjects = 'deleteObjects',

  // Object info
  StatObject = 'statObject',
  GetObjectUrl = 'getObjectUrl',

  // Presigned URLs
  PresignedGetObject = 'presignedGetObject',
  PresignedPutObject = 'presignedPutObject',
}

/**
 * MinIO/S3 Node
 * Perform S3-compatible object storage operations
 */
export const MinIONode: NodeTypeDefinition = {
  type: 'minio',
  name: 'minio',
  displayName: 'MinIO / S3',
  description: 'Perform S3-compatible object storage operations',
  category: NodeCategory.Integration,
  group: ['integration', 'storage'],
  version: 1,
  icon: 'hard-drive',
  iconColor: '#C72C48',

  inputs: [
    {
      type: NodeInputType.Main,
      displayName: 'Input',
    },
  ],
  outputs: [
    {
      type: NodeOutputType.Main,
      displayName: 'Output',
    },
  ],

  credentials: [
    {
      name: 'minio',
      required: true,
    },
  ],

  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: PropertyType.Options,
      default: MinIOOperation.ListBuckets,
      required: true,
      description: 'The S3/MinIO operation to perform',
      options: [
        // Bucket operations
        { name: 'List Buckets', value: MinIOOperation.ListBuckets, description: 'List all buckets' },
        { name: 'Create Bucket', value: MinIOOperation.CreateBucket, description: 'Create a new bucket' },
        { name: 'Delete Bucket', value: MinIOOperation.DeleteBucket, description: 'Delete an empty bucket' },
        { name: 'Bucket Exists', value: MinIOOperation.BucketExists, description: 'Check if bucket exists' },

        // Object operations
        { name: 'List Objects', value: MinIOOperation.ListObjects, description: 'List objects in a bucket' },
        { name: 'Get Object', value: MinIOOperation.GetObject, description: 'Download an object' },
        { name: 'Put Object', value: MinIOOperation.PutObject, description: 'Upload an object' },
        { name: 'Copy Object', value: MinIOOperation.CopyObject, description: 'Copy an object' },
        { name: 'Delete Object', value: MinIOOperation.DeleteObject, description: 'Delete an object' },
        { name: 'Delete Objects', value: MinIOOperation.DeleteObjects, description: 'Delete multiple objects' },

        // Object info
        { name: 'Stat Object', value: MinIOOperation.StatObject, description: 'Get object metadata' },
        { name: 'Get Object URL', value: MinIOOperation.GetObjectUrl, description: 'Get direct URL for object' },

        // Presigned URLs
        { name: 'Presigned Get URL', value: MinIOOperation.PresignedGetObject, description: 'Generate presigned download URL' },
        { name: 'Presigned Put URL', value: MinIOOperation.PresignedPutObject, description: 'Generate presigned upload URL' },
      ],
    },
    // Bucket name
    {
      name: 'bucket',
      displayName: 'Bucket',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'my-bucket',
      description: 'The bucket name',
      displayOptions: {
        hide: {
          operation: [MinIOOperation.ListBuckets],
        },
      },
    },
    // Object key/path
    {
      name: 'objectKey',
      displayName: 'Object Key',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'path/to/file.txt',
      description: 'The object key (path)',
      displayOptions: {
        show: {
          operation: [
            MinIOOperation.GetObject,
            MinIOOperation.PutObject,
            MinIOOperation.CopyObject,
            MinIOOperation.DeleteObject,
            MinIOOperation.StatObject,
            MinIOOperation.GetObjectUrl,
            MinIOOperation.PresignedGetObject,
            MinIOOperation.PresignedPutObject,
          ],
        },
      },
    },
    // Destination for copy
    {
      name: 'destinationBucket',
      displayName: 'Destination Bucket',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'destination-bucket',
      description: 'Destination bucket for copy',
      displayOptions: {
        show: {
          operation: [MinIOOperation.CopyObject],
        },
      },
    },
    {
      name: 'destinationKey',
      displayName: 'Destination Key',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'path/to/destination.txt',
      description: 'Destination object key',
      displayOptions: {
        show: {
          operation: [MinIOOperation.CopyObject],
        },
      },
    },
    // Object content for put
    {
      name: 'objectContent',
      displayName: 'Content',
      type: PropertyType.String,
      default: '',
      placeholder: 'File content or base64 data',
      description: 'Object content to upload',
      typeOptions: {
        rows: 4,
      },
      displayOptions: {
        show: {
          operation: [MinIOOperation.PutObject],
        },
      },
    },
    // Content type
    {
      name: 'contentType',
      displayName: 'Content Type',
      type: PropertyType.String,
      default: 'application/octet-stream',
      placeholder: 'application/json',
      description: 'MIME type of the object',
      displayOptions: {
        show: {
          operation: [MinIOOperation.PutObject],
        },
      },
    },
    // List options
    {
      name: 'prefix',
      displayName: 'Prefix',
      type: PropertyType.String,
      default: '',
      placeholder: 'folder/',
      description: 'Filter objects by prefix',
      displayOptions: {
        show: {
          operation: [MinIOOperation.ListObjects, MinIOOperation.DeleteObjects],
        },
      },
    },
    {
      name: 'recursive',
      displayName: 'Recursive',
      type: PropertyType.Boolean,
      default: false,
      description: 'List objects recursively',
      displayOptions: {
        show: {
          operation: [MinIOOperation.ListObjects],
        },
      },
    },
    {
      name: 'maxKeys',
      displayName: 'Max Keys',
      type: PropertyType.Number,
      default: 1000,
      description: 'Maximum number of objects to list',
      displayOptions: {
        show: {
          operation: [MinIOOperation.ListObjects],
        },
      },
    },
    // Delete multiple objects
    {
      name: 'objectKeys',
      displayName: 'Object Keys',
      type: PropertyType.String,
      default: '',
      placeholder: 'key1,key2,key3',
      description: 'Comma-separated list of object keys to delete',
      displayOptions: {
        show: {
          operation: [MinIOOperation.DeleteObjects],
        },
      },
    },
    // Presigned URL options
    {
      name: 'expiry',
      displayName: 'URL Expiry (seconds)',
      type: PropertyType.Number,
      default: 3600,
      description: 'Presigned URL expiry time in seconds',
      displayOptions: {
        show: {
          operation: [
            MinIOOperation.PresignedGetObject,
            MinIOOperation.PresignedPutObject,
          ],
        },
      },
    },
    // Bucket creation options
    {
      name: 'bucketRegion',
      displayName: 'Region',
      type: PropertyType.String,
      default: '',
      placeholder: 'us-east-1',
      description: 'Region for bucket (optional)',
      displayOptions: {
        show: {
          operation: [MinIOOperation.CreateBucket],
        },
      },
    },
    // Advanced options
    {
      name: 'options',
      displayName: 'Options',
      type: PropertyType.Collection,
      default: {},
      values: [
        {
          name: 'returnBinary',
          displayName: 'Return Binary Data',
          type: PropertyType.Boolean,
          default: false,
          description: 'Return object content as binary data',
        },
        {
          name: 'addMetadata',
          displayName: 'Include Metadata',
          type: PropertyType.Boolean,
          default: true,
          description: 'Include object metadata in response',
        },
      ],
    },
  ],

  async execute(context: NodeExecutionContext) {
    const items = context.getInputData();
    const operation = context.getNodeParameter('operation') as MinIOOperation;

    const getParam = <T>(name: string, defaultValue?: T): T => {
      return context.getNodeParameter(name, defaultValue) as T;
    };

    const simulateMinIO = async (): Promise<unknown> => {
      const bucket = getParam<string>('bucket', '');
      const objectKey = getParam<string>('objectKey', '');

      switch (operation) {
        case MinIOOperation.ListBuckets:
          return {
            buckets: [
              { name: 'bucket-1', creationDate: '2024-01-15T10:30:00.000Z' },
              { name: 'bucket-2', creationDate: '2024-02-20T14:45:00.000Z' },
              { name: 'bucket-3', creationDate: '2024-03-10T08:15:00.000Z' },
            ],
          };

        case MinIOOperation.CreateBucket:
          return {
            success: true,
            bucket,
            region: getParam<string>('bucketRegion', 'us-east-1'),
          };

        case MinIOOperation.DeleteBucket:
          return {
            success: true,
            bucket,
          };

        case MinIOOperation.BucketExists:
          return {
            bucket,
            exists: true,
          };

        case MinIOOperation.ListObjects:
          return {
            bucket,
            prefix: getParam<string>('prefix', ''),
            objects: [
              { name: 'file1.txt', size: 1024, lastModified: '2024-01-20T12:00:00.000Z' },
              { name: 'file2.json', size: 2048, lastModified: '2024-01-21T14:30:00.000Z' },
              { name: 'folder/file3.txt', size: 512, lastModified: '2024-01-22T09:15:00.000Z' },
            ],
            isTruncated: false,
          };

        case MinIOOperation.GetObject:
          return {
            bucket,
            key: objectKey,
            content: 'Sample file content',
            contentType: 'text/plain',
            size: 20,
            etag: '"abc123def456"',
            lastModified: '2024-01-20T12:00:00.000Z',
          };

        case MinIOOperation.PutObject:
          return {
            success: true,
            bucket,
            key: objectKey,
            etag: '"abc123def456"',
            versionId: 'v1.0',
          };

        case MinIOOperation.CopyObject:
          return {
            success: true,
            sourceBucket: bucket,
            sourceKey: objectKey,
            destBucket: getParam<string>('destinationBucket', ''),
            destKey: getParam<string>('destinationKey', ''),
            etag: '"copied123"',
          };

        case MinIOOperation.DeleteObject:
          return {
            success: true,
            bucket,
            key: objectKey,
          };

        case MinIOOperation.DeleteObjects:
          const keys = getParam<string>('objectKeys', '').split(',').map((k: string) => k.trim());
          return {
            success: true,
            bucket,
            deleted: keys,
            errors: [],
          };

        case MinIOOperation.StatObject:
          return {
            bucket,
            key: objectKey,
            size: 1024,
            etag: '"abc123def456"',
            contentType: 'text/plain',
            lastModified: '2024-01-20T12:00:00.000Z',
            metadata: {
              'x-amz-meta-custom': 'value',
            },
          };

        case MinIOOperation.GetObjectUrl:
          return {
            bucket,
            key: objectKey,
            url: `https://minio.example.com/${bucket}/${objectKey}`,
          };

        case MinIOOperation.PresignedGetObject:
          return {
            bucket,
            key: objectKey,
            url: `https://minio.example.com/${bucket}/${objectKey}?X-Amz-Signature=abc123`,
            expiry: getParam<number>('expiry', 3600),
            expiresAt: new Date(Date.now() + getParam<number>('expiry', 3600) * 1000).toISOString(),
          };

        case MinIOOperation.PresignedPutObject:
          return {
            bucket,
            key: objectKey,
            url: `https://minio.example.com/${bucket}/${objectKey}?X-Amz-Signature=def456`,
            expiry: getParam<number>('expiry', 3600),
            expiresAt: new Date(Date.now() + getParam<number>('expiry', 3600) * 1000).toISOString(),
          };

        default:
          return { error: `Unknown operation: ${operation}` };
      }
    };

    const results: INodeExecutionData[] = [];
    for (const item of items) {
      const result = await simulateMinIO();
      results.push({
        json: {
          ...item.json,
          minio: result,
        },
        binary: item.binary,
      });
    }

    return { outputData: [results] };
  },
};

/**
 * MinIO/S3 Trigger Node
 * Trigger workflow on S3 bucket events
 */
export const MinIOTriggerNode: NodeTypeDefinition = {
  type: 'minio-trigger',
  name: 'minioTrigger',
  displayName: 'MinIO / S3 Trigger',
  description: 'Trigger workflow on S3 bucket events',
  category: NodeCategory.Trigger,
  group: ['trigger', 'integration'],
  version: 1,
  icon: 'hard-drive',
  iconColor: '#C72C48',

  inputs: [],
  outputs: [
    {
      type: NodeOutputType.Main,
      displayName: 'Output',
    },
  ],

  credentials: [
    {
      name: 'minio',
      required: true,
    },
  ],

  properties: [
    {
      name: 'bucket',
      displayName: 'Bucket',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'my-bucket',
      description: 'The bucket to watch for events',
    },
    {
      name: 'events',
      displayName: 'Events',
      type: PropertyType.MultiOptions,
      default: ['s3:ObjectCreated:*'],
      required: true,
      description: 'S3 event types to listen for',
      options: [
        { name: 'Object Created (All)', value: 's3:ObjectCreated:*' },
        { name: 'Object Created (Put)', value: 's3:ObjectCreated:Put' },
        { name: 'Object Created (Post)', value: 's3:ObjectCreated:Post' },
        { name: 'Object Created (Copy)', value: 's3:ObjectCreated:Copy' },
        { name: 'Object Removed (All)', value: 's3:ObjectRemoved:*' },
        { name: 'Object Removed (Delete)', value: 's3:ObjectRemoved:Delete' },
        { name: 'Object Accessed (Get)', value: 's3:ObjectAccessed:Get' },
      ],
    },
    {
      name: 'prefix',
      displayName: 'Prefix Filter',
      type: PropertyType.String,
      default: '',
      placeholder: 'uploads/',
      description: 'Filter events by object key prefix',
    },
    {
      name: 'suffix',
      displayName: 'Suffix Filter',
      type: PropertyType.String,
      default: '',
      placeholder: '.jpg',
      description: 'Filter events by object key suffix',
    },
  ],

  async execute(_context: NodeExecutionContext) {
    // Simulated trigger - returns sample S3 event
    return {
      outputData: [[
        {
          json: {
            eventName: 's3:ObjectCreated:Put',
            bucket: {
              name: 'sample-bucket',
              arn: 'arn:aws:s3:::sample-bucket',
            },
            object: {
              key: 'uploads/image.jpg',
              size: 102400,
              eTag: '"abc123def456"',
              contentType: 'image/jpeg',
            },
            eventTime: new Date().toISOString(),
          },
        },
      ]],
    };
  },
};
