import type { NodeTypeDefinition, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  PropertyType,
  NodeInputType,
  NodeOutputType,
} from '@kerdar/core';

/**
 * Execute Command Node
 * Execute shell commands (simulated in frontend)
 */
export const ExecuteCommandNode: NodeTypeDefinition = {
  type: 'execute-command',
  name: 'executeCommand',
  displayName: 'Execute Command',
  description: 'Execute shell commands',
  category: NodeCategory.Action,
  group: ['action', 'command'],
  version: 1,
  icon: 'terminal',
  iconColor: '#10b981',

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
      name: 'command',
      displayName: 'Command',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'echo "Hello World"',
      description: 'The command to execute',
    },
    {
      name: 'executeOnce',
      displayName: 'Execute Once',
      type: PropertyType.Boolean,
      default: true,
      description: 'Execute the command only once, not for each input item',
    },
  ],

  async execute(context) {
    const items = context.getInputData();
    const command = context.getNodeParameter<string>('command', '');
    const executeOnce = context.getNodeParameter<boolean>('executeOnce', true);

    // In a frontend-only environment, we simulate command execution
    // In a real implementation, this would call a backend API
    const simulateCommand = (cmd: string): { stdout: string; stderr: string; exitCode: number } => {
      // Simulate some basic commands
      if (cmd.startsWith('echo ')) {
        const output = cmd.replace('echo ', '').replace(/^["']|["']$/g, '');
        return { stdout: output, stderr: '', exitCode: 0 };
      }

      if (cmd === 'date') {
        return { stdout: new Date().toISOString(), stderr: '', exitCode: 0 };
      }

      if (cmd === 'pwd') {
        return { stdout: '/simulated/working/directory', stderr: '', exitCode: 0 };
      }

      // For other commands, return a simulated response
      return {
        stdout: `Simulated output for command: ${cmd}`,
        stderr: '',
        exitCode: 0,
      };
    };

    const results: INodeExecutionData[] = [];

    if (executeOnce) {
      const result = simulateCommand(command);
      results.push({
        json: {
          command,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          executed: true,
          note: 'Command execution is simulated in frontend-only mode',
        },
      });
    } else {
      for (const item of items) {
        // Could use item data to parameterize command
        const result = simulateCommand(command);
        results.push({
          json: {
            ...item.json,
            command,
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
            executed: true,
            note: 'Command execution is simulated in frontend-only mode',
          },
        });
      }
    }

    return { outputData: [results] };
  },
};
