import type { CredentialTypeDefinition } from '@kerdar/core';

// Import credential types
import { SmtpCredential } from './SmtpCredential';
import { SlackApiCredential } from './SlackApiCredential';
import { HttpBasicAuthCredential } from './HttpBasicAuthCredential';
import { HttpHeaderAuthCredential } from './HttpHeaderAuthCredential';
import { ApiKeyCredential } from './ApiKeyCredential';
import { BearerTokenCredential } from './BearerTokenCredential';
import { OAuth2Credential } from './OAuth2Credential';
import { RedisCredential } from './RedisCredential';
import { RabbitMQCredential } from './RabbitMQCredential';
import { MinIOCredential } from './MinIOCredential';

/**
 * All standard credential types
 */
export const standardCredentialTypes: CredentialTypeDefinition[] = [
  SmtpCredential,
  SlackApiCredential,
  HttpBasicAuthCredential,
  HttpHeaderAuthCredential,
  ApiKeyCredential,
  BearerTokenCredential,
  OAuth2Credential,
  RedisCredential,
  RabbitMQCredential,
  MinIOCredential,
];

// Re-export individual credentials
export {
  SmtpCredential,
  SlackApiCredential,
  HttpBasicAuthCredential,
  HttpHeaderAuthCredential,
  ApiKeyCredential,
  BearerTokenCredential,
  OAuth2Credential,
  RedisCredential,
  RabbitMQCredential,
  MinIOCredential,
};

/**
 * Register all standard credential types
 */
export function registerStandardCredentialTypes(
  registerFn: (credential: CredentialTypeDefinition) => void
): void {
  standardCredentialTypes.forEach(registerFn);
}

/**
 * Get a credential type by name
 */
export function getCredentialType(name: string): CredentialTypeDefinition | undefined {
  return standardCredentialTypes.find((cred) => cred.name === name);
}

export default standardCredentialTypes;
