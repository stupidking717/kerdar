import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
  ComparisonOperation,
} from '@kerdar/core';

/**
 * Switch Node
 * Routes data to different outputs based on conditions
 */
export const SwitchNode: NodeTypeDefinition = {
  name: 'switch',
  displayName: 'Switch',
  description: 'Route data based on conditions to different outputs',
  type: 'switch',
  group: ['logic'],
  category: NodeCategory.Logic,
  version: 1,
  icon: 'git-branch',
  iconColor: '#f59e0b',

  inputs: [
    {
      type: NodeInputType.Main,
      displayName: 'Input',
    },
  ],
  outputs: [
    {
      type: NodeOutputType.Main,
      displayName: 'Output 0',
    },
    {
      type: NodeOutputType.Main,
      displayName: 'Output 1',
    },
    {
      type: NodeOutputType.Main,
      displayName: 'Output 2',
    },
    {
      type: NodeOutputType.Main,
      displayName: 'Output 3',
    },
  ],

  properties: [
    {
      name: 'mode',
      displayName: 'Mode',
      type: PropertyType.Options,
      default: 'rules',
      description: 'How to determine the output',
      options: [
        {
          name: 'Rules',
          value: 'rules',
          description: 'Match against defined rules',
        },
        {
          name: 'Expression',
          value: 'expression',
          description: 'Use an expression to determine output index',
        },
      ],
    },
    {
      name: 'dataType',
      displayName: 'Data Type',
      type: PropertyType.Options,
      default: 'string',
      description: 'The data type of the value to compare',
      displayOptions: {
        show: {
          mode: ['rules'],
        },
      },
      options: [
        { name: 'String', value: 'string' },
        { name: 'Number', value: 'number' },
        { name: 'Boolean', value: 'boolean' },
      ],
    },
    {
      name: 'value1',
      displayName: 'Value to Compare',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: '={{ $json.status }}',
      description: 'The value to compare against rules',
      displayOptions: {
        show: {
          mode: ['rules'],
        },
      },
    },
    {
      name: 'rules',
      displayName: 'Routing Rules',
      type: PropertyType.FixedCollection,
      default: { rules: [] },
      description: 'The routing rules',
      displayOptions: {
        show: {
          mode: ['rules'],
        },
      },
      typeOptions: {
        multipleValues: true,
      },
      values: [
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
            { name: 'Regex', value: ComparisonOperation.Regex },
            { name: 'Greater Than', value: ComparisonOperation.GreaterThan },
            { name: 'Less Than', value: ComparisonOperation.LessThan },
          ],
        },
        {
          name: 'value2',
          displayName: 'Value',
          type: PropertyType.String,
          default: '',
          description: 'The value to compare with',
        },
        {
          name: 'output',
          displayName: 'Output',
          type: PropertyType.Number,
          default: 0,
          description: 'The output index (0-based)',
        },
      ],
    },
    {
      name: 'fallbackOutput',
      displayName: 'Fallback Output',
      type: PropertyType.Options,
      default: 'none',
      description: 'What to do when no rules match',
      displayOptions: {
        show: {
          mode: ['rules'],
        },
      },
      options: [
        { name: 'None', value: 'none' },
        { name: 'Output 0', value: '0' },
        { name: 'Output 1', value: '1' },
        { name: 'Output 2', value: '2' },
        { name: 'Output 3', value: '3' },
      ],
    },
    {
      name: 'outputIndex',
      displayName: 'Output Index',
      type: PropertyType.String,
      default: '0',
      required: true,
      placeholder: '={{ $json.outputIndex }}',
      description: 'Expression that returns the output index (0-based)',
      displayOptions: {
        show: {
          mode: ['expression'],
        },
      },
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const items = inputData[0] || [];
    const mode = parameters.mode as string;

    // Initialize outputs (4 outputs)
    const outputs: INodeExecutionData[][] = [[], [], [], []];

    for (const item of items) {
      let outputIndex = -1;

      if (mode === 'expression') {
        const indexStr = String(parameters.outputIndex || '0');
        outputIndex = parseInt(indexStr, 10);
        if (isNaN(outputIndex)) outputIndex = 0;
      } else {
        // Rules mode
        const value1 = String(parameters.value1 || '');
        const rules = (parameters.rules as { rules?: Array<{
          operation: ComparisonOperation;
          value2: string;
          output: number;
        }> })?.rules || [];

        for (const rule of rules) {
          const value2 = String(rule.value2 || '');
          let matches = false;

          switch (rule.operation) {
            case ComparisonOperation.Equals:
              matches = value1 === value2;
              break;
            case ComparisonOperation.NotEquals:
              matches = value1 !== value2;
              break;
            case ComparisonOperation.Contains:
              matches = value1.includes(value2);
              break;
            case ComparisonOperation.NotContains:
              matches = !value1.includes(value2);
              break;
            case ComparisonOperation.StartsWith:
              matches = value1.startsWith(value2);
              break;
            case ComparisonOperation.EndsWith:
              matches = value1.endsWith(value2);
              break;
            case ComparisonOperation.Regex:
              try {
                matches = new RegExp(value2).test(value1);
              } catch {
                matches = false;
              }
              break;
            case ComparisonOperation.GreaterThan:
              matches = parseFloat(value1) > parseFloat(value2);
              break;
            case ComparisonOperation.LessThan:
              matches = parseFloat(value1) < parseFloat(value2);
              break;
          }

          if (matches) {
            outputIndex = rule.output;
            break;
          }
        }

        // Handle fallback
        if (outputIndex === -1) {
          const fallback = parameters.fallbackOutput as string;
          if (fallback !== 'none') {
            outputIndex = parseInt(fallback, 10);
          }
        }
      }

      // Add item to appropriate output
      if (outputIndex >= 0 && outputIndex < 4) {
        outputs[outputIndex].push(item);
      }
    }

    return { outputData: outputs };
  },
};
