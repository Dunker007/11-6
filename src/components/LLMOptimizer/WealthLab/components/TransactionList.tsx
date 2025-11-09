import { useMemo, useState, useCallback, memo } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import { Search, Filter } from 'lucide-react';
import { useDebounce } from '@/utils/hooks/useDebounce';
import { DEBOUNCE_DELAYS } from '@/utils/constants';

interface TransactionListProps {
  month: number;
  year: number;
}

const TransactionList = memo(function TransactionList({ month, year }: TransactionListProps) {
  const transactions = useWealthStore((state) => state.transactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const debouncedSearch = useDebounce(searchQuery, DEBOUNCE_DELAYS.SEARCH_INPUT);

  const monthTransactions = useMemo(() => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    let filtered = transactions.filter(
      (tx) => tx.date >= startDate && tx.date <= endDate
    );

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.description.toLowerCase().includes(query) ||
          tx.merchant?.toLowerCase().includes(query) ||
          tx.category.toLowerCase().includes(query)
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((tx) => tx.category === filterCategory);
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, month, year, debouncedSearch, filterCategory]);

  const categories = useMemo(() => {
    const cats = new Set(transactions.map((tx) => tx.category));
    return Array.from(cats).sort();
  }, [transactions]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

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
        </div>
      </div>

      <div className="transaction-list-items">
        {monthTransactions.length === 0 ? (
          <div className="transaction-empty">
            <p>No transactions found</p>
            <p className="empty-hint">
              {searchQuery || filterCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add transactions to track your spending'}
            </p>
          </div>
        ) : (
          monthTransactions.map((tx) => (
            <div key={tx.id} className="transaction-item">
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
                <div className={`transaction-amount ${tx.type === 'expense' ? 'expense' : 'income'}`}>
                  {tx.type === 'expense' ? '-' : '+'}${tx.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export default TransactionList;

