import { useMemo, useState, useCallback, memo } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import { wealthService } from '@/services/wealth/wealthService';
import { useToast } from '@/components/ui';
import { formatCurrency } from '@/utils/formatters';
import { Search, Filter, Edit2, Trash2, Scissors, CheckSquare, Square, X, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/utils/hooks/useDebounce';
import { usePagination } from '@/utils/hooks/usePerformance';
import { DEBOUNCE_DELAYS } from '@/utils/constants';
import type { Transaction, BudgetCategory } from '@/types/wealth';
import '@/styles/WealthLab.css';

interface TransactionListProps {
  month: number;
  year: number;
}

interface SplitForm {
  splits: Array<{ amount: number; category: BudgetCategory; description: string }>;
}

const TransactionList = memo(function TransactionList({ month, year }: TransactionListProps) {
  const transactions = useWealthStore((state) => state.transactions);
  const loadTransactions = useWealthStore((state) => state.loadTransactions);
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMerchant, setFilterMerchant] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [splittingId, setSplittingId] = useState<string | null>(null);
  const [splitForm, setSplitForm] = useState<SplitForm>({ splits: [{ amount: 0, category: 'other', description: '' }] });
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<BudgetCategory>('other');
  const [groupByMerchant, setGroupByMerchant] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const debouncedSearch = useDebounce(searchQuery, DEBOUNCE_DELAYS.SEARCH_INPUT);
  const debouncedMinAmount = useDebounce(minAmount, DEBOUNCE_DELAYS.SEARCH_INPUT);
  const debouncedMaxAmount = useDebounce(maxAmount, DEBOUNCE_DELAYS.SEARCH_INPUT);

  const monthTransactions = useMemo(() => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    let filtered = transactions.filter(
      (tx) => tx.date >= startDate && tx.date <= endDate
    );

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.description.toLowerCase().includes(query) ||
          tx.merchant?.toLowerCase().includes(query) ||
          tx.category.toLowerCase().includes(query) ||
          tx.notes?.toLowerCase().includes(query)
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((tx) => tx.category === filterCategory);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((tx) => tx.type === filterType);
    }

    if (filterMerchant !== 'all') {
      filtered = filtered.filter((tx) => (tx.merchant || 'Unknown') === filterMerchant);
    }

    if (debouncedMinAmount) {
      const min = parseFloat(debouncedMinAmount);
      if (!isNaN(min)) {
        filtered = filtered.filter((tx) => tx.amount >= min);
      }
    }

    if (debouncedMaxAmount) {
      const max = parseFloat(debouncedMaxAmount);
      if (!isNaN(max)) {
        filtered = filtered.filter((tx) => tx.amount <= max);
      }
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, month, year, debouncedSearch, filterCategory, filterType, filterMerchant, debouncedMinAmount, debouncedMaxAmount]);

  // Pagination for transactions
  const {
    currentPage,
    totalPages,
    paginatedItems,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    totalItems,
  } = usePagination(monthTransactions, itemsPerPage);

  const categories = useMemo(() => {
    const cats = new Set(transactions.map((tx) => tx.category));
    return Array.from(cats).sort();
  }, [transactions]);

  const merchants = useMemo(() => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const monthTxs = transactions.filter(
      (tx) => tx.date >= startDate && tx.date <= endDate && tx.merchant
    );
    const merchantSet = new Set(monthTxs.map((tx) => tx.merchant!));
    return Array.from(merchantSet).sort();
  }, [transactions, month, year]);

  const groupedByMerchant = useMemo(() => {
    if (!groupByMerchant) return null;
    const grouped = new Map<string, Transaction[]>();
    monthTransactions.forEach((tx) => {
      const merchant = tx.merchant || 'Unknown';
      if (!grouped.has(merchant)) {
        grouped.set(merchant, []);
      }
      grouped.get(merchant)!.push(tx);
    });
    return grouped;
  }, [monthTransactions, groupByMerchant]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === paginatedItems.length) {
      // Deselect all on current page
      const pageIds = new Set(paginatedItems.map((tx) => tx.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select all on current page
      const pageIds = new Set(paginatedItems.map((tx) => tx.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [selectedIds.size, paginatedItems]);

  // Optimistic update for bulk operations
  const handleBulkUpdate = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    try {
      // Optimistically update UI immediately
      wealthService.bulkUpdateTransactions(Array.from(selectedIds), { category: bulkCategory });
      
      // Reload transactions to sync with store
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      loadTransactions(startDate, endDate);
      
      setSelectedIds(new Set());
      setBulkEditMode(false);
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to update transactions',
        message: (error as Error).message,
      });
      // Reload on error to ensure consistency
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      loadTransactions(startDate, endDate);
    }
  }, [selectedIds, bulkCategory, year, month, loadTransactions]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} transaction(s)?`)) return;
    const count = wealthService.bulkDeleteTransactions(Array.from(selectedIds));
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    loadTransactions(startDate, endDate);
    setSelectedIds(new Set());
    showToast({
      variant: 'success',
      title: 'Transactions deleted',
      message: `Deleted ${count} transaction(s)`,
      duration: 3000,
    });
  }, [selectedIds, loadTransactions, month, year, showToast]);

  const handleSplit = useCallback((tx: Transaction) => {
    setSplittingId(tx.id);
    setSplitForm({
      splits: [{ amount: tx.amount, category: tx.category, description: tx.description }],
    });
  }, []);

  const handleSplitSubmit = useCallback(() => {
    if (!splittingId) return;
    const tx = transactions.find((t) => t.id === splittingId);
    if (!tx) return;

    const totalAmount = splitForm.splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalAmount - tx.amount) > 0.01) {
      showToast({
        variant: 'error',
        title: 'Invalid split amounts',
        message: `Split amounts must equal original amount (${tx.amount.toFixed(2)})`,
      });
      return;
    }

    try {
      wealthService.splitTransaction(splittingId, splitForm.splits);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      loadTransactions(startDate, endDate);
      setSplittingId(null);
      setSplitForm({ splits: [{ amount: 0, category: 'other', description: '' }] });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to split transaction',
        message: (error as Error).message,
      });
    }
  }, [splittingId, splitForm, transactions, loadTransactions, month, year, showToast]);

  const addSplitRow = useCallback(() => {
    setSplitForm((prev) => ({
      splits: [...prev.splits, { amount: 0, category: 'other', description: '' }],
    }));
  }, []);

  const removeSplitRow = useCallback((index: number) => {
    setSplitForm((prev) => ({
      splits: prev.splits.filter((_, i) => i !== index),
    }));
  }, []);

  const updateSplitRow = useCallback((index: number, field: 'amount' | 'category' | 'description', value: string | number) => {
    setSplitForm((prev) => ({
      splits: prev.splits.map((split, i) =>
        i === index ? { ...split, [field]: value } : split
      ),
    }));
  }, []);

  const handleEdit = useCallback((tx: Transaction) => {
    setEditingId(tx.id);
  }, []);

  const handleSaveEdit = useCallback(async (id: string, updates: Partial<Transaction>) => {
    try {
      // Optimistic update - update immediately
      wealthService.updateTransaction(id, updates);
      
      // Reload to sync with store
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      loadTransactions(startDate, endDate);
      setEditingId(null);
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to update transaction',
        message: (error as Error).message,
      });
      // Reload on error
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      loadTransactions(startDate, endDate);
    }
  }, [year, month, loadTransactions, showToast]);

  const handleDelete = useCallback((id: string) => {
    if (!confirm('Delete this transaction?')) return;
    wealthService.deleteTransaction(id);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    loadTransactions(startDate, endDate);
  }, [loadTransactions, month, year]);


  const renderTransaction = (tx: Transaction, showCheckbox: boolean = false) => {
    if (editingId === tx.id) {
      return (
        <TransactionEditForm
          key={tx.id}
          transaction={tx}
          categories={categories}
          onSave={(updates) => handleSaveEdit(tx.id, updates)}
          onCancel={() => setEditingId(null)}
        />
      );
    }

    return (
      <div key={tx.id} className={`transaction-item ${selectedIds.has(tx.id) ? 'selected' : ''}`}>
        {showCheckbox && (
          <div className="transaction-checkbox">
            <button
              type="button"
              onClick={() => toggleSelect(tx.id)}
              className="checkbox-btn"
            >
              {selectedIds.has(tx.id) ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
          </div>
        )}
        <div className="transaction-main">
          <div className="transaction-info">
            <div className="transaction-description">{tx.description}</div>
            <div className="transaction-meta">
              <span className="transaction-category">{tx.category.replace('_', ' ').toUpperCase()}</span>
              <span className="transaction-date">
                {tx.date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              {tx.merchant && <span className="transaction-merchant">{tx.merchant}</span>}
            </div>
          </div>
          <div className="transaction-amount-wrapper">
            <div className={`transaction-amount ${tx.type === 'expense' ? 'expense' : 'income'}`}>
              {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
            </div>
            <div className="transaction-actions">
              <button
                type="button"
                onClick={() => handleEdit(tx)}
                className="transaction-action-btn"
                title="Edit"
              >
                <Edit2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleSplit(tx)}
                className="transaction-action-btn"
                title="Split"
              >
                <Scissors size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(tx.id)}
                className="transaction-action-btn danger"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
        {tx.tags && tx.tags.length > 0 && (
          <div className="transaction-tags">
            {tx.tags.map((tag) => (
              <span key={tag} className="transaction-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
        {splittingId === tx.id && (
          <div className="transaction-split-form">
            <h4>Split Transaction</h4>
            {splitForm.splits.map((split, index) => (
              <div key={index} className="split-row">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={split.amount || ''}
                  onChange={(e) => updateSplitRow(index, 'amount', parseFloat(e.target.value) || 0)}
                  className="split-input"
                />
                <select
                  value={split.category}
                  onChange={(e) => updateSplitRow(index, 'category', e.target.value as BudgetCategory)}
                  className="split-select"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Description"
                  value={split.description}
                  onChange={(e) => updateSplitRow(index, 'description', e.target.value)}
                  className="split-input"
                />
                {splitForm.splits.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSplitRow(index)}
                    className="split-remove-btn"
                  >
                    <Minus size={14} />
                  </button>
                )}
              </div>
            ))}
            <div className="split-actions">
              <button type="button" onClick={addSplitRow} className="split-add-btn">
                <Plus size={14} /> Add Split
              </button>
              <div className="split-total">
                Total: {formatCurrency(splitForm.splits.reduce((sum, s) => sum + s.amount, 0))}
              </div>
              <button type="button" onClick={handleSplitSubmit} className="split-submit-btn">
                Split Transaction
              </button>
              <button
                type="button"
                onClick={() => {
                  setSplittingId(null);
                  setSplitForm({ splits: [{ amount: 0, category: 'other', description: '' }] });
                }}
                className="split-cancel-btn"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="transaction-list">
      <div className="transaction-list-header">
        <h3>Transactions</h3>
        <div className="transaction-list-controls">
          <div className="transaction-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="transaction-search-input"
            />
          </div>
          <div className="transaction-filter">
            <Filter size={16} />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="transaction-filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="transaction-filter">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="transaction-filter-select"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
              <option value="transfer">Transfers</option>
            </select>
          </div>
          {merchants.length > 0 && (
            <div className="transaction-filter">
              <select
                value={filterMerchant}
                onChange={(e) => setFilterMerchant(e.target.value)}
                className="transaction-filter-select"
              >
                <option value="all">All Merchants</option>
                {merchants.map((merchant) => (
                  <option key={merchant} value={merchant}>
                    {merchant}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="transaction-filter">
            <input
              type="number"
              placeholder="Min $"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="transaction-filter-input"
            />
          </div>
          <div className="transaction-filter">
            <input
              type="number"
              placeholder="Max $"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="transaction-filter-input"
            />
          </div>
          <button
            type="button"
            onClick={() => setGroupByMerchant(!groupByMerchant)}
            className={`transaction-toggle-btn ${groupByMerchant ? 'active' : ''}`}
            title="Group by merchant"
          >
            Group
          </button>
        </div>
      </div>

      {bulkEditMode && selectedIds.size > 0 && (
        <div className="bulk-edit-bar">
          <span>{selectedIds.size} selected</span>
          <select
            value={bulkCategory}
            onChange={(e) => setBulkCategory(e.target.value as BudgetCategory)}
            className="bulk-category-select"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
          <button type="button" onClick={handleBulkUpdate} className="bulk-update-btn">
            Update Category
          </button>
          <button type="button" onClick={handleBulkDelete} className="bulk-delete-btn">
            Delete Selected
          </button>
          <button type="button" onClick={() => {
            setBulkEditMode(false);
            setSelectedIds(new Set());
          }} className="bulk-cancel-btn">
            <X size={16} />
          </button>
        </div>
      )}

      {!bulkEditMode && (
        <div className="transaction-list-actions">
          <button
            type="button"
            onClick={() => setBulkEditMode(true)}
            className="bulk-edit-toggle-btn"
          >
            <CheckSquare size={16} /> Bulk Edit
          </button>
        </div>
      )}

      <div className="transaction-list-items">
        {monthTransactions.length === 0 ? (
          <div className="transaction-empty">
            <p>No transactions found</p>
            <p className="empty-hint">
              {searchQuery || filterCategory !== 'all' || filterType !== 'all' || filterMerchant !== 'all' || minAmount || maxAmount
                ? 'Try adjusting your search or filters'
                : 'Add transactions to track your spending'}
            </p>
          </div>
        ) : groupByMerchant && groupedByMerchant ? (
          Array.from(groupedByMerchant.entries()).map(([merchant, txs]) => (
            <div key={merchant} className="merchant-group">
              <div className="merchant-group-header">
                <h4>{merchant}</h4>
                <span className="merchant-total">
                  {formatCurrency(txs.reduce((sum, tx) => sum + (tx.type === 'expense' ? -tx.amount : tx.amount), 0))}
                </span>
                <span className="merchant-count">{txs.length} transaction(s)</span>
              </div>
              {txs.map((tx) => renderTransaction(tx, bulkEditMode))}
            </div>
          ))
        ) : (
          <>
            {bulkEditMode && (
              <div className="transaction-select-all">
                <button type="button" onClick={toggleSelectAll} className="select-all-btn">
                  {selectedIds.size === paginatedItems.length ? <CheckSquare size={18} /> : <Square size={18} />}
                  Select All ({paginatedItems.length} on this page)
                </button>
              </div>
            )}
            {paginatedItems.map((tx) => renderTransaction(tx, bulkEditMode))}
          </>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <div className="pagination-info">
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
          </div>
          <div className="pagination-buttons">
            <button
              type="button"
              onClick={previousPage}
              disabled={!hasPreviousPage}
              className="pagination-btn"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <div className="pagination-pages">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => goToPage(pageNum)}
                    className={`pagination-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={nextPage}
              disabled={!hasNextPage}
              className="pagination-btn"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="pagination-items-select"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
      )}
    </div>
  );
});

interface TransactionEditFormProps {
  transaction: Transaction;
  categories: string[];
  onSave: (updates: Partial<Transaction>) => void;
  onCancel: () => void;
}

const TransactionEditForm = memo(function TransactionEditForm({
  transaction,
  categories,
  onSave,
  onCancel,
}: TransactionEditFormProps) {
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category);
  const [merchant, setMerchant] = useState(transaction.merchant || '');
  const [notes, setNotes] = useState(transaction.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      description,
      amount: parseFloat(amount),
      category: category as BudgetCategory,
      merchant: merchant || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <form className="transaction-edit-form" onSubmit={handleSubmit}>
      <div className="edit-form-row">
        <label>
          Description
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>
        <label>
          Amount
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value as BudgetCategory)}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="edit-form-row">
        <label>
          Merchant
          <input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />
        </label>
        <label>
          Notes
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </div>
      <div className="edit-form-actions">
        <button type="submit" className="edit-save-btn">Save</button>
        <button type="button" onClick={onCancel} className="edit-cancel-btn">Cancel</button>
      </div>
    </form>
  );
});

export default TransactionList;
