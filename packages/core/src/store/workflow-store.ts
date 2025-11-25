import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowViewport,
  Position,
  StickyNote,
} from '../types';
import { nanoid } from '../utils/nanoid';

/**
 * History entry for undo/redo
 */
interface HistoryEntry {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  timestamp: number;
}

/**
 * Workflow store state
 */
interface WorkflowState {
  // Workflow data
  workflow: Workflow;

  // Selection state
  selectedNodeIds: string[];
  selectedEdgeIds: string[];

  // Viewport
  viewport: WorkflowViewport;

  // Interaction state
  isConnecting: boolean;
  connectionStartNode: string | null;
  connectionStartHandle: string | null;
  isDragging: boolean;
  isPanning: boolean;

  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;
  maxHistory: number;

  // Sticky notes
  stickyNotes: StickyNote[];

  // Clipboard
  clipboard: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  } | null;

  // Dirty state
  isDirty: boolean;
}

/**
 * Workflow store actions
 */
interface WorkflowActions {
  // Workflow actions
  setWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (updates: Partial<Workflow>) => void;
  resetWorkflow: () => void;

  // Node actions
  addNode: (node: Omit<WorkflowNode, 'id'> & { id?: string }) => WorkflowNode;
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  removeNode: (nodeId: string) => void;
  removeNodes: (nodeIds: string[]) => void;
  duplicateNodes: (nodeIds: string[]) => WorkflowNode[];
  moveNode: (nodeId: string, position: Position) => void;
  moveNodes: (updates: Array<{ id: string; position: Position }>) => void;
  setNodeParameters: (nodeId: string, parameters: Record<string, unknown>) => void;
  setNodeCredentials: (nodeId: string, credentials: WorkflowNode['credentials']) => void;
  toggleNodeDisabled: (nodeId: string) => void;

  // Edge actions
  addEdge: (edge: Omit<WorkflowEdge, 'id'> & { id?: string }) => WorkflowEdge;
  updateEdge: (edgeId: string, updates: Partial<WorkflowEdge>) => void;
  removeEdge: (edgeId: string) => void;
  removeEdges: (edgeIds: string[]) => void;
  removeEdgesForNode: (nodeId: string) => void;

  // Selection actions
  selectNode: (nodeId: string, addToSelection?: boolean) => void;
  selectNodes: (nodeIds: string[]) => void;
  selectEdge: (edgeId: string, addToSelection?: boolean) => void;
  selectEdges: (edgeIds: string[]) => void;
  selectAll: () => void;
  deselectAll: () => void;
  deselectNode: (nodeId: string) => void;
  deselectEdge: (edgeId: string) => void;

  // Viewport actions
  setViewport: (viewport: WorkflowViewport) => void;
  zoomTo: (zoom: number) => void;
  panTo: (x: number, y: number) => void;
  fitView: (padding?: number) => void;

  // Connection actions
  startConnection: (nodeId: string, handleId: string) => void;
  endConnection: () => void;

  // Drag actions
  setDragging: (isDragging: boolean) => void;
  setPanning: (isPanning: boolean) => void;

  // History actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // Clipboard actions
  copy: () => void;
  cut: () => void;
  paste: (position?: Position) => void;

  // Sticky note actions
  addStickyNote: (note: Omit<StickyNote, 'id'>) => StickyNote;
  updateStickyNote: (noteId: string, updates: Partial<StickyNote>) => void;
  removeStickyNote: (noteId: string) => void;

  // Dirty state
  setDirty: (isDirty: boolean) => void;

  // Helpers
  getNode: (nodeId: string) => WorkflowNode | undefined;
  getEdge: (edgeId: string) => WorkflowEdge | undefined;
  getConnectedEdges: (nodeId: string) => WorkflowEdge[];
  getIncomingEdges: (nodeId: string) => WorkflowEdge[];
  getOutgoingEdges: (nodeId: string) => WorkflowEdge[];
  getConnectedNodes: (nodeId: string) => WorkflowNode[];
  isValidConnection: (source: string, sourceHandle: string, target: string, targetHandle: string) => boolean;
}

/**
 * Default empty workflow
 */
const createEmptyWorkflow = (): Workflow => ({
  id: nanoid(),
  name: 'Untitled Workflow',
  version: '1.0.0',
  nodes: [],
  edges: [],
  settings: {},
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
});

/**
 * Default viewport
 */
const defaultViewport: WorkflowViewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

/**
 * Workflow store
 */
export const useWorkflowStore = create<WorkflowState & WorkflowActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      workflow: createEmptyWorkflow(),
      selectedNodeIds: [],
      selectedEdgeIds: [],
      viewport: defaultViewport,
      isConnecting: false,
      connectionStartNode: null,
      connectionStartHandle: null,
      isDragging: false,
      isPanning: false,
      history: [],
      historyIndex: -1,
      maxHistory: 50,
      stickyNotes: [],
      clipboard: null,
      isDirty: false,

      // Workflow actions
      setWorkflow: (workflow) => {
        set((state) => {
          state.workflow = workflow;
          state.selectedNodeIds = [];
          state.selectedEdgeIds = [];
          state.isDirty = false;
        });
        get().clearHistory();
        get().pushHistory();
      },

      updateWorkflow: (updates) => {
        set((state) => {
          Object.assign(state.workflow, updates);
          const now = new Date().toISOString();
          state.workflow.metadata = {
            createdAt: state.workflow.metadata?.createdAt ?? now,
            updatedAt: now,
            author: state.workflow.metadata?.author,
            instanceId: state.workflow.metadata?.instanceId,
            templateId: state.workflow.metadata?.templateId,
            templateVersion: state.workflow.metadata?.templateVersion,
          };
          state.isDirty = true;
        });
      },

      resetWorkflow: () => {
        set((state) => {
          state.workflow = createEmptyWorkflow();
          state.selectedNodeIds = [];
          state.selectedEdgeIds = [];
          state.isDirty = false;
        });
        get().clearHistory();
      },

      // Node actions
      addNode: (node) => {
        const newNode: WorkflowNode = {
          ...node,
          id: node.id || nanoid(),
        };

        set((state) => {
          state.workflow.nodes.push(newNode);
          state.isDirty = true;
        });

        get().pushHistory();
        return newNode;
      },

      updateNode: (nodeId, updates) => {
        set((state) => {
          const nodeIndex = state.workflow.nodes.findIndex((n: WorkflowNode) => n.id === nodeId);
          if (nodeIndex !== -1) {
            Object.assign(state.workflow.nodes[nodeIndex], updates);
            state.isDirty = true;
          }
        });
        get().pushHistory();
      },

      removeNode: (nodeId) => {
        get().removeEdgesForNode(nodeId);
        set((state) => {
          state.workflow.nodes = state.workflow.nodes.filter((n: WorkflowNode) => n.id !== nodeId);
          state.selectedNodeIds = state.selectedNodeIds.filter((id: string) => id !== nodeId);
          state.isDirty = true;
        });
        get().pushHistory();
      },

      removeNodes: (nodeIds) => {
        nodeIds.forEach((id) => get().removeEdgesForNode(id));
        set((state) => {
          state.workflow.nodes = state.workflow.nodes.filter((n: WorkflowNode) => !nodeIds.includes(n.id));
          state.selectedNodeIds = state.selectedNodeIds.filter((id: string) => !nodeIds.includes(id));
          state.isDirty = true;
        });
        get().pushHistory();
      },

      duplicateNodes: (nodeIds) => {
        const state = get();
        const nodesToDuplicate = state.workflow.nodes.filter((n) => nodeIds.includes(n.id));
        const newNodes: WorkflowNode[] = [];
        const idMap = new Map<string, string>();

        // Create new nodes with offset position
        nodesToDuplicate.forEach((node) => {
          const newId = nanoid();
          idMap.set(node.id, newId);
          const newNode: WorkflowNode = {
            ...JSON.parse(JSON.stringify(node)),
            id: newId,
            name: `${node.name} (copy)`,
            position: {
              x: node.position.x + 50,
              y: node.position.y + 50,
            },
          };
          newNodes.push(newNode);
        });

        // Duplicate edges between duplicated nodes
        const edgesToDuplicate = state.workflow.edges.filter(
          (e) => nodeIds.includes(e.source) && nodeIds.includes(e.target)
        );

        set((draft) => {
          draft.workflow.nodes.push(...newNodes);

          edgesToDuplicate.forEach((edge) => {
            draft.workflow.edges.push({
              ...edge,
              id: nanoid(),
              source: idMap.get(edge.source)!,
              target: idMap.get(edge.target)!,
            });
          });

          draft.selectedNodeIds = newNodes.map((n) => n.id);
          draft.isDirty = true;
        });

        get().pushHistory();
        return newNodes;
      },

      moveNode: (nodeId, position) => {
        set((state) => {
          const node = state.workflow.nodes.find((n: WorkflowNode) => n.id === nodeId);
          if (node) {
            node.position = position;
          }
        });
      },

      moveNodes: (updates) => {
        set((state) => {
          updates.forEach(({ id, position }) => {
            const node = state.workflow.nodes.find((n: WorkflowNode) => n.id === id);
            if (node) {
              node.position = position;
            }
          });
        });
      },

      setNodeParameters: (nodeId, parameters) => {
        set((state) => {
          const node = state.workflow.nodes.find((n: WorkflowNode) => n.id === nodeId);
          if (node) {
            node.parameters = parameters;
            state.isDirty = true;
          }
        });
        get().pushHistory();
      },

      setNodeCredentials: (nodeId, credentials) => {
        set((state) => {
          const node = state.workflow.nodes.find((n: WorkflowNode) => n.id === nodeId);
          if (node) {
            node.credentials = credentials;
            state.isDirty = true;
          }
        });
        get().pushHistory();
      },

      toggleNodeDisabled: (nodeId) => {
        set((state) => {
          const node = state.workflow.nodes.find((n: WorkflowNode) => n.id === nodeId);
          if (node) {
            node.disabled = !node.disabled;
            state.isDirty = true;
          }
        });
        get().pushHistory();
      },

      // Edge actions
      addEdge: (edge) => {
        const newEdge: WorkflowEdge = {
          ...edge,
          id: edge.id || nanoid(),
        };

        // Check if edge already exists
        const exists = get().workflow.edges.some(
          (e) =>
            e.source === newEdge.source &&
            e.target === newEdge.target &&
            e.sourceHandle === newEdge.sourceHandle &&
            e.targetHandle === newEdge.targetHandle
        );

        if (exists) {
          return newEdge;
        }

        set((state) => {
          state.workflow.edges.push(newEdge);
          state.isDirty = true;
        });

        get().pushHistory();
        return newEdge;
      },

      updateEdge: (edgeId, updates) => {
        set((state) => {
          const edgeIndex = state.workflow.edges.findIndex((e: WorkflowEdge) => e.id === edgeId);
          if (edgeIndex !== -1) {
            Object.assign(state.workflow.edges[edgeIndex], updates);
            state.isDirty = true;
          }
        });
        get().pushHistory();
      },

      removeEdge: (edgeId) => {
        set((state) => {
          state.workflow.edges = state.workflow.edges.filter((e: WorkflowEdge) => e.id !== edgeId);
          state.selectedEdgeIds = state.selectedEdgeIds.filter((id: string) => id !== edgeId);
          state.isDirty = true;
        });
        get().pushHistory();
      },

      removeEdges: (edgeIds) => {
        set((state) => {
          state.workflow.edges = state.workflow.edges.filter((e: WorkflowEdge) => !edgeIds.includes(e.id));
          state.selectedEdgeIds = state.selectedEdgeIds.filter((id: string) => !edgeIds.includes(id));
          state.isDirty = true;
        });
        get().pushHistory();
      },

      removeEdgesForNode: (nodeId) => {
        set((state) => {
          state.workflow.edges = state.workflow.edges.filter(
            (e: WorkflowEdge) => e.source !== nodeId && e.target !== nodeId
          );
        });
      },

      // Selection actions
      selectNode: (nodeId, addToSelection = false) => {
        set((state) => {
          if (addToSelection) {
            if (!state.selectedNodeIds.includes(nodeId)) {
              state.selectedNodeIds.push(nodeId);
            }
          } else {
            state.selectedNodeIds = [nodeId];
            state.selectedEdgeIds = [];
          }
        });
      },

      selectNodes: (nodeIds) => {
        set((state) => {
          state.selectedNodeIds = nodeIds;
        });
      },

      selectEdge: (edgeId, addToSelection = false) => {
        set((state) => {
          if (addToSelection) {
            if (!state.selectedEdgeIds.includes(edgeId)) {
              state.selectedEdgeIds.push(edgeId);
            }
          } else {
            state.selectedEdgeIds = [edgeId];
            state.selectedNodeIds = [];
          }
        });
      },

      selectEdges: (edgeIds) => {
        set((state) => {
          state.selectedEdgeIds = edgeIds;
        });
      },

      selectAll: () => {
        set((state) => {
          state.selectedNodeIds = state.workflow.nodes.map((n: WorkflowNode) => n.id);
          state.selectedEdgeIds = state.workflow.edges.map((e: WorkflowEdge) => e.id);
        });
      },

      deselectAll: () => {
        set((state) => {
          state.selectedNodeIds = [];
          state.selectedEdgeIds = [];
        });
      },

      deselectNode: (nodeId) => {
        set((state) => {
          state.selectedNodeIds = state.selectedNodeIds.filter((id: string) => id !== nodeId);
        });
      },

      deselectEdge: (edgeId) => {
        set((state) => {
          state.selectedEdgeIds = state.selectedEdgeIds.filter((id: string) => id !== edgeId);
        });
      },

      // Viewport actions
      setViewport: (viewport) => {
        set((state) => {
          state.viewport = viewport;
        });
      },

      zoomTo: (zoom) => {
        set((state) => {
          state.viewport.zoom = Math.min(Math.max(zoom, 0.1), 4);
        });
      },

      panTo: (x, y) => {
        set((state) => {
          state.viewport.x = x;
          state.viewport.y = y;
        });
      },

      fitView: (_padding = 50) => {
        const { workflow } = get();
        if (workflow.nodes.length === 0) return;

        // Calculate bounding box
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        workflow.nodes.forEach((node) => {
          minX = Math.min(minX, node.position.x);
          minY = Math.min(minY, node.position.y);
          maxX = Math.max(maxX, node.position.x + 220); // Assuming node width
          maxY = Math.max(maxY, node.position.y + 100); // Assuming node height
        });

        // This would need to be connected to ReactFlow's fitView
        // For now, just center the viewport
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        set((state) => {
          state.viewport = {
            x: -centerX,
            y: -centerY,
            zoom: 1,
          };
        });
      },

      // Connection actions
      startConnection: (nodeId, handleId) => {
        set((state) => {
          state.isConnecting = true;
          state.connectionStartNode = nodeId;
          state.connectionStartHandle = handleId;
        });
      },

      endConnection: () => {
        set((state) => {
          state.isConnecting = false;
          state.connectionStartNode = null;
          state.connectionStartHandle = null;
        });
      },

      // Drag actions
      setDragging: (isDragging) => {
        set((state) => {
          state.isDragging = isDragging;
        });
      },

      setPanning: (isPanning) => {
        set((state) => {
          state.isPanning = isPanning;
        });
      },

      // History actions
      pushHistory: () => {
        const { workflow, historyIndex, maxHistory } = get();

        const entry: HistoryEntry = {
          nodes: JSON.parse(JSON.stringify(workflow.nodes)),
          edges: JSON.parse(JSON.stringify(workflow.edges)),
          timestamp: Date.now(),
        };

        set((state) => {
          // Remove any future history if we're not at the end
          state.history = state.history.slice(0, historyIndex + 1);

          // Add new entry
          state.history.push(entry);

          // Limit history size
          if (state.history.length > maxHistory) {
            state.history = state.history.slice(-maxHistory);
          }

          state.historyIndex = state.history.length - 1;
        });
      },

      undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex <= 0) return;

        const prevEntry = history[historyIndex - 1];

        set((state) => {
          state.workflow.nodes = JSON.parse(JSON.stringify(prevEntry.nodes));
          state.workflow.edges = JSON.parse(JSON.stringify(prevEntry.edges));
          state.historyIndex = historyIndex - 1;
          state.isDirty = true;
        });
      },

      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex >= history.length - 1) return;

        const nextEntry = history[historyIndex + 1];

        set((state) => {
          state.workflow.nodes = JSON.parse(JSON.stringify(nextEntry.nodes));
          state.workflow.edges = JSON.parse(JSON.stringify(nextEntry.edges));
          state.historyIndex = historyIndex + 1;
          state.isDirty = true;
        });
      },

      canUndo: () => get().historyIndex > 0,

      canRedo: () => get().historyIndex < get().history.length - 1,

      clearHistory: () => {
        set((state) => {
          state.history = [];
          state.historyIndex = -1;
        });
      },

      // Clipboard actions
      copy: () => {
        const { selectedNodeIds, workflow } = get();

        const nodesToCopy = workflow.nodes.filter((n: WorkflowNode) => selectedNodeIds.includes(n.id));
        const edgesToCopy = workflow.edges.filter(
          (e: WorkflowEdge) => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)
        );

        set((state) => {
          state.clipboard = {
            nodes: JSON.parse(JSON.stringify(nodesToCopy)),
            edges: JSON.parse(JSON.stringify(edgesToCopy)),
          };
        });
      },

      cut: () => {
        get().copy();
        const { selectedNodeIds } = get();
        get().removeNodes(selectedNodeIds);
      },

      paste: (position) => {
        const { clipboard } = get();
        if (!clipboard || clipboard.nodes.length === 0) return;

        const idMap = new Map<string, string>();
        const offset = position ? { x: 0, y: 0 } : { x: 50, y: 50 };

        // Calculate center of copied nodes for position offset
        let centerX = 0;
        let centerY = 0;
        clipboard.nodes.forEach((node) => {
          centerX += node.position.x;
          centerY += node.position.y;
        });
        centerX /= clipboard.nodes.length;
        centerY /= clipboard.nodes.length;

        const newNodes: WorkflowNode[] = clipboard.nodes.map((node) => {
          const newId = nanoid();
          idMap.set(node.id, newId);

          const newPosition = position
            ? {
                x: position.x + (node.position.x - centerX),
                y: position.y + (node.position.y - centerY),
              }
            : {
                x: node.position.x + offset.x,
                y: node.position.y + offset.y,
              };

          return {
            ...node,
            id: newId,
            position: newPosition,
          };
        });

        const newEdges: WorkflowEdge[] = clipboard.edges.map((edge) => ({
          ...edge,
          id: nanoid(),
          source: idMap.get(edge.source)!,
          target: idMap.get(edge.target)!,
        }));

        set((state) => {
          state.workflow.nodes.push(...newNodes);
          state.workflow.edges.push(...newEdges);
          state.selectedNodeIds = newNodes.map((n) => n.id);
          state.selectedEdgeIds = [];
          state.isDirty = true;
        });

        get().pushHistory();
      },

      // Sticky note actions
      addStickyNote: (note) => {
        const newNote: StickyNote = {
          ...note,
          id: nanoid(),
        };

        set((state) => {
          state.stickyNotes.push(newNote);
        });

        return newNote;
      },

      updateStickyNote: (noteId, updates) => {
        set((state) => {
          const noteIndex = state.stickyNotes.findIndex((n: StickyNote) => n.id === noteId);
          if (noteIndex !== -1) {
            Object.assign(state.stickyNotes[noteIndex], updates);
          }
        });
      },

      removeStickyNote: (noteId) => {
        set((state) => {
          state.stickyNotes = state.stickyNotes.filter((n: StickyNote) => n.id !== noteId);
        });
      },

      // Dirty state
      setDirty: (isDirty) => {
        set((state) => {
          state.isDirty = isDirty;
        });
      },

      // Helpers
      getNode: (nodeId) => get().workflow.nodes.find((n) => n.id === nodeId),

      getEdge: (edgeId) => get().workflow.edges.find((e) => e.id === edgeId),

      getConnectedEdges: (nodeId) =>
        get().workflow.edges.filter((e) => e.source === nodeId || e.target === nodeId),

      getIncomingEdges: (nodeId) =>
        get().workflow.edges.filter((e) => e.target === nodeId),

      getOutgoingEdges: (nodeId) =>
        get().workflow.edges.filter((e) => e.source === nodeId),

      getConnectedNodes: (nodeId) => {
        const edges = get().getConnectedEdges(nodeId);
        const connectedIds = new Set<string>();

        edges.forEach((e) => {
          if (e.source !== nodeId) connectedIds.add(e.source);
          if (e.target !== nodeId) connectedIds.add(e.target);
        });

        return get().workflow.nodes.filter((n) => connectedIds.has(n.id));
      },

      isValidConnection: (source, sourceHandle, target, targetHandle) => {
        // Can't connect to self
        if (source === target) return false;

        // Check if connection already exists
        const exists = get().workflow.edges.some(
          (e) =>
            e.source === source &&
            e.target === target &&
            e.sourceHandle === sourceHandle &&
            e.targetHandle === targetHandle
        );
        if (exists) return false;

        // Check for cycles (simple check - would need more complex logic for full DAG validation)
        const wouldCreateCycle = (start: string, end: string): boolean => {
          const visited = new Set<string>();
          const queue = [end];

          while (queue.length > 0) {
            const current = queue.shift()!;
            if (current === start) return true;
            if (visited.has(current)) continue;
            visited.add(current);

            const outgoing = get().workflow.edges.filter((e) => e.source === current);
            outgoing.forEach((e) => queue.push(e.target));
          }

          return false;
        };

        return !wouldCreateCycle(source, target);
      },
    }))
  )
);

/**
 * Selector hooks for common patterns
 */
export const useWorkflow = () => useWorkflowStore((state) => state.workflow);
export const useNodes = () => useWorkflowStore((state) => state.workflow.nodes);
export const useEdges = () => useWorkflowStore((state) => state.workflow.edges);
export const useSelectedNodeIds = () => useWorkflowStore((state) => state.selectedNodeIds);
export const useSelectedEdgeIds = () => useWorkflowStore((state) => state.selectedEdgeIds);
export const useViewport = () => useWorkflowStore((state) => state.viewport);
export const useIsDirty = () => useWorkflowStore((state) => state.isDirty);

export const useSelectedNodes = () => {
  const nodes = useNodes();
  const selectedIds = useSelectedNodeIds();
  return nodes.filter((n) => selectedIds.includes(n.id));
};

export const useSelectedNode = () => {
  const nodes = useNodes();
  const selectedIds = useSelectedNodeIds();
  if (selectedIds.length !== 1) return null;
  return nodes.find((n) => n.id === selectedIds[0]) ?? null;
};
