import type { NodeTypeDefinition, INodeExecutionData } from '@kerdar/core';
import {
  NodeCategory,
  NodeInputType,
  NodeOutputType,
  PropertyType,
  CodeExecutionMode,
} from '@kerdar/core';

/**
 * Code Node
 * Execute custom JavaScript code
 */
export const CodeNode: NodeTypeDefinition = {
  type: 'code',
  version: 1,
  name: 'code',
  displayName: 'Code',
  description: 'Execute custom JavaScript code',
  icon: 'Code',
  iconColor: '#3B82F6',
  category: NodeCategory.Action,
  group: ['action', 'code', 'transform'],
  defaults: {
    name: 'Code',
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
      displayName: 'Output',
    },
  ],

  properties: [
    {
      name: 'mode',
      displayName: 'Mode',
      type: PropertyType.Options,
      default: CodeExecutionMode.RunOnceForAllItems,
      options: [
        {
          name: 'Run Once for All Items',
          value: CodeExecutionMode.RunOnceForAllItems,
          description: 'Execute code once with access to all items',
        },
        {
          name: 'Run Once for Each Item',
          value: CodeExecutionMode.RunOnceForEachItem,
          description: 'Execute code separately for each input item',
        },
      ],
    },
    {
      name: 'jsCode',
      displayName: 'JavaScript Code',
      type: PropertyType.Code,
      default: `// Add your code here
// For "Run Once for All Items":
//   - $input.all() returns all items
//   - Return an array of items
//
// For "Run Once for Each Item":
//   - $input.item returns the current item
//   - Return a single item

// Example: return items unchanged
return $input.all();`,
      typeOptions: {
        editor: 'codeNodeEditor',
        rows: 20,
      },
      description: 'JavaScript code to execute',
    },
    {
      name: 'notice',
      displayName: '',
      type: PropertyType.Notice,
      default: '',
      description:
        'Available variables: $input, $item (current item), $items (all items), $json, $env, $execution, $node',
    },
  ],

  async execute(context) {
    const mode = context.getNodeParameter<string>('mode', CodeExecutionMode.RunOnceForAllItems);
    const code = context.getNodeParameter<string>('jsCode', '');
    const items = context.getInputData();

    // Create sandbox environment
    const createSandbox = (currentItem?: INodeExecutionData, itemIndex?: number) => {
      return {
        $input: {
          all: () => items,
          first: () => items[0],
          last: () => items[items.length - 1],
          item: currentItem,
        },
        $item: currentItem,
        $items: items,
        $json: currentItem?.json ?? {},
        $env: {},
        $execution: {
          id: context.executionId,
          mode: context.mode,
        },
        $node: context.node,
        $itemIndex: itemIndex ?? 0,
        // Helpers
        console: {
          log: (...args: unknown[]) => context.logger.info(args.map(String).join(' ')),
          warn: (...args: unknown[]) => context.logger.warn(args.map(String).join(' ')),
          error: (...args: unknown[]) => context.logger.error(args.map(String).join(' ')),
        },
        JSON,
        Math,
        Date,
        Array,
        Object,
        String,
        Number,
        Boolean,
        parseInt,
        parseFloat,
        encodeURIComponent,
        decodeURIComponent,
      };
    };

    try {
      if (mode === CodeExecutionMode.RunOnceForAllItems) {
        // Execute once with all items
        const sandbox = createSandbox(items[0], 0);
        const fn = new Function(...Object.keys(sandbox), code);
        const result = fn(...Object.values(sandbox));

        // Process result
        let outputItems: INodeExecutionData[];
        if (Array.isArray(result)) {
          outputItems = result.map((item, index) => {
            if (typeof item === 'object' && item !== null && 'json' in item) {
              return item as INodeExecutionData;
            }
            return {
              json: typeof item === 'object' ? item : { data: item },
              pairedItem: { item: index },
            };
          });
        } else if (result && typeof result === 'object') {
          outputItems = [{
            json: 'json' in result ? (result as INodeExecutionData).json : result,
            pairedItem: { item: 0 },
          }];
        } else {
          outputItems = [{ json: { result }, pairedItem: { item: 0 } }];
        }

        return { outputData: [outputItems] };
      } else {
        // Execute for each item
        const outputItems: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
          const sandbox = createSandbox(items[i], i);
          const fn = new Function(...Object.keys(sandbox), code);
          const result = fn(...Object.values(sandbox));

          if (result && typeof result === 'object') {
            if ('json' in result) {
              outputItems.push({
                ...result as INodeExecutionData,
                pairedItem: { item: i },
              });
            } else {
              outputItems.push({
                json: result as Record<string, unknown>,
                pairedItem: { item: i },
              });
            }
          } else {
            outputItems.push({
              json: { result },
              pairedItem: { item: i },
            });
          }
        }

        return { outputData: [outputItems] };
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      context.logger.error(`Code execution error: ${errorMessage}`);
      throw new Error(`Code execution failed: ${errorMessage}`);
    }
  },
};

export default CodeNode;
