import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Redis Operation Types
 */
export enum RedisOperation {
  // String operations
  Get = 'get',
  Set = 'set',
  Delete = 'delete',
  Increment = 'increment',
  Decrement = 'decrement',
  Append = 'append',

  // Key operations
  Keys = 'keys',
  Exists = 'exists',
  Expire = 'expire',
  TTL = 'ttl',
  Type = 'type',
  Rename = 'rename',

  // List operations
  LPush = 'lpush',
  RPush = 'rpush',
  LPop = 'lpop',
  RPop = 'rpop',
  LRange = 'lrange',
  LLen = 'llen',

  // Set operations
  SAdd = 'sadd',
  SRem = 'srem',
  SMembers = 'smembers',
  SIsMember = 'sismember',
  SCard = 'scard',

  // Hash operations
  HSet = 'hset',
  HGet = 'hget',
  HGetAll = 'hgetall',
  HDel = 'hdel',
  HExists = 'hexists',
  HKeys = 'hkeys',
  HVals = 'hvals',

  // Sorted Set operations
  ZAdd = 'zadd',
  ZRem = 'zrem',
  ZRange = 'zrange',
  ZScore = 'zscore',
  ZCard = 'zcard',

  // Pub/Sub operations
  Publish = 'publish',

  // Info
  Info = 'info',
  Ping = 'ping',
}

/**
 * Redis Node
 * Perform Redis operations (GET, SET, lists, hashes, etc.)
 */
export const RedisNode: NodeTypeDefinition = {
  type: 'redis',
  name: 'redis',
  displayName: 'Redis',
  description: 'Perform Redis operations',
  category: NodeCategory.Integration,
  group: ['integration', 'database'],
  version: 1,
  icon: 'database',
  iconColor: '#DC382D',

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
      name: 'redis',
      required: true,
    },
  ],

  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: PropertyType.Options,
      default: RedisOperation.Get,
      required: true,
      description: 'The Redis operation to perform',
      options: [
        // String operations
        { name: 'Get', value: RedisOperation.Get, description: 'Get the value of a key' },
        { name: 'Set', value: RedisOperation.Set, description: 'Set the value of a key' },
        { name: 'Delete', value: RedisOperation.Delete, description: 'Delete a key' },
        { name: 'Increment', value: RedisOperation.Increment, description: 'Increment a number value' },
        { name: 'Decrement', value: RedisOperation.Decrement, description: 'Decrement a number value' },
        { name: 'Append', value: RedisOperation.Append, description: 'Append to a string value' },

        // Key operations
        { name: 'Keys', value: RedisOperation.Keys, description: 'Find keys matching a pattern' },
        { name: 'Exists', value: RedisOperation.Exists, description: 'Check if a key exists' },
        { name: 'Expire', value: RedisOperation.Expire, description: 'Set key expiration' },
        { name: 'TTL', value: RedisOperation.TTL, description: 'Get key time-to-live' },
        { name: 'Type', value: RedisOperation.Type, description: 'Get the type of a key' },
        { name: 'Rename', value: RedisOperation.Rename, description: 'Rename a key' },

        // List operations
        { name: 'List Push Left', value: RedisOperation.LPush, description: 'Push to the left of a list' },
        { name: 'List Push Right', value: RedisOperation.RPush, description: 'Push to the right of a list' },
        { name: 'List Pop Left', value: RedisOperation.LPop, description: 'Pop from the left of a list' },
        { name: 'List Pop Right', value: RedisOperation.RPop, description: 'Pop from the right of a list' },
        { name: 'List Range', value: RedisOperation.LRange, description: 'Get a range of list elements' },
        { name: 'List Length', value: RedisOperation.LLen, description: 'Get the length of a list' },

        // Set operations
        { name: 'Set Add', value: RedisOperation.SAdd, description: 'Add members to a set' },
        { name: 'Set Remove', value: RedisOperation.SRem, description: 'Remove members from a set' },
        { name: 'Set Members', value: RedisOperation.SMembers, description: 'Get all members of a set' },
        { name: 'Set Is Member', value: RedisOperation.SIsMember, description: 'Check if value is a set member' },
        { name: 'Set Count', value: RedisOperation.SCard, description: 'Get the number of set members' },

        // Hash operations
        { name: 'Hash Set', value: RedisOperation.HSet, description: 'Set hash field value' },
        { name: 'Hash Get', value: RedisOperation.HGet, description: 'Get hash field value' },
        { name: 'Hash Get All', value: RedisOperation.HGetAll, description: 'Get all hash fields and values' },
        { name: 'Hash Delete', value: RedisOperation.HDel, description: 'Delete hash fields' },
        { name: 'Hash Exists', value: RedisOperation.HExists, description: 'Check if hash field exists' },
        { name: 'Hash Keys', value: RedisOperation.HKeys, description: 'Get all hash field names' },
        { name: 'Hash Values', value: RedisOperation.HVals, description: 'Get all hash values' },

        // Sorted Set operations
        { name: 'Sorted Set Add', value: RedisOperation.ZAdd, description: 'Add to sorted set with score' },
        { name: 'Sorted Set Remove', value: RedisOperation.ZRem, description: 'Remove from sorted set' },
        { name: 'Sorted Set Range', value: RedisOperation.ZRange, description: 'Get range from sorted set' },
        { name: 'Sorted Set Score', value: RedisOperation.ZScore, description: 'Get member score' },
        { name: 'Sorted Set Count', value: RedisOperation.ZCard, description: 'Get sorted set size' },

        // Pub/Sub
        { name: 'Publish', value: RedisOperation.Publish, description: 'Publish message to channel' },

        // Info
        { name: 'Info', value: RedisOperation.Info, description: 'Get server information' },
        { name: 'Ping', value: RedisOperation.Ping, description: 'Ping the server' },
      ],
    },
    // Key parameter (for most operations)
    {
      name: 'key',
      displayName: 'Key',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'my-key',
      description: 'The Redis key',
      displayOptions: {
        hide: {
          operation: [
            RedisOperation.Keys,
            RedisOperation.Info,
            RedisOperation.Ping,
            RedisOperation.Publish,
          ],
        },
      },
    },
    // Pattern for Keys operation
    {
      name: 'pattern',
      displayName: 'Pattern',
      type: PropertyType.String,
      default: '*',
      required: true,
      placeholder: 'user:*',
      description: 'Key pattern to match (supports wildcards: *, ?, [abc])',
      displayOptions: {
        show: {
          operation: [RedisOperation.Keys],
        },
      },
    },
    // Value parameter (for SET, APPEND, etc.)
    {
      name: 'value',
      displayName: 'Value',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'value',
      description: 'The value to set',
      displayOptions: {
        show: {
          operation: [
            RedisOperation.Set,
            RedisOperation.Append,
            RedisOperation.LPush,
            RedisOperation.RPush,
            RedisOperation.SAdd,
            RedisOperation.SRem,
            RedisOperation.SIsMember,
          ],
        },
      },
    },
    // New key for rename
    {
      name: 'newKey',
      displayName: 'New Key',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'new-key-name',
      description: 'The new key name',
      displayOptions: {
        show: {
          operation: [RedisOperation.Rename],
        },
      },
    },
    // Expiration time
    {
      name: 'expireTime',
      displayName: 'Expire Time (seconds)',
      type: PropertyType.Number,
      default: 0,
      description: 'Key expiration in seconds (0 = no expiration)',
      displayOptions: {
        show: {
          operation: [RedisOperation.Set, RedisOperation.Expire],
        },
      },
    },
    // Increment/Decrement amount
    {
      name: 'amount',
      displayName: 'Amount',
      type: PropertyType.Number,
      default: 1,
      description: 'Amount to increment or decrement',
      displayOptions: {
        show: {
          operation: [RedisOperation.Increment, RedisOperation.Decrement],
        },
      },
    },
    // Range parameters for List operations
    {
      name: 'rangeStart',
      displayName: 'Start Index',
      type: PropertyType.Number,
      default: 0,
      description: 'Start index (0-based, negative counts from end)',
      displayOptions: {
        show: {
          operation: [RedisOperation.LRange, RedisOperation.ZRange],
        },
      },
    },
    {
      name: 'rangeEnd',
      displayName: 'End Index',
      type: PropertyType.Number,
      default: -1,
      description: 'End index (-1 for all remaining)',
      displayOptions: {
        show: {
          operation: [RedisOperation.LRange, RedisOperation.ZRange],
        },
      },
    },
    // Hash field parameter
    {
      name: 'field',
      displayName: 'Field',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'field-name',
      description: 'The hash field name',
      displayOptions: {
        show: {
          operation: [
            RedisOperation.HSet,
            RedisOperation.HGet,
            RedisOperation.HDel,
            RedisOperation.HExists,
          ],
        },
      },
    },
    // Hash value parameter
    {
      name: 'fieldValue',
      displayName: 'Field Value',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'field-value',
      description: 'The value for the hash field',
      displayOptions: {
        show: {
          operation: [RedisOperation.HSet],
        },
      },
    },
    // Sorted set score
    {
      name: 'score',
      displayName: 'Score',
      type: PropertyType.Number,
      default: 0,
      required: true,
      description: 'The score for sorted set member',
      displayOptions: {
        show: {
          operation: [RedisOperation.ZAdd],
        },
      },
    },
    // Sorted set member
    {
      name: 'member',
      displayName: 'Member',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'member-value',
      description: 'The sorted set member',
      displayOptions: {
        show: {
          operation: [
            RedisOperation.ZAdd,
            RedisOperation.ZRem,
            RedisOperation.ZScore,
          ],
        },
      },
    },
    // Pub/Sub channel
    {
      name: 'channel',
      displayName: 'Channel',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'my-channel',
      description: 'The pub/sub channel name',
      displayOptions: {
        show: {
          operation: [RedisOperation.Publish],
        },
      },
    },
    // Pub/Sub message
    {
      name: 'message',
      displayName: 'Message',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: '{"event": "update"}',
      description: 'The message to publish',
      displayOptions: {
        show: {
          operation: [RedisOperation.Publish],
        },
      },
    },
    // Options
    {
      name: 'options',
      displayName: 'Options',
      type: PropertyType.Collection,
      default: {},
      values: [
        {
          name: 'setMode',
          displayName: 'Set Mode',
          type: PropertyType.Options,
          default: 'always',
          description: 'When to set the value',
          options: [
            { name: 'Always', value: 'always' },
            { name: 'Only if not exists (NX)', value: 'nx' },
            { name: 'Only if exists (XX)', value: 'xx' },
          ],
        },
        {
          name: 'parseJson',
          displayName: 'Parse JSON',
          type: PropertyType.Boolean,
          default: true,
          description: 'Automatically parse JSON values',
        },
        {
          name: 'stringifyJson',
          displayName: 'Stringify JSON',
          type: PropertyType.Boolean,
          default: true,
          description: 'Automatically stringify objects as JSON',
        },
        {
          name: 'withScores',
          displayName: 'Include Scores',
          type: PropertyType.Boolean,
          default: false,
          description: 'Include scores in sorted set results',
        },
      ],
    },
  ],

  async execute(context: NodeExecutionContext) {
    const items = context.getInputData();
    const operation = context.getNodeParameter('operation') as RedisOperation;

    // Helper to get parameters
    const getParam = <T>(name: string, defaultValue?: T): T => {
      return context.getNodeParameter(name, defaultValue) as T;
    };

    // Simulated Redis operations for demo purposes
    // In production, this would use a real Redis client like ioredis
    const simulateRedis = async (): Promise<unknown> => {
      const key = getParam<string>('key', '');
      const value = getParam<string>('value', '');

      switch (operation) {
        case RedisOperation.Get:
          return { key, value: `simulated_value_for_${key}` };

        case RedisOperation.Set:
          return {
            success: true,
            key,
            value,
            expiration: getParam<number>('expireTime', 0) || null
          };

        case RedisOperation.Delete:
          return { deleted: 1, key };

        case RedisOperation.Increment:
        case RedisOperation.Decrement:
          const amount = getParam<number>('amount', 1);
          return {
            key,
            newValue: operation === RedisOperation.Increment ? amount : -amount
          };

        case RedisOperation.Keys:
          const pattern = getParam<string>('pattern', '*');
          return {
            pattern,
            keys: [`${pattern.replace('*', '1')}`, `${pattern.replace('*', '2')}`]
          };

        case RedisOperation.Exists:
          return { key, exists: true };

        case RedisOperation.Expire:
          return { key, expireSet: true, seconds: getParam<number>('expireTime', 0) };

        case RedisOperation.TTL:
          return { key, ttl: 3600 };

        case RedisOperation.Type:
          return { key, type: 'string' };

        case RedisOperation.Rename:
          return { oldKey: key, newKey: getParam<string>('newKey', ''), success: true };

        case RedisOperation.LPush:
        case RedisOperation.RPush:
          return { key, value, listLength: 5 };

        case RedisOperation.LPop:
        case RedisOperation.RPop:
          return { key, poppedValue: 'simulated_popped_value' };

        case RedisOperation.LRange:
          return {
            key,
            values: ['item1', 'item2', 'item3'],
            start: getParam<number>('rangeStart', 0),
            end: getParam<number>('rangeEnd', -1)
          };

        case RedisOperation.LLen:
          return { key, length: 10 };

        case RedisOperation.SAdd:
        case RedisOperation.SRem:
          return { key, value, membersAffected: 1 };

        case RedisOperation.SMembers:
          return { key, members: ['member1', 'member2', 'member3'] };

        case RedisOperation.SIsMember:
          return { key, value, isMember: true };

        case RedisOperation.SCard:
          return { key, cardinality: 5 };

        case RedisOperation.HSet:
          return {
            key,
            field: getParam<string>('field', ''),
            value: getParam<string>('fieldValue', ''),
            success: true
          };

        case RedisOperation.HGet:
          return {
            key,
            field: getParam<string>('field', ''),
            value: `simulated_field_value`
          };

        case RedisOperation.HGetAll:
          return {
            key,
            fields: { field1: 'value1', field2: 'value2' }
          };

        case RedisOperation.HDel:
          return { key, field: getParam<string>('field', ''), deleted: true };

        case RedisOperation.HExists:
          return { key, field: getParam<string>('field', ''), exists: true };

        case RedisOperation.HKeys:
          return { key, fields: ['field1', 'field2', 'field3'] };

        case RedisOperation.HVals:
          return { key, values: ['value1', 'value2', 'value3'] };

        case RedisOperation.ZAdd:
          return {
            key,
            member: getParam<string>('member', ''),
            score: getParam<number>('score', 0),
            added: 1
          };

        case RedisOperation.ZRem:
          return { key, member: getParam<string>('member', ''), removed: 1 };

        case RedisOperation.ZRange:
          return {
            key,
            members: ['member1', 'member2'],
            start: getParam<number>('rangeStart', 0),
            end: getParam<number>('rangeEnd', -1)
          };

        case RedisOperation.ZScore:
          return { key, member: getParam<string>('member', ''), score: 42.5 };

        case RedisOperation.ZCard:
          return { key, cardinality: 8 };

        case RedisOperation.Publish:
          return {
            channel: getParam<string>('channel', ''),
            message: getParam<string>('message', ''),
            subscribersNotified: 3
          };

        case RedisOperation.Info:
          return {
            redis_version: '7.0.0',
            connected_clients: 10,
            used_memory_human: '1.5M',
            uptime_in_days: 30
          };

        case RedisOperation.Ping:
          return { response: 'PONG', latencyMs: 1 };

        default:
          return { error: `Unknown operation: ${operation}` };
      }
    };

    const results: INodeExecutionData[] = [];

    for (const item of items) {
      const result = await simulateRedis();
      results.push({
        json: {
          ...item.json,
          redis: result,
        },
        binary: item.binary,
      });
    }

    return { outputData: [results] };
  },
};

/**
 * Redis Trigger Node
 * Listen for Redis pub/sub messages or key events
 */
export const RedisTriggerNode: NodeTypeDefinition = {
  type: 'redis-trigger',
  name: 'redisTrigger',
  displayName: 'Redis Trigger',
  description: 'Trigger workflow on Redis pub/sub messages or key events',
  category: NodeCategory.Trigger,
  group: ['trigger', 'integration'],
  version: 1,
  icon: 'database',
  iconColor: '#DC382D',

  inputs: [],
  outputs: [
    {
      type: NodeOutputType.Main,
      displayName: 'Output',
    },
  ],

  credentials: [
    {
      name: 'redis',
      required: true,
    },
  ],

  properties: [
    {
      name: 'triggerType',
      displayName: 'Trigger Type',
      type: PropertyType.Options,
      default: 'subscribe',
      required: true,
      description: 'The type of trigger',
      options: [
        {
          name: 'Channel Subscribe',
          value: 'subscribe',
          description: 'Listen for messages on a channel'
        },
        {
          name: 'Pattern Subscribe',
          value: 'psubscribe',
          description: 'Listen for messages matching a pattern'
        },
        {
          name: 'Keyspace Events',
          value: 'keyspace',
          description: 'Listen for key events (requires keyspace notifications)'
        },
      ],
    },
    {
      name: 'channel',
      displayName: 'Channel',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'my-channel',
      description: 'The channel to subscribe to',
      displayOptions: {
        show: {
          triggerType: ['subscribe'],
        },
      },
    },
    {
      name: 'pattern',
      displayName: 'Pattern',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'notifications:*',
      description: 'Channel pattern to subscribe to (supports wildcards)',
      displayOptions: {
        show: {
          triggerType: ['psubscribe'],
        },
      },
    },
    {
      name: 'keyPattern',
      displayName: 'Key Pattern',
      type: PropertyType.String,
      default: '*',
      required: true,
      placeholder: 'user:*',
      description: 'Key pattern to watch for events',
      displayOptions: {
        show: {
          triggerType: ['keyspace'],
        },
      },
    },
    {
      name: 'keyEvents',
      displayName: 'Key Events',
      type: PropertyType.MultiOptions,
      default: ['set', 'del'],
      description: 'Key events to listen for',
      displayOptions: {
        show: {
          triggerType: ['keyspace'],
        },
      },
      options: [
        { name: 'Set', value: 'set' },
        { name: 'Delete', value: 'del' },
        { name: 'Expire', value: 'expired' },
        { name: 'Rename', value: 'rename' },
        { name: 'List Operations', value: 'list' },
        { name: 'Set Operations', value: 'set_ops' },
        { name: 'Hash Operations', value: 'hash' },
        { name: 'Sorted Set Operations', value: 'zset' },
      ],
    },
    {
      name: 'parseJson',
      displayName: 'Parse JSON Messages',
      type: PropertyType.Boolean,
      default: true,
      description: 'Automatically parse JSON messages',
    },
  ],

  async execute(_context: NodeExecutionContext) {
    // Simulated trigger for demo - returns sample message data
    return {
      outputData: [[
        {
          json: {
            channel: 'test-channel',
            message: { event: 'test', data: { id: 1, name: 'Test' } },
            timestamp: new Date().toISOString(),
          },
        },
      ]],
    };
  },
};
