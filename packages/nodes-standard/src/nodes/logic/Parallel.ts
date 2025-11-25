import type { NodeTypeDefinition, NodeExecutionContext, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Parallel Node
 * Splits execution into parallel branches
 */
export const ParallelNode: NodeTypeDefinition = {
  name: 'parallel',
  displayName: 'Parallel',
  description: 'Split workflow into parallel branches that execute concurrently',
  type: 'parallel',
  group: ['logic'],
  category: NodeCategory.Logic,
  version: 1,
  icon: 'git-fork',
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
      displayName: 'Branch 1',
    },
    {
      type: NodeOutputType.Main,
      displayName: 'Branch 2',
    },
    {
      type: NodeOutputType.Main,
      displayName: 'Branch 3',
    },
  ],

  properties: [
    {
      name: 'mode',
      displayName: 'Mode',
      type: PropertyType.Options,
      default: 'duplicate',
      description: 'How to distribute data to branches',
      options: [
        {
          name: 'Duplicate to All',
          value: 'duplicate',
          description: 'Send all items to all branches',
        },
        {
          name: 'Round Robin',
          value: 'roundRobin',
          description: 'Distribute items across branches evenly',
        },
        {
          name: 'By Expression',
          value: 'expression',
          description: 'Use an expression to determine the branch',
        },
      ],
    },
    {
      name: 'branchExpression',
      displayName: 'Branch Expression',
      type: PropertyType.String,
      default: '0',
      placeholder: '={{ $json.branchIndex }}',
      description: 'Expression that returns the branch index (0-based)',
      displayOptions: {
        show: {
          mode: ['expression'],
        },
      },
    },
    {
      name: 'options',
      displayName: 'Options',
      type: PropertyType.Collection,
      default: {},
      values: [
        {
          name: 'addBranchInfo',
          displayName: 'Add Branch Info',
          type: PropertyType.Boolean,
          default: true,
          description: 'Add branch information to each item',
        },
      ],
    },
  ],

  execute: async (context: NodeExecutionContext) => {
    const { inputData, parameters } = context;
    const items = inputData[0] || [];
    const mode = parameters.mode as string;
    const addBranchInfo = (parameters.options as { addBranchInfo?: boolean })?.addBranchInfo ?? true;

    // Initialize 3 output branches
    const branches: INodeExecutionData[][] = [[], [], []];

    const addToBranch = (item: INodeExecutionData, branchIndex: number) => {
      const targetBranch = Math.max(0, Math.min(branchIndex, 2));
      const outputItem = addBranchInfo
        ? {
            json: {
              ...item.json,
              _parallelBranch: targetBranch,
              _parallelMode: mode,
            },
            binary: item.binary,
          }
        : item;
      branches[targetBranch].push(outputItem);
    };

    switch (mode) {
      case 'duplicate':
        // Send all items to all branches
        for (const item of items) {
          for (let i = 0; i < 3; i++) {
            addToBranch(item, i);
          }
        }
        break;

      case 'roundRobin':
        // Distribute items evenly across branches
        items.forEach((item, index) => {
          addToBranch(item, index % 3);
        });
        break;

      case 'expression':
        // Use expression to determine branch
        const branchExpression = parameters.branchExpression as string;
        for (const item of items) {
          // In a real implementation, this would evaluate the expression
          // For simulation, we parse a simple number
          const branchIndex = parseInt(branchExpression, 10) || 0;
          addToBranch(item, branchIndex);
        }
        break;

      default:
        // Default: duplicate to all
        for (const item of items) {
          for (let i = 0; i < 3; i++) {
            addToBranch(item, i);
          }
        }
    }

    return { outputData: branches };
  },
};
