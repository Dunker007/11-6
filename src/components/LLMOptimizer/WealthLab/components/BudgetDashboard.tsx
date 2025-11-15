import { useMemo, memo } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import type { BudgetCategory } from '@/types/wealth';
import { AlertCircle } from 'lucide-react';
import BudgetEditor from './BudgetEditor';
import TransactionList from './TransactionList';
import SpendingAnalysis from './SpendingAnalysis';

interface BudgetDashboardProps {
  month: number;
  year: number;
}

const BudgetDashboard = memo(function BudgetDashboard({ month, year }: BudgetDashboardProps) {
  const getBudget = useWealthStore((state) => state.getBudget);
  const transactions = useWealthStore((state) => state.transactions);

  const budget = useMemo(() => {
    return getBudget(month, year);
  }, [getBudget, month, year]);

  const monthTransactions = useMemo(() => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return transactions.filter(
      (tx) => tx.date >= startDate && tx.date <= endDate && tx.type === 'expense'
    );
  }, [transactions, month, year]);

  const spendingByCategory = useMemo(() => {
    const spending: Record<BudgetCategory, number> = {
      housing: 0,
      food: 0,
      transportation: 0,
      utilities: 0,
      healthcare: 0,
      entertainment: 0,
      shopping: 0,
      personal_care: 0,
      education: 0,
      travel: 0,
      debt_payment: 0,
      savings: 0,
      investments: 0,
      insurance: 0,
      gifts: 0,
      charity: 0,
      other: 0,
    };

    monthTransactions.forEach((tx) => {
      spending[tx.category] = (spending[tx.category] || 0) + tx.amount;
    });

    return spending;
  }, [monthTransactions]);

  const totalSpent = useMemo(() => {
    return monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [monthTransactions]);

  const totalBudgeted = useMemo(() => {
    if (!budget) return 0;
    return Object.values(budget.categories).reduce((sum, amount) => sum + amount, 0);
  }, [budget]);

  const remainingBudget = totalBudgeted - totalSpent;

  const categoryItems = useMemo(() => {
    if (!budget) return [];
    return Object.entries(budget.categories)
      .filter(([_, budgeted]) => budgeted > 0)
      .sort(([_, a], [__, b]) => b - a)
      .map(([category, budgeted]) => {
        const spent = spendingByCategory[category as BudgetCategory] || 0;
        const remaining = budgeted - spent;
        const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;
        const isOverBudget = spent > budgeted;
        return { category, budgeted, spent, remaining, percentage, isOverBudget };
      });
  }, [budget, spendingByCategory]);

  if (!budget) {
    return (
      <div className="budget-dashboard">
        <div className="budget-empty">
          <p>No budget set for this month</p>
          <p className="empty-hint">Create a budget to start tracking your spending</p>
          <BudgetEditor month={month} year={year} />
        </div>
      </div>
    );
  }

  return (
    <div className="budget-dashboard">
      {/* Budget Overview */}
      <div className="budget-overview">
        <div className="budget-summary">
          <div className="budget-summary-item">
            <div className="summary-label">Total Budgeted</div>
            <div className="summary-value">${totalBudgeted.toLocaleString()}</div>
          </div>
          <div className="budget-summary-item">
            <div className="summary-label">Total Spent</div>
            <div className="summary-value">${totalSpent.toLocaleString()}</div>
          </div>
          <div className="budget-summary-item">
            <div className="summary-label">Remaining</div>
            <div className={`summary-value ${remainingBudget >= 0 ? 'positive' : 'negative'}`}>
              ${remainingBudget.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="budget-progress-overall">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${totalBudgeted > 0 ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0}%`,
                backgroundColor: remainingBudget >= 0 ? 'var(--emerald-500)' : 'var(--red-500)',
              }}
            />
          </div>
          <div className="progress-text">
            {totalBudgeted > 0
              ? `${((totalSpent / totalBudgeted) * 100).toFixed(1)}% of budget used`
              : 'No budget set'}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="budget-categories">
        <h3>Category Breakdown</h3>
        <div className="category-list">
          {categoryItems.map(({ category, budgeted, spent, remaining, percentage, isOverBudget }) => (
            <div key={category} className="category-item">
              <div className="category-header">
                <span className="category-name">{category.replace('_', ' ').toUpperCase()}</span>
                <span className={`category-remaining ${remaining >= 0 ? 'positive' : 'negative'}`}>
                  ${Math.abs(remaining).toLocaleString()} {remaining >= 0 ? 'left' : 'over'}
                </span>
              </div>
              <div className="category-amounts">
                <span className="category-spent">${spent.toLocaleString()}</span>
                <span className="category-budgeted">/ ${budgeted.toLocaleString()}</span>
              </div>
              <div className="category-progress-bar">
                <div
                  className={`category-progress-fill ${isOverBudget ? 'over-budget' : ''}`}
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                  }}
                />
                {isOverBudget && (
                  <div
                    className="category-progress-over"
                    style={{
                      width: `${percentage - 100}%`,
                      marginLeft: '100%',
                    }}
                  />
                )}
              </div>
              {isOverBudget && (
                <div className="category-warning">
                  <AlertCircle size={14} />
                  <span>Over budget by ${Math.abs(remaining).toLocaleString()}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Spending Analysis */}
      <SpendingAnalysis month={month} year={year} />

      {/* Transactions */}
      <TransactionList month={month} year={year} />
    </div>
  );
});

export default BudgetDashboard;
