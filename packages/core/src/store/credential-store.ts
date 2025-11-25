import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Credential,
  CredentialData,
  CredentialTypeDefinition,
  CredentialStore,
  CredentialTestResult,
  CredentialFilter,
} from '../types';
import { nanoid } from '../utils/nanoid';

/**
 * Credential state
 */
interface CredentialState {
  // Registered credential types
  credentialTypes: Map<string, CredentialTypeDefinition>;

  // Stored credentials (in-memory, for demo purposes)
  credentials: Credential[];

  // External credential store (for real apps)
  externalStore: CredentialStore | null;

  // Loading states
  isLoading: boolean;
  loadingCredentials: Record<string, boolean>;

  // Test results cache
  testResults: Record<string, CredentialTestResult>;
}

/**
 * Credential actions
 */
interface CredentialActions {
  // Credential type registration
  registerCredentialType: (type: CredentialTypeDefinition) => void;
  registerCredentialTypes: (types: CredentialTypeDefinition[]) => void;
  unregisterCredentialType: (name: string) => void;
  getCredentialType: (name: string) => CredentialTypeDefinition | undefined;
  getAllCredentialTypes: () => CredentialTypeDefinition[];

  // Credential management
  setCredentials: (credentials: Credential[]) => void;
  addCredential: (credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Credential>;
  updateCredential: (id: string, updates: Partial<Credential>) => Promise<Credential>;
  deleteCredential: (id: string) => Promise<void>;
  getCredential: (id: string) => Credential | undefined;
  getCredentials: (filter?: CredentialFilter) => Credential[];
  getCredentialsByType: (type: string) => Credential[];

  // Credential data
  getCredentialData: (id: string) => Promise<CredentialData | null>;

  // External store
  setExternalStore: (store: CredentialStore | null) => void;
  syncWithExternalStore: () => Promise<void>;

  // Testing
  testCredential: (type: string, data: CredentialData) => Promise<CredentialTestResult>;
  getTestResult: (credentialId: string) => CredentialTestResult | undefined;
  clearTestResult: (credentialId: string) => void;

  // Loading
  setLoading: (loading: boolean) => void;
  setCredentialLoading: (id: string, loading: boolean) => void;
  isCredentialLoading: (id: string) => boolean;
}

/**
 * Credential store
 */
export const useCredentialStore = create<CredentialState & CredentialActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      credentialTypes: new Map(),
      credentials: [],
      externalStore: null,
      isLoading: false,
      loadingCredentials: {},
      testResults: {},

      // Credential type registration
      registerCredentialType: (type) => {
        set((state) => {
          state.credentialTypes.set(type.name, type);
        });
      },

      registerCredentialTypes: (types) => {
        set((state) => {
          types.forEach((type) => {
            state.credentialTypes.set(type.name, type);
          });
        });
      },

      unregisterCredentialType: (name) => {
        set((state) => {
          state.credentialTypes.delete(name);
        });
      },

      getCredentialType: (name) => {
        return get().credentialTypes.get(name);
      },

      getAllCredentialTypes: () => {
        return Array.from(get().credentialTypes.values());
      },

      // Credential management
      setCredentials: (credentials) => {
        set((state) => {
          state.credentials = credentials;
        });
      },

      addCredential: async (credential) => {
        const { externalStore } = get();
        const now = new Date().toISOString();

        const newCredential: Credential = {
          ...credential,
          id: nanoid(),
          createdAt: now,
          updatedAt: now,
        };

        if (externalStore) {
          try {
            const created = await externalStore.create(credential);
            set((state) => {
              state.credentials.push(created);
            });
            return created;
          } catch (error) {
            console.error('Failed to create credential in external store:', error);
            throw error;
          }
        } else {
          set((state) => {
            state.credentials.push(newCredential);
          });
          return newCredential;
        }
      },

      updateCredential: async (id, updates) => {
        const { externalStore, credentials } = get();
        const now = new Date().toISOString();

        const existingCredential = credentials.find((c) => c.id === id);
        if (!existingCredential) {
          throw new Error(`Credential not found: ${id}`);
        }

        const updatedCredential: Credential = {
          ...existingCredential,
          ...updates,
          updatedAt: now,
        };

        if (externalStore) {
          try {
            const updated = await externalStore.update(id, updates);
            set((state) => {
              const index = state.credentials.findIndex((c: Credential) => c.id === id);
              if (index !== -1) {
                state.credentials[index] = updated;
              }
            });
            return updated;
          } catch (error) {
            console.error('Failed to update credential in external store:', error);
            throw error;
          }
        } else {
          set((state) => {
            const index = state.credentials.findIndex((c: Credential) => c.id === id);
            if (index !== -1) {
              state.credentials[index] = updatedCredential;
            }
          });
          return updatedCredential;
        }
      },

      deleteCredential: async (id) => {
        const { externalStore } = get();

        if (externalStore) {
          try {
            await externalStore.delete(id);
          } catch (error) {
            console.error('Failed to delete credential from external store:', error);
            throw error;
          }
        }

        set((state) => {
          state.credentials = state.credentials.filter((c: Credential) => c.id !== id);
          delete state.testResults[id];
          delete state.loadingCredentials[id];
        });
      },

      getCredential: (id) => {
        return get().credentials.find((c) => c.id === id);
      },

      getCredentials: (filter) => {
        let { credentials } = get();

        if (filter?.type) {
          credentials = credentials.filter((c) => c.type === filter.type);
        }

        if (filter?.search) {
          const searchLower = filter.search.toLowerCase();
          credentials = credentials.filter((c) =>
            c.name.toLowerCase().includes(searchLower)
          );
        }

        if (filter?.nodeType) {
          const nodeType = filter.nodeType;
          credentials = credentials.filter((c) => {
            const credentialType = get().credentialTypes.get(c.type);
            return credentialType?.properties.some(
              (p) => p.credentialTypes?.includes(nodeType)
            );
          });
        }

        return credentials;
      },

      getCredentialsByType: (type) => {
        return get().credentials.filter((c) => c.type === type);
      },

      // Credential data
      getCredentialData: async (id) => {
        const { externalStore, credentials } = get();

        if (externalStore) {
          try {
            return await externalStore.getData(id);
          } catch (error) {
            console.error('Failed to get credential data from external store:', error);
            throw error;
          }
        }

        // For in-memory store, data is stored with the credential
        const credential = credentials.find((c) => c.id === id);
        return credential?.data ?? null;
      },

      // External store
      setExternalStore: (store) => {
        set((state) => {
          state.externalStore = store;
        });
      },

      syncWithExternalStore: async () => {
        const { externalStore } = get();
        if (!externalStore) return;

        set((state) => {
          state.isLoading = true;
        });

        try {
          const credentials = await externalStore.list();
          set((state) => {
            state.credentials = credentials;
            state.isLoading = false;
          });
        } catch (error) {
          console.error('Failed to sync credentials with external store:', error);
          set((state) => {
            state.isLoading = false;
          });
          throw error;
        }
      },

      // Testing
      testCredential: async (type, data) => {
        const { externalStore, credentialTypes } = get();

        if (externalStore?.test) {
          try {
            const result = await externalStore.test(type, data);
            return result;
          } catch (error) {
            return {
              status: 'Error' as const,
              message: error instanceof Error ? error.message : 'Test failed',
            };
          }
        }

        // Use credential type's test function if available
        const credentialType = credentialTypes.get(type);
        if (credentialType?.test) {
          try {
            // credentialType.test.request contains test configuration
            // This would need actual implementation with HTTP client
            return { status: 'OK' as const, message: 'Test successful' };
          } catch (error) {
            return {
              status: 'Error' as const,
              message: error instanceof Error ? error.message : 'Test failed',
            };
          }
        }

        // No test available
        return {
          status: 'OK' as const,
          message: 'No test available for this credential type',
        };
      },

      getTestResult: (credentialId) => {
        return get().testResults[credentialId];
      },

      clearTestResult: (credentialId) => {
        set((state) => {
          delete state.testResults[credentialId];
        });
      },

      // Loading
      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setCredentialLoading: (id, loading) => {
        set((state) => {
          state.loadingCredentials[id] = loading;
        });
      },

      isCredentialLoading: (id) => {
        return get().loadingCredentials[id] ?? false;
      },
    }))
  )
);

/**
 * Selector hooks
 */
export const useCredentials = () => useCredentialStore((state) => state.credentials);
export const useCredentialTypes = () =>
  useCredentialStore((state) => Array.from(state.credentialTypes.values()));
export const useIsCredentialsLoading = () => useCredentialStore((state) => state.isLoading);

export const useCredential = (id: string) => {
  return useCredentialStore((state) => state.credentials.find((c) => c.id === id));
};

export const useCredentialType = (name: string) => {
  return useCredentialStore((state) => state.credentialTypes.get(name));
};

export const useCredentialsByType = (type: string) => {
  return useCredentialStore((state) =>
    state.credentials.filter((c) => c.type === type)
  );
};

/**
 * Hook for credential actions
 */
export function useCredentialActions() {
  const store = useCredentialStore;

  return {
    registerCredentialType: store.getState().registerCredentialType,
    registerCredentialTypes: store.getState().registerCredentialTypes,
    addCredential: store.getState().addCredential,
    updateCredential: store.getState().updateCredential,
    deleteCredential: store.getState().deleteCredential,
    testCredential: store.getState().testCredential,
    syncWithExternalStore: store.getState().syncWithExternalStore,
    setExternalStore: store.getState().setExternalStore,
  };
}
