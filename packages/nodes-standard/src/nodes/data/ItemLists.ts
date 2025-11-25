import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
  ItemListOperation,
  SortOrder,
} from '@kerdar/core';

/**
 * Item Lists Node
 * Perform operations on item lists (arrays)
 */
export const ItemListsNode: NodeTypeDefinition = {
  name: 'itemLists',
  displayName: 'Item Lists',
  description: 'Perform operations on item lists',
  type: 'item-lists',
  group: ['data'],
  category: NodeCategory.Data,
  version: 1,
  icon: 'list',
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
      default: ItemListOperation.RemoveDuplicates,
      description: 'The operation to perform',
      options: [
        { name: 'Remove Duplicates', value: ItemListOperation.RemoveDuplicates },
        { name: 'Sort', value: ItemListOperation.Sort },
        { name: 'Limit', value: ItemListOperation.Limit },
        { name: 'Split Into Batches', value: ItemListOperation.Split },
        { name: 'Concatenate Items', value: ItemListOperation.Concatenate },
        { name: 'Unique By Field', value: ItemListOperation.UniqueByField },
        { name: 'Flatten', value: ItemListOperation.Flatten },
        { name: 'Aggregate', value: ItemListOperation.Aggregate },
      ],
    },
    // Remove Duplicates options
    {
      name: 'compareFields',
      displayName: 'Compare Fields',
      type: PropertyType.String,
      default: '',
      placeholder: 'field1, field2',
      description: 'Comma-separated list of fields to compare (empty = all fields)',
      displayOptions: {
        show: {
          operation: [ItemListOperation.RemoveDuplicates, ItemListOperation.UniqueByField],
        },
      },
    },
    // Sort options
    {
      name: 'sortField',
      displayName: 'Sort Field',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'fieldName',
      description: 'The field to sort by',
      displayOptions: {
        show: {
          operation: [ItemListOperation.Sort],
        },
      },
    },
    {
      name: 'sortOrder',
      displayName: 'Sort Order',
      type: PropertyType.Options,
      default: SortOrder.Ascending,
      displayOptions: {
        show: {
          operation: [ItemListOperation.Sort],
        },
      },
      options: [
        { name: 'Ascending', value: SortOrder.Ascending },
        { name: 'Descending', value: SortOrder.Descending },
      ],
    },
    // Limit options
    {
      name: 'limit',
      displayName: 'Limit',
      type: PropertyType.Number,
      default: 10,
      displayOptions: {
        show: {
          operation: [ItemListOperation.Limit],
        },
      },
    },
    // Split options
    {
      name: 'batchSize',
      displayName: 'Batch Size',
      type: PropertyType.Number,
      default: 10,
      displayOptions: {
        show: {
          operation: [ItemListOperation.Split],
        },
      },
    },
    // Flatten options
    {
      name: 'flattenField',
      displayName: 'Field to Flatten',
      type: PropertyType.String,
      default: '',
      placeholder: 'arrayField',
      description: 'The array field to flatten',
      displayOptions: {
        show: {
          operation: [ItemListOperation.Flatten],
        },
      },
    },
    // Aggregate options
    {
      name: 'aggregateField',
      displayName: 'Aggregate Field',
      type: PropertyType.String,
      default: '',
      placeholder: 'fieldName',
      description: 'The field to aggregate',
      displayOptions: {
        show: {
          operation: [ItemListOperation.Aggregate],
        },
      },
    },
    {
      name: 'aggregateFunction',
      displayName: 'Aggregate Function',
      type: PropertyType.Options,
      default: 'sum',
      displayOptions: {
        show: {
          operation: [ItemListOperation.Aggregate],
        },
      },
      options: [
        { name: 'Sum', value: 'sum' },
        { name: 'Average', value: 'average' },
        { name: 'Count', value: 'count' },
        { name: 'Min', value: 'min' },
        { name: 'Max', value: 'max' },
      ],
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const items = inputData[0] || [];
    const operation = parameters.operation as ItemListOperation;

    const getFieldValue = (item: INodeExecutionData, field: string): unknown => {
      return field.split('.').reduce<unknown>((obj, key) => {
        if (obj && typeof obj === 'object') {
          return (obj as Record<string, unknown>)[key];
        }
        return undefined;
      }, item.json);
    };

    switch (operation) {
      case ItemListOperation.RemoveDuplicates: {
        const compareFieldsStr = parameters.compareFields as string;
        const compareFields = compareFieldsStr
          ? compareFieldsStr.split(',').map((f) => f.trim())
          : null;

        const seen = new Set<string>();
        const unique: INodeExecutionData[] = [];

        for (const item of items) {
          let key: string;
          if (compareFields) {
            key = compareFields.map((f) => JSON.stringify(getFieldValue(item, f))).join('|');
          } else {
            key = JSON.stringify(item.json);
          }

          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        }
        return { outputData: [unique] };
      }

      case ItemListOperation.Sort: {
        const sortField = parameters.sortField as string;
        const sortOrder = parameters.sortOrder as SortOrder;
        const sorted = [...items].sort((a, b) => {
          const aVal = getFieldValue(a, sortField);
          const bVal = getFieldValue(b, sortField);
          const comparison = String(aVal ?? '').localeCompare(String(bVal ?? ''));
          return sortOrder === SortOrder.Descending ? -comparison : comparison;
        });
        return { outputData: [sorted] };
      }

      case ItemListOperation.Limit: {
        const limit = (parameters.limit as number) || 10;
        return { outputData: [items.slice(0, limit)] };
      }

      case ItemListOperation.Split: {
        // Split returns items with batch information
        const batchSize = (parameters.batchSize as number) || 10;
        const batches: INodeExecutionData[] = [];
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          batches.push({
            json: {
              batch: batch.map((item) => item.json),
              batchIndex: Math.floor(i / batchSize),
              batchSize: batch.length,
              totalItems: items.length,
            },
          });
        }
        return { outputData: [batches] };
      }

      case ItemListOperation.Concatenate: {
        // Concatenate all items into a single item with an array
        return {
          outputData: [
            [
              {
                json: {
                  items: items.map((item) => item.json),
                  count: items.length,
                },
              },
            ],
          ],
        };
      }

      case ItemListOperation.UniqueByField: {
        const compareFieldsStr = parameters.compareFields as string;
        const compareFields = compareFieldsStr
          ? compareFieldsStr.split(',').map((f) => f.trim())
          : [];

        if (compareFields.length === 0) {
          return { outputData: [items] };
        }

        const seen = new Set<string>();
        const unique: INodeExecutionData[] = [];

        for (const item of items) {
          const key = compareFields.map((f) => JSON.stringify(getFieldValue(item, f))).join('|');
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        }
        return { outputData: [unique] };
      }

      case ItemListOperation.Flatten: {
        const flattenField = parameters.flattenField as string;
        const flattened: INodeExecutionData[] = [];

        for (const item of items) {
          const arrayValue = getFieldValue(item, flattenField);
          if (Array.isArray(arrayValue)) {
            for (const element of arrayValue) {
              flattened.push({
                json: typeof element === 'object' && element !== null
                  ? element as Record<string, unknown>
                  : { value: element },
              });
            }
          } else {
            flattened.push(item);
          }
        }
        return { outputData: [flattened] };
      }

      case ItemListOperation.Aggregate: {
        const aggregateField = parameters.aggregateField as string;
        const aggregateFunction = parameters.aggregateFunction as string;

        const values = items
          .map((item) => getFieldValue(item, aggregateField))
          .filter((v) => v !== undefined && v !== null)
          .map((v) => parseFloat(String(v)));

        let result: number;
        switch (aggregateFunction) {
          case 'sum':
            result = values.reduce((a, b) => a + b, 0);
            break;
          case 'average':
            result = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            break;
          case 'count':
            result = values.length;
            break;
          case 'min':
            result = values.length > 0 ? Math.min(...values) : 0;
            break;
          case 'max':
            result = values.length > 0 ? Math.max(...values) : 0;
            break;
          default:
            result = 0;
        }

        return {
          outputData: [
            [
              {
                json: {
                  [aggregateFunction]: result,
                  field: aggregateField,
                  itemCount: items.length,
                },
              },
            ],
          ],
        };
      }

      default:
        return { outputData: [items] };
    }
  },
};
