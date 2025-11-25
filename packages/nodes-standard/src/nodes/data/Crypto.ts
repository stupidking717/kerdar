import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Crypto Node
 * Perform cryptographic operations (hashing, encoding, etc.)
 */
export const CryptoNode: NodeTypeDefinition = {
  name: 'crypto',
  displayName: 'Crypto',
  description: 'Perform cryptographic operations like hashing and encoding',
  type: 'crypto',
  group: ['data'],
  category: NodeCategory.Data,
  version: 1,
  icon: 'lock',
  iconColor: '#8b5cf6',

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

  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: PropertyType.Options,
      default: 'hash',
      description: 'The cryptographic operation to perform',
      options: [
        { name: 'Hash', value: 'hash' },
        { name: 'HMAC', value: 'hmac' },
        { name: 'Base64 Encode', value: 'base64Encode' },
        { name: 'Base64 Decode', value: 'base64Decode' },
        { name: 'URL Encode', value: 'urlEncode' },
        { name: 'URL Decode', value: 'urlDecode' },
        { name: 'Generate UUID', value: 'uuid' },
        { name: 'Generate Random', value: 'random' },
      ],
    },
    {
      name: 'value',
      displayName: 'Value',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'Text to process',
      description: 'The value to process',
      displayOptions: {
        hide: {
          operation: ['uuid', 'random'],
        },
      },
    },
    // Hash options
    {
      name: 'hashAlgorithm',
      displayName: 'Algorithm',
      type: PropertyType.Options,
      default: 'sha256',
      displayOptions: {
        show: {
          operation: ['hash', 'hmac'],
        },
      },
      options: [
        { name: 'MD5', value: 'md5' },
        { name: 'SHA-1', value: 'sha1' },
        { name: 'SHA-256', value: 'sha256' },
        { name: 'SHA-384', value: 'sha384' },
        { name: 'SHA-512', value: 'sha512' },
      ],
    },
    {
      name: 'encoding',
      displayName: 'Output Encoding',
      type: PropertyType.Options,
      default: 'hex',
      displayOptions: {
        show: {
          operation: ['hash', 'hmac'],
        },
      },
      options: [
        { name: 'Hex', value: 'hex' },
        { name: 'Base64', value: 'base64' },
      ],
    },
    // HMAC secret
    {
      name: 'secret',
      displayName: 'Secret',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'HMAC secret key',
      description: 'The secret key for HMAC',
      displayOptions: {
        show: {
          operation: ['hmac'],
        },
      },
    },
    // Random options
    {
      name: 'randomType',
      displayName: 'Random Type',
      type: PropertyType.Options,
      default: 'string',
      displayOptions: {
        show: {
          operation: ['random'],
        },
      },
      options: [
        { name: 'Random String', value: 'string' },
        { name: 'Random Number', value: 'number' },
        { name: 'Random Bytes (Hex)', value: 'bytes' },
      ],
    },
    {
      name: 'randomLength',
      displayName: 'Length',
      type: PropertyType.Number,
      default: 16,
      displayOptions: {
        show: {
          operation: ['random'],
        },
      },
    },
    {
      name: 'outputField',
      displayName: 'Output Field',
      type: PropertyType.String,
      default: 'result',
      description: 'The field name for the result',
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const items = inputData[0] || [{ json: {} }];
    const operation = parameters.operation as string;
    const outputField = (parameters.outputField as string) || 'result';

    // Simple hash function for browser (for demo purposes)
    // In production, use Web Crypto API
    const simpleHash = async (
      message: string,
      algorithm: string
    ): Promise<string> => {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const algoMap: Record<string, string> = {
          sha256: 'SHA-256',
          sha384: 'SHA-384',
          sha512: 'SHA-512',
          sha1: 'SHA-1',
        };
        const algo = algoMap[algorithm] || 'SHA-256';

        try {
          const hashBuffer = await crypto.subtle.digest(algo, data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        } catch {
          // Fallback for unsupported algorithms
          return `simulated_${algorithm}_hash_${message.length}`;
        }
      }
      return `simulated_${algorithm}_hash_${message.length}`;
    };

    const generateUUID = (): string => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // Fallback UUID v4 generation
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

    const generateRandom = (type: string, length: number): string | number => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

      switch (type) {
        case 'string':
          return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        case 'number':
          return Math.floor(Math.random() * Math.pow(10, length));
        case 'bytes':
          return Array.from({ length }, () =>
            Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
          ).join('');
        default:
          return '';
      }
    };

    const results: INodeExecutionData[] = [];

    for (const item of items) {
      let result: unknown;
      const value = (parameters.value as string) || '';

      switch (operation) {
        case 'hash': {
          const algorithm = (parameters.hashAlgorithm as string) || 'sha256';
          result = await simpleHash(value, algorithm);
          break;
        }

        case 'hmac': {
          const algorithm = (parameters.hashAlgorithm as string) || 'sha256';
          const secret = (parameters.secret as string) || '';
          // Simplified HMAC simulation
          result = await simpleHash(`${secret}${value}`, algorithm);
          break;
        }

        case 'base64Encode': {
          if (typeof btoa !== 'undefined') {
            result = btoa(value);
          } else {
            result = Buffer.from(value).toString('base64');
          }
          break;
        }

        case 'base64Decode': {
          try {
            if (typeof atob !== 'undefined') {
              result = atob(value);
            } else {
              result = Buffer.from(value, 'base64').toString('utf-8');
            }
          } catch {
            result = { error: 'Invalid base64 string' };
          }
          break;
        }

        case 'urlEncode': {
          result = encodeURIComponent(value);
          break;
        }

        case 'urlDecode': {
          try {
            result = decodeURIComponent(value);
          } catch {
            result = { error: 'Invalid URL-encoded string' };
          }
          break;
        }

        case 'uuid': {
          result = generateUUID();
          break;
        }

        case 'random': {
          const randomType = (parameters.randomType as string) || 'string';
          const length = (parameters.randomLength as number) || 16;
          result = generateRandom(randomType, length);
          break;
        }

        default:
          result = null;
      }

      results.push({
        json: {
          ...item.json,
          [outputField]: result,
        },
        binary: item.binary,
      });
    }

    return { outputData: [results] };
  },
};
