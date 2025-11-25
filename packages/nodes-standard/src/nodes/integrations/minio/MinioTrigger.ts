import type { NodeTypeDefinition, TriggerContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeOutputType,
} from '@kerdar/core';
import {
  IntegrationTriggerMode,
  integrationTriggerBaseProperties,
} from '../../triggers/IntegrationTriggerBase';

/**
 * MinIO Event Types
 */
export enum MinioEventType {
  ObjectCreated = 's3:ObjectCreated:*',
  ObjectCreatedPut = 's3:ObjectCreated:Put',
  ObjectCreatedPost = 's3:ObjectCreated:Post',
  ObjectCreatedCopy = 's3:ObjectCreated:Copy',
  ObjectRemoved = 's3:ObjectRemoved:*',
  ObjectRemovedDelete = 's3:ObjectRemoved:Delete',
  ObjectAccessed = 's3:ObjectAccessed:*',
  ObjectAccessedGet = 's3:ObjectAccessed:Get',
  ObjectAccessedHead = 's3:ObjectAccessed:Head',
  BucketCreated = 's3:BucketCreated:*',
  BucketRemoved = 's3:BucketRemoved:*',
}

/**
 * MinIO Trigger Node
 * Triggers workflow when MinIO/S3 events occur
 */
export const MinioTriggerNode: NodeTypeDefinition = {
  name: 'minioTrigger',
  displayName: 'MinIO Trigger',
  description: 'Start workflow when objects are created, deleted, or accessed in MinIO/S3',
  category: NodeCategory.Trigger,
  version: 1,
  icon: 'database',
  iconColor: '#c72c48',

  inputs: [],
  outputs: [
    {
      type: NodeOutputType.Main,
      displayName: 'Event',
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
      default: [MinioEventType.ObjectCreated],
      required: true,
      description: 'Which events to trigger on',
      options: [
        { name: 'Object Created (All)', value: MinioEventType.ObjectCreated },
        { name: 'Object Created (Put)', value: MinioEventType.ObjectCreatedPut },
        { name: 'Object Created (Post)', value: MinioEventType.ObjectCreatedPost },
        { name: 'Object Created (Copy)', value: MinioEventType.ObjectCreatedCopy },
        { name: 'Object Removed (All)', value: MinioEventType.ObjectRemoved },
        { name: 'Object Removed (Delete)', value: MinioEventType.ObjectRemovedDelete },
        { name: 'Object Accessed (All)', value: MinioEventType.ObjectAccessed },
        { name: 'Object Accessed (Get)', value: MinioEventType.ObjectAccessedGet },
        { name: 'Bucket Created', value: MinioEventType.BucketCreated },
        { name: 'Bucket Removed', value: MinioEventType.BucketRemoved },
      ],
    },
    {
      name: 'prefix',
      displayName: 'Prefix Filter',
      type: PropertyType.String,
      default: '',
      placeholder: 'uploads/',
      description: 'Only trigger for objects with this prefix',
    },
    {
      name: 'suffix',
      displayName: 'Suffix Filter',
      type: PropertyType.String,
      default: '',
      placeholder: '.jpg',
      description: 'Only trigger for objects with this suffix',
    },
    ...integrationTriggerBaseProperties,
  ],

  trigger: async (context: TriggerContext): Promise<INodeExecutionData[][]> => {
    const { parameters } = context;
    const triggerMode = parameters.triggerMode as IntegrationTriggerMode;
    const bucket = parameters.bucket as string;
    const events = parameters.events as MinioEventType[];
    const prefix = parameters.prefix as string;
    const suffix = parameters.suffix as string;

    // Simulate a MinIO event
    const mockEvent = {
      eventName: events[0] || MinioEventType.ObjectCreatedPut,
      eventTime: new Date().toISOString(),
      bucket: {
        name: bucket || 'example-bucket',
        arn: `arn:aws:s3:::${bucket || 'example-bucket'}`,
      },
      object: {
        key: `${prefix}example-file${suffix || '.txt'}`,
        size: 1024,
        eTag: 'abc123def456',
        contentType: 'application/octet-stream',
        userMetadata: {},
      },
      source: {
        host: 'minio-server',
        port: '9000',
        userAgent: 'MinIO Notification',
      },
    };

    return [[{
      json: {
        ...mockEvent,
        _trigger: {
          service: 'MinIO',
          mode: triggerMode,
          bucket,
          events,
          prefix,
          suffix,
          timestamp: new Date().toISOString(),
          simulated: true,
          note: 'MinIO trigger is simulated. Configure bucket notifications for real events.',
        },
      },
    }]];
  },
};
