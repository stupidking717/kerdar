import { memo, useState, useCallback, useEffect } from 'react';
import { X, KeyRound, Save, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { CredentialTypeDefinition, CredentialData, Credential } from '../../types';
import { PropertyType } from '../../types';

/**
 * Props for CredentialEditor
 */
export interface CredentialEditorProps {
  /** Credential type definition */
  credentialType: CredentialTypeDefinition;
  /** Existing credential to edit (undefined for new) */
  existingCredential?: Credential;
  /** Called when credential is saved */
  onSave: (name: string, data: CredentialData) => Promise<void>;
  /** Called when credential is deleted (only for existing) */
  onDelete?: () => Promise<void>;
  /** Called when editor is closed */
  onClose: () => void;
  /** Whether the save operation is in progress */
  isSaving?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * CredentialEditor - Modal dialog for creating/editing credentials
 */
export const CredentialEditor = memo<CredentialEditorProps>(({
  credentialType,
  existingCredential,
  onSave,
  onDelete,
  onClose,
  isSaving = false,
  className,
}) => {
  const [name, setName] = useState(existingCredential?.name || `My ${credentialType.displayName}`);
  const [data, setData] = useState<CredentialData>(existingCredential?.data || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize default values
  useEffect(() => {
    if (!existingCredential) {
      const defaultData: CredentialData = {};
      credentialType.properties.forEach((prop) => {
        if (prop.default !== undefined) {
          defaultData[prop.name] = prop.default;
        }
      });
      setData(defaultData);
    }
  }, [credentialType, existingCredential]);

  const handleFieldChange = useCallback((fieldName: string, value: unknown) => {
    setData((prev) => ({ ...prev, [fieldName]: value }));
    // Clear error for this field
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Credential name is required';
    }

    credentialType.properties.forEach((prop) => {
      if (prop.required) {
        const value = data[prop.name];
        if (value === undefined || value === null || value === '') {
          newErrors[prop.name] = `${prop.displayName} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, data, credentialType.properties]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    try {
      await onSave(name.trim(), data);
    } catch (error) {
      console.error('Failed to save credential:', error);
    }
  }, [name, data, validate, onSave]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;

    if (!window.confirm('Are you sure you want to delete this credential?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error('Failed to delete credential:', error);
      setIsDeleting(false);
    }
  }, [onDelete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={cn(
          'w-full max-w-lg mx-4',
          'bg-white dark:bg-slate-800',
          'rounded-xl shadow-2xl',
          'flex flex-col max-h-[90vh]',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {existingCredential ? 'Edit' : 'Create'} {credentialType.displayName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {credentialType.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving || isDeleting}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Credential Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Credential Name
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.name;
                  return next;
                });
              }}
              placeholder="Enter a name for this credential"
              className={cn(
                'w-full px-3 py-2 rounded-lg',
                'border',
                errors.name
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-slate-600',
                'bg-white dark:bg-slate-700',
                'text-gray-900 dark:text-gray-100',
                'placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              )}
            />
            {errors.name && (
              <p className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Credential Fields */}
          {credentialType.properties.map((prop) => (
            <CredentialField
              key={prop.name}
              property={prop}
              value={data[prop.name]}
              onChange={(value) => handleFieldChange(prop.name, value)}
              error={errors[prop.name]}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
          <div>
            {existingCredential && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  'text-red-600 dark:text-red-400',
                  'hover:bg-red-50 dark:hover:bg-red-900/20',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors'
                )}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className={cn(
                'px-4 py-2 rounded-lg',
                'text-gray-600 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-slate-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors'
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg',
                'bg-blue-500 hover:bg-blue-600 text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors'
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

CredentialEditor.displayName = 'CredentialEditor';

/**
 * Individual credential field component
 */
interface CredentialFieldProps {
  property: CredentialTypeDefinition['properties'][0];
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

const CredentialField = memo<CredentialFieldProps>(({
  property,
  value,
  onChange,
  error,
}) => {
  const { name, displayName, description, type, required, placeholder, typeOptions } = property;

  const isPassword = typeOptions?.password || name.toLowerCase().includes('password') || name.toLowerCase().includes('secret') || name.toLowerCase().includes('token');

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {displayName}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {type === PropertyType.String && (
        <input
          type={isPassword ? 'password' : 'text'}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full px-3 py-2 rounded-lg',
            'border',
            error
              ? 'border-red-300 dark:border-red-600'
              : 'border-gray-300 dark:border-slate-600',
            'bg-white dark:bg-slate-700',
            'text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          )}
        />
      )}

      {type === PropertyType.Number && (
        <input
          type="number"
          value={(value as number) ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          placeholder={placeholder}
          className={cn(
            'w-full px-3 py-2 rounded-lg',
            'border',
            error
              ? 'border-red-300 dark:border-red-600'
              : 'border-gray-300 dark:border-slate-600',
            'bg-white dark:bg-slate-700',
            'text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          )}
        />
      )}

      {type === PropertyType.Boolean && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {description || displayName}
          </span>
        </label>
      )}

      {description && type !== PropertyType.Boolean && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
});

CredentialField.displayName = 'CredentialField';

export default CredentialEditor;
