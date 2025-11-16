import { useState, useCallback } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import type { BudgetCategory } from '@/types/wealth';
import { Save, Copy } from 'lucide-react';

interface BudgetEditorProps {
  month: number;
  year: number;
}

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  'housing',
  'food',
  'transportation',
  'utilities',
  'healthcare',
  'entertainment',
  'shopping',
  'personal_care',
  'education',
  'travel',
  'debt_payment',
  'savings',
  'investments',
  'insurance',
  'gifts',
  'charity',
  'other',
];

function BudgetEditor({ month, year }: BudgetEditorProps) {
  const { getBudget, setBudget } = useWealthStore();
  const existingBudget = getBudget(month, year);

  const [categories, setCategories] = useState<Record<BudgetCategory, number>>(() => {
    if (existingBudget) {
      return existingBudget.categories;
    }
    // Initialize with zeros
    const init: Record<string, number> = {};
    DEFAULT_CATEGORIES.forEach((cat) => {
      init[cat] = 0;
    });
    return init as Record<BudgetCategory, number>;
  });

  const handleCategoryChange = useCallback((category: BudgetCategory, value: string) => {
    setCategories((prev) => ({
      ...prev,
      [category]: parseFloat(value) || 0,
    }));
  }, []);

  const handleSave = useCallback(() => {
    setBudget(month, year, categories);
  }, [setBudget, month, year, categories]);

  const handleCopyPrevious = useCallback(() => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevBudget = getBudget(prevMonth, prevYear);
    if (prevBudget) {
      setCategories(prevBudget.categories);
    }
  }, [getBudget, month, year]);

  return (
    <div className="budget-editor">
      <div className="budget-editor-header">
        <h3>Edit Budget</h3>
        <div className="budget-editor-actions">
          <button className="budget-action-btn" onClick={handleCopyPrevious}>
            <Copy size={16} />
            <span>Copy Previous Month</span>
          </button>
          <button className="budget-action-btn primary" onClick={handleSave}>
            <Save size={16} />
            <span>Save Budget</span>
          </button>
        </div>
      </div>

      <div className="budget-editor-categories">
        {DEFAULT_CATEGORIES.map((category) => (
          <div key={category} className="budget-editor-item">
            <label className="budget-editor-label">
              {category.replace('_', ' ').toUpperCase()}
            </label>
            <div className="budget-editor-input-wrapper">
              <span className="budget-editor-currency">$</span>
              <input
                type="number"
                className="budget-editor-input"
                value={categories[category] || 0}
                onChange={(e) => handleCategoryChange(category, e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BudgetEditor;

