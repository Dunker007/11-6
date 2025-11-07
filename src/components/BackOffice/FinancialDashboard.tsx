import { useState, useEffect, useCallback } from 'react';
import { useFinancialStore } from '../../services/backoffice/financialStore';
import { useThresholdStore } from '../../services/backoffice/thresholdStore';
import type { ExpenseCategory, IncomeSource } from '@/types/backoffice';
import '../../styles/FinancialDashboard.css';

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'api_costs', label: 'API Costs', icon: '🔌' },
  { value: 'hosting', label: 'Hosting', icon: '☁️' },
  { value: 'tools', label: 'Tools', icon: '🛠️' },
  { value: 'subscriptions', label: 'Subscriptions', icon: '📱' },
  { value: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
  { value: 'services', label: 'Services', icon: '🔧' },
  { value: 'development', label: 'Development', icon: '💻' },
  { value: 'legal', label: 'Legal', icon: '⚖️' },
  { value: 'marketing', label: 'Marketing', icon: '📢' },
  { value: 'other', label: 'Other', icon: '📦' },
];

const INCOME_SOURCES: { value: IncomeSource; label: string; icon: string }[] = [
  { value: 'saas_subscriptions', label: 'SaaS Subscriptions', icon: '💼' },
  { value: 'affiliate', label: 'Affiliate', icon: '🤝' },
  { value: 'crypto_trading', label: 'Crypto Trading', icon: '₿' },
  { value: 'crypto_staking', label: 'Crypto Staking', icon: '🔗' },
  { value: 'idle_computing', label: 'Idle Computing', icon: '💤' },
  { value: 'product_sales', label: 'Product Sales', icon: '🛒' },
  { value: 'service_revenue', label: 'Service Revenue', icon: '💵' },
  { value: 'certifications', label: 'Certifications', icon: '🎓' },
  { value: 'other', label: 'Other', icon: '💰' },
];

function FinancialDashboard() {
  const {
    expenses,
    income,
    summary,
    addExpense,
    addIncome,
    deleteExpense,
    deleteIncome,
    refresh,
  } = useFinancialStore();

  const { status, alert, clearAlert } = useThresholdStore();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'income'>('overview');

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (summary) {
      useThresholdStore.getState().updateFinancials(summary.totalIncome, summary.totalExpenses);
    }
  }, [summary]);

  // Memoize currency formatter to avoid recreating on every render
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addExpense({
      category: formData.get('category') as ExpenseCategory,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      recurring: formData.get('recurring') === 'on',
      tags: (formData.get('tags') as string).split(',').map((t) => t.trim()).filter(Boolean),
      notes: formData.get('notes') as string || undefined,
    });
    setShowAddExpense(false);
    (e.target as HTMLFormElement).reset();
  };

  const handleAddIncome = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addIncome({
      source: formData.get('source') as IncomeSource,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      recurring: formData.get('recurring') === 'on',
      tags: (formData.get('tags') as string).split(',').map((t) => t.trim()).filter(Boolean),
      notes: formData.get('notes') as string || undefined,
    });
    setShowAddIncome(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="financial-dashboard">
      <div className="dashboard-header">
        <h2>Financial Dashboard</h2>
        <div className="header-actions">
          <button onClick={() => setShowAddExpense(true)} className="add-btn">
            + Expense
          </button>
          <button onClick={() => setShowAddIncome(true)} className="add-btn income-btn">
            + Income
          </button>
        </div>
      </div>

      {alert && (
        <div className={`threshold-alert ${alert.type}`}>
          <div className="alert-content">
            <strong>{alert.type === 'reached' ? '🎯' : alert.type === 'exceeded' ? '⚠️' : '📊'}</strong>
            <div>
              <div className="alert-message">{alert.message}</div>
              <div className="alert-actions">
                {alert.actions.map((action, idx) => (
                  <span key={idx} className="action-item">• {action}</span>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => clearAlert(alert.id)} className="alert-close">×</button>
        </div>
      )}

      {status && (
        <div className={`grace-period-banner ${status.isGracePeriod ? 'active' : 'reached'}`}>
          <div className="banner-content">
            <strong>{status.isGracePeriod ? '🛡️ Grace Period Active' : '✅ Threshold Reached'}</strong>
            <span>
              {status.isGracePeriod
                ? `Grace Period Active: $${(status.threshold - status.currentProfit).toFixed(2)} until threshold. Focus on building - compliance framework is being prepared.`
                : 'Threshold Reached: Time to get serious about incorporation and reporting.'}
            </span>
          </div>
          <div className="banner-stats">
            <div className="stat">
              <span className="label">Profit:</span>
              <span className={`value ${status.currentProfit >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(status.currentProfit)}
              </span>
            </div>
            <div className="stat">
              <span className="label">Threshold:</span>
              <span className="value">{formatCurrency(status.threshold)}</span>
            </div>
            {status.daysUntilThreshold && (
              <div className="stat">
                <span className="label">Est. Days:</span>
                <span className="value">{status.daysUntilThreshold}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {summary && (
        <div className="summary-cards">
          <div className="summary-card income">
            <div className="card-header">
              <span className="card-icon">💰</span>
              <h3>Total Income</h3>
            </div>
            <div className="card-value">{formatCurrency(summary.totalIncome)}</div>
          </div>

          <div className="summary-card expenses">
            <div className="card-header">
              <span className="card-icon">💸</span>
              <h3>Total Expenses</h3>
            </div>
            <div className="card-value">{formatCurrency(summary.totalExpenses)}</div>
          </div>

          <div className={`summary-card profit ${summary.profit >= 0 ? 'positive' : 'negative'}`}>
            <div className="card-header">
              <span className="card-icon">{summary.profit >= 0 ? '📈' : '📉'}</span>
              <h3>Net Profit</h3>
            </div>
            <div className="card-value">{formatCurrency(summary.profit)}</div>
            <div className="card-meta">Margin: {summary.profitMargin.toFixed(1)}%</div>
          </div>
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          Expenses ({expenses.length})
        </button>
        <button
          className={`tab ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => setActiveTab('income')}
        >
          Income ({income.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && summary && (
          <div className="overview-content">
            <div className="breakdown-section">
              <h3>Expenses by Category</h3>
              <div className="breakdown-list">
                {Object.entries(summary.byCategory.expenses)
                  .filter(([_, amount]) => amount > 0)
                  .sort(([_, a], [__, b]) => b - a)
                  .map(([category, amount]) => {
                    const cat = EXPENSE_CATEGORIES.find((c) => c.value === category);
                    const percentage = (amount / summary.totalExpenses) * 100;
                    return (
                      <div key={category} className="breakdown-item">
                        <div className="breakdown-header">
                          <span>{cat?.icon} {cat?.label}</span>
                          <span>{formatCurrency(amount)} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="breakdown-bar">
                          <div
                            className="breakdown-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="breakdown-section">
              <h3>Income by Source</h3>
              <div className="breakdown-list">
                {Object.entries(summary.byCategory.income)
                  .filter(([_, amount]) => amount > 0)
                  .sort(([_, a], [__, b]) => b - a)
                  .map(([source, amount]) => {
                    const src = INCOME_SOURCES.find((s) => s.value === source);
                    const percentage = (amount / summary.totalIncome) * 100;
                    return (
                      <div key={source} className="breakdown-item">
                        <div className="breakdown-header">
                          <span>{src?.icon} {src?.label}</span>
                          <span>{formatCurrency(amount)} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="breakdown-bar">
                          <div
                            className="breakdown-fill income-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="expenses-list">
            {expenses.length === 0 ? (
              <div className="empty-state">No expenses tracked yet. Add your first expense to get started.</div>
            ) : (
              expenses.map((expense) => {
                const cat = EXPENSE_CATEGORIES.find((c) => c.value === expense.category);
                return (
                  <div key={expense.id} className="expense-item">
                    <div className="item-main">
                      <span className="item-icon">{cat?.icon}</span>
                      <div className="item-details">
                        <div className="item-description">{expense.description}</div>
                        <div className="item-meta">
                          <span>{cat?.label}</span>
                          <span>•</span>
                          <span>{expense.date.toLocaleDateString()}</span>
                          {expense.recurring && <span>• Recurring</span>}
                        </div>
                      </div>
                    </div>
                    <div className="item-amount">{formatCurrency(expense.amount)}</div>
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="delete-btn"
                      title="Delete expense"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'income' && (
          <div className="income-list">
            {income.length === 0 ? (
              <div className="empty-state">No income tracked yet. Add your first income source to get started.</div>
            ) : (
              income.map((item) => {
                const src = INCOME_SOURCES.find((s) => s.value === item.source);
                return (
                  <div key={item.id} className="income-item">
                    <div className="item-main">
                      <span className="item-icon">{src?.icon}</span>
                      <div className="item-details">
                        <div className="item-description">{item.description}</div>
                        <div className="item-meta">
                          <span>{src?.label}</span>
                          <span>•</span>
                          <span>{item.date.toLocaleDateString()}</span>
                          {item.recurring && <span>• Recurring</span>}
                        </div>
                      </div>
                    </div>
                    <div className="item-amount positive">{formatCurrency(item.amount)}</div>
                    <button
                      onClick={() => deleteIncome(item.id)}
                      className="delete-btn"
                      title="Delete income"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {showAddExpense && (
        <div className="modal-overlay" onClick={() => setShowAddExpense(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Expense</h3>
              <button className="modal-close" onClick={() => setShowAddExpense(false)}>×</button>
            </div>
            <form onSubmit={handleAddExpense} className="add-form">
              <div className="form-group">
                <label>Category</label>
                <select name="category" required>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" name="description" required />
              </div>
              <div className="form-group">
                <label>Amount ($)</label>
                <input type="number" name="amount" step="0.01" min="0" required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" name="recurring" />
                  Recurring expense
                </label>
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" name="tags" placeholder="api, monthly, essential" />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea name="notes" rows={3} />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Add Expense</button>
                <button type="button" onClick={() => setShowAddExpense(false)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddIncome && (
        <div className="modal-overlay" onClick={() => setShowAddIncome(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Income</h3>
              <button className="modal-close" onClick={() => setShowAddIncome(false)}>×</button>
            </div>
            <form onSubmit={handleAddIncome} className="add-form">
              <div className="form-group">
                <label>Source</label>
                <select name="source" required>
                  {INCOME_SOURCES.map((src) => (
                    <option key={src.value} value={src.value}>
                      {src.icon} {src.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" name="description" required />
              </div>
              <div className="form-group">
                <label>Amount ($)</label>
                <input type="number" name="amount" step="0.01" min="0" required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" name="recurring" />
                  Recurring income
                </label>
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" name="tags" placeholder="passive, crypto, monthly" />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea name="notes" rows={3} />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Add Income</button>
                <button type="button" onClick={() => setShowAddIncome(false)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancialDashboard;

