import { useEffect, useCallback, useState, useRef } from 'react';
import {
  WorkflowDesigner,
  NodeSidebar,
  ExecutionHistory,
  registerNodes,
  useWorkflowStore,
  useExecutionStore,
  useNodeRegistryStore,
  useThemeMode,
  useThemeActions,
  type Workflow,
  type WorkflowDesignerProps,
  type WorkflowDesignerRef,
  type NodeTypeDefinition,
  type ExecutionRecord,
  ThemeMode,
  ExecutionOrderVersion,
  DataSaveMode,
  ExecutionMode,
} from '@kerdar/core';
import {
  standardNodes,
  registerStandardNodes,
} from '@kerdar/nodes-standard';

// Sample workflow for demonstration
const sampleWorkflow: Workflow = {
  id: 'demo-workflow-1',
  name: 'Sample API Workflow',
  nodes: [
    {
      id: 'node-1',
      type: 'manual-trigger',
      name: 'Start',
      position: { x: 150, y: 200 },
      parameters: {},
    },
    {
      id: 'node-2',
      type: 'http-request',
      name: 'Fetch Data',
      position: { x: 400, y: 200 },
      parameters: {
        url: 'https://jsonplaceholder.typicode.com/posts',
        method: 'GET',
      },
    },
    {
      id: 'node-3',
      type: 'if',
      name: 'Filter Posts',
      position: { x: 650, y: 200 },
      parameters: {
        conditions: {
          conditions: [
            {
              value1: '={{ $json.userId }}',
              operation: 'equals',
              value2: '1',
            },
          ],
        },
        combineConditions: 'and',
      },
    },
    {
      id: 'node-4',
      type: 'set-variable',
      name: 'Transform Data',
      position: { x: 900, y: 150 },
      parameters: {
        mode: 'keep',
        fields: 'id, title',
      },
    },
    {
      id: 'node-5',
      type: 'no-op',
      name: 'Discarded',
      position: { x: 900, y: 300 },
      parameters: {},
    },
  ],
  edges: [
    {
      id: 'edge-1-2',
      source: 'node-1',
      target: 'node-2',
      sourceHandle: 'output-0',
      targetHandle: 'input-0',
    },
    {
      id: 'edge-2-3',
      source: 'node-2',
      target: 'node-3',
      sourceHandle: 'output-0',
      targetHandle: 'input-0',
    },
    {
      id: 'edge-3-4',
      source: 'node-3',
      target: 'node-4',
      sourceHandle: 'output-0',
      targetHandle: 'input-0',
    },
    {
      id: 'edge-3-5',
      source: 'node-3',
      target: 'node-5',
      sourceHandle: 'output-1',
      targetHandle: 'input-0',
    },
  ],
  settings: {
    executionOrder: ExecutionOrderVersion.V1,
    saveDataErrorExecution: DataSaveMode.All,
    saveDataSuccessExecution: DataSaveMode.All,
    saveManualExecutions: true,
    callerPolicy: 'workflowsFromSameOwner',
    errorWorkflow: '',
    timezone: 'UTC',
  },
  tags: [],
  active: false,
  version: '1.0.0',
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

function App() {
  const [isReady, setIsReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const designerRef = useRef<WorkflowDesignerRef>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { setWorkflow, workflow, addNode } = useWorkflowStore();
  const { isExecuting, startExecution, cancelExecution } = useExecutionStore();
  const { createNodeInstance, getNodeType } = useNodeRegistryStore();
  const mode = useThemeMode();
  const { setMode } = useThemeActions();

  // Register standard nodes on mount
  useEffect(() => {
    registerStandardNodes((node) => registerNodes([node]));
    setIsReady(true);
  }, []);

  // Load sample workflow
  useEffect(() => {
    if (isReady) {
      setWorkflow(sampleWorkflow);
    }
  }, [isReady, setWorkflow]);

  // Apply theme class to document
  useEffect(() => {
    const isDark = mode === ThemeMode.Dark ||
      (mode === ThemeMode.System && window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.documentElement.classList.toggle('dark', isDark);
  }, [mode]);

  // Handle workflow change
  const handleWorkflowChange = useCallback((updatedWorkflow: Workflow) => {
    console.log('Workflow updated:', updatedWorkflow);
  }, []);

  // Handle execute button click
  const handleExecuteClick = useCallback(() => {
    if (isExecuting) {
      cancelExecution();
    } else if (workflow) {
      startExecution(`exec-${Date.now()}`, ExecutionMode.Manual);
    }
  }, [isExecuting, workflow, startExecution, cancelExecution]);

  // Handle save button click
  const handleSaveClick = useCallback(() => {
    console.log('Workflow saved:', workflow);
    alert('Workflow saved to console!');
  }, [workflow]);

  // Handle theme toggle
  const handleThemeToggle = useCallback(() => {
    setMode(mode === ThemeMode.Dark ? ThemeMode.Light : ThemeMode.Dark);
  }, [mode, setMode]);

  // Handle node click from sidebar - add node to canvas
  const handleNodeClick = useCallback((nodeType: NodeTypeDefinition) => {
    const newNode = createNodeInstance(nodeType.type, {
      x: 400 + Math.random() * 200,
      y: 150 + Math.random() * 200,
    });
    if (newNode) {
      addNode(newNode);
    }
  }, [createNodeInstance, addNode]);

  // Handle drag start from sidebar
  const handleNodeDragStart = useCallback((nodeType: NodeTypeDefinition, event: React.DragEvent) => {
    event.dataTransfer.setData('application/kerdar-node', JSON.stringify({
      type: nodeType.type,
      name: nodeType.name,
    }));
    event.dataTransfer.effectAllowed = 'copy';
  }, []);

  // Mock execution history fetch
  const handleFetchHistory = useCallback(async (): Promise<ExecutionRecord[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Return mock data
    const statuses: ExecutionRecord['status'][] = ['success', 'error', 'success', 'success', 'error'];
    const modes: ExecutionRecord['mode'][] = ['manual', 'webhook', 'schedule', 'manual', 'webhook'];

    return Array.from({ length: 8 }, (_, i) => {
      const startTime = new Date(Date.now() - i * 3600000 - Math.random() * 1800000);
      const duration = Math.floor(Math.random() * 5000) + 500;
      const status = statuses[i % statuses.length];

      return {
        id: `exec-${Date.now() - i * 1000}-${Math.random().toString(36).substr(2, 9)}`,
        workflowId: 'demo-workflow-1',
        workflowName: 'Sample API Workflow',
        status,
        startedAt: startTime.toISOString(),
        finishedAt: new Date(startTime.getTime() + duration).toISOString(),
        duration,
        mode: modes[i % modes.length],
        error: status === 'error' ? 'Connection timeout: Failed to connect to external API' : undefined,
        nodeResults: [
          { nodeId: 'node-1', nodeName: 'Start', status: 'success', duration: 10, outputItems: 1 },
          { nodeId: 'node-2', nodeName: 'Fetch Data', status: status === 'error' && i % 2 === 1 ? 'error' : 'success', duration: duration - 100, outputItems: status === 'error' ? 0 : 25 },
          { nodeId: 'node-3', nodeName: 'Filter Posts', status: status === 'error' ? 'skipped' : 'success', duration: 50, outputItems: status === 'error' ? 0 : 10 },
        ],
      };
    });
  }, []);

  // Handle execution selection
  const handleExecutionSelect = useCallback((execution: ExecutionRecord) => {
    console.log('Selected execution:', execution);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Kerdar...</p>
        </div>
      </div>
    );
  }

  const designerProps: WorkflowDesignerProps = {
    workflow: workflow || sampleWorkflow,
    onChange: handleWorkflowChange,
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 dark:bg-slate-900">
      {/* Header */}
      <header className="h-14 border-b border-border bg-background flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src="/kerdar.svg" alt="Kerdar" className="h-8 w-8" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Kerdar</h1>
            <p className="text-xs text-muted-foreground">Workflow Designer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {workflow?.name || 'Untitled Workflow'}
          </span>
          {workflow?.active && (
            <span className="px-2 py-0.5 text-xs bg-green-500/10 text-green-600 rounded-full">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExecuteClick}
            className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            {isExecuting ? (
              <>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Stop
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Execute
              </>
            )}
          </button>
          <button
            onClick={handleSaveClick}
            className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Save
          </button>
          <button
            onClick={handleThemeToggle}
            className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            {mode === ThemeMode.Dark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex">
        {/* Node Sidebar */}
        <NodeSidebar
          onNodeClick={handleNodeClick}
          onNodeDragStart={handleNodeDragStart}
          collapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
        />

        {/* Workflow Canvas - drop is handled by WorkflowDesigner internally */}
        <div ref={canvasRef} className="flex-1 relative">
          <WorkflowDesigner ref={designerRef} {...designerProps} />

          {/* Zoom controls hint */}
          <div className="absolute bottom-4 left-4 text-xs text-gray-400 dark:text-gray-600 pointer-events-none">
            Scroll to zoom • Drag to pan • Double-click to configure
          </div>
        </div>

        {/* Execution History */}
        <ExecutionHistory
          onFetchHistory={handleFetchHistory}
          onExecutionSelect={handleExecutionSelect}
          collapsed={historyCollapsed}
          onCollapseChange={setHistoryCollapsed}
        />
      </main>

      {/* Footer */}
      <footer className="h-8 border-t border-border bg-background flex items-center px-4 justify-between text-xs text-muted-foreground shrink-0">
        <div className="flex items-center gap-4">
          <span>Nodes: {workflow?.nodes.length || 0}</span>
          <span>Connections: {workflow?.edges.length || 0}</span>
          <span>Registered: {standardNodes.length} node types</span>
        </div>
        <div className="flex items-center gap-4">
          {isExecuting && (
            <span className="flex items-center gap-1 text-green-600">
              <span className="animate-pulse">●</span> Executing...
            </span>
          )}
          <span>v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
