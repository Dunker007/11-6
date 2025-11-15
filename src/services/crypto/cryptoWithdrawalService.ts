/**
 * Crypto Withdrawal Service
 * 
 * Bridges Crypto Lab (trading P&L) to Revenue & Monetization (business income).
 * 
 * IMPORTANT SEPARATION:
 * - Crypto Lab: Tracks trading positions, P&L, orders (on-exchange only)
 * - Revenue & Monetization: Tracks business income/expenses, including crypto profits when withdrawn
 * - Wealth Lab: Tracks personal net worth, assets, liabilities (separate from business revenue)
 * 
 * When crypto profits are withdrawn from an exchange, they become business revenue
 * and should be tracked in the Revenue & Monetization tab via financialService.
 */

import { financialService } from '@/services/backoffice/financialService';

export interface WithdrawalRecord {
  id: string;
  amount: number;
  source: 'trading' | 'staking';
  date: Date;
  description?: string;
  exchange?: string;
}

/**
 * Track crypto withdrawal from exchange to revenue/monetization
 * 
 * This method records a withdrawal as business income in the Revenue & Monetization tab.
 * Crypto profits stay in Crypto Lab until explicitly withdrawn.
 * 
 * @param amount - USD value of the withdrawal
 * @param source - 'trading' for trading profits, 'staking' for staking rewards
 * @param date - Date of withdrawal (defaults to now)
 * @param description - Optional description of the withdrawal
 * @param exchange - Optional exchange name (e.g., 'Coinbase')
 * @returns The created withdrawal record
 */
export async function trackCryptoWithdrawal(
  amount: number,
  source: 'trading' | 'staking' = 'trading',
  date: Date = new Date(),
  description?: string,
  exchange?: string
): Promise<WithdrawalRecord> {
  if (amount <= 0) {
    throw new Error('Withdrawal amount must be greater than 0');
  }

  // Record in Revenue & Monetization via financialService
  financialService.trackCryptoIncome(amount, source, date);

  // Return withdrawal record (could be stored separately if needed)
  return {
    id: crypto.randomUUID(),
    amount,
    source,
    date,
    description: description || `Crypto ${source} withdrawal${exchange ? ` from ${exchange}` : ''}`,
    exchange,
  };
}

