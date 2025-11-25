import type { NodeTypeDefinition } from '@kerdar/core';
import { NodeCategory, NodeOutputType, PropertyType, ScheduleInterval } from '@kerdar/core';

/**
 * Schedule Trigger Node
 * Triggers workflow on a schedule
 */
export const ScheduleTriggerNode: NodeTypeDefinition = {
  type: 'schedule-trigger',
  version: 1,
  name: 'scheduleTrigger',
  displayName: 'Schedule Trigger',
  description: 'Triggers the workflow on a schedule',
  icon: 'Clock',
  iconColor: '#8B5CF6',
  category: NodeCategory.Trigger,
  group: ['trigger', 'schedule'],
  defaults: {
    name: 'Schedule Trigger',
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
      name: 'rule',
      displayName: 'Trigger Rule',
      type: PropertyType.Options,
      default: 'interval',
      options: [
        { name: 'Interval', value: 'interval', description: 'Trigger at a fixed interval' },
        { name: 'Cron Expression', value: 'cron', description: 'Use a cron expression' },
      ],
    },
    {
      name: 'interval',
      displayName: 'Interval Value',
      type: PropertyType.Number,
      default: 1,
      typeOptions: {
        minValue: 1,
      },
      displayOptions: {
        show: {
          rule: ['interval'],
        },
      },
    },
    {
      name: 'intervalUnit',
      displayName: 'Interval Unit',
      type: PropertyType.Options,
      default: ScheduleInterval.Hours,
      options: [
        { name: 'Seconds', value: ScheduleInterval.Seconds },
        { name: 'Minutes', value: ScheduleInterval.Minutes },
        { name: 'Hours', value: ScheduleInterval.Hours },
        { name: 'Days', value: ScheduleInterval.Days },
        { name: 'Weeks', value: ScheduleInterval.Weeks },
      ],
      displayOptions: {
        show: {
          rule: ['interval'],
        },
      },
    },
    {
      name: 'cronExpression',
      displayName: 'Cron Expression',
      type: PropertyType.String,
      default: '0 * * * *',
      placeholder: '0 * * * *',
      description: 'Standard cron expression (minute hour day month weekday)',
      displayOptions: {
        show: {
          rule: ['cron'],
        },
      },
    },
    {
      name: 'timezone',
      displayName: 'Timezone',
      type: PropertyType.String,
      default: 'UTC',
      placeholder: 'UTC',
      description: 'Timezone for the schedule',
    },
  ],

  async execute(context) {
    const rule = context.getNodeParameter('rule', 'interval');
    const timezone = context.getNodeParameter('timezone', 'UTC');

    return {
      outputData: [[{
        json: {
          triggered: true,
          timestamp: new Date().toISOString(),
          rule,
          timezone,
        },
      }]],
    };
  },

  trigger: {
    async activate(context) {
      context.logger.info('Schedule trigger activated');
      // In a real implementation, this would set up the scheduler
    },
    async deactivate(context) {
      context.logger.info('Schedule trigger deactivated');
      // In a real implementation, this would tear down the scheduler
    },
  },
};

export default ScheduleTriggerNode;
