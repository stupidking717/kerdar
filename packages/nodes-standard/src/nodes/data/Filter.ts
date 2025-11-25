import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
  ComparisonOperation,
  CombineConditionMode,
} from '@kerdar/core';

/**
 * Filter Node
 * Filters items based on conditions
 */
export const FilterNode: NodeTypeDefinition = {
  name: 'filter',
  displayName: 'Filter',
  description: 'Filter items based on conditions',
  type: 'filter',
  group: ['data'],
  category: NodeCategory.Data,
  version: 1,
  icon: 'filter',
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
      displayName: 'Kept',
    },
    {
      type: NodeOutputType.Main,
      displayName: 'Discarded',
    },
  ],

  properties: [
    {
      name: 'conditions',
      displayName: 'Conditions',
      type: PropertyType.FixedCollection,
      default: { conditions: [] },
      description: 'The filter conditions',
      typeOptions: {
        multipleValues: true,
      },
      values: [
        {
          name: 'value1',
          displayName: 'Value 1',
          type: PropertyType.String,
          default: '',
          placeholder: '={{ $json.field }}',
          description: 'The value to compare',
        },
        {
          name: 'operation',
          displayName: 'Operation',
          type: PropertyType.Options,
          default: ComparisonOperation.Equals,
          options: [
            { name: 'Equals', value: ComparisonOperation.Equals },
            { name: 'Not Equals', value: ComparisonOperation.NotEquals },
            { name: 'Contains', value: ComparisonOperation.Contains },
            { name: 'Not Contains', value: ComparisonOperation.NotContains },
            { name: 'Starts With', value: ComparisonOperation.StartsWith },
            { name: 'Ends With', value: ComparisonOperation.EndsWith },
            { name: 'Regex Match', value: ComparisonOperation.Regex },
            { name: 'Is Empty', value: ComparisonOperation.IsEmpty },
            { name: 'Is Not Empty', value: ComparisonOperation.IsNotEmpty },
            { name: 'Greater Than', value: ComparisonOperation.GreaterThan },
            { name: 'Greater Than or Equal', value: ComparisonOperation.GreaterThanOrEqual },
            { name: 'Less Than', value: ComparisonOperation.LessThan },
            { name: 'Less Than or Equal', value: ComparisonOperation.LessThanOrEqual },
            { name: 'Is True', value: ComparisonOperation.IsTrue },
            { name: 'Is False', value: ComparisonOperation.IsFalse },
          ],
        },
        {
          name: 'value2',
          displayName: 'Value 2',
          type: PropertyType.String,
          default: '',
          placeholder: 'Value to compare with',
          description: 'The value to compare against',
          displayOptions: {
            hide: {
              operation: [
                ComparisonOperation.IsEmpty,
                ComparisonOperation.IsNotEmpty,
                ComparisonOperation.IsTrue,
                ComparisonOperation.IsFalse,
              ],
            },
          },
        },
      ],
    },
    {
      name: 'combineConditions',
      displayName: 'Combine Conditions',
      type: PropertyType.Options,
      default: CombineConditionMode.And,
      description: 'How to combine multiple conditions',
      options: [
        {
          name: 'AND',
          value: CombineConditionMode.And,
          description: 'All conditions must be true',
        },
        {
          name: 'OR',
          value: CombineConditionMode.Or,
          description: 'Any condition can be true',
        },
      ],
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const items = inputData[0] || [];
    const conditions = (parameters.conditions as { conditions?: Array<{
      value1: string;
      operation: ComparisonOperation;
      value2: string;
    }> })?.conditions || [];
    const combineMode = parameters.combineConditions as CombineConditionMode;

    const kept: INodeExecutionData[] = [];
    const discarded: INodeExecutionData[] = [];

    const evaluateCondition = (
      value1: unknown,
      operation: ComparisonOperation,
      value2: unknown
    ): boolean => {
      const str1 = String(value1 ?? '');
      const str2 = String(value2 ?? '');

      switch (operation) {
        case ComparisonOperation.Equals:
          return str1 === str2;
        case ComparisonOperation.NotEquals:
          return str1 !== str2;
        case ComparisonOperation.Contains:
          return str1.includes(str2);
        case ComparisonOperation.NotContains:
          return !str1.includes(str2);
        case ComparisonOperation.StartsWith:
          return str1.startsWith(str2);
        case ComparisonOperation.EndsWith:
          return str1.endsWith(str2);
        case ComparisonOperation.Regex:
          try {
            return new RegExp(str2).test(str1);
          } catch {
            return false;
          }
        case ComparisonOperation.IsEmpty:
          return str1 === '' || value1 === null || value1 === undefined;
        case ComparisonOperation.IsNotEmpty:
          return str1 !== '' && value1 !== null && value1 !== undefined;
        case ComparisonOperation.GreaterThan:
          return parseFloat(str1) > parseFloat(str2);
        case ComparisonOperation.GreaterThanOrEqual:
          return parseFloat(str1) >= parseFloat(str2);
        case ComparisonOperation.LessThan:
          return parseFloat(str1) < parseFloat(str2);
        case ComparisonOperation.LessThanOrEqual:
          return parseFloat(str1) <= parseFloat(str2);
        case ComparisonOperation.IsTrue:
          return value1 === true || str1.toLowerCase() === 'true' || str1 === '1';
        case ComparisonOperation.IsFalse:
          return value1 === false || str1.toLowerCase() === 'false' || str1 === '0';
        default:
          return false;
      }
    };

    for (const item of items) {
      const results = conditions.map((condition) =>
        evaluateCondition(condition.value1, condition.operation, condition.value2)
      );

      let passes: boolean;
      if (conditions.length === 0) {
        passes = true; // No conditions = keep all
      } else if (combineMode === CombineConditionMode.And) {
        passes = results.every((r) => r);
      } else {
        passes = results.some((r) => r);
      }

      if (passes) {
        kept.push(item);
      } else {
        discarded.push(item);
      }
    }

    return { outputData: [kept, discarded] };
  },
};
