import {
  memo,
  useState,
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  type NodeDragHandler,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { cn } from '../../utils/cn';
import { nanoid } from '../../utils/nanoid';
import { useWorkflowStore } from '../../store/workflow-store';
import { useNodeRegistryStore } from '../../store/node-registry-store';
import { useExecutionStore } from '../../store/execution-store';
import { useDialogStore } from '../../store/dialog-store';
import { useThemeStore, initializeTheme } from '../../store/theme-store';
import { useSchemaContextStore } from '../../store/schema-context-store';
import { useCredentialStore } from '../../store/credential-store';
import { BaseNode, type BaseNodeData } from '../Nodes/BaseNode';
import { edgeTypes as customEdgeTypes } from '../Edges/CustomEdge';
import { NodeDetailsView, type InputDataItem } from '../NDV';
import { CredentialEditor } from '../CredentialEditor';
import { executeWorkflow } from '../../engine/executor';
import type {
  WorkflowDesignerProps,
  WorkflowDesignerRef,
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowViewport,
  Position,
  DialogConfig,
  CredentialTypeDefinition,
  Credential,
  CredentialData,
  NodeCredential,
} from '../../types';
import { DialogType } from '../../types';

/**
 * Convert workflow nodes to ReactFlow nodes
 */
function toReactFlowNodes(
  nodes: WorkflowNode[],
  nodeStatusMap: Record<string, unknown>,
  onConfigure: (node: WorkflowNode) => void,
  onDelete: (nodeId: string) => void,
  onDuplicate: (nodeId: string) => void,
  onToggleDisable: (nodeId: string) => void,
  onNameChange: (nodeId: string, newName: string) => void
): Node<BaseNodeData>[] {
  return nodes.map((node) => ({
    id: node.id,
    type: 'baseNode',
    position: node.position,
    data: {
      ...node,
      executionStatus: nodeStatusMap[node.id],
      onConfigure: () => onConfigure(node),
      onDelete: () => onDelete(node.id),
      onDuplicate: () => onDuplicate(node.id),
      onToggleDisable: () => onToggleDisable(node.id),
      onNameChange: (newName: string) => onNameChange(node.id, newName),
    },
    selected: false,
    draggable: !node.disabled,
  }));
}

/**
 * Convert workflow edges to ReactFlow edges
 */
function toReactFlowEdges(edges: WorkflowEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: 'custom',
    data: edge.data,
    animated: edge.animated,
    style: edge.style,
  }));
}

/**
 * Convert ReactFlow nodes back to workflow nodes
 */
function fromReactFlowNodes(nodes: Node<BaseNodeData>[]): WorkflowNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.data.type,
    name: node.data.name,
    position: node.position,
    parameters: node.data.parameters,
    credentials: node.data.credentials,
    disabled: node.data.disabled,
    notes: node.data.notes,
    color: node.data.color,
    alwaysOutputData: node.data.alwaysOutputData,
    executeOnce: node.data.executeOnce,
    retryOnFail: node.data.retryOnFail,
    maxTries: node.data.maxTries,
    waitBetweenTries: node.data.waitBetweenTries,
    continueOnFail: node.data.continueOnFail,
    metadata: node.data.metadata,
  }));
}

/**
 * Convert ReactFlow edges back to workflow edges
 */
function fromReactFlowEdges(edges: Edge[]): WorkflowEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? undefined,
    targetHandle: edge.targetHandle ?? undefined,
    type: edge.type as WorkflowEdge['type'],
    data: edge.data,
    animated: edge.animated,
    style: edge.style ? {
      stroke: edge.style.stroke as string | undefined,
      strokeWidth: typeof edge.style.strokeWidth === 'number' ? edge.style.strokeWidth : undefined,
    } : undefined,
  }));
}

/**
 * Node types for ReactFlow
 */
const nodeTypes: NodeTypes = {
  baseNode: BaseNode,
};

/**
 * Inner workflow designer (needs ReactFlowProvider)
 */
interface InnerWorkflowDesignerProps extends WorkflowDesignerProps {
  innerRef: React.Ref<WorkflowDesignerRef>;
}

const InnerWorkflowDesigner = memo<InnerWorkflowDesignerProps>(({
  workflow: externalWorkflow,
  onChange,
  theme: themeConfig,
  whiteLabel,
  executionEngine,
  readOnly = false,
  defaultViewport,
  nodeTypes: customNodeTypes,
  onNodeSelect,
  onNodeDoubleClick,
  onNodeContextMenu,
  onEdgeSelect,
  onViewportChange,
  onError,
  className,
  style,
  children,
  innerRef,
}) => {
  const reactFlowInstance = useReactFlow();

  // Stores
  const workflowStore = useWorkflowStore();
  const nodeRegistry = useNodeRegistryStore();
  const executionStore = useExecutionStore();
  const dialogStore = useDialogStore();
  const themeStore = useThemeStore();

  // Local state for ReactFlow
  const [nodes, setNodes, onNodesChange] = useNodesState<BaseNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // Initialize theme
  useEffect(() => {
    initializeTheme();
    if (themeConfig) {
      themeStore.setThemeConfig(themeConfig);
    }
  }, []);

  // Register custom node types
  useEffect(() => {
    if (customNodeTypes) {
      nodeRegistry.registerNodeTypes(customNodeTypes);
    }
  }, [customNodeTypes]);

  // Sync external workflow with internal state
  useEffect(() => {
    if (!isInitialized.current) {
      workflowStore.setWorkflow(externalWorkflow);
      isInitialized.current = true;
    }
  }, [externalWorkflow]);

  // Convert workflow to ReactFlow format
  useEffect(() => {
    const nodeStatusMap = executionStore.nodeStatus;

    const handleConfigure = (node: WorkflowNode) => {
      const nodeType = nodeRegistry.getNodeType(node.type);
      if (!nodeType) return;

      onNodeDoubleClick?.(node);

      dialogStore.openParameters({
        title: `${nodeType.displayName} Settings`,
        node,
        nodeType,
        currentParameters: node.parameters,
        onSave: (parameters) => {
          workflowStore.setNodeParameters(node.id, parameters);
        },
      });
    };

    const handleDelete = (nodeId: string) => {
      workflowStore.removeNode(nodeId);
    };

    const handleDuplicate = (nodeId: string) => {
      workflowStore.duplicateNodes([nodeId]);
    };

    const handleToggleDisable = (nodeId: string) => {
      workflowStore.toggleNodeDisabled(nodeId);
    };

    const handleNameChange = (nodeId: string, newName: string) => {
      workflowStore.updateNode(nodeId, { name: newName });
    };

    const rfNodes = toReactFlowNodes(
      workflowStore.workflow.nodes,
      nodeStatusMap,
      handleConfigure,
      handleDelete,
      handleDuplicate,
      handleToggleDisable,
      handleNameChange
    );

    const rfEdges = toReactFlowEdges(workflowStore.workflow.edges);

    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [workflowStore.workflow.nodes, workflowStore.workflow.edges, executionStore.nodeStatus]);

  // Sync changes back to workflow store and external
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);

      // Sync position changes
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && change.dragging === false) {
          workflowStore.moveNode(change.id, change.position);
        }
      });
    },
    [onNodesChange]
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  // Handle new connections
  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const newEdge: WorkflowEdge = {
        id: nanoid(),
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
      };

      workflowStore.addEdge(newEdge);
      setEdges((eds) => addEdge({ ...newEdge, type: 'custom' }, eds));
    },
    []
  );

  // Node event handlers
  const handleNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      workflowStore.selectNode(node.id, event.shiftKey);
      onNodeSelect?.(workflowStore.getNode(node.id) ?? null);
    },
    [onNodeSelect]
  );

  const handleNodeDoubleClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const workflowNode = workflowStore.getNode(node.id);
      if (workflowNode) {
        onNodeDoubleClick?.(workflowNode);

        const nodeType = nodeRegistry.getNodeType(workflowNode.type);
        if (nodeType) {
          dialogStore.openParameters({
            title: `${nodeType.displayName} Settings`,
            node: workflowNode,
            nodeType,
            currentParameters: workflowNode.parameters,
            onSave: (parameters) => {
              workflowStore.setNodeParameters(workflowNode.id, parameters);
            },
          });
        }
      }
    },
    [onNodeDoubleClick]
  );

  const handleNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      event.preventDefault();
      const workflowNode = workflowStore.getNode(node.id);
      if (workflowNode) {
        onNodeContextMenu?.(workflowNode, event as unknown as React.MouseEvent);
      }
    },
    [onNodeContextMenu]
  );

  const handleNodeDragStop: NodeDragHandler = useCallback(
    (_event, node) => {
      workflowStore.moveNode(node.id, node.position);
      workflowStore.pushHistory();
    },
    []
  );

  // Edge event handlers
  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (event, edge) => {
      workflowStore.selectEdge(edge.id, event.shiftKey);
      onEdgeSelect?.(edge.id);
    },
    [onEdgeSelect]
  );

  // Pane click (deselect)
  const handlePaneClick = useCallback(() => {
    workflowStore.deselectAll();
    onNodeSelect?.(null);
    onEdgeSelect?.(null);
  }, [onNodeSelect, onEdgeSelect]);

  // Viewport change
  const handleViewportChange = useCallback(
    (viewport: { x: number; y: number; zoom: number }) => {
      workflowStore.setViewport(viewport);
      onViewportChange?.(viewport);
    },
    [onViewportChange]
  );

  // Handle drop on canvas
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const data = event.dataTransfer.getData('application/kerdar-node');
      if (!data) return;

      try {
        const { type } = JSON.parse(data);
        const nodeType = nodeRegistry.getNodeType(type);
        if (!nodeType) return;

        // Use ReactFlow's screenToFlowPosition to get correct coordinates
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNode = nodeRegistry.createNodeInstance(type, position);
        if (newNode) {
          workflowStore.addNode(newNode);
        }
      } catch (e) {
        console.error('Failed to parse dropped node data:', e);
      }
    },
    [nodeRegistry, reactFlowInstance, workflowStore]
  );

  // Handle drag over on canvas
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected nodes/edges
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target) {
        const selectedNodeIds = workflowStore.selectedNodeIds;
        const selectedEdgeIds = workflowStore.selectedEdgeIds;

        if (selectedNodeIds.length > 0) {
          workflowStore.removeNodes(selectedNodeIds);
        }
        if (selectedEdgeIds.length > 0) {
          workflowStore.removeEdges(selectedEdgeIds);
        }
      }

      // Copy (Cmd/Ctrl + C)
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        workflowStore.copy();
      }

      // Paste (Cmd/Ctrl + V)
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        workflowStore.paste();
      }

      // Cut (Cmd/Ctrl + X)
      if ((e.metaKey || e.ctrlKey) && e.key === 'x') {
        workflowStore.cut();
      }

      // Undo (Cmd/Ctrl + Z)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        workflowStore.undo();
      }

      // Redo (Cmd/Ctrl + Shift + Z)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        workflowStore.redo();
      }

      // Select all (Cmd/Ctrl + A)
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        workflowStore.selectAll();
      }

      // Escape (deselect)
      if (e.key === 'Escape') {
        workflowStore.deselectAll();
        dialogStore.closeTop();
      }

      // Duplicate (Cmd/Ctrl + D)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        const selectedNodeIds = workflowStore.selectedNodeIds;
        if (selectedNodeIds.length > 0) {
          workflowStore.duplicateNodes(selectedNodeIds);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Notify parent of workflow changes
  useEffect(() => {
    if (workflowStore.isDirty) {
      onChange?.({
        ...workflowStore.workflow,
        nodes: fromReactFlowNodes(nodes),
        edges: fromReactFlowEdges(edges),
      });
    }
  }, [workflowStore.isDirty, nodes, edges, onChange]);

  // Imperative handle for ref
  useImperativeHandle(
    innerRef,
    () => ({
      getWorkflow: () => workflowStore.workflow,
      setWorkflow: (workflow: Workflow) => workflowStore.setWorkflow(workflow),
      addNode: (type: string, position?: Position) => {
        const node = nodeRegistry.createNodeInstance(type, position);
        if (node) {
          workflowStore.addNode(node);
        }
        return node!;
      },
      removeNode: (nodeId: string) => workflowStore.removeNode(nodeId),
      updateNode: (nodeId: string, updates: Partial<WorkflowNode>) =>
        workflowStore.updateNode(nodeId, updates),
      selectNode: (nodeId: string) => workflowStore.selectNode(nodeId),
      deselectAll: () => workflowStore.deselectAll(),
      fitView: () => reactFlowInstance.fitView(),
      zoomTo: (zoom: number) => reactFlowInstance.zoomTo(zoom),
      getViewport: () => reactFlowInstance.getViewport(),
      setViewport: (viewport: WorkflowViewport) =>
        reactFlowInstance.setViewport(viewport),
      execute: async (options) => {
        if (executionEngine?.execute) {
          return await executionEngine.execute(workflowStore.workflow, options);
        }
        throw new Error('No execution engine configured');
      },
      openDialog: (config: DialogConfig) => dialogStore.open(config),
      closeDialog: (id: string) => dialogStore.close(id),
      undo: () => workflowStore.undo(),
      redo: () => workflowStore.redo(),
      canUndo: () => workflowStore.canUndo(),
      canRedo: () => workflowStore.canRedo(),
      exportWorkflow: () => JSON.stringify(workflowStore.workflow, null, 2),
      importWorkflow: (json: string) => {
        try {
          const workflow = JSON.parse(json);
          workflowStore.setWorkflow(workflow);
        } catch (error) {
          onError?.(error as Error);
        }
      },
    }),
    [workflowStore, nodeRegistry, reactFlowInstance, executionEngine, dialogStore, onError]
  );

  // Theme
  const effectiveMode = themeStore.getEffectiveMode();

  // Feature toggles
  const features = whiteLabel?.features ?? {};
  const showMinimap = features.showMinimap ?? true;
  const showControls = features.showControls ?? true;

  return (
    <div
      ref={containerRef}
      className={cn(
        'workflow-designer',
        'w-full h-full relative',
        effectiveMode === 'dark' && 'dark',
        className
      )}
      style={style}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={customEdgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeContextMenu={handleNodeContextMenu}
        onNodeDragStop={handleNodeDragStop}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onMoveEnd={(_event, viewport) => handleViewportChange(viewport)}
        defaultViewport={defaultViewport}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{
          stroke: 'var(--kd-edge-color, #94A3B8)',
          strokeWidth: 2,
        }}
        snapToGrid
        snapGrid={[15, 15]}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode={readOnly ? null : ['Delete', 'Backspace']}
        multiSelectionKeyCode={['Shift']}
        selectionKeyCode={['Shift']}
        panOnDrag={[1, 2]}
        selectionOnDrag
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        minZoom={0.1}
        maxZoom={4}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        className={cn(
          'bg-gray-50 dark:bg-slate-900',
          readOnly && 'pointer-events-none'
        )}
      >
        {/* Background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={effectiveMode === 'dark' ? '#334155' : '#E2E8F0'}
        />

        {/* Controls */}
        {showControls && (
          <Controls
            showZoom
            showFitView
            showInteractive={false}
            position="bottom-right"
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg"
          />
        )}

        {/* Minimap */}
        {showMinimap && (
          <MiniMap
            position="bottom-right"
            style={{
              marginBottom: showControls ? 50 : 10,
            }}
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg"
            maskColor={effectiveMode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'}
            nodeColor={(node) => {
              const nodeType = nodeRegistry.getNodeType(node.data?.type);
              if (nodeType?.iconColor) return nodeType.iconColor;
              return effectiveMode === 'dark' ? '#64748B' : '#94A3B8';
            }}
          />
        )}

        {/* Custom panels */}
        {children}
      </ReactFlow>

      {/* Dialogs */}
      <DialogsRenderer />
    </div>
  );
});

InnerWorkflowDesigner.displayName = 'InnerWorkflowDesigner';

/**
 * Dialogs renderer component
 */
const DialogsRenderer = memo(() => {
  const dialogs = useDialogStore((state) => state.dialogs);
  const dialogStore = useDialogStore();
  const workflowStore = useWorkflowStore();
  const executionStore = useExecutionStore();
  const credentialStore = useCredentialStore();
  const isExecuting = executionStore.isExecuting;

  // Credential editor state
  const [credentialEditorState, setCredentialEditorState] = useState<{
    isOpen: boolean;
    credentialType: CredentialTypeDefinition | null;
    nodeId: string | null;
    credentialTypeName: string | null;
  }>({
    isOpen: false,
    credentialType: null,
    nodeId: null,
    credentialTypeName: null,
  });
  const [isSavingCredential, setIsSavingCredential] = useState(false);

  // Get credentials from store
  const credentials = credentialStore.credentials;

  /**
   * Get available credentials for a node, organized by credential type
   */
  const getAvailableCredentialsForNode = useCallback((nodeType: { credentials?: Array<{ name: string }> }): Record<string, Credential[]> => {
    if (!nodeType.credentials) return {};

    const result: Record<string, Credential[]> = {};
    nodeType.credentials.forEach((credConfig) => {
      result[credConfig.name] = credentials.filter((c) => c.type === credConfig.name);
    });
    return result;
  }, [credentials]);

  /**
   * Handle credential change for a node
   */
  const handleCredentialChange = useCallback((nodeId: string, credentialType: string, credential: NodeCredential | undefined) => {
    const node = workflowStore.getNode(nodeId);
    if (!node) return;

    const newCredentials = { ...(node.credentials || {}) };
    if (credential) {
      newCredentials[credentialType] = credential;
    } else {
      delete newCredentials[credentialType];
    }

    workflowStore.updateNode(nodeId, { credentials: newCredentials });
  }, [workflowStore]);

  /**
   * Handle create new credential request
   */
  const handleCreateCredential = useCallback((nodeId: string, credentialTypeName: string) => {
    const credentialType = credentialStore.getCredentialType(credentialTypeName);
    if (!credentialType) {
      console.error(`Credential type not found: ${credentialTypeName}`);
      return;
    }

    setCredentialEditorState({
      isOpen: true,
      credentialType,
      nodeId,
      credentialTypeName,
    });
  }, [credentialStore]);

  /**
   * Handle save credential
   */
  const handleSaveCredential = useCallback(async (name: string, data: CredentialData) => {
    const { credentialType, nodeId, credentialTypeName } = credentialEditorState;
    if (!credentialType) return;

    setIsSavingCredential(true);
    try {
      // Add the new credential
      const newCredential = await credentialStore.addCredential({
        name,
        type: credentialType.name,
        data,
      });

      // Automatically select it for the node
      if (nodeId && credentialTypeName) {
        handleCredentialChange(nodeId, credentialTypeName, {
          id: newCredential.id,
          name: newCredential.name,
        });
      }

      // Close the editor
      setCredentialEditorState({
        isOpen: false,
        credentialType: null,
        nodeId: null,
        credentialTypeName: null,
      });
    } catch (error) {
      console.error('Failed to save credential:', error);
    } finally {
      setIsSavingCredential(false);
    }
  }, [credentialEditorState, credentialStore, handleCredentialChange]);

  /**
   * Handle close credential editor
   */
  const handleCloseCredentialEditor = useCallback(() => {
    setCredentialEditorState({
      isOpen: false,
      credentialType: null,
      nodeId: null,
      credentialTypeName: null,
    });
  }, []);

  /**
   * Run workflow to get real data for the INPUT panel
   */
  const handleRunWorkflow = useCallback(async () => {
    if (isExecuting) return;

    try {
      // Execute the workflow to populate nodeOutputData
      await executeWorkflow(workflowStore.workflow, {
        mode: 'manual',
        onProgress: (nodeId, status) => {
          console.log(`[Execution] Node ${nodeId}: ${status}`);
        },
      });
    } catch (error) {
      console.error('Workflow execution failed:', error);
    }
  }, [workflowStore.workflow, isExecuting]);

  /**
   * Get input data from upstream nodes for expression intellisense
   * Uses real execution data if available, otherwise generates from schema
   */
  const getInputDataForNode = useCallback((nodeId: string): { data: InputDataItem[]; sourceName?: string; hasRealData: boolean } => {
    // Find incoming edges to this node
    const incomingEdges = workflowStore.workflow.edges.filter(
      (edge) => edge.target === nodeId
    );

    if (incomingEdges.length === 0) {
      return { data: [], sourceName: undefined, hasRealData: false };
    }

    // Get the first source node
    const sourceEdge = incomingEdges[0];
    const sourceNode = workflowStore.workflow.nodes.find(
      (n) => n.id === sourceEdge.source
    );

    if (!sourceNode) {
      return { data: [], sourceName: undefined, hasRealData: false };
    }

    // Check if we have real execution data from the source node
    const realOutputData = executionStore.nodeOutputData[sourceNode.id];
    if (realOutputData && realOutputData[0] && realOutputData[0].length > 0) {
      // Get the correct output based on the edge's source handle
      const outputIndex = sourceEdge.sourceHandle
        ? parseInt(sourceEdge.sourceHandle.replace('output-', ''), 10)
        : 0;

      const outputData = realOutputData[outputIndex] ?? realOutputData[0];
      const inputData: InputDataItem[] = outputData.map((item) => ({
        json: item.json,
        binary: item.binary,
      }));

      return { data: inputData, sourceName: sourceNode.name, hasRealData: true };
    }

    // Use schema context to generate mock data based on upstream node's output schema
    const schemaStore = useSchemaContextStore.getState();
    const schemaContext = schemaStore.getSchemaContext(nodeId);

    if (schemaContext && schemaContext.inputSchemas.length > 0) {
      // We have schema info from upstream node(s)
      const mockData = schemaStore.getMockData(nodeId);
      if (mockData && Object.keys(mockData).length > 0) {
        const schemaBasedData: InputDataItem[] = [{ json: mockData }];
        return { data: schemaBasedData, sourceName: sourceNode.name, hasRealData: false };
      }
    }

    // No schema available - return empty data with message
    // The UI should show "No input data" and suggest running the workflow
    return { data: [], sourceName: sourceNode.name, hasRealData: false };
  }, [workflowStore.workflow.edges, workflowStore.workflow.nodes, executionStore.nodeOutputData]);

  return (
    <>
      {dialogs.map((dialog) => {
        if (dialog.type === DialogType.Parameters) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const config = dialog as any;
          const { data: inputData, sourceName, hasRealData } = getInputDataForNode(config.node.id);
          const availableCredentials = getAvailableCredentialsForNode(config.nodeType);

          return (
            <NodeDetailsView
              key={dialog.id}
              open={true}
              node={config.node}
              nodeType={config.nodeType}
              currentParameters={config.currentParameters}
              inputData={inputData}
              sourceNodeName={sourceName}
              isSampleData={!hasRealData}
              availableCredentials={availableCredentials}
              onCredentialChange={(credentialType, credential) => {
                handleCredentialChange(config.node.id, credentialType, credential);
              }}
              onCreateCredential={(credentialType) => {
                handleCreateCredential(config.node.id, credentialType);
              }}
              onNameChange={(newName) => {
                workflowStore.updateNode(config.node.id, { name: newName });
              }}
              onSave={(parameters, settings) => {
                // Save parameters
                config.onSave?.(parameters);
                // Apply settings to node
                workflowStore.updateNode(config.node.id, {
                  name: settings.name,
                  alwaysOutputData: settings.alwaysOutputData,
                  executeOnce: settings.executeOnce,
                  retryOnFail: settings.retryOnFail,
                  maxTries: settings.maxTries,
                  waitBetweenTries: settings.waitBetweenTries,
                  continueOnFail: settings.continueOnFail,
                  notes: settings.notes,
                  color: settings.color,
                });
              }}
              onClose={() => dialogStore.close(dialog.id)}
              onExecute={config.onExecute}
              onRunWorkflow={handleRunWorkflow}
            />
          );
        }

        // Add other dialog types here...

        return null;
      })}

      {/* Credential Editor Modal */}
      {credentialEditorState.isOpen && credentialEditorState.credentialType && (
        <CredentialEditor
          credentialType={credentialEditorState.credentialType}
          onSave={handleSaveCredential}
          onClose={handleCloseCredentialEditor}
          isSaving={isSavingCredential}
        />
      )}
    </>
  );
});

DialogsRenderer.displayName = 'DialogsRenderer';

/**
 * Main WorkflowDesigner component
 * Wraps the inner component with ReactFlowProvider
 */
export const WorkflowDesigner = forwardRef<WorkflowDesignerRef, WorkflowDesignerProps>(
  (props, ref) => {
    return (
      <ReactFlowProvider>
        <InnerWorkflowDesigner {...props} innerRef={ref} />
      </ReactFlowProvider>
    );
  }
);

WorkflowDesigner.displayName = 'WorkflowDesigner';

export default WorkflowDesigner;
