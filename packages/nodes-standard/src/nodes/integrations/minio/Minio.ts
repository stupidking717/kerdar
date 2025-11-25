import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * MinIO Operations
 */
export enum MinioOperation {
  // Object operations
  GetObject = 'getObject',
  PutObject = 'putObject',
  CopyObject = 'copyObject',
  DeleteObject = 'deleteObject',
  ListObjects = 'listObjects',
  GetObjectUrl = 'getObjectUrl',
  StatObject = 'statObject',
  // Bucket operations
  ListBuckets = 'listBuckets',
  CreateBucket = 'createBucket',
  DeleteBucket = 'deleteBucket',
  BucketExists = 'bucketExists',
}

/**
 * MinIO Action Node
 * Perform operations on MinIO/S3 storage
 */
export const MinioNode: NodeTypeDefinition = {
  name: 'minio',
  displayName: 'MinIO',
  description: 'Work with MinIO or S3-compatible object storage',
  category: NodeCategory.Integration,
  version: 1,
  icon: 'database',
  iconColor: '#c72c48',

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
      displayName: 'MinIO Credentials',
    },
  ],

  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: PropertyType.Options,
      default: MinioOperation.ListObjects,
      required: true,
      description: 'The operation to perform',
      options: [
        { name: 'Get Object', value: MinioOperation.GetObject },
        { name: 'Put Object', value: MinioOperation.PutObject },
        { name: 'Copy Object', value: MinioOperation.CopyObject },
        { name: 'Delete Object', value: MinioOperation.DeleteObject },
        { name: 'List Objects', value: MinioOperation.ListObjects },
        { name: 'Get Object URL', value: MinioOperation.GetObjectUrl },
        { name: 'Get Object Info', value: MinioOperation.StatObject },
        { name: 'List Buckets', value: MinioOperation.ListBuckets },
        { name: 'Create Bucket', value: MinioOperation.CreateBucket },
        { name: 'Delete Bucket', value: MinioOperation.DeleteBucket },
        { name: 'Bucket Exists', value: MinioOperation.BucketExists },
      ],
    },
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
          operation: [MinioOperation.ListBuckets],
        },
      },
    },
    {
      name: 'objectKey',
      displayName: 'Object Key',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'folder/file.txt',
      description: 'The object key (path)',
      displayOptions: {
        show: {
          operation: [
            MinioOperation.GetObject,
            MinioOperation.PutObject,
            MinioOperation.CopyObject,
            MinioOperation.DeleteObject,
            MinioOperation.GetObjectUrl,
            MinioOperation.StatObject,
          ],
        },
      },
    },
    {
      name: 'destinationBucket',
      displayName: 'Destination Bucket',
      type: PropertyType.String,
      default: '',
      placeholder: 'destination-bucket',
      description: 'Destination bucket for copy',
      displayOptions: {
        show: {
          operation: [MinioOperation.CopyObject],
        },
      },
    },
    {
      name: 'destinationKey',
      displayName: 'Destination Key',
      type: PropertyType.String,
      default: '',
      placeholder: 'new-folder/file.txt',
      description: 'Destination object key for copy',
      displayOptions: {
        show: {
          operation: [MinioOperation.CopyObject],
        },
      },
    },
    {
      name: 'content',
      displayName: 'Content',
      type: PropertyType.String,
      default: '',
      description: 'Content to upload (for text files)',
      displayOptions: {
        show: {
          operation: [MinioOperation.PutObject],
        },
      },
      typeOptions: {
        rows: 5,
      },
    },
    {
      name: 'binaryProperty',
      displayName: 'Binary Property',
      type: PropertyType.String,
      default: 'data',
      description: 'Name of the binary property containing file data',
      displayOptions: {
        show: {
          operation: [MinioOperation.PutObject, MinioOperation.GetObject],
        },
      },
    },
    {
      name: 'prefix',
      displayName: 'Prefix',
      type: PropertyType.String,
      default: '',
      placeholder: 'folder/',
      description: 'Filter objects by prefix',
      displayOptions: {
        show: {
          operation: [MinioOperation.ListObjects],
        },
      },
    },
    {
      name: 'maxKeys',
      displayName: 'Max Keys',
      type: PropertyType.Number,
      default: 1000,
      description: 'Maximum number of objects to return',
      displayOptions: {
        show: {
          operation: [MinioOperation.ListObjects],
        },
      },
    },
    {
      name: 'urlExpiry',
      displayName: 'URL Expiry (seconds)',
      type: PropertyType.Number,
      default: 3600,
      description: 'How long the presigned URL is valid',
      displayOptions: {
        show: {
          operation: [MinioOperation.GetObjectUrl],
        },
      },
    },
    {
      name: 'contentType',
      displayName: 'Content Type',
      type: PropertyType.String,
      default: 'application/octet-stream',
      placeholder: 'image/png',
      description: 'MIME type of the object',
      displayOptions: {
        show: {
          operation: [MinioOperation.PutObject],
        },
      },
    },
    {
      name: 'metadata',
      displayName: 'Metadata',
      type: PropertyType.Json,
      default: '{}',
      description: 'Custom metadata for the object',
      displayOptions: {
        show: {
          operation: [MinioOperation.PutObject],
        },
      },
    },
  ],

  execute: async (context: NodeExecutionContext): Promise<INodeExecutionData[][]> => {
    const { inputData, parameters } = context;
    const items = inputData[0] || [{ json: {} }];
    const operation = parameters.operation as MinioOperation;
    const bucket = parameters.bucket as string;
    const objectKey = parameters.objectKey as string;

    const results: INodeExecutionData[] = [];

    for (const item of items) {
      let responseData: Record<string, unknown>;

      switch (operation) {
        case MinioOperation.GetObject:
          responseData = {
            bucket,
            key: objectKey,
            content: 'Simulated file content',
            size: 1024,
            contentType: 'text/plain',
            lastModified: new Date().toISOString(),
            etag: 'abc123',
          };
          break;

        case MinioOperation.PutObject:
          responseData = {
            bucket,
            key: objectKey,
            etag: `"${Date.now().toString(16)}"`,
            versionId: null,
            uploaded: true,
            size: (parameters.content as string)?.length || 0,
          };
          break;

        case MinioOperation.CopyObject:
          responseData = {
            sourceBucket: bucket,
            sourceKey: objectKey,
            destinationBucket: parameters.destinationBucket || bucket,
            destinationKey: parameters.destinationKey || objectKey,
            copied: true,
            etag: `"${Date.now().toString(16)}"`,
          };
          break;

        case MinioOperation.DeleteObject:
          responseData = {
            bucket,
            key: objectKey,
            deleted: true,
          };
          break;

        case MinioOperation.ListObjects:
          responseData = {
            bucket,
            prefix: parameters.prefix || '',
            objects: [
              { key: 'file1.txt', size: 1024, lastModified: new Date().toISOString() },
              { key: 'file2.jpg', size: 204800, lastModified: new Date().toISOString() },
              { key: 'folder/file3.pdf', size: 51200, lastModified: new Date().toISOString() },
            ],
            isTruncated: false,
            keyCount: 3,
          };
          break;

        case MinioOperation.GetObjectUrl:
          responseData = {
            bucket,
            key: objectKey,
            url: `https://minio-server:9000/${bucket}/${objectKey}?X-Amz-Signature=simulated`,
            expiresIn: parameters.urlExpiry as number,
            expiresAt: new Date(Date.now() + (parameters.urlExpiry as number) * 1000).toISOString(),
          };
          break;

        case MinioOperation.StatObject:
          responseData = {
            bucket,
            key: objectKey,
            size: 1024,
            contentType: 'application/octet-stream',
            lastModified: new Date().toISOString(),
            etag: 'abc123def456',
            metadata: {},
          };
          break;

        case MinioOperation.ListBuckets:
          responseData = {
            buckets: [
              { name: 'bucket-1', creationDate: new Date().toISOString() },
              { name: 'bucket-2', creationDate: new Date().toISOString() },
              { name: 'bucket-3', creationDate: new Date().toISOString() },
            ],
          };
          break;

        case MinioOperation.CreateBucket:
          responseData = {
            bucket,
            created: true,
            location: `/${bucket}`,
          };
          break;

        case MinioOperation.DeleteBucket:
          responseData = {
            bucket,
            deleted: true,
          };
          break;

        case MinioOperation.BucketExists:
          responseData = {
            bucket,
            exists: true,
          };
          break;

        default:
          responseData = { error: 'Unknown operation' };
      }

      results.push({
        json: {
          ...item.json,
          minio: {
            ...responseData,
            operation,
            simulated: true,
            note: 'MinIO operations are simulated. Configure a backend handler for real S3/MinIO access.',
          },
        },
      });
    }

    return [results];
  },
};
