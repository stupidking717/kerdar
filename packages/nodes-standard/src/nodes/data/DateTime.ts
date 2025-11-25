import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Date Time Node
 * Parse, format, and manipulate dates and times
 */
export const DateTimeNode: NodeTypeDefinition = {
  name: 'dateTime',
  displayName: 'Date & Time',
  description: 'Parse, format, and manipulate dates and times',
  type: 'date-time',
  group: ['data'],
  category: NodeCategory.Data,
  version: 1,
  icon: 'calendar',
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
      default: 'format',
      description: 'The date/time operation to perform',
      options: [
        { name: 'Format Date', value: 'format' },
        { name: 'Add/Subtract', value: 'calculate' },
        { name: 'Get Current Time', value: 'now' },
        { name: 'Parse Date', value: 'parse' },
        { name: 'Extract Part', value: 'extract' },
        { name: 'Compare Dates', value: 'compare' },
      ],
    },
    // Input date (for most operations)
    {
      name: 'inputDate',
      displayName: 'Input Date',
      type: PropertyType.String,
      default: '',
      placeholder: '2024-01-15 or {{ $json.date }}',
      description: 'The date to operate on',
      displayOptions: {
        hide: {
          operation: ['now'],
        },
      },
    },
    // Format operation
    {
      name: 'outputFormat',
      displayName: 'Output Format',
      type: PropertyType.Options,
      default: 'iso',
      description: 'The format for the output date',
      displayOptions: {
        show: {
          operation: ['format', 'now'],
        },
      },
      options: [
        { name: 'ISO 8601', value: 'iso' },
        { name: 'Unix Timestamp (ms)', value: 'timestamp' },
        { name: 'Unix Timestamp (s)', value: 'timestampSeconds' },
        { name: 'YYYY-MM-DD', value: 'date' },
        { name: 'HH:mm:ss', value: 'time' },
        { name: 'YYYY-MM-DD HH:mm:ss', value: 'datetime' },
        { name: 'Custom', value: 'custom' },
      ],
    },
    {
      name: 'customFormat',
      displayName: 'Custom Format',
      type: PropertyType.String,
      default: '',
      placeholder: 'YYYY-MM-DD HH:mm',
      description: 'Custom format string',
      displayOptions: {
        show: {
          operation: ['format', 'now'],
          outputFormat: ['custom'],
        },
      },
    },
    // Calculate operation
    {
      name: 'calculateOperation',
      displayName: 'Calculate',
      type: PropertyType.Options,
      default: 'add',
      displayOptions: {
        show: {
          operation: ['calculate'],
        },
      },
      options: [
        { name: 'Add', value: 'add' },
        { name: 'Subtract', value: 'subtract' },
      ],
    },
    {
      name: 'calculateAmount',
      displayName: 'Amount',
      type: PropertyType.Number,
      default: 1,
      displayOptions: {
        show: {
          operation: ['calculate'],
        },
      },
    },
    {
      name: 'calculateUnit',
      displayName: 'Unit',
      type: PropertyType.Options,
      default: 'days',
      displayOptions: {
        show: {
          operation: ['calculate'],
        },
      },
      options: [
        { name: 'Years', value: 'years' },
        { name: 'Months', value: 'months' },
        { name: 'Weeks', value: 'weeks' },
        { name: 'Days', value: 'days' },
        { name: 'Hours', value: 'hours' },
        { name: 'Minutes', value: 'minutes' },
        { name: 'Seconds', value: 'seconds' },
      ],
    },
    // Extract operation
    {
      name: 'extractPart',
      displayName: 'Extract Part',
      type: PropertyType.Options,
      default: 'year',
      displayOptions: {
        show: {
          operation: ['extract'],
        },
      },
      options: [
        { name: 'Year', value: 'year' },
        { name: 'Month', value: 'month' },
        { name: 'Day', value: 'day' },
        { name: 'Day of Week', value: 'dayOfWeek' },
        { name: 'Hour', value: 'hour' },
        { name: 'Minute', value: 'minute' },
        { name: 'Second', value: 'second' },
        { name: 'Week Number', value: 'week' },
        { name: 'Quarter', value: 'quarter' },
      ],
    },
    // Compare operation
    {
      name: 'compareDate',
      displayName: 'Compare With',
      type: PropertyType.String,
      default: '',
      placeholder: '2024-01-20',
      description: 'The date to compare with',
      displayOptions: {
        show: {
          operation: ['compare'],
        },
      },
    },
    {
      name: 'outputField',
      displayName: 'Output Field',
      type: PropertyType.String,
      default: 'date',
      description: 'The field name for the result',
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const items = inputData[0] || [{ json: {} }];
    const operation = parameters.operation as string;
    const outputField = (parameters.outputField as string) || 'date';

    const formatDate = (date: Date, format: string): string => {
      const pad = (n: number): string => n.toString().padStart(2, '0');

      switch (format) {
        case 'iso':
          return date.toISOString();
        case 'timestamp':
          return date.getTime().toString();
        case 'timestampSeconds':
          return Math.floor(date.getTime() / 1000).toString();
        case 'date':
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        case 'time':
          return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        case 'datetime':
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        default:
          return date.toISOString();
      }
    };

    const results: INodeExecutionData[] = [];

    for (const item of items) {
      let result: unknown;

      switch (operation) {
        case 'now': {
          const format = parameters.outputFormat as string;
          result = formatDate(new Date(), format);
          break;
        }

        case 'format': {
          const inputDate = new Date(parameters.inputDate as string);
          const format = parameters.outputFormat as string;
          result = formatDate(inputDate, format);
          break;
        }

        case 'calculate': {
          const inputDate = new Date(parameters.inputDate as string);
          const calcOp = parameters.calculateOperation as string;
          const amount = (parameters.calculateAmount as number) || 0;
          const unit = parameters.calculateUnit as string;
          const multiplier = calcOp === 'subtract' ? -1 : 1;

          switch (unit) {
            case 'years':
              inputDate.setFullYear(inputDate.getFullYear() + amount * multiplier);
              break;
            case 'months':
              inputDate.setMonth(inputDate.getMonth() + amount * multiplier);
              break;
            case 'weeks':
              inputDate.setDate(inputDate.getDate() + amount * 7 * multiplier);
              break;
            case 'days':
              inputDate.setDate(inputDate.getDate() + amount * multiplier);
              break;
            case 'hours':
              inputDate.setHours(inputDate.getHours() + amount * multiplier);
              break;
            case 'minutes':
              inputDate.setMinutes(inputDate.getMinutes() + amount * multiplier);
              break;
            case 'seconds':
              inputDate.setSeconds(inputDate.getSeconds() + amount * multiplier);
              break;
          }

          result = inputDate.toISOString();
          break;
        }

        case 'parse': {
          const inputDate = new Date(parameters.inputDate as string);
          result = {
            iso: inputDate.toISOString(),
            timestamp: inputDate.getTime(),
            year: inputDate.getFullYear(),
            month: inputDate.getMonth() + 1,
            day: inputDate.getDate(),
            hour: inputDate.getHours(),
            minute: inputDate.getMinutes(),
            second: inputDate.getSeconds(),
            dayOfWeek: inputDate.getDay(),
            valid: !isNaN(inputDate.getTime()),
          };
          break;
        }

        case 'extract': {
          const inputDate = new Date(parameters.inputDate as string);
          const part = parameters.extractPart as string;

          switch (part) {
            case 'year':
              result = inputDate.getFullYear();
              break;
            case 'month':
              result = inputDate.getMonth() + 1;
              break;
            case 'day':
              result = inputDate.getDate();
              break;
            case 'dayOfWeek':
              result = inputDate.getDay();
              break;
            case 'hour':
              result = inputDate.getHours();
              break;
            case 'minute':
              result = inputDate.getMinutes();
              break;
            case 'second':
              result = inputDate.getSeconds();
              break;
            case 'week':
              const startOfYear = new Date(inputDate.getFullYear(), 0, 1);
              const days = Math.floor((inputDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
              result = Math.ceil((days + startOfYear.getDay() + 1) / 7);
              break;
            case 'quarter':
              result = Math.ceil((inputDate.getMonth() + 1) / 3);
              break;
            default:
              result = null;
          }
          break;
        }

        case 'compare': {
          const date1 = new Date(parameters.inputDate as string);
          const date2 = new Date(parameters.compareDate as string);
          const diff = date1.getTime() - date2.getTime();

          result = {
            isBefore: diff < 0,
            isAfter: diff > 0,
            isEqual: diff === 0,
            differenceMs: Math.abs(diff),
            differenceSeconds: Math.abs(diff) / 1000,
            differenceMinutes: Math.abs(diff) / (1000 * 60),
            differenceHours: Math.abs(diff) / (1000 * 60 * 60),
            differenceDays: Math.abs(diff) / (1000 * 60 * 60 * 24),
          };
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
