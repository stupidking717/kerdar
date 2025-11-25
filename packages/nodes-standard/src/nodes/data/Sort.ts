import type { NodeTypeDefinition, NodeExecutionContext } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
  SortOrder,
} from '@kerdar/core';

/**
 * Sort Node
 * Sorts items by field values
 */
export const SortNode: NodeTypeDefinition = {
  name: 'sort',
  displayName: 'Sort',
  description: 'Sort items by field values',
  type: 'sort',
  group: ['data'],
  category: NodeCategory.Data,
  version: 1,
  icon: 'arrow-up-down',
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
      name: 'sortFields',
      displayName: 'Sort Fields',
      type: PropertyType.FixedCollection,
      default: { fields: [] },
      description: 'Fields to sort by',
      typeOptions: {
        multipleValues: true,
      },
      values: [
        {
          name: 'fieldName',
          displayName: 'Field Name',
          type: PropertyType.String,
          default: '',
          required: true,
          placeholder: 'e.g., name or data.price',
          description: 'The field to sort by (use dot notation for nested fields)',
        },
        {
          name: 'order',
          displayName: 'Order',
          type: PropertyType.Options,
          default: SortOrder.Ascending,
          options: [
            { name: 'Ascending', value: SortOrder.Ascending },
            { name: 'Descending', value: SortOrder.Descending },
          ],
        },
      ],
    },
    {
      name: 'options',
      displayName: 'Options',
      type: PropertyType.Collection,
      default: {},
      values: [
        {
          name: 'caseSensitive',
          displayName: 'Case Sensitive',
          type: PropertyType.Boolean,
          default: true,
          description: 'Whether string comparisons should be case sensitive',
        },
        {
          name: 'treatAsNumber',
          displayName: 'Treat As Number',
          type: PropertyType.Boolean,
          default: false,
          description: 'Parse field values as numbers for comparison',
        },
      ],
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const items = [...(inputData[0] || [])];
    const sortFields = (parameters.sortFields as { fields?: Array<{
      fieldName: string;
      order: SortOrder;
    }> })?.fields || [];
    const caseSensitive = (parameters.options as { caseSensitive?: boolean })?.caseSensitive ?? true;
    const treatAsNumber = (parameters.options as { treatAsNumber?: boolean })?.treatAsNumber ?? false;

    // Helper to get nested value
    const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
      return path.split('.').reduce<unknown>((current, key) => {
        if (current && typeof current === 'object') {
          return (current as Record<string, unknown>)[key];
        }
        return undefined;
      }, obj);
    };

    // Sort items
    items.sort((a, b) => {
      for (const field of sortFields) {
        const aValue = getNestedValue(a.json, field.fieldName);
        const bValue = getNestedValue(b.json, field.fieldName);

        let comparison = 0;

        if (treatAsNumber) {
          const aNum = parseFloat(String(aValue ?? '0'));
          const bNum = parseFloat(String(bValue ?? '0'));
          comparison = aNum - bNum;
        } else {
          let aStr = String(aValue ?? '');
          let bStr = String(bValue ?? '');

          if (!caseSensitive) {
            aStr = aStr.toLowerCase();
            bStr = bStr.toLowerCase();
          }

          comparison = aStr.localeCompare(bStr);
        }

        if (comparison !== 0) {
          return field.order === SortOrder.Descending ? -comparison : comparison;
        }
      }
      return 0;
    });

    return { outputData: [items] };
  },
};
