/**
 * Custom nanoid implementation for generating unique IDs
 * Lightweight alternative to the nanoid package
 */

const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

/**
 * Generate a random string ID
 * @param size - Length of the ID (default: 21)
 * @returns Random string ID
 */
export function nanoid(size: number = 21): string {
  let id = '';
  const bytes = crypto.getRandomValues(new Uint8Array(size));

  for (let i = 0; i < size; i++) {
    id += urlAlphabet[bytes[i] & 63];
  }

  return id;
}

/**
 * Generate a custom alphabet ID
 * @param alphabet - Custom alphabet to use
 * @param size - Length of the ID
 * @returns Random string ID using custom alphabet
 */
export function customAlphabet(alphabet: string, size: number): () => string {
  return () => {
    let id = '';
    const bytes = crypto.getRandomValues(new Uint8Array(size));
    const alphabetLength = alphabet.length;

    for (let i = 0; i < size; i++) {
      id += alphabet[bytes[i] % alphabetLength];
    }

    return id;
  };
}

/**
 * Generate a UUID v4
 * @returns UUID string
 */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a short ID (8 characters)
 */
export const shortId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);

/**
 * Generate a node ID
 */
export function nodeId(): string {
  return `node_${nanoid(16)}`;
}

/**
 * Generate an edge ID
 */
export function edgeId(): string {
  return `edge_${nanoid(16)}`;
}

/**
 * Generate a workflow ID
 */
export function workflowId(): string {
  return `wf_${nanoid(16)}`;
}

/**
 * Generate a credential ID
 */
export function credentialId(): string {
  return `cred_${nanoid(16)}`;
}

/**
 * Generate an execution ID
 */
export function executionId(): string {
  return `exec_${nanoid(16)}`;
}
