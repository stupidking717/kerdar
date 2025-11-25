import type { NodeTypeDefinition } from '@kerdar/core';
import { NodeCategory, NodeOutputType, PropertyType } from '@kerdar/core';

/**
 * Manual Trigger Node
 * Simple start node for manual workflow execution
 */
export const ManualTriggerNode: NodeTypeDefinition = {
  type: 'manual-trigger',
  version: 1,
  name: 'manualTrigger',
  displayName: 'Manual Trigger',
  description: 'Start the workflow manually',
  icon: 'PlayCircle',
  iconColor: '#8B5CF6',
  category: NodeCategory.Trigger,
  group: ['trigger'],
  defaults: {
    name: 'Manual Trigger',
  },

  inputs: [],
  outputs: [
    {
      type: NodeOutputType.Main,
      displayName: 'Output',
    },
  ],

  properties: [
    {
      name: 'notice',
      displayName: '',
      type: PropertyType.Notice,
      default: '',
      description:
        'This node will trigger when you click the "Execute Workflow" button. Use it to manually start your workflow.',
    },
  ],

  async execute(_context) {
    // Manual trigger outputs empty data to start the workflow
    return {
      outputData: [[{ json: { triggered: true, timestamp: new Date().toISOString() } }]],
    };
  },
};

export default ManualTriggerNode;
