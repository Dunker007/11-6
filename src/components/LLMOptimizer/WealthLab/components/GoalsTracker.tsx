import { useState, useCallback, useMemo, memo } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import { Plus } from 'lucide-react';
import type { Goal, GoalType } from '@/types/wealth';

const GoalsTracker = memo(function GoalsTracker() {
  const { goals, addGoal } = useWealthStore();
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddGoal = useCallback(() => {
    setShowAddForm(true);
  }, []);

  const handleSaveGoal = useCallback(
    (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
      addGoal(goal);
      setShowAddForm(false);
    },
    [addGoal]
  );

  const handleCancelForm = useCallback(() => {
    setShowAddForm(false);
  }, []);

  const progressPercentage = useCallback((goal: Goal) => {
    return goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  }, []);

  const goalsWithProgress = useMemo(() => {
    return goals.map((goal) => ({
      ...goal,
      progress: progressPercentage(goal),
    }));
  }, [goals, progressPercentage]);

  return (
    <div className="goals-tracker">
      <div className="goals-tracker-header">
        <h3>Financial Goals</h3>
        <button className="goal-add-btn" onClick={handleAddGoal}>
          <Plus size={16} />
          <span>Add Goal</span>
        </button>
      </div>

      {showAddForm && <GoalForm onSave={handleSaveGoal} onCancel={handleCancelForm} />}

      <div className="goals-list">
        {goals.length === 0 ? (
          <div className="goals-empty">
            <p>No goals set</p>
            <p className="empty-hint">Create financial goals to track your progress</p>
          </div>
        ) : (
          goalsWithProgress.map((goal) => (
            <div key={goal.id} className="goal-item">
              <div className="goal-header">
                <div className="goal-info">
                  <div className="goal-name">{goal.name}</div>
                  <div className="goal-type">{goal.type.replace('_', ' ').toUpperCase()}</div>
                </div>
                <div className="goal-amount">
                  ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                </div>
              </div>
              <div className="goal-progress">
                <div className="goal-progress-bar">
                  <div
                    className="goal-progress-fill"
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
                <div className="goal-progress-text">{goal.progress.toFixed(1)}%</div>
              </div>
              {goal.targetDate && (
                <div className="goal-date">
                  Target: {goal.targetDate.toLocaleDateString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

interface GoalFormProps {
  goal?: Goal;
  onSave: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const GoalForm = memo(function GoalForm({ goal, onSave, onCancel }: GoalFormProps) {
  const [name, setName] = useState(goal?.name || '');
  const [type, setType] = useState<GoalType>(goal?.type || 'savings');
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount.toString() || '0');
  const [currentAmount, setCurrentAmount] = useState(goal?.currentAmount.toString() || '0');
  const [targetDate, setTargetDate] = useState(
    goal?.targetDate ? goal.targetDate.toISOString().split('T')[0] : ''
  );
  const [monthlyContribution, setMonthlyContribution] = useState(
    goal?.monthlyContribution?.toString() || '0'
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        name,
        type,
        targetAmount: parseFloat(targetAmount) || 0,
        currentAmount: parseFloat(currentAmount) || 0,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        monthlyContribution: monthlyContribution ? parseFloat(monthlyContribution) : undefined,
        notes: goal?.notes,
      });
    },
    [name, type, targetAmount, currentAmount, targetDate, monthlyContribution, goal, onSave]
  );

  return (
    <form className="goal-form" onSubmit={handleSubmit}>
      <h4>{goal ? 'Edit Goal' : 'Add Goal'}</h4>
      <label>
        Goal Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label>
        Goal Type
        <select value={type} onChange={(e) => setType(e.target.value as GoalType)} required>
          <option value="savings">Savings</option>
          <option value="debt_payoff">Debt Payoff</option>
          <option value="purchase">Purchase</option>
          <option value="emergency_fund">Emergency Fund</option>
          <option value="retirement">Retirement</option>
          <option value="other">Other</option>
        </select>
      </label>
      <div className="goal-form-row">
        <label>
          Current Amount ($)
          <input
            type="number"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            min="0"
            step="0.01"
            required
          />
        </label>
        <label>
          Target Amount ($)
          <input
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            min="0"
            step="0.01"
            required
          />
        </label>
      </div>
      <div className="goal-form-row">
        <label>
          Target Date (optional)
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </label>
        <label>
          Monthly Contribution ($)
          <input
            type="number"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value)}
            min="0"
            step="0.01"
          />
        </label>
      </div>
      <div className="goal-form-actions">
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
});

export default GoalsTracker;
