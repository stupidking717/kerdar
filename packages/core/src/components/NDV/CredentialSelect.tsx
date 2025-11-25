import { memo, useState, useCallback, useMemo } from 'react';
import { KeyRound, Plus, ChevronDown, AlertCircle, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Credential, CredentialTypeConfig, NodeCredential } from '../../types';

/**
 * Props for CredentialSelect component
 */
export interface CredentialSelectProps {
  /** Credential type configuration from node type */
  credentialConfig: CredentialTypeConfig;
  /** Currently selected credential */
  selectedCredential?: NodeCredential;
  /** Available credentials of this type */
  availableCredentials: Credential[];
  /** Called when credential selection changes */
  onChange: (credential: NodeCredential | undefined) => void;
  /** Called when user wants to create new credential */
  onCreateNew?: () => void;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * CredentialSelect - n8n-style credential selector for node configuration
 * Shows available credentials and allows creating new ones
 */
export const CredentialSelect = memo<CredentialSelectProps>(({
  credentialConfig,
  selectedCredential,
  availableCredentials,
  onChange,
  onCreateNew,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Find the selected credential details
  const selectedDetails = useMemo(() => {
    if (!selectedCredential) return null;
    return availableCredentials.find(c => c.id === selectedCredential.id);
  }, [selectedCredential, availableCredentials]);

  const handleSelect = useCallback((credential: Credential) => {
    onChange({
      id: credential.id,
      name: credential.name,
    });
    setIsOpen(false);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(undefined);
    setIsOpen(false);
  }, [onChange]);

  const handleCreateNew = useCallback(() => {
    setIsOpen(false);
    onCreateNew?.();
  }, [onCreateNew]);

  const displayName = credentialConfig.displayName || credentialConfig.name;

  return (
    <div className={cn('space-y-1', className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          <KeyRound className="w-3.5 h-3.5 text-gray-400" />
          {displayName}
          {credentialConfig.required && (
            <span className="text-red-500">*</span>
          )}
        </label>
        {!selectedCredential && credentialConfig.required && (
          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-3 h-3" />
            Required
          </span>
        )}
      </div>

      {/* Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between gap-2',
            'px-3 py-2 rounded-lg text-sm',
            'border border-gray-300 dark:border-slate-600',
            'bg-white dark:bg-slate-800',
            'hover:border-blue-400 dark:hover:border-blue-500',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-colors',
            disabled && 'opacity-50 cursor-not-allowed',
            !selectedCredential && credentialConfig.required && 'border-amber-400 dark:border-amber-500',
            isOpen && 'ring-2 ring-blue-500 border-transparent'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              'w-6 h-6 rounded flex items-center justify-center flex-shrink-0',
              selectedCredential
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-gray-100 dark:bg-slate-700'
            )}>
              <KeyRound className={cn(
                'w-3.5 h-3.5',
                selectedCredential
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-400'
              )} />
            </div>
            <span className={cn(
              'truncate',
              selectedCredential
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400'
            )}>
              {selectedCredential?.name || `Select ${displayName}...`}
            </span>
          </div>
          <ChevronDown className={cn(
            'w-4 h-4 text-gray-400 transition-transform flex-shrink-0',
            isOpen && 'rotate-180'
          )} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <div className={cn(
              'absolute z-20 w-full mt-1',
              'bg-white dark:bg-slate-800',
              'border border-gray-200 dark:border-slate-600',
              'rounded-lg shadow-lg',
              'max-h-60 overflow-auto',
              'py-1'
            )}>
              {/* Available credentials */}
              {availableCredentials.length > 0 ? (
                <>
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Available Credentials
                  </div>
                  {availableCredentials.map((credential) => (
                    <button
                      key={credential.id}
                      type="button"
                      onClick={() => handleSelect(credential)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2',
                        'text-left text-sm',
                        'hover:bg-gray-100 dark:hover:bg-slate-700',
                        'transition-colors',
                        selectedCredential?.id === credential.id && 'bg-blue-50 dark:bg-blue-900/20'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded flex items-center justify-center',
                        selectedCredential?.id === credential.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-slate-700'
                      )}>
                        {selectedCredential?.id === credential.id ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <KeyRound className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {credential.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {credential.type}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  <KeyRound className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                  <p>No credentials available</p>
                  <p className="text-xs mt-1">Create a new credential to continue</p>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-slate-600 my-1" />

              {/* Clear selection */}
              {selectedCredential && (
                <button
                  type="button"
                  onClick={handleClear}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2',
                    'text-left text-sm text-gray-600 dark:text-gray-400',
                    'hover:bg-gray-100 dark:hover:bg-slate-700',
                    'transition-colors'
                  )}
                >
                  <span className="w-5" />
                  Clear selection
                </button>
              )}

              {/* Create new credential */}
              {onCreateNew && (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2',
                    'text-left text-sm text-blue-600 dark:text-blue-400',
                    'hover:bg-blue-50 dark:hover:bg-blue-900/20',
                    'transition-colors'
                  )}
                >
                  <Plus className="w-4 h-4" />
                  Create new {displayName}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Selected credential info */}
      {selectedDetails && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
          <Check className="w-3 h-3 text-green-500" />
          <span>Connected</span>
          {selectedDetails.updatedAt && (
            <span className="text-gray-400">
              · Updated {new Date(selectedDetails.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

CredentialSelect.displayName = 'CredentialSelect';

export default CredentialSelect;
