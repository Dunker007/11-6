/**
 * Integration Types
 * Models for external service integrations
 */

export type IntegrationType =
  | 'stripe'
  | 'github'
  | 'twitter'
  | 'medium'
  | 'wordpress'
  | 'vastai'
  | 'salad';

export type IntegrationStatus =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'testing';

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  status: IntegrationStatus;
  credentials?: Record<string, string>;
  config?: Record<string, any>;
  lastSync?: Date;
  error?: string;
}

export interface IntegrationConfig {
  type: IntegrationType;
  name: string;
  description: string;
  fields: IntegrationField[];
  autoDetect?: boolean;
  setupTime: number; // minutes
}

export interface IntegrationField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'select';
  placeholder?: string;
  required: boolean;
  validation?: (value: string) => { valid: boolean; error?: string };
}

export interface WebhookEvent {
  id: string;
  source: IntegrationType;
  event: string;
  payload: Record<string, any>;
  timestamp: Date;
  processed: boolean;
}
