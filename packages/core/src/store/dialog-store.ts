import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  DialogConfig,
  CredentialsDialogConfig,
  NodeParametersDialogConfig,
  NodeSettingsDialogConfig,
  CustomDialogConfig,
  ConfirmDialogConfig,
  AlertDialogConfig,
} from '../types';
import { DialogType, DialogSize } from '../types';

/**
 * Dialog state
 */
interface DialogState {
  // Currently open dialogs (stack)
  dialogs: DialogConfig[];

  // Active/focused dialog
  activeDialogId: string | null;

  // Dialog-specific loading states
  loadingDialogs: Record<string, boolean>;

  // Dialog-specific error states
  dialogErrors: Record<string, string | null>;
}

/**
 * Dialog actions
 */
interface DialogActions {
  // Open dialogs
  open: (config: DialogConfig) => void;
  openCredentials: (config: Omit<CredentialsDialogConfig, 'type' | 'id'> & { id?: string }) => void;
  openParameters: (config: Omit<NodeParametersDialogConfig, 'type' | 'id'> & { id?: string }) => void;
  openSettings: (config: Omit<NodeSettingsDialogConfig, 'type' | 'id'> & { id?: string }) => void;
  openCustom: (config: Omit<CustomDialogConfig, 'type' | 'id'> & { id?: string }) => void;
  openConfirm: (config: Omit<ConfirmDialogConfig, 'type' | 'id'> & { id?: string }) => Promise<boolean>;
  openAlert: (config: Omit<AlertDialogConfig, 'type' | 'id'> & { id?: string }) => void;

  // Close dialogs
  close: (id: string) => void;
  closeAll: () => void;
  closeTop: () => void;

  // Update dialog
  update: (id: string, updates: Partial<DialogConfig>) => void;

  // Focus
  focus: (id: string) => void;
  bringToFront: (id: string) => void;

  // Loading states
  setLoading: (id: string, loading: boolean) => void;
  isLoading: (id: string) => boolean;

  // Error states
  setError: (id: string, error: string | null) => void;
  getError: (id: string) => string | null;
  clearError: (id: string) => void;

  // Queries
  isOpen: (id: string) => boolean;
  getDialog: (id: string) => DialogConfig | undefined;
  getTopDialog: () => DialogConfig | undefined;
  hasOpenDialogs: () => boolean;
}

let dialogIdCounter = 0;
const generateDialogId = (prefix: string = 'dialog') => `${prefix}-${++dialogIdCounter}`;

// Store pending confirm dialog resolvers
const confirmResolvers = new Map<string, (value: boolean) => void>();

/**
 * Dialog store
 */
export const useDialogStore = create<DialogState & DialogActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      dialogs: [],
      activeDialogId: null,
      loadingDialogs: {},
      dialogErrors: {},

      // Open dialogs
      open: (config) => {
        set((state) => {
          // Check if dialog with same ID already exists
          const existingIndex = state.dialogs.findIndex((d: DialogConfig) => d.id === config.id);
          if (existingIndex !== -1) {
            // Update existing dialog
            state.dialogs[existingIndex] = config;
          } else {
            // Add new dialog
            state.dialogs.push(config);
          }
          state.activeDialogId = config.id;
        });
      },

      openCredentials: (config) => {
        const id = config.id || generateDialogId('credentials');
        const dialogConfig: CredentialsDialogConfig = {
          ...config,
          id,
          type: DialogType.Credentials,
          size: config.size ?? DialogSize.Medium,
          closable: config.closable ?? true,
        };
        get().open(dialogConfig);
      },

      openParameters: (config) => {
        const id = config.id || generateDialogId('parameters');
        const dialogConfig: NodeParametersDialogConfig = {
          ...config,
          id,
          type: DialogType.Parameters,
          size: config.size ?? DialogSize.Large,
          closable: config.closable ?? true,
        };
        get().open(dialogConfig);
      },

      openSettings: (config) => {
        const id = config.id || generateDialogId('settings');
        const dialogConfig: NodeSettingsDialogConfig = {
          ...config,
          id,
          type: DialogType.Settings,
          size: config.size ?? DialogSize.Medium,
          closable: config.closable ?? true,
        };
        get().open(dialogConfig);
      },

      openCustom: (config) => {
        const id = config.id || generateDialogId('custom');
        const dialogConfig: CustomDialogConfig = {
          ...config,
          id,
          type: DialogType.Custom,
          size: config.size ?? DialogSize.Medium,
          closable: config.closable ?? true,
        };
        get().open(dialogConfig);
      },

      openConfirm: (config) => {
        return new Promise<boolean>((resolve) => {
          const id = config.id || generateDialogId('confirm');

          // Store resolver
          confirmResolvers.set(id, resolve);

          const dialogConfig: ConfirmDialogConfig = {
            ...config,
            id,
            type: DialogType.Confirm,
            size: config.size ?? DialogSize.Small,
            closable: config.closable ?? true,
            onConfirm: () => {
              config.onConfirm?.();
              const resolver = confirmResolvers.get(id);
              if (resolver) {
                resolver(true);
                confirmResolvers.delete(id);
              }
              get().close(id);
            },
            onCancel: () => {
              config.onCancel?.();
              const resolver = confirmResolvers.get(id);
              if (resolver) {
                resolver(false);
                confirmResolvers.delete(id);
              }
              get().close(id);
            },
            onClose: () => {
              config.onClose?.();
              const resolver = confirmResolvers.get(id);
              if (resolver) {
                resolver(false);
                confirmResolvers.delete(id);
              }
            },
          };

          get().open(dialogConfig);
        });
      },

      openAlert: (config) => {
        const id = config.id || generateDialogId('alert');
        const dialogConfig: AlertDialogConfig = {
          ...config,
          id,
          type: DialogType.Alert,
          size: config.size ?? DialogSize.Small,
          closable: config.closable ?? true,
        };
        get().open(dialogConfig);
      },

      // Close dialogs
      close: (id) => {
        set((state) => {
          const dialogIndex = state.dialogs.findIndex((d: DialogConfig) => d.id === id);
          if (dialogIndex !== -1) {
            const dialog = state.dialogs[dialogIndex];
            dialog.onClose?.();
            state.dialogs.splice(dialogIndex, 1);

            // Clean up loading/error states
            delete state.loadingDialogs[id];
            delete state.dialogErrors[id];

            // Update active dialog
            if (state.activeDialogId === id) {
              state.activeDialogId =
                state.dialogs.length > 0
                  ? state.dialogs[state.dialogs.length - 1].id
                  : null;
            }
          }
        });

        // Clean up any pending confirm resolvers
        const resolver = confirmResolvers.get(id);
        if (resolver) {
          resolver(false);
          confirmResolvers.delete(id);
        }
      },

      closeAll: () => {
        const { dialogs } = get();
        dialogs.forEach((dialog) => {
          dialog.onClose?.();
          const resolver = confirmResolvers.get(dialog.id);
          if (resolver) {
            resolver(false);
            confirmResolvers.delete(dialog.id);
          }
        });

        set((state) => {
          state.dialogs = [];
          state.activeDialogId = null;
          state.loadingDialogs = {};
          state.dialogErrors = {};
        });
      },

      closeTop: () => {
        const { dialogs } = get();
        if (dialogs.length > 0) {
          const topDialog = dialogs[dialogs.length - 1];
          if (topDialog.closable !== false) {
            get().close(topDialog.id);
          }
        }
      },

      // Update dialog
      update: (id, updates) => {
        set((state) => {
          const dialogIndex = state.dialogs.findIndex((d: DialogConfig) => d.id === id);
          if (dialogIndex !== -1) {
            Object.assign(state.dialogs[dialogIndex], updates);
          }
        });
      },

      // Focus
      focus: (id) => {
        set((state) => {
          state.activeDialogId = id;
        });
      },

      bringToFront: (id) => {
        set((state) => {
          const dialogIndex = state.dialogs.findIndex((d: DialogConfig) => d.id === id);
          if (dialogIndex !== -1 && dialogIndex !== state.dialogs.length - 1) {
            const dialog = state.dialogs[dialogIndex];
            state.dialogs.splice(dialogIndex, 1);
            state.dialogs.push(dialog);
            state.activeDialogId = id;
          }
        });
      },

      // Loading states
      setLoading: (id, loading) => {
        set((state) => {
          state.loadingDialogs[id] = loading;
        });
      },

      isLoading: (id) => get().loadingDialogs[id] ?? false,

      // Error states
      setError: (id, error) => {
        set((state) => {
          state.dialogErrors[id] = error;
        });
      },

      getError: (id) => get().dialogErrors[id] ?? null,

      clearError: (id) => {
        set((state) => {
          state.dialogErrors[id] = null;
        });
      },

      // Queries
      isOpen: (id) => get().dialogs.some((d) => d.id === id),

      getDialog: (id) => get().dialogs.find((d) => d.id === id),

      getTopDialog: () => {
        const { dialogs } = get();
        return dialogs.length > 0 ? dialogs[dialogs.length - 1] : undefined;
      },

      hasOpenDialogs: () => get().dialogs.length > 0,
    }))
  )
);

/**
 * Selector hooks
 */
export const useDialogs = () => useDialogStore((state) => state.dialogs);
export const useActiveDialogId = () => useDialogStore((state) => state.activeDialogId);
export const useHasOpenDialogs = () => useDialogStore((state) => state.dialogs.length > 0);

export const useDialog = (id: string) => {
  return useDialogStore((state) => state.dialogs.find((d) => d.id === id));
};

export const useIsDialogOpen = (id: string) => {
  return useDialogStore((state) => state.dialogs.some((d) => d.id === id));
};

export const useIsDialogLoading = (id: string) => {
  return useDialogStore((state) => state.loadingDialogs[id] ?? false);
};

export const useDialogError = (id: string) => {
  return useDialogStore((state) => state.dialogErrors[id] ?? null);
};

/**
 * Hook for dialog actions (convenient wrapper)
 */
export function useDialogActions() {
  const store = useDialogStore;

  return {
    open: store.getState().open,
    openCredentials: store.getState().openCredentials,
    openParameters: store.getState().openParameters,
    openSettings: store.getState().openSettings,
    openCustom: store.getState().openCustom,
    openConfirm: store.getState().openConfirm,
    openAlert: store.getState().openAlert,
    close: store.getState().close,
    closeAll: store.getState().closeAll,
    closeTop: store.getState().closeTop,
    update: store.getState().update,
    setLoading: store.getState().setLoading,
    setError: store.getState().setError,
    clearError: store.getState().clearError,
  };
}
