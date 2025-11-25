import { memo, useState, useCallback, useMemo } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Settings, FileText, Play, Save, Loader2 } from 'lucide-react';
import { BaseDialog } from './BaseDialog';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { CodeEditor } from '../ui/CodeEditor';
import type {
  WorkflowNode,
  NodeTypeDefinition,
  NodeProperty,
  Credential,
} from '../../types';
import { DialogSize, PropertyType } from '../../types';
import { useDialogStore } from '../../store/dialog-store';
import { NodeIcon } from '../Nodes/NodeIcon';

/**
 * Props for NodeParametersDialog
 */
export interface NodeParametersDialogProps {
  /** Dialog ID */
  id: string;

  /** Whether dialog is open */
  open: boolean;

  /** Node being configured */
  node: WorkflowNode;

  /** Node type definition */
  nodeType: NodeTypeDefinition;

  /** Current parameter values */
  currentParameters: Record<string, unknown>;

  /** Available credentials */
  availableCredentials?: Record<string, Credential[]>;

  /** Title override */
  title?: string;

  /** Initial tab */
  initialTab?: 'parameters' | 'settings' | 'notes';

  /** Called when parameters are saved */
  onSave?: (parameters: Record<string, unknown>) => void;

  /** Called when cancel is clicked */
  onCancel?: () => void;

  /** Called when execute is clicked */
  onExecute?: () => void;

  /** Called when dialog closes */
  onClose?: () => void;
}

/**
 * Node parameters dialog - main dialog for configuring node parameters
 * Similar to n8n's node configuration panel
 */
export const NodeParametersDialog = memo<NodeParametersDialogProps>(({
  id,
  open,
  node,
  nodeType,
  currentParameters,
  availableCredentials,
  title,
  initialTab = 'parameters',
  onSave,
  onCancel,
  onExecute,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [parameters, setParameters] = useState<Record<string, unknown>>(() => ({
    ...currentParameters,
  }));
  const [nodeSettings, setNodeSettings] = useState({
    alwaysOutputData: node.alwaysOutputData ?? false,
    executeOnce: node.executeOnce ?? false,
    retryOnFail: node.retryOnFail ?? false,
    maxTries: node.maxTries ?? 3,
    waitBetweenTries: node.waitBetweenTries ?? 1000,
    continueOnFail: node.continueOnFail ?? false,
    notes: node.notes ?? '',
    color: node.color ?? '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const dialogStore = useDialogStore();

  // Handle parameter change
  const handleParameterChange = useCallback((name: string, value: unknown) => {
    setParameters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setIsDirty(true);
  }, []);

  // Handle settings change
  const handleSettingsChange = useCallback((name: string, value: unknown) => {
    setNodeSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
    setIsDirty(true);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      await onSave?.(parameters);
      setIsDirty(false);
      onClose?.();
      dialogStore.close(id);
    } catch (error) {
      console.error('Failed to save parameters:', error);
    } finally {
      setIsLoading(false);
    }
  }, [parameters, onSave, onClose, dialogStore, id]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onCancel?.();
    onClose?.();
    dialogStore.close(id);
  }, [onCancel, onClose, dialogStore, id]);

  // Handle execute
  const handleExecute = useCallback(async () => {
    setIsLoading(true);
    try {
      await onSave?.(parameters);
      await onExecute?.();
    } catch (error) {
      console.error('Failed to execute:', error);
    } finally {
      setIsLoading(false);
    }
  }, [parameters, onSave, onExecute]);

  // Filter visible properties based on displayOptions
  const visibleProperties = useMemo(() => {
    return nodeType.properties.filter((prop) => {
      if (!prop.displayOptions) return true;

      const { show, hide } = prop.displayOptions;

      // Check show conditions
      if (show) {
        for (const [field, values] of Object.entries(show)) {
          const currentValue = parameters[field];
          if (!values.includes(currentValue)) {
            return false;
          }
        }
      }

      // Check hide conditions
      if (hide) {
        for (const [field, values] of Object.entries(hide)) {
          const currentValue = parameters[field];
          if (values.includes(currentValue)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [nodeType.properties, parameters]);

  const dialogTitle = title || `${nodeType.displayName} Settings`;

  return (
    <BaseDialog
      open={open}
      onClose={handleCancel}
      title={dialogTitle}
      size={DialogSize.Large}
      icon={
        <NodeIcon
          icon={nodeType.icon}
          color={nodeType.iconColor}
          size={24}
        />
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {onExecute && (
              <Button
                variant="outline"
                onClick={handleExecute}
                disabled={isLoading}
              >
                <Play className="w-4 h-4 mr-2" />
                Execute
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleCancel} disabled={isLoading}>
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
      }
    >
      <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        {/* Tab list */}
        <Tabs.List className="flex gap-1 border-b border-gray-200 dark:border-slate-700 mb-4">
          <Tabs.Trigger
            value="parameters"
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-t-lg',
              'border-b-2 transition-colors',
              activeTab === 'parameters'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            )}
          >
            Parameters
          </Tabs.Trigger>
          <Tabs.Trigger
            value="settings"
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-t-lg',
              'border-b-2 transition-colors',
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            )}
          >
            <Settings className="w-4 h-4 mr-1 inline" />
            Settings
          </Tabs.Trigger>
          <Tabs.Trigger
            value="notes"
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-t-lg',
              'border-b-2 transition-colors',
              activeTab === 'notes'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            )}
          >
            <FileText className="w-4 h-4 mr-1 inline" />
            Notes
          </Tabs.Trigger>
        </Tabs.List>

        {/* Parameters tab */}
        <Tabs.Content value="parameters" className="space-y-4">
          {visibleProperties.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              This node has no configurable parameters.
            </div>
          ) : (
            visibleProperties.map((property) => (
              <PropertyField
                key={property.name}
                property={property}
                value={parameters[property.name]}
                onChange={(value) => handleParameterChange(property.name, value)}
                credentials={availableCredentials}
              />
            ))
          )}
        </Tabs.Content>

        {/* Settings tab */}
        <Tabs.Content value="settings" className="space-y-4">
          <div className="space-y-4">
            <SettingsToggle
              label="Always Output Data"
              description="Output data even if the node fails or returns empty data"
              checked={nodeSettings.alwaysOutputData}
              onChange={(v) => handleSettingsChange('alwaysOutputData', v)}
            />
            <SettingsToggle
              label="Execute Once"
              description="Execute the node only once, regardless of how many items are in the input"
              checked={nodeSettings.executeOnce}
              onChange={(v) => handleSettingsChange('executeOnce', v)}
            />
            <SettingsToggle
              label="Retry On Fail"
              description="Automatically retry the node if it fails"
              checked={nodeSettings.retryOnFail}
              onChange={(v) => handleSettingsChange('retryOnFail', v)}
            />
            {nodeSettings.retryOnFail && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Tries
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={nodeSettings.maxTries}
                    onChange={(e) => handleSettingsChange('maxTries', parseInt(e.target.value))}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg',
                      'border border-gray-300 dark:border-slate-600',
                      'bg-white dark:bg-slate-800',
                      'text-gray-900 dark:text-gray-100',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
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
                    value={nodeSettings.waitBetweenTries}
                    onChange={(e) => handleSettingsChange('waitBetweenTries', parseInt(e.target.value))}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg',
                      'border border-gray-300 dark:border-slate-600',
                      'bg-white dark:bg-slate-800',
                      'text-gray-900 dark:text-gray-100',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                </div>
              </>
            )}
            <SettingsToggle
              label="Continue On Fail"
              description="Continue the workflow even if this node fails"
              checked={nodeSettings.continueOnFail}
              onChange={(v) => handleSettingsChange('continueOnFail', v)}
            />
          </div>
        </Tabs.Content>

        {/* Notes tab */}
        <Tabs.Content value="notes" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={nodeSettings.notes}
              onChange={(e) => handleSettingsChange('notes', e.target.value)}
              placeholder="Add notes about this node..."
              rows={6}
              className={cn(
                'w-full px-3 py-2 rounded-lg',
                'border border-gray-300 dark:border-slate-600',
                'bg-white dark:bg-slate-800',
                'text-gray-900 dark:text-gray-100',
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'resize-y'
              )}
            />
            <p className="text-xs text-gray-500 mt-1">
              Add notes to help you or your team understand what this node does.
            </p>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </BaseDialog>
  );
});

NodeParametersDialog.displayName = 'NodeParametersDialog';

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
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </div>
      </div>
    </label>
  );
}

/**
 * Property field component
 */
interface PropertyFieldProps {
  property: NodeProperty;
  value: unknown;
  onChange: (value: unknown) => void;
  credentials?: Record<string, Credential[]>;
}

function PropertyField({ property, value, onChange, credentials: _credentials }: PropertyFieldProps) {
  const { name, displayName, type, description, placeholder, required, options, typeOptions } = property;

  const commonProps = {
    id: name,
    name,
    required,
    placeholder,
  };

  const fieldClasses = cn(
    'w-full px-3 py-2 rounded-lg',
    'border border-gray-300 dark:border-slate-600',
    'bg-white dark:bg-slate-800',
    'text-gray-900 dark:text-gray-100',
    'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'text-sm'
  );

  const renderField = () => {
    switch (type) {
      case PropertyType.String:
        if (typeOptions?.password) {
          return (
            <input
              {...commonProps}
              type="password"
              value={(value as string) ?? ''}
              onChange={(e) => onChange(e.target.value)}
              className={fieldClasses}
            />
          );
        }
        if (typeOptions?.rows && typeOptions.rows > 1) {
          return (
            <textarea
              {...commonProps}
              value={(value as string) ?? ''}
              onChange={(e) => onChange(e.target.value)}
              rows={typeOptions.rows}
              className={cn(fieldClasses, 'resize-y')}
            />
          );
        }
        return (
          <input
            {...commonProps}
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={fieldClasses}
          />
        );

      case PropertyType.Number:
        return (
          <input
            {...commonProps}
            type="number"
            value={(value as number) ?? ''}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            min={typeOptions?.minValue}
            max={typeOptions?.maxValue}
            step={typeOptions?.numberStepSize}
            className={fieldClasses}
          />
        );

      case PropertyType.Boolean:
        return (
          <label className="flex items-center gap-2">
            <input
              {...commonProps}
              type="checkbox"
              checked={(value as boolean) ?? false}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {displayName}
            </span>
          </label>
        );

      case PropertyType.Options:
        // Serialize value for comparison - handles objects and primitives
        const getOptionValue = (v: unknown): string => {
          if (v === null || v === undefined) return '';
          if (typeof v === 'object') return JSON.stringify(v);
          return String(v);
        };
        const currentValue = getOptionValue(value);
        return (
          <select
            {...commonProps}
            value={currentValue}
            onChange={(e) => {
              const selectedOpt = options?.find((opt) => getOptionValue(opt.value) === e.target.value);
              onChange(selectedOpt?.value ?? e.target.value);
            }}
            className={fieldClasses}
          >
            <option value="">Select...</option>
            {options?.map((opt) => {
              const optValue = getOptionValue(opt.value);
              return (
                <option key={optValue} value={optValue}>
                  {opt.name}
                </option>
              );
            })}
          </select>
        );

      case PropertyType.MultiOptions:
        // Helper for multi-select options
        const getMultiOptionValue = (v: unknown): string => {
          if (v === null || v === undefined) return '';
          if (typeof v === 'object') return JSON.stringify(v);
          return String(v);
        };
        const selectedValues = ((value as unknown[]) ?? []).map(getMultiOptionValue);
        return (
          <select
            {...commonProps}
            multiple
            value={selectedValues}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (opt) => {
                const foundOpt = options?.find((o) => getMultiOptionValue(o.value) === opt.value);
                return foundOpt?.value ?? opt.value;
              });
              onChange(selected);
            }}
            className={cn(fieldClasses, 'min-h-[100px]')}
          >
            {options?.map((opt) => {
              const optValue = getMultiOptionValue(opt.value);
              return (
                <option key={optValue} value={optValue}>
                  {opt.name}
                </option>
              );
            })}
          </select>
        );

      case PropertyType.Json:
        return (
          <textarea
            {...commonProps}
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            }}
            rows={6}
            className={cn(fieldClasses, 'font-mono text-xs resize-y')}
          />
        );

      case PropertyType.Code:
        const codeLanguage = typeOptions?.language || 'javascript';
        return (
          <CodeEditor
            value={(value as string) ?? ''}
            onChange={onChange}
            language={codeLanguage}
            height={typeOptions?.rows ? `${typeOptions.rows * 24}px` : '300px'}
            placeholder={placeholder}
          />
        );

      case PropertyType.Notice:
        return (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {description || displayName}
            </p>
          </div>
        );

      default:
        return (
          <input
            {...commonProps}
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={fieldClasses}
          />
        );
    }
  };

  // Don't render label for boolean (it's inline) or notice (it's self-descriptive)
  if (type === PropertyType.Boolean || type === PropertyType.Notice) {
    return <div className="space-y-1">{renderField()}</div>;
  }

  return (
    <div className="space-y-1">
      <label
        htmlFor={name}
        className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {displayName}
        {required && <span className="text-red-500">*</span>}
      </label>
      {renderField()}
      {description && (type as string) !== PropertyType.Notice && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
  );
}

export default NodeParametersDialog;
