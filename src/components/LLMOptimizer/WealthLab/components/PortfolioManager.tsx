import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, PieChart, BarChart3, Download, X, Save } from 'lucide-react';
import { portfolioService } from '@/services/wealth/portfolioService';
import { useToast } from '@/components/ui';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import type { Portfolio } from '@/types/wealth';
import '@/styles/WealthLab.css';

function PortfolioManager() {
  const { showToast } = useToast();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDesc, setNewPortfolioDesc] = useState('');
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [newPosition, setNewPosition] = useState({
    symbol: '',
    quantity: '',
    costBasis: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  });
  const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    loadPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      refreshPortfolioPerformance();
    }
  }, [selectedPortfolio]);

  const loadPortfolios = () => {
    const loaded = portfolioService.getPortfolios();
    setPortfolios(loaded);
    if (loaded.length > 0 && !selectedPortfolio) {
      setSelectedPortfolio(loaded[0].id);
    }
  };

  const refreshPortfolioPerformance = async () => {
    if (!selectedPortfolio) return;
    try {
      await portfolioService.updatePortfolioPerformance(selectedPortfolio);
      loadPortfolios();
    } catch (error) {
      console.error('Failed to refresh performance:', error);
    }
  };

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) {
      showToast({
        variant: 'error',
        title: 'Invalid name',
        message: 'Please enter a portfolio name',
      });
      return;
    }

    try {
      const portfolio = await portfolioService.createPortfolio(
        newPortfolioName.trim(),
        newPortfolioDesc.trim() || undefined
      );
      setPortfolios([...portfolios, portfolio]);
      setSelectedPortfolio(portfolio.id);
      setNewPortfolioName('');
      setNewPortfolioDesc('');
      setIsCreating(false);
      showToast({
        variant: 'success',
        title: 'Portfolio created',
        message: `Created "${portfolio.name}"`,
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to create',
        message: (error as Error).message,
      });
    }
  };

  const handleDeletePortfolio = (id: string) => {
    const portfolio = portfolioService.getPortfolio(id);
    if (!portfolio) return;

    if (confirm(`Delete portfolio "${portfolio.name}"?`)) {
      portfolioService.deletePortfolio(id);
      loadPortfolios();
      if (selectedPortfolio === id) {
        setSelectedPortfolio(portfolios.length > 1 ? portfolios.find(p => p.id !== id)?.id || null : null);
      }
      showToast({
        variant: 'success',
        title: 'Portfolio deleted',
        message: `Deleted "${portfolio.name}"`,
      });
    }
  };

  const handleEditPortfolio = (id: string) => {
    const portfolio = portfolioService.getPortfolio(id);
    if (portfolio) {
      setEditingPortfolio(id);
      setEditName(portfolio.name);
      setEditDesc(portfolio.description || '');
    }
  };

  const handleSaveEdit = () => {
    if (!editingPortfolio || !editName.trim()) return;

    const updated = portfolioService.updatePortfolio(editingPortfolio, {
      name: editName.trim(),
      description: editDesc.trim() || undefined,
    });
    if (updated) {
      loadPortfolios();
      setEditingPortfolio(null);
      setEditName('');
      setEditDesc('');
      showToast({
        variant: 'success',
        title: 'Portfolio updated',
        message: `Updated "${updated.name}"`,
      });
    }
  };

  const handleAddPosition = async () => {
    if (!selectedPortfolio || !newPosition.symbol.trim() || !newPosition.quantity || !newPosition.costBasis) {
      showToast({
        variant: 'error',
        title: 'Invalid input',
        message: 'Please fill in all required fields',
      });
      return;
    }

    try {
      await portfolioService.addPosition(
        selectedPortfolio,
        newPosition.symbol.trim().toUpperCase(),
        parseFloat(newPosition.quantity),
        parseFloat(newPosition.costBasis),
        new Date(newPosition.purchaseDate)
      );
      loadPortfolios();
      setNewPosition({
        symbol: '',
        quantity: '',
        costBasis: '',
        purchaseDate: new Date().toISOString().split('T')[0],
      });
      setIsAddingPosition(false);
      showToast({
        variant: 'success',
        title: 'Position added',
        message: `Added ${newPosition.symbol.toUpperCase()} to portfolio`,
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to add position',
        message: (error as Error).message,
      });
    }
  };

  const handleRemovePosition = (positionId: string) => {
    if (!selectedPortfolio) return;

    if (confirm('Remove this position from portfolio?')) {
      portfolioService.removePosition(selectedPortfolio, positionId);
      loadPortfolios();
      showToast({
        variant: 'success',
        title: 'Position removed',
        message: 'Position has been removed',
      });
    }
  };

  const handleExportPortfolio = () => {
    const portfolio = currentPortfolio;
    if (!portfolio) return;

    const data = {
      name: portfolio.name,
      description: portfolio.description,
      holdings: portfolio.holdings,
      performance: portfolio.performance,
      allocation: portfolio.allocation,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${portfolio.name.replace(/\s+/g, '_')}_portfolio.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast({
      variant: 'success',
      title: 'Portfolio exported',
      message: 'Portfolio data downloaded',
    });
  };

  const currentPortfolio = useMemo(() => {
    return selectedPortfolio ? portfolioService.getPortfolio(selectedPortfolio) : null;
  }, [selectedPortfolio, portfolios]);

  const allocationData = useMemo(() => {
    if (!currentPortfolio) return [];
    
    return Object.entries(currentPortfolio.allocation)
      .filter(([_, value]) => value > 0)
      .map(([type, value]) => ({
        type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
        percent: value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [currentPortfolio]);

  return (
    <div className="portfolio-manager-container">
      <div className="portfolio-header">
      <h2>Portfolio Manager</h2>
        <button
          className="create-portfolio-btn"
          onClick={() => setIsCreating(true)}
        >
          <Plus size={16} />
          New Portfolio
        </button>
      </div>

      {isCreating && (
        <div className="create-portfolio-form">
          <input
            type="text"
            placeholder="Portfolio name..."
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreatePortfolio();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewPortfolioName('');
                setNewPortfolioDesc('');
              }
            }}
            autoFocus
          />
          <textarea
            placeholder="Description (optional)..."
            value={newPortfolioDesc}
            onChange={(e) => setNewPortfolioDesc(e.target.value)}
            rows={2}
          />
          <div className="form-actions">
            <button onClick={handleCreatePortfolio}>
              <Save size={14} />
              Create
            </button>
            <button onClick={() => {
              setIsCreating(false);
              setNewPortfolioName('');
              setNewPortfolioDesc('');
            }}>
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="portfolio-content">
        <div className="portfolio-sidebar">
          <h3>My Portfolios</h3>
          {portfolios.length === 0 ? (
            <div className="empty-state">
              <p>No portfolios yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="portfolio-list">
              {portfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  className={`portfolio-item ${selectedPortfolio === portfolio.id ? 'active' : ''}`}
                  onClick={() => setSelectedPortfolio(portfolio.id)}
                >
                  <div className="portfolio-item-content">
                    {editingPortfolio === portfolio.id ? (
                      <>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') {
                              setEditingPortfolio(null);
                              setEditName('');
                              setEditDesc('');
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          rows={2}
                        />
                      </>
                    ) : (
                      <>
                        <span className="portfolio-name">{portfolio.name}</span>
                        {portfolio.description && (
                          <span className="portfolio-desc">{portfolio.description}</span>
                        )}
                        <div className="portfolio-stats">
                          <span className={`performance ${portfolio.performance.totalReturnPercent >= 0 ? 'positive' : 'negative'}`}>
                            {formatPercent(portfolio.performance.totalReturnPercent, 2, true, true)}
                          </span>
                          <span>{portfolio.holdings.length} positions</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="portfolio-actions" onClick={(e) => e.stopPropagation()}>
                    {editingPortfolio === portfolio.id ? (
                      <>
                        <button onClick={handleSaveEdit} title="Save">
                          <Save size={14} />
                        </button>
                        <button onClick={() => {
                          setEditingPortfolio(null);
                          setEditName('');
                          setEditDesc('');
                        }} title="Cancel">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEditPortfolio(portfolio.id)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeletePortfolio(portfolio.id)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="portfolio-main">
          {currentPortfolio ? (
            <>
              <div className="portfolio-details-header">
                <div>
                  <h3>{currentPortfolio.name}</h3>
                  {currentPortfolio.description && (
                    <p className="portfolio-description">{currentPortfolio.description}</p>
                  )}
                </div>
                <div className="header-actions">
                  <button onClick={refreshPortfolioPerformance} title="Refresh prices">
                    <BarChart3 size={16} />
                    Refresh
                  </button>
                  <button onClick={handleExportPortfolio} title="Export portfolio">
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>

              <div className="portfolio-performance">
                <div className="performance-card">
                  <div className="performance-metric">
                    <span className="metric-label">Total Return</span>
                    <span className={`metric-value ${currentPortfolio.performance.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(currentPortfolio.performance.totalReturn)}
                    </span>
                  </div>
                  <div className="performance-metric">
                    <span className="metric-label">Return %</span>
                    <span className={`metric-value ${currentPortfolio.performance.totalReturnPercent >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercent(currentPortfolio.performance.totalReturnPercent, 2, true, true)}
                    </span>
                  </div>
                  {currentPortfolio.performance.sharpeRatio !== undefined && (
                    <div className="performance-metric">
                      <span className="metric-label">Sharpe Ratio</span>
                      <span className="metric-value">
                        {currentPortfolio.performance.sharpeRatio.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="allocation-section">
                <h4>
                  <PieChart size={18} />
                  Asset Allocation
                </h4>
                {allocationData.length === 0 ? (
                  <p className="empty-allocation">No positions yet. Add positions to see allocation.</p>
                ) : (
                  <div className="allocation-chart">
                    {allocationData.map((item) => (
                      <div key={item.type} className="allocation-item">
                        <div className="allocation-bar">
                          <div
                            className="allocation-fill"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                        <span className="allocation-label">{item.type}</span>
                        <span className="allocation-value">{item.percent.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="positions-section">
                <div className="positions-header">
                  <h4>Holdings</h4>
                  <button
                    className="add-position-btn"
                    onClick={() => setIsAddingPosition(true)}
                  >
                    <Plus size={14} />
                    Add Position
                  </button>
                </div>

                {isAddingPosition && (
                  <div className="add-position-form">
                    <input
                      type="text"
                      placeholder="Symbol (e.g., AAPL)"
                      value={newPosition.symbol}
                      onChange={(e) => setNewPosition({ ...newPosition, symbol: e.target.value.toUpperCase() })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Quantity"
                      value={newPosition.quantity}
                      onChange={(e) => setNewPosition({ ...newPosition, quantity: e.target.value })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Cost Basis (per share)"
                      value={newPosition.costBasis}
                      onChange={(e) => setNewPosition({ ...newPosition, costBasis: e.target.value })}
                    />
                    <input
                      type="date"
                      value={newPosition.purchaseDate}
                      onChange={(e) => setNewPosition({ ...newPosition, purchaseDate: e.target.value })}
                    />
                    <div className="form-actions">
                      <button onClick={handleAddPosition}>
                        <Save size={14} />
                        Add
                      </button>
                      <button onClick={() => {
                        setIsAddingPosition(false);
                        setNewPosition({
                          symbol: '',
                          quantity: '',
                          costBasis: '',
                          purchaseDate: new Date().toISOString().split('T')[0],
                        });
                      }}>
                        <X size={14} />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {currentPortfolio.holdings.length === 0 ? (
                  <div className="empty-state">
                    <p>No positions in this portfolio. Add positions to track your investments.</p>
                  </div>
                ) : (
                  <div className="positions-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Quantity</th>
                          <th>Cost Basis</th>
                          <th>Current Value</th>
                          <th>P/L</th>
                          <th>P/L %</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPortfolio.holdings.map((position) => {
                          const currentValue = (position.costBasis + (position.unrealizedPL || 0) / position.quantity) * position.quantity;
                          
                          return (
                            <tr key={position.id}>
                              <td className="symbol-cell">
                                <strong>{position.symbol}</strong>
                              </td>
                              <td>{position.quantity}</td>
                              <td>{formatCurrency(position.costBasis * position.quantity)}</td>
                              <td>{formatCurrency(currentValue)}</td>
                              <td className={position.unrealizedPL && position.unrealizedPL >= 0 ? 'positive' : 'negative'}>
                                {position.unrealizedPL !== undefined ? formatCurrency(position.unrealizedPL) : '-'}
                              </td>
                              <td className={position.unrealizedPLPercent && position.unrealizedPLPercent >= 0 ? 'positive' : 'negative'}>
                                {position.unrealizedPLPercent !== undefined ? (
                                  <>
                                    {position.unrealizedPLPercent >= 0 ? (
                                      <TrendingUp size={12} />
                                    ) : (
                                      <TrendingDown size={12} />
                                    )}
                                    {formatPercent(position.unrealizedPLPercent || 0, 2, true, true)}
                                  </>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td>
                                <button
                                  className="remove-btn"
                                  onClick={() => handleRemovePosition(position.id)}
                                  title="Remove position"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Select a portfolio or create a new one to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PortfolioManager;
