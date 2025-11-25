import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import {
  X, Play, Save, Settings, FileText, ChevronLeft, ChevronRight,
  Loader2, GripVertical, Maximize2, Minimize2, KeyRound,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { NodeIcon } from '../Nodes/NodeIcon';
import { InputDataPanel, type InputDataItem } from './InputDataPanel';
import { ParameterInput } from './ParameterInput';
import { CredentialSelect } from './CredentialSelect';
import type { ExpressionContext } from './ExpressionEditor';
import type { WorkflowNode, NodeTypeDefinition, Credential, NodeCredential } from '../../types';

/**
 * Props for NodeDetailsView
 */
export interface NodeDetailsViewProps {
  /** Whether the NDV is open */
  open: boolean;
  /** Node being configured */
  node: WorkflowNode;
  /** Node type definition */
  nodeType: NodeTypeDefinition;
  /** Current parameter values */
  currentParameters: Record<string, unknown>;
  /** Input data from previous nodes */
  inputData?: InputDataItem[];
  /** Source node name for input data */
  sourceNodeName?: string;
  /** Whether showing sample data instead of real execution data */
  isSampleData?: boolean;
  /** Available credentials */
  availableCredentials?: Record<string, Credential[]>;
  /** Called when credential selection changes */
  onCredentialChange?: (credentialType: string, credential: NodeCredential | undefined) => void;
  /** Called when user wants to create new credential */
  onCreateCredential?: (credentialType: string) => void;
  /** Called when node name changes */
  onNameChange?: (newName: string) => void;
  /** Called when parameters are saved */
  onSave?: (parameters: Record<string, unknown>, settings: NodeSettings) => void;
  /** Called when cancel/close is clicked */
  onClose?: () => void;
  /** Called when execute is clicked */
  onExecute?: () => void;
  /** Called to run workflow to get input data */
  onRunWorkflow?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Node settings
 */
interface NodeSettings {
  name: string;
  alwaysOutputData: boolean;
  executeOnce: boolean;
  retryOnFail: boolean;
  maxTries: number;
  waitBetweenTries: number;
  continueOnFail: boolean;
  notes: string;
  color: string;
}

/**
 * NodeDetailsView - n8n-style Node Details View with INPUT | PARAMETERS | OUTPUT panels
 */
export const NodeDetailsView = memo<NodeDetailsViewProps>(({
  open,
  node,
  nodeType,
  currentParameters,
  inputData = [],
  sourceNodeName,
  isSampleData = false,
  availableCredentials = {},
  onCredentialChange,
  onCreateCredential,
  onNameChange,
  onSave,
  onClose,
  onExecute,
  onRunWorkflow,
  className,
}) => {
  // Panel visibility
  const [showInputPanel, setShowInputPanel] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'parameters' | 'settings' | 'notes'>('parameters');

  // Parameters state
  const [parameters, setParameters] = useState<Record<string, unknown>>(() => ({
    ...currentParameters,
  }));

  // Settings state
  const [settings, setSettings] = useState<NodeSettings>({
    name: node.name,
    alwaysOutputData: node.alwaysOutputData ?? false,
    executeOnce: node.executeOnce ?? false,
    retryOnFail: node.retryOnFail ?? false,
    maxTries: node.maxTries ?? 3,
    waitBetweenTries: node.waitBetweenTries ?? 1000,
    continueOnFail: node.continueOnFail ?? false,
    notes: node.notes ?? '',
    color: node.color ?? '',
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [dragOverField, setDragOverField] = useState<string | null>(null);

  // Reset state when node changes
  useEffect(() => {
    setParameters({ ...currentParameters });
    setSettings({
      name: node.name,
      alwaysOutputData: node.alwaysOutputData ?? false,
      executeOnce: node.executeOnce ?? false,
      retryOnFail: node.retryOnFail ?? false,
      maxTries: node.maxTries ?? 3,
      waitBetweenTries: node.waitBetweenTries ?? 1000,
      continueOnFail: node.continueOnFail ?? false,
      notes: node.notes ?? '',
      color: node.color ?? '',
    });
    setIsDirty(false);
  }, [node, currentParameters]);

  // Expression context from input data
  const expressionContext: ExpressionContext = useMemo(() => ({
    $json: inputData[0]?.json ?? {},
    $input: {
      all: () => inputData.map(i => i.json),
      first: () => inputData[0]?.json ?? {},
      last: () => inputData[inputData.length - 1]?.json ?? {},
    },
    $item: inputData[0]?.json ?? {},
    $workflow: { id: 'workflow-1', name: 'My Workflow' },
    $now: new Date(),
    $today: new Date(new Date().setHours(0, 0, 0, 0)),
    $executionId: 'exec-1',
  }), [inputData]);

  // Filter visible properties based on displayOptions
  const visibleProperties = useMemo(() => {
    return nodeType.properties.filter((prop) => {
      if (!prop.displayOptions) return true;

      const { show, hide } = prop.displayOptions;

      if (show) {
        for (const [field, values] of Object.entries(show)) {
          const currentValue = parameters[field];
          // Compare as strings to handle enum values properly
          const stringValues = values.map((v) => String(v));
          const stringCurrentValue = currentValue !== undefined ? String(currentValue) : undefined;
          if (!stringValues.includes(stringCurrentValue as string)) {
            return false;
          }
        }
      }

      if (hide) {
        for (const [field, values] of Object.entries(hide)) {
          const currentValue = parameters[field];
          // Compare as strings to handle enum values properly
          const stringValues = values.map((v) => String(v));
          const stringCurrentValue = currentValue !== undefined ? String(currentValue) : undefined;
          if (stringValues.includes(stringCurrentValue as string)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [nodeType.properties, parameters]);

  // Filter visible credentials based on displayOptions
  const visibleCredentials = useMemo(() => {
    if (!nodeType.credentials) return [];

    return nodeType.credentials.filter((cred) => {
      if (!cred.displayOptions) return true;

      const { show, hide } = cred.displayOptions;

      if (show) {
        for (const [field, values] of Object.entries(show)) {
          const currentValue = parameters[field];
          // Compare as strings to handle enum values properly
          const stringValues = values.map((v) => String(v));
          const stringCurrentValue = currentValue !== undefined ? String(currentValue) : undefined;
          if (!stringValues.includes(stringCurrentValue as string)) {
            return false;
          }
        }
      }

      if (hide) {
        for (const [field, values] of Object.entries(hide)) {
          const currentValue = parameters[field];
          // Compare as strings to handle enum values properly
          const stringValues = values.map((v) => String(v));
          const stringCurrentValue = currentValue !== undefined ? String(currentValue) : undefined;
          if (stringValues.includes(stringCurrentValue as string)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [nodeType.credentials, parameters]);

  // Handle credential change
  const handleCredentialChange = useCallback((credentialType: string, credential: NodeCredential | undefined) => {
    onCredentialChange?.(credentialType, credential);
    setIsDirty(true);
  }, [onCredentialChange]);

  // Handlers
  const handleParameterChange = useCallback((name: string, value: unknown) => {
    setParameters((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  }, []);

  const handleSettingsChange = useCallback((name: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      await onSave?.(parameters, settings);
      setIsDirty(false);
      onClose?.();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsLoading(false);
    }
  }, [parameters, settings, onSave, onClose]);

  const handleExecute = useCallback(async () => {
    setIsLoading(true);
    try {
      await onSave?.(parameters, settings);
      await onExecute?.();
    } catch (error) {
      console.error('Failed to execute:', error);
    } finally {
      setIsLoading(false);
    }
  }, [parameters, settings, onSave, onExecute]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose, handleSave]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* NDV Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed z-50 bg-white dark:bg-slate-900',
              'shadow-2xl rounded-t-xl overflow-hidden',
              'flex flex-col',
              isFullscreen
                ? 'inset-0 rounded-none'
                : 'left-0 right-0 bottom-0 h-[85vh]',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
              <div className="flex items-center gap-3">
                {/* Node Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: nodeType.iconColor || '#64748B' }}
                >
                  <NodeIcon icon={nodeType.icon} color="#ffffff" className="w-4 h-4" />
                </div>

                {/* Node Name */}
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                    {settings.name || node.name}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {nodeType.displayName}
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                {onExecute && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExecute}
                    disabled={isLoading}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Test
                  </Button>
                )}

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500"
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Content - Split Panels */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* INPUT Panel */}
              {showInputPanel && (
                <>
                  <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <InputDataPanel
                      data={inputData}
                      sourceNodeName={sourceNodeName}
                      hasData={inputData.length > 0}
                      isSampleData={isSampleData}
                      onRunWorkflow={onRunWorkflow}
                      className="flex-1"
                    />
                  </div>

                  {/* Resize Handle */}
                  <div className="w-1 bg-gray-200 dark:bg-slate-700 hover:bg-blue-400 cursor-col-resize flex items-center justify-center group">
                    <GripVertical className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
                  </div>
                </>
              )}

              {/* Toggle INPUT Panel Button */}
              <button
                onClick={() => setShowInputPanel(!showInputPanel)}
                className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 z-10',
                  'p-1 rounded-r-lg',
                  'bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600',
                  'text-gray-500',
                  showInputPanel && 'left-[320px]'
                )}
                title={showInputPanel ? 'Hide input panel' : 'Show input panel'}
              >
                {showInputPanel ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {/* PARAMETERS Panel */}
              <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                {/* Tabs */}
                <Tabs.Root
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as typeof activeTab)}
                  className="flex-1 flex flex-col min-h-0"
                >
                  <Tabs.List className="flex gap-1 px-4 py-2 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <Tabs.Trigger
                      value="parameters"
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                        activeTab === 'parameters'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                      )}
                    >
                      Parameters
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="settings"
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1',
                        activeTab === 'settings'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                      )}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="notes"
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1',
                        activeTab === 'notes'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                      )}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Notes
                    </Tabs.Trigger>
                  </Tabs.List>

                  {/* Parameters Tab */}
                  <Tabs.Content value="parameters" className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
                    {/* Credentials Section */}
                    {visibleCredentials.length > 0 && (
                      <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <KeyRound className="w-4 h-4" />
                          Credentials
                        </div>
                        {visibleCredentials.map((credConfig) => (
                          <CredentialSelect
                            key={credConfig.name}
                            credentialConfig={credConfig}
                            selectedCredential={node.credentials?.[credConfig.name]}
                            availableCredentials={availableCredentials[credConfig.name] || []}
                            onChange={(cred) => handleCredentialChange(credConfig.name, cred)}
                            onCreateNew={onCreateCredential ? () => onCreateCredential(credConfig.name) : undefined}
                          />
                        ))}
                      </div>
                    )}

                    {/* Parameters Section */}
                    {visibleProperties.length === 0 && visibleCredentials.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <p className="text-sm">This node has no configurable parameters.</p>
                      </div>
                    ) : (
                      visibleProperties.map((property) => (
                        <ParameterInput
                          key={property.name}
                          property={property}
                          value={parameters[property.name]}
                          onChange={(value) => handleParameterChange(property.name, value)}
                          expressionContext={expressionContext}
                          nodeId={node.id}
                          allValues={parameters}
                          onOtherParameterChange={handleParameterChange}
                          isDragOver={dragOverField === property.name}
                          onDragEnter={() => setDragOverField(property.name)}
                          onDragLeave={() => setDragOverField(null)}
                          onDrop={() => setDragOverField(null)}
                        />
                      ))
                    )}
                  </Tabs.Content>

                  {/* Settings Tab */}
                  <Tabs.Content value="settings" className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
                    {/* Node Name */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Node Name
                      </label>
                      <input
                        type="text"
                        value={settings.name}
                        onChange={(e) => {
                          handleSettingsChange('name', e.target.value);
                          // Call onNameChange immediately for real-time update
                          if (e.target.value.trim()) {
                            onNameChange?.(e.target.value.trim());
                          }
                        }}
                        className={cn(
                          'w-full px-3 py-2 rounded-lg text-sm',
                          'border border-gray-300 dark:border-slate-600',
                          'bg-white dark:bg-slate-700',
                          'text-gray-900 dark:text-gray-100',
                          'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        )}
                        placeholder="Enter node name..."
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        A unique name for this node in the workflow
                      </p>
                    </div>

                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4" />

                    <SettingsToggle
                      label="Always Output Data"
                      description="Output data even if the node fails or returns empty data"
                      checked={settings.alwaysOutputData}
                      onChange={(v) => handleSettingsChange('alwaysOutputData', v)}
                    />
                    <SettingsToggle
                      label="Execute Once"
                      description="Execute the node only once, regardless of how many items are in the input"
                      checked={settings.executeOnce}
                      onChange={(v) => handleSettingsChange('executeOnce', v)}
                    />
                    <SettingsToggle
                      label="Retry On Fail"
                      description="Automatically retry the node if it fails"
                      checked={settings.retryOnFail}
                      onChange={(v) => handleSettingsChange('retryOnFail', v)}
                    />
                    {settings.retryOnFail && (
                      <div className="ml-6 space-y-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Max Tries
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={settings.maxTries}
                            onChange={(e) => handleSettingsChange('maxTries', parseInt(e.target.value))}
                            className={cn(
                              'w-full px-3 py-2 rounded-lg text-sm',
                              'border border-gray-300 dark:border-slate-600',
                              'bg-white dark:bg-slate-700',
                              'focus:ring-2 focus:ring-blue-500'
                            )}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Wait Between Tries (ms)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={100}
                            value={settings.waitBetweenTries}
                            onChange={(e) => handleSettingsChange('waitBetweenTries', parseInt(e.target.value))}
                            className={cn(
                              'w-full px-3 py-2 rounded-lg text-sm',
                              'border border-gray-300 dark:border-slate-600',
                              'bg-white dark:bg-slate-700',
                              'focus:ring-2 focus:ring-blue-500'
                            )}
                          />
                        </div>
                      </div>
                    )}
                    <SettingsToggle
                      label="Continue On Fail"
                      description="Continue the workflow even if this node fails"
                      checked={settings.continueOnFail}
                      onChange={(v) => handleSettingsChange('continueOnFail', v)}
                    />
                  </Tabs.Content>

                  {/* Notes Tab */}
                  <Tabs.Content value="notes" className="flex-1 min-h-0 overflow-auto p-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={settings.notes}
                        onChange={(e) => handleSettingsChange('notes', e.target.value)}
                        placeholder="Add notes about this node..."
                        rows={8}
                        className={cn(
                          'w-full px-3 py-2 rounded-lg text-sm',
                          'border border-gray-300 dark:border-slate-600',
                          'bg-white dark:bg-slate-800',
                          'focus:ring-2 focus:ring-blue-500',
                          'resize-y'
                        )}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Add notes to help you or your team understand what this node does.
                      </p>
                    </div>
                  </Tabs.Content>
                </Tabs.Root>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                  <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading || !isDirty}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

NodeDetailsView.displayName = 'NodeDetailsView';

/**
 * Settings toggle component
 */
interface SettingsToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SettingsToggle({ label, description, checked, onChange }: SettingsToggleProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className={cn(
          'w-10 h-6 bg-gray-200 dark:bg-slate-600 rounded-full',
          'peer-checked:bg-blue-500',
          'transition-colors'
        )} />
        <div className={cn(
          'absolute left-1 top-1 w-4 h-4 bg-white rounded-full',
          'peer-checked:translate-x-4',
          'transition-transform shadow-sm'
        )} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {label}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </div>
      </div>
    </label>
  );
}

export default NodeDetailsView;
