import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import type { NodeTypeDefinition, WorkflowNode, Position } from '../types';

import { NodeCategory } from '../types';

import { nanoid } from '../utils/nanoid';

// Enable Immer Map/Set support before any store is created
enableMapSet();

/**
 * Node registry state
 */
interface NodeRegistryState {
  // Registered node types
  nodeTypes: Map<string, NodeTypeDefinition>;

  // Node type categories for palette
  categories: Map<NodeCategory, string[]>;

  // Search index for quick lookups
  searchIndex: Map<string, string[]>; // keyword -> node types
}

/**
 * Node registry actions
 */
interface NodeRegistryActions {
  // Registration
  registerNodeType: (nodeType: NodeTypeDefinition) => void;
  registerNodeTypes: (nodeTypes: NodeTypeDefinition[]) => void;
  unregisterNodeType: (type: string) => void;
  clearRegistry: () => void;

  // Lookups
  getNodeType: (type: string) => NodeTypeDefinition | undefined;
  getAllNodeTypes: () => NodeTypeDefinition[];
  getNodeTypesByCategory: (category: NodeCategory) => NodeTypeDefinition[];
  getNodeTypesForGroup: (group: string) => NodeTypeDefinition[];

  // Search
  searchNodeTypes: (query: string) => NodeTypeDefinition[];
  rebuildSearchIndex: () => void;

  // Factory
  createNodeInstance: (type: string, position?: Position, overrides?: Partial<WorkflowNode>) => WorkflowNode | null;
  getDefaultParameters: (type: string) => Record<string, unknown>;

  // Categories
  getCategories: () => NodeCategory[];
  getCategoryNodeTypes: () => Map<NodeCategory, NodeTypeDefinition[]>;
}

/**
 * Build search terms for a node type
 */
function buildSearchTerms(nodeType: NodeTypeDefinition): string[] {
  const terms: string[] = [];

  // Name variations
  terms.push(nodeType.type.toLowerCase());
  terms.push(nodeType.name.toLowerCase());
  terms.push(nodeType.displayName.toLowerCase());

  // Description words
  if (nodeType.description) {
    const descWords = nodeType.description.toLowerCase().split(/\s+/);
    terms.push(...descWords.filter((w) => w.length > 2));
  }

  // Groups
  terms.push(...nodeType.group.map((g) => g.toLowerCase()));

  // Category
  terms.push(nodeType.category.toLowerCase());

  // Aliases from codex
  if (nodeType.codex?.alias) {
    terms.push(...nodeType.codex.alias.map((a) => a.toLowerCase()));
  }

  // Remove duplicates
  return [...new Set(terms)];
}

/**
 * Node registry store
 */
export const useNodeRegistryStore = create<NodeRegistryState & NodeRegistryActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      nodeTypes: new Map(),
      categories: new Map(),
      searchIndex: new Map(),

      // Registration
      registerNodeType: (nodeType) => {
        set((state) => {
          state.nodeTypes.set(nodeType.type, nodeType);

          // Update categories
          const category = nodeType.category;
          const categoryTypes = state.categories.get(category) ?? [];
          if (!categoryTypes.includes(nodeType.type)) {
            categoryTypes.push(nodeType.type);
            state.categories.set(category, categoryTypes);
          }
        });

        // Rebuild search index
        get().rebuildSearchIndex();
      },

      registerNodeTypes: (nodeTypes) => {
        set((state) => {
          nodeTypes.forEach((nodeType) => {
            state.nodeTypes.set(nodeType.type, nodeType);

            // Update categories
            const category = nodeType.category;
            const categoryTypes = state.categories.get(category) ?? [];
            if (!categoryTypes.includes(nodeType.type)) {
              categoryTypes.push(nodeType.type);
              state.categories.set(category, categoryTypes);
            }
          });
        });

        // Rebuild search index
        get().rebuildSearchIndex();
      },

      unregisterNodeType: (type) => {
        set((state) => {
          const nodeType = state.nodeTypes.get(type);
          if (nodeType) {
            state.nodeTypes.delete(type);

            // Update categories
            const category = nodeType.category;
            const categoryTypes = state.categories.get(category);
            if (categoryTypes) {
              const index = categoryTypes.indexOf(type);
              if (index !== -1) {
                categoryTypes.splice(index, 1);
              }
              if (categoryTypes.length === 0) {
                state.categories.delete(category);
              }
            }
          }
        });

        // Rebuild search index
        get().rebuildSearchIndex();
      },

      clearRegistry: () => {
        set((state) => {
          state.nodeTypes.clear();
          state.categories.clear();
          state.searchIndex.clear();
        });
      },

      // Lookups
      getNodeType: (type) => {
        return get().nodeTypes.get(type);
      },

      getAllNodeTypes: () => {
        return Array.from(get().nodeTypes.values());
      },

      getNodeTypesByCategory: (category) => {
        const { nodeTypes, categories } = get();
        const typeIds = categories.get(category) ?? [];
        return typeIds
          .map((id) => nodeTypes.get(id))
          .filter((t): t is NodeTypeDefinition => t !== undefined);
      },

      getNodeTypesForGroup: (group) => {
        return get()
          .getAllNodeTypes()
          .filter((t) => t.group.includes(group));
      },

      // Search
      searchNodeTypes: (query) => {
        if (!query.trim()) {
          return get().getAllNodeTypes();
        }

        const { nodeTypes, searchIndex } = get();
        const queryLower = query.toLowerCase();
        const queryTerms = queryLower.split(/\s+/);

        // Score each node type
        const scores = new Map<string, number>();

        queryTerms.forEach((term) => {
          // Check search index
          searchIndex.forEach((terms, nodeType) => {
            const matchingTerms = terms.filter(
              (t) => t.includes(term) || term.includes(t)
            );
            if (matchingTerms.length > 0) {
              const currentScore = scores.get(nodeType) ?? 0;
              // Higher score for exact matches
              const exactMatch = matchingTerms.some((t) => t === term);
              scores.set(nodeType, currentScore + (exactMatch ? 10 : 1));
            }
          });
        });

        // Sort by score and return
        return Array.from(scores.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([type]) => nodeTypes.get(type))
          .filter((t): t is NodeTypeDefinition => t !== undefined);
      },

      rebuildSearchIndex: () => {
        set((state) => {
          state.searchIndex.clear();

          state.nodeTypes.forEach((nodeType: NodeTypeDefinition) => {
            const terms = buildSearchTerms(nodeType);
            state.searchIndex.set(nodeType.type, terms);
          });
        });
      },

      // Factory
      createNodeInstance: (type, position, overrides) => {
        const nodeType = get().nodeTypes.get(type);
        if (!nodeType) {
          console.warn(`Node type not found: ${type}`);
          return null;
        }

        const defaultParams = get().getDefaultParameters(type);

        const node: WorkflowNode = {
          id: nanoid(),
          type: nodeType.type,
          name: nodeType.defaults?.name ?? nodeType.displayName,
          position: position ?? { x: 100, y: 100 },
          parameters: defaultParams,
          disabled: false,
          ...overrides,
        };

        return node;
      },

      getDefaultParameters: (type) => {
        const nodeType = get().nodeTypes.get(type);
        if (!nodeType) {
          return {};
        }

        const params: Record<string, unknown> = {};

        nodeType.properties.forEach((prop) => {
          if (prop.default !== undefined) {
            params[prop.name] = prop.default;
          }
        });

        return params;
      },

      // Categories
      getCategories: () => {
        return Array.from(get().categories.keys());
      },

      getCategoryNodeTypes: () => {
        const { nodeTypes, categories } = get();
        const result = new Map<NodeCategory, NodeTypeDefinition[]>();

        categories.forEach((typeIds, category) => {
          const types = typeIds
            .map((id) => nodeTypes.get(id))
            .filter((t): t is NodeTypeDefinition => t !== undefined);
          result.set(category, types);
        });

        return result;
      },
    }))
  )
);

/**
 * Selector hooks
 */
export const useNodeTypes = () =>
  useNodeRegistryStore((state) => Array.from(state.nodeTypes.values()));

export const useNodeType = (type: string) =>
  useNodeRegistryStore((state) => state.nodeTypes.get(type));

export const useNodeCategories = () =>
  useNodeRegistryStore((state) => Array.from(state.categories.keys()));

export const useNodeTypesByCategory = (category: NodeCategory) =>
  useNodeRegistryStore((state) => {
    const typeIds = state.categories.get(category) ?? [];
    return typeIds
      .map((id) => state.nodeTypes.get(id))
      .filter((t): t is NodeTypeDefinition => t !== undefined);
  });

/**
 * Hook for node registry actions
 */
export function useNodeRegistryActions() {
  const store = useNodeRegistryStore;

  return {
    registerNodeType: store.getState().registerNodeType,
    registerNodeTypes: store.getState().registerNodeTypes,
    unregisterNodeType: store.getState().unregisterNodeType,
    createNodeInstance: store.getState().createNodeInstance,
    searchNodeTypes: store.getState().searchNodeTypes,
    getDefaultParameters: store.getState().getDefaultParameters,
  };
}

/**
 * Register a node type (convenience function)
 */
export function registerNode(nodeType: NodeTypeDefinition): void {
  useNodeRegistryStore.getState().registerNodeType(nodeType);
}

/**
 * Register multiple node types (convenience function)
 */
export function registerNodes(nodeTypes: NodeTypeDefinition[]): void {
  useNodeRegistryStore.getState().registerNodeTypes(nodeTypes);
}

/**
 * Get a node type (convenience function)
 */
export function getNodeType(type: string): NodeTypeDefinition | undefined {
  return useNodeRegistryStore.getState().getNodeType(type);
}
