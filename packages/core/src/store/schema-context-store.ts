/**
 * Schema Context Store
 *
 * Provides schema context tracking for workflow nodes, enabling:
 * - Expression editor autocomplete based on upstream node outputs
 * - Type information for data flowing through connections
 * - Workflow simulation with proper data typing
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  WorkflowNode,
  WorkflowEdge,
  NodeTypeDefinition,
  DataSchema,
  SchemaContext,
  ResolvedSchema,
  SchemaSuggestion,
} from '../types';
import {
  resolveSchema,
  mergeSchemas,
  schemaToSuggestions,
  generateMockData,
} from '../types';
import { useWorkflowStore } from './workflow-store';
import { useNodeRegistryStore } from './node-registry-store';

/**
 * Schema context store state
 */
interface SchemaContextState {
  /** Cached schema contexts by node ID */
  contextCache: Map<string, SchemaContext>;

  /** Cache invalidation version - increments when workflow changes */
  cacheVersion: number;
}

/**
 * Schema context store actions
 */
interface SchemaContextActions {
  /** Get schema context for a node */
  getSchemaContext: (nodeId: string) => SchemaContext;

  /** Get autocomplete suggestions for a node */
  getSuggestions: (nodeId: string) => SchemaSuggestion[];

  /** Get mock data for simulation at a node */
  getMockData: (nodeId: string) => Record<string, unknown>;

  /** Invalidate cache (called when workflow changes) */
  invalidateCache: () => void;

  /** Clear all cached contexts */
  clearCache: () => void;
}

/**
 * Build schema context for a specific node
 * This traverses the workflow graph backwards to collect all available schemas
 */
function buildSchemaContext(
  nodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  getNodeType: (type: string) => NodeTypeDefinition | undefined
): SchemaContext {
  const inputSchemas: ResolvedSchema[] = [];
  const accessibleSchemas: Record<string, ResolvedSchema> = {};
  const visited = new Set<string>();

  // Helper to get incoming edges for a node
  const getIncomingEdges = (nId: string): WorkflowEdge[] => {
    return edges.filter((e) => e.target === nId);
  };

  // Helper to get a node by ID
  const getNode = (nId: string): WorkflowNode | undefined => {
    return nodes.find((n) => n.id === nId);
  };

  // Helper to resolve output schema for a node
  const resolveNodeOutputSchema = (node: WorkflowNode): DataSchema | null => {
    const nodeType = getNodeType(node.type);
    if (!nodeType?.outputSchema) return null;

    return resolveSchema(nodeType.outputSchema, node.parameters, node);
  };

  // BFS traversal to collect all upstream schemas
  const queue: Array<{ nodeId: string; distance: number }> = [];

  // Start with direct inputs
  const directInputEdges = getIncomingEdges(nodeId);
  directInputEdges.forEach((edge) => {
    queue.push({ nodeId: edge.source, distance: 1 });
  });

  // Process all upstream nodes
  while (queue.length > 0) {
    const { nodeId: currentNodeId, distance } = queue.shift()!;

    if (visited.has(currentNodeId)) continue;
    visited.add(currentNodeId);

    const currentNode = getNode(currentNodeId);
    if (!currentNode) continue;

    const schema = resolveNodeOutputSchema(currentNode);
    if (schema) {
      const resolvedSchema: ResolvedSchema = {
        schema,
        sourceNodeId: currentNode.id,
        sourceNodeName: currentNode.name,
        sourceNodeType: currentNode.type,
        outputIndex: 0, // TODO: handle multiple outputs
      };

      // Direct inputs (distance 1) go in inputSchemas
      if (distance === 1) {
        inputSchemas.push(resolvedSchema);
      }

      // All upstream nodes are accessible via $node reference
      accessibleSchemas[currentNode.name] = resolvedSchema;
    }

    // Add upstream nodes to queue
    const upstreamEdges = getIncomingEdges(currentNodeId);
    upstreamEdges.forEach((edge) => {
      if (!visited.has(edge.source)) {
        queue.push({ nodeId: edge.source, distance: distance + 1 });
      }
    });
  }

  // Merge all direct input schemas for $json and $input context
  const mergedInputSchema = mergeSchemas(...inputSchemas.map((s) => s.schema));

  return {
    nodeId,
    inputSchemas,
    accessibleSchemas,
    mergedInputSchema,
  };
}

/**
 * Schema context store
 */
export const useSchemaContextStore = create<SchemaContextState & SchemaContextActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    contextCache: new Map(),
    cacheVersion: 0,

    // Get schema context for a node
    getSchemaContext: (nodeId) => {
      const { contextCache, cacheVersion } = get();

      // Check cache first
      const cacheKey = `${nodeId}:${cacheVersion}`;
      const cached = contextCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Build context from workflow state
      const workflowState = useWorkflowStore.getState();
      const registryState = useNodeRegistryStore.getState();

      const context = buildSchemaContext(
        nodeId,
        workflowState.workflow.nodes,
        workflowState.workflow.edges,
        registryState.getNodeType
      );

      // Cache the result
      set((state) => {
        state.contextCache.set(cacheKey, context);
        return state;
      });

      return context;
    },

    // Get autocomplete suggestions for a node
    getSuggestions: (nodeId) => {
      const context = get().getSchemaContext(nodeId);
      const suggestions: SchemaSuggestion[] = [];

      // Add $json suggestions (from merged input)
      if (context.mergedInputSchema) {
        suggestions.push(...schemaToSuggestions(context.mergedInputSchema, '$json'));
      }

      // Add $input suggestions (same as $json for now, but could include metadata)
      if (context.inputSchemas.length > 0 && context.inputSchemas[0].schema) {
        const inputSuggestions = schemaToSuggestions(
          context.inputSchemas[0].schema,
          '$input.item.json',
          context.inputSchemas[0].sourceNodeName
        );
        suggestions.push(...inputSuggestions);
      }

      // Add $node suggestions for all accessible upstream nodes
      Object.entries(context.accessibleSchemas).forEach(([nodeName, resolved]) => {
        const nodeSuggestions = schemaToSuggestions(
          resolved.schema,
          `$node["${nodeName}"].json`,
          nodeName
        );
        suggestions.push(...nodeSuggestions);
      });

      return suggestions;
    },

    // Get mock data for simulation at a node
    getMockData: (nodeId) => {
      const context = get().getSchemaContext(nodeId);

      if (context.mergedInputSchema) {
        return generateMockData(context.mergedInputSchema);
      }

      // If no schema, return empty object
      return {};
    },

    // Invalidate cache
    invalidateCache: () => {
      set((state) => ({
        ...state,
        cacheVersion: state.cacheVersion + 1,
        contextCache: new Map(),
      }));
    },

    // Clear cache
    clearCache: () => {
      set((state) => ({
        ...state,
        contextCache: new Map(),
      }));
    },
  }))
);

// Subscribe to workflow changes to invalidate cache
useWorkflowStore.subscribe(
  (state) => [state.workflow.nodes, state.workflow.edges],
  () => {
    useSchemaContextStore.getState().invalidateCache();
  },
  { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] }
);

/**
 * Hook to get schema context for a node
 */
export function useSchemaContext(nodeId: string | null): SchemaContext | null {
  const getSchemaContext = useSchemaContextStore((state) => state.getSchemaContext);
  // Subscribe to cacheVersion to trigger re-render when cache is invalidated
  const _cacheVersion = useSchemaContextStore((state) => state.cacheVersion);
  // Silence unused variable warning - cacheVersion is used to trigger re-renders
  void _cacheVersion;

  if (!nodeId) return null;

  return getSchemaContext(nodeId);
}

/**
 * Hook to get autocomplete suggestions for a node
 */
export function useSchemaSuggestions(nodeId: string | null): SchemaSuggestion[] {
  const getSuggestions = useSchemaContextStore((state) => state.getSuggestions);
  // Subscribe to cacheVersion to trigger re-render when cache is invalidated
  const _cacheVersion = useSchemaContextStore((state) => state.cacheVersion);
  void _cacheVersion;

  if (!nodeId) return [];

  return getSuggestions(nodeId);
}

/**
 * Hook to get mock data for simulation
 */
export function useMockData(nodeId: string | null): Record<string, unknown> {
  const getMockData = useSchemaContextStore((state) => state.getMockData);
  // Subscribe to cacheVersion to trigger re-render when cache is invalidated
  const _cacheVersion = useSchemaContextStore((state) => state.cacheVersion);
  void _cacheVersion;

  if (!nodeId) return {};

  return getMockData(nodeId);
}

/**
 * Get schema context for a node (non-hook version)
 */
export function getSchemaContext(nodeId: string): SchemaContext {
  return useSchemaContextStore.getState().getSchemaContext(nodeId);
}

/**
 * Get suggestions for a node (non-hook version)
 */
export function getSchemaSuggestions(nodeId: string): SchemaSuggestion[] {
  return useSchemaContextStore.getState().getSuggestions(nodeId);
}

/**
 * Get mock data for simulation (non-hook version)
 */
export function getMockDataForNode(nodeId: string): Record<string, unknown> {
  return useSchemaContextStore.getState().getMockData(nodeId);
}

/**
 * Resolve output schema for a specific node instance
 */
export function resolveNodeSchema(node: WorkflowNode): DataSchema | null {
  const nodeType = useNodeRegistryStore.getState().getNodeType(node.type);
  if (!nodeType?.outputSchema) return null;

  return resolveSchema(nodeType.outputSchema, node.parameters, node);
}

/**
 * Get all available expression variables for a node based on schema context
 * Returns suggestions organized by category
 */
export function getSchemaExpressionVariables(nodeId: string): {
  json: SchemaSuggestion[];
  input: SchemaSuggestion[];
  nodes: Record<string, SchemaSuggestion[]>;
  builtIn: SchemaSuggestion[];
} {
  const context = useSchemaContextStore.getState().getSchemaContext(nodeId);

  const result = {
    json: [] as SchemaSuggestion[],
    input: [] as SchemaSuggestion[],
    nodes: {} as Record<string, SchemaSuggestion[]>,
    builtIn: [] as SchemaSuggestion[],
  };

  // $json suggestions
  if (context.mergedInputSchema) {
    result.json = schemaToSuggestions(context.mergedInputSchema, '$json');
  }

  // $input suggestions
  if (context.inputSchemas.length > 0 && context.inputSchemas[0].schema) {
    result.input = schemaToSuggestions(
      context.inputSchemas[0].schema,
      '$input.item.json',
      context.inputSchemas[0].sourceNodeName
    );
  }

  // $node suggestions grouped by node name
  Object.entries(context.accessibleSchemas).forEach(([nodeName, resolved]) => {
    result.nodes[nodeName] = schemaToSuggestions(
      resolved.schema,
      `$node["${nodeName}"].json`,
      nodeName
    );
  });

  // Built-in variables
  result.builtIn = [
    {
      path: '$executionId',
      label: '$executionId',
      type: 'string',
      kind: 'variable',
      description: 'Unique ID of the current execution',
    },
    {
      path: '$runIndex',
      label: '$runIndex',
      type: 'integer',
      kind: 'variable',
      description: 'Index of the current run (for retry scenarios)',
    },
    {
      path: '$itemIndex',
      label: '$itemIndex',
      type: 'integer',
      kind: 'variable',
      description: 'Index of the current item in the array',
    },
    {
      path: '$now',
      label: '$now',
      type: 'string',
      kind: 'variable',
      description: 'Current timestamp in ISO format',
    },
    {
      path: '$today',
      label: '$today',
      type: 'string',
      kind: 'variable',
      description: 'Current date in YYYY-MM-DD format',
    },
    {
      path: '$workflow',
      label: '$workflow',
      type: 'object',
      kind: 'object',
      description: 'Workflow metadata (id, name, active)',
    },
  ];

  return result;
}
