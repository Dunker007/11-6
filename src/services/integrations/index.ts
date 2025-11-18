/**
 * Integration Services Index
 * Central export point for all integration services
 */

export { githubIntegrationService } from './githubIntegrationService';
export { notionIntegrationService } from './notionIntegrationService';
export { airtableIntegrationService } from './airtableIntegrationService';
export { slackIntegrationService } from './slackIntegrationService';
export { zapierIntegrationService } from './zapierIntegrationService';

export type { GitHubRepo, GitHubIssue, GitHubRelease } from './githubIntegrationService';
export type { NotionPage, NotionDatabase, ContentToNotion } from './notionIntegrationService';
export type { AirtableBase, AirtableTable, AirtableRecord, ContentRecord } from './airtableIntegrationService';
export type { SlackMessage, SlackChannel, SlackNotification } from './slackIntegrationService';
export type { ZapierZap, ZapierTrigger, ZapierAction, ZapierWebhook } from './zapierIntegrationService';
