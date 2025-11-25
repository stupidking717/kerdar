import type { NodeTypeDefinition, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  NodeInputType,
  NodeOutputType,
  PropertyType,
  ComparisonOperation,
  CombineConditionMode,
} from '@kerdar/core';

/**
 * IF Node
 * Conditional branching based on conditions
 */
export const IfNode: NodeTypeDefinition = {
  type: 'if',
  version: 1,
  name: 'if',
  displayName: 'IF',
  description: 'Route items based on conditions',
  icon: 'GitBranch',
  iconColor: '#F59E0B',
  category: NodeCategory.Logic,
  group: ['logic', 'condition', 'branch'],
  defaults: {
    name: 'IF',
  },
  subtitle: (node) => {
    const combineMode = node.parameters.combineConditions as string || 'and';
    return `Combine: ${combineMode.toUpperCase()}`;
  },

  inputs: [
    {
      type: NodeInputType.Main,
      displayName: 'Input',
    },
  ],
  outputs: [
    {
      type: NodeOutputType.Main,
      displayName: 'True',
    },
    {
      type: NodeOutputType.Main,
      displayName: 'False',
    },
  ],

  properties: [
    {
      name: 'conditions',
      displayName: 'Conditions',
      type: PropertyType.FixedCollection,
      default: {
        conditions: [
          {
            value1: '',
            operation: ComparisonOperation.Equals,
            value2: '',
          },
        ],
      },
      typeOptions: {
        multipleValues: true,
        multipleValueButtonText: 'Add Condition',
      },
      values: [
        {
          name: 'value1',
          displayName: 'Value 1',
          type: PropertyType.String,
          default: '',
          placeholder: '={{ $json.field }}',
          description: 'First value to compare',
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
          placeholder: 'Value to compare',
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
      options: [
        { name: 'AND (all must match)', value: CombineConditionMode.And },
        { name: 'OR (any can match)', value: CombineConditionMode.Or },
      ],
    },
  ],

  async execute(context) {
    const items = context.getInputData();
    const combineMode = context.getNodeParameter<string>('combineConditions', CombineConditionMode.And);
    const conditionsConfig = context.getNodeParameter<{
      conditions: Array<{
        value1: unknown;
        operation: ComparisonOperation;
        value2: unknown;
      }>;
    }>('conditions', { conditions: [] });

    const trueItems: INodeExecutionData[] = [];
    const falseItems: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const conditions = conditionsConfig.conditions || [];
      const results: boolean[] = [];

      for (const condition of conditions) {
        const { value1, operation, value2 } = condition;
        const result = evaluateCondition(value1, operation, value2);
        results.push(result);
      }

      // Combine results
      let finalResult: boolean;
      if (combineMode === CombineConditionMode.And) {
        finalResult = results.every((r) => r);
      } else {
        finalResult = results.some((r) => r);
      }

      if (finalResult) {
        trueItems.push({ ...items[i], pairedItem: { item: i } });
      } else {
        falseItems.push({ ...items[i], pairedItem: { item: i } });
      }
    }

    return {
      outputData: [trueItems, falseItems],
    };
  },
};

/**
 * Evaluate a single condition
 */
function evaluateCondition(
  value1: unknown,
  operation: ComparisonOperation,
  value2: unknown
): boolean {
  const v1 = String(value1 ?? '');
  const v2 = String(value2 ?? '');
  const n1 = Number(value1);
  const n2 = Number(value2);

  switch (operation) {
    case ComparisonOperation.Equals:
      return v1 === v2;

    case ComparisonOperation.NotEquals:
      return v1 !== v2;

    case ComparisonOperation.Contains:
      return v1.includes(v2);

    case ComparisonOperation.NotContains:
      return !v1.includes(v2);

    case ComparisonOperation.StartsWith:
      return v1.startsWith(v2);

    case ComparisonOperation.EndsWith:
      return v1.endsWith(v2);

    case ComparisonOperation.Regex:
      try {
        return new RegExp(v2).test(v1);
      } catch {
        return false;
      }

    case ComparisonOperation.IsEmpty:
      return !value1 || v1.trim() === '';

    case ComparisonOperation.IsNotEmpty:
      return !!value1 && v1.trim() !== '';

    case ComparisonOperation.GreaterThan:
      return !isNaN(n1) && !isNaN(n2) && n1 > n2;

    case ComparisonOperation.GreaterThanOrEqual:
      return !isNaN(n1) && !isNaN(n2) && n1 >= n2;

    case ComparisonOperation.LessThan:
      return !isNaN(n1) && !isNaN(n2) && n1 < n2;

    case ComparisonOperation.LessThanOrEqual:
      return !isNaN(n1) && !isNaN(n2) && n1 <= n2;

    case ComparisonOperation.IsTrue:
      return value1 === true || v1.toLowerCase() === 'true' || v1 === '1';

    case ComparisonOperation.IsFalse:
      return value1 === false || v1.toLowerCase() === 'false' || v1 === '0' || !value1;

    default:
      return false;
  }
}

export default IfNode;
