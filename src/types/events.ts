/**
 * Event Type Definitions
 * 
 * Type-safe event definitions for the event bus system.
 */

import type { EventPayload } from '@/services/events/eventBus';

// Idea Lab Event Payloads
export interface IdeaCreatedPayload extends EventPayload {
  ideaId: string;
  title: string;
  topic: string;
}

export interface IdeaStatusChangedPayload extends EventPayload {
  ideaId: string;
  oldStatus: string;
  newStatus: string;
}

// Crypto Lab Event Payloads
export interface CryptoTradeExecutedPayload extends EventPayload {
  tradeId: string;
  pair: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  profit?: number;
}

export interface CryptoProfitThresholdPayload extends EventPayload {
  profit: number;
  threshold: number;
  pair?: string;
}

export interface CryptoWithdrawalRecordedPayload extends EventPayload {
  amount: number;
  currency: string;
  timestamp: Date;
}

// Wealth Lab Event Payloads
export interface WealthNetWorthUpdatedPayload extends EventPayload {
  netWorth: number;
  previousNetWorth: number;
  change: number;
}

export interface WealthBudgetThresholdPayload extends EventPayload {
  category: string;
  spent: number;
  budget: number;
  percentage: number;
}

// Revenue Event Payloads
export interface RevenueIncomeAddedPayload extends EventPayload {
  incomeId: string;
  amount: number;
  source: string;
}

export interface RevenueExpenseAddedPayload extends EventPayload {
  expenseId: string;
  amount: number;
  category: string;
}

export interface RevenueThresholdBreachedPayload extends EventPayload {
  threshold: number;
  current: number;
  type: 'income' | 'expense' | 'profit';
}

// LLM Event Payloads
export interface LLMModelChangedPayload extends EventPayload {
  modelName: string;
  provider: string;
  previousModel?: string;
}

export interface LLMCostThresholdPayload extends EventPayload {
  cost: number;
  threshold: number;
  period: 'daily' | 'monthly' | 'total';
}

// Project Event Payloads
export interface ProjectCreatedPayload extends EventPayload {
  projectId: string;
  name: string;
  ideaId?: string;
}

export interface ProjectCompletedPayload extends EventPayload {
  projectId: string;
  name: string;
}

export interface ProjectDeployedPayload extends EventPayload {
  projectId: string;
  name: string;
  environment: string;
}

// System Event Payloads
export interface SystemErrorPayload extends EventPayload {
  error: Error;
  source: string;
  context?: Record<string, any>;
}

export interface SystemHealthAlertPayload extends EventPayload {
  alert: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metric?: string;
  value?: number;
}

// Workflow Event Payloads
export interface WorkflowStartedPayload extends EventPayload {
  workflowId: string;
  workflowName: string;
}

export interface WorkflowCompletedPayload extends EventPayload {
  workflowId: string;
  workflowName: string;
  duration: number;
  success: boolean;
}

export interface WorkflowFailedPayload extends EventPayload {
  workflowId: string;
  workflowName: string;
  error: string;
  step?: string;
}

