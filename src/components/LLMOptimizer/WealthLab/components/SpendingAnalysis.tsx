import { useMemo, memo } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import type { BudgetCategory } from '@/types/wealth';

interface SpendingAnalysisProps {
  month: number;
  year: number;
}

const SpendingAnalysis = memo(function SpendingAnalysis({ month, year }: SpendingAnalysisProps) {
  const transactions = useWealthStore((state) => state.transactions);

  const analysis = useMemo(() => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const monthTransactions = transactions.filter(
      (tx) => tx.date >= startDate && tx.date <= endDate && tx.type === 'expense'
    );

    // Spending by category
    const byCategory: Record<BudgetCategory, number> = {
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
      byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount;
    });

    const total = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Top spending categories
    const topCategories = Object.entries(byCategory)
      .filter(([_, amount]) => amount > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5);

    return {
      total,
      byCategory,
      topCategories,
    };
  }, [transactions, month, year]);

  if (analysis.total === 0) {
    return null;
  }

  return (
    <div className="spending-analysis">
      <h3>Spending Analysis</h3>
      <div className="spending-top-categories">
        <h4>Top Spending Categories</h4>
        <div className="top-categories-list">
          {analysis.topCategories.map(([category, amount]) => {
            const percentage = (amount / analysis.total) * 100;
            return (
              <div key={category} className="top-category-item">
                <div className="top-category-header">
                  <span className="top-category-name">{category.replace('_', ' ').toUpperCase()}</span>
                  <span className="top-category-amount">${amount.toLocaleString()}</span>
                </div>
                <div className="top-category-bar">
                  <div
                    className="top-category-bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="top-category-percentage">{percentage.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default SpendingAnalysis;

