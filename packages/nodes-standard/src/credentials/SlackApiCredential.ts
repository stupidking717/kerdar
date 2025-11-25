import type { CredentialTypeDefinition } from '@kerdar/core';
import { PropertyType, CredentialAuthMethod } from '@kerdar/core';

/**
 * Slack API Credential Type
 * For connecting to Slack workspace
 */
export const SlackApiCredential: CredentialTypeDefinition = {
  name: 'slackApi',
  displayName: 'Slack API',
  description: 'Connect to Slack using a Bot Token or User Token',
  icon: 'message-square',
  documentationUrl: 'https://api.slack.com/authentication/token-types',

  authenticate: {
    type: CredentialAuthMethod.Generic,
  },

  properties: [
    {
      name: 'accessToken',
      displayName: 'Access Token',
      type: PropertyType.String,
      default: '',
      required: true,
      placeholder: 'xoxb-your-token',
      description: 'Slack Bot Token (starts with xoxb-) or User Token (starts with xoxp-)',
      typeOptions: {
        password: true,
      },
    },
  ],

  test: {
    request: {
      url: 'https://slack.com/api/auth.test',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer {{$credentials.accessToken}}',
        'Content-Type': 'application/json',
      },
    },
  },
};
