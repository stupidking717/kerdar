import { useEffect, useCallback, useState, useRef } from 'react';
import {
  WorkflowDesigner,
  NodeSidebar,
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
      type: 'manualTrigger',
      name: 'Start',
      position: { x: 100, y: 200 },
      parameters: {},
    },
    {
      id: 'node-2',
      type: 'httpRequest',
      name: 'Fetch Data',
      position: { x: 350, y: 200 },
      parameters: {
        url: 'https://jsonplaceholder.typicode.com/posts',
        method: 'GET',
      },
    },
    {
      id: 'node-3',
      type: 'if',
      name: 'Filter Posts',
      position: { x: 600, y: 200 },
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
      type: 'setVariable',
      name: 'Transform Data',
      position: { x: 850, y: 150 },
      parameters: {
        mode: 'keep',
        fields: 'id, title',
      },
    },
    {
      id: 'node-5',
      type: 'noOp',
      name: 'Discarded',
      position: { x: 850, y: 300 },
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
  const designerRef = useRef<WorkflowDesignerRef>(null);
  const { setWorkflow, workflow, addNode } = useWorkflowStore();
  const { isExecuting, startExecution, cancelExecution } = useExecutionStore();
  const { createNodeInstance } = useNodeRegistryStore();
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
      x: 400 + Math.random() * 100,
      y: 200 + Math.random() * 100,
    });
    if (newNode) {
      addNode(newNode);
    }
  }, [createNodeInstance, addNode]);

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
    <div className="h-screen w-screen flex flex-col">
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
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            {isExecuting ? 'Stop' : 'Execute'}
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
            {mode === ThemeMode.Dark ? 'Light' : 'Dark'}
          </button>
          <a
            href="https://github.com/your-org/kerdar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex">
        {/* Node Sidebar */}
        <NodeSidebar
          onNodeClick={handleNodeClick}
          collapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
        />

        {/* Workflow Canvas */}
        <div className="flex-1">
          <WorkflowDesigner ref={designerRef} {...designerProps} />
        </div>
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
            <span className="flex items-center gap-1 text-status-running">
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
