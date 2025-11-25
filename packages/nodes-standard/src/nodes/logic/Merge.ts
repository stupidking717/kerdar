import type { NodeTypeDefinition, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  NodeInputType,
  NodeOutputType,
  PropertyType,
  MergeMode,
} from '@kerdar/core';

/**
 * Merge Node
 * Combine data from multiple inputs
 */
export const MergeNode: NodeTypeDefinition = {
  type: 'merge',
  version: 1,
  name: 'merge',
  displayName: 'Merge',
  description: 'Merge data from multiple branches',
  icon: 'Merge',
  iconColor: '#F59E0B',
  category: NodeCategory.Logic,
  group: ['logic', 'merge', 'combine'],
  defaults: {
    name: 'Merge',
  },
  subtitle: (node) => {
    const mode = node.parameters.mode as string || 'append';
    return `Mode: ${mode}`;
  },

  inputs: [
    {
      type: NodeInputType.Main,
      displayName: 'Input 1',
    },
    {
      type: NodeInputType.Main,
      displayName: 'Input 2',
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
      name: 'mode',
      displayName: 'Mode',
      type: PropertyType.Options,
      default: MergeMode.Append,
      options: [
        {
          name: 'Append',
          value: MergeMode.Append,
          description: 'Append all items from both inputs',
        },
        {
          name: 'Combine by Index',
          value: MergeMode.CombineByIndex,
          description: 'Merge items by their index position',
        },
        {
          name: 'Combine by Field',
          value: MergeMode.CombineByField,
          description: 'Merge items by matching field values',
        },
        {
          name: 'Keep Input 1',
          value: MergeMode.KeepInput1,
          description: 'Only output items from Input 1',
        },
        {
          name: 'Keep Input 2',
          value: MergeMode.KeepInput2,
          description: 'Only output items from Input 2',
        },
        {
          name: 'Wait for Both',
          value: MergeMode.Wait,
          description: 'Wait for both inputs before outputting',
        },
      ],
    },
    {
      name: 'joinField1',
      displayName: 'Input 1 Field',
      type: PropertyType.String,
      default: 'id',
      placeholder: 'id',
      displayOptions: {
        show: {
          mode: [MergeMode.CombineByField],
        },
      },
      description: 'Field name to match in Input 1',
    },
    {
      name: 'joinField2',
      displayName: 'Input 2 Field',
      type: PropertyType.String,
      default: 'id',
      placeholder: 'id',
      displayOptions: {
        show: {
          mode: [MergeMode.CombineByField],
        },
      },
      description: 'Field name to match in Input 2',
    },
    {
      name: 'outputConflicts',
      displayName: 'Handle Conflicts',
      type: PropertyType.Options,
      default: 'preferInput2',
      options: [
        { name: 'Prefer Input 1', value: 'preferInput1' },
        { name: 'Prefer Input 2', value: 'preferInput2' },
        { name: 'Keep Both (separate fields)', value: 'keepBoth' },
      ],
      displayOptions: {
        show: {
          mode: [MergeMode.CombineByIndex, MergeMode.CombineByField],
        },
      },
    },
  ],

  async execute(context) {
    const mode = context.getNodeParameter<string>('mode', MergeMode.Append);
    const input1 = context.getInputData(0);
    const input2 = context.getInputData(1);

    let outputItems: INodeExecutionData[] = [];

    switch (mode) {
      case MergeMode.Append:
        outputItems = [
          ...input1.map((item, i) => ({ ...item, pairedItem: { item: i, input: 0 } })),
          ...input2.map((item, i) => ({ ...item, pairedItem: { item: i, input: 1 } })),
        ];
        break;

      case MergeMode.CombineByIndex: {
        const conflictMode = context.getNodeParameter<string>('outputConflicts', 'preferInput2');
        const maxLength = Math.max(input1.length, input2.length);

        for (let i = 0; i < maxLength; i++) {
          const item1 = input1[i];
          const item2 = input2[i];

          if (item1 && item2) {
            let mergedJson: Record<string, unknown>;
            if (conflictMode === 'preferInput1') {
              mergedJson = { ...item2.json, ...item1.json };
            } else if (conflictMode === 'preferInput2') {
              mergedJson = { ...item1.json, ...item2.json };
            } else {
              mergedJson = {
                input1: item1.json,
                input2: item2.json,
              };
            }
            outputItems.push({ json: mergedJson, pairedItem: { item: i } });
          } else if (item1) {
            outputItems.push({ ...item1, pairedItem: { item: i, input: 0 } });
          } else if (item2) {
            outputItems.push({ ...item2, pairedItem: { item: i, input: 1 } });
          }
        }
        break;
      }

      case MergeMode.CombineByField: {
        const joinField1 = context.getNodeParameter<string>('joinField1', 'id');
        const joinField2 = context.getNodeParameter<string>('joinField2', 'id');
        const conflictMode = context.getNodeParameter<string>('outputConflicts', 'preferInput2');

        // Create lookup map from input2
        const input2Map = new Map<string, INodeExecutionData>();
        input2.forEach((item) => {
          const key = String(item.json[joinField2] ?? '');
          if (key) {
            input2Map.set(key, item);
          }
        });

        // Merge based on field match
        const matchedKeys = new Set<string>();
        for (let i = 0; i < input1.length; i++) {
          const item1 = input1[i];
          const key = String(item1.json[joinField1] ?? '');
          const item2 = input2Map.get(key);

          if (item2) {
            matchedKeys.add(key);
            let mergedJson: Record<string, unknown>;
            if (conflictMode === 'preferInput1') {
              mergedJson = { ...item2.json, ...item1.json };
            } else if (conflictMode === 'preferInput2') {
              mergedJson = { ...item1.json, ...item2.json };
            } else {
              mergedJson = { input1: item1.json, input2: item2.json };
            }
            outputItems.push({ json: mergedJson, pairedItem: { item: i } });
          } else {
            outputItems.push({ ...item1, pairedItem: { item: i, input: 0 } });
          }
        }

        // Add unmatched items from input2
        input2.forEach((item, i) => {
          const key = String(item.json[joinField2] ?? '');
          if (!matchedKeys.has(key)) {
            outputItems.push({ ...item, pairedItem: { item: i, input: 1 } });
          }
        });
        break;
      }

      case MergeMode.KeepInput1:
        outputItems = input1.map((item, i) => ({ ...item, pairedItem: { item: i, input: 0 } }));
        break;

      case MergeMode.KeepInput2:
        outputItems = input2.map((item, i) => ({ ...item, pairedItem: { item: i, input: 1 } }));
        break;

      case MergeMode.Wait:
        // Wait mode just passes through both inputs combined
        outputItems = [
          ...input1.map((item, i) => ({ ...item, pairedItem: { item: i, input: 0 } })),
          ...input2.map((item, i) => ({ ...item, pairedItem: { item: i, input: 1 } })),
        ];
        break;
    }

    return {
      outputData: [outputItems],
    };
  },
};

export default MergeNode;
