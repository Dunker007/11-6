import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit2, Bell, TrendingUp, TrendingDown, X, Save, CheckCircle2 } from 'lucide-react';
import { watchlistService } from '@/services/wealth/watchlistService';
import { wealthMarketDataService } from '@/services/wealth/marketDataService';
import { useToast } from '@/components/ui';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import type { Watchlist } from '@/types/wealth';
import '@/styles/WealthLab.css';

function Watchlist() {
  const { showToast } = useToast();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [editingWatchlist, setEditingWatchlist] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [priceAlerts, setPriceAlerts] = useState<Map<string, { targetPrice: number; direction: 'above' | 'below' }>>(new Map());
  const [symbolPrices, setSymbolPrices] = useState<Map<string, { price: number; change: number; changePercent: number }>>(new Map());

  useEffect(() => {
    loadWatchlists();
    // Refresh prices every 30 seconds
    const interval = setInterval(() => {
      refreshPrices();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedWatchlist) {
      refreshPrices();
    }
  }, [selectedWatchlist]);

  const loadWatchlists = () => {
    const loaded = watchlistService.getWatchlists();
    setWatchlists(loaded);
    if (loaded.length > 0 && !selectedWatchlist) {
      setSelectedWatchlist(loaded[0].id);
    }
  };

  const refreshPrices = async () => {
    if (!selectedWatchlist) return;
    
    const watchlist = watchlistService.getWatchlist(selectedWatchlist);
    if (!watchlist) return;

    const priceMap = new Map<string, { price: number; change: number; changePercent: number }>();
    
    for (const symbol of watchlist.symbols) {
      try {
        const priceData = await wealthMarketDataService.getRealTimePrice(symbol);
        priceMap.set(symbol, {
          price: priceData.price,
          change: priceData.change24h || 0,
          changePercent: priceData.changePercent24h || 0,
        });
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
        // Use cached price or default
        const cached = symbolPrices.get(symbol);
        if (cached) {
          priceMap.set(symbol, cached);
        }
      }
    }
    
    setSymbolPrices(priceMap);
  };

  const handleCreateWatchlist = () => {
    if (!newWatchlistName.trim()) {
      showToast({
        variant: 'error',
        title: 'Invalid name',
        message: 'Please enter a watchlist name',
      });
      return;
    }

    const watchlist = watchlistService.createWatchlist(newWatchlistName.trim());
    setWatchlists([...watchlists, watchlist]);
    setSelectedWatchlist(watchlist.id);
    setNewWatchlistName('');
    setIsCreating(false);
    showToast({
      variant: 'success',
      title: 'Watchlist created',
      message: `Created "${watchlist.name}"`,
    });
  };

  const handleDeleteWatchlist = (id: string) => {
    const watchlist = watchlistService.getWatchlist(id);
    if (!watchlist) return;

    if (confirm(`Delete watchlist "${watchlist.name}"?`)) {
      watchlistService.deleteWatchlist(id);
      loadWatchlists();
      if (selectedWatchlist === id) {
        setSelectedWatchlist(watchlists.length > 1 ? watchlists.find(w => w.id !== id)?.id || null : null);
      }
      showToast({
        variant: 'success',
        title: 'Watchlist deleted',
        message: `Deleted "${watchlist.name}"`,
      });
    }
  };

  const handleEditWatchlist = (id: string) => {
    const watchlist = watchlistService.getWatchlist(id);
    if (watchlist) {
      setEditingWatchlist(id);
      setEditName(watchlist.name);
    }
  };

  const handleSaveEdit = () => {
    if (!editingWatchlist || !editName.trim()) return;

    const updated = watchlistService.updateWatchlist(editingWatchlist, { name: editName.trim() });
    if (updated) {
      loadWatchlists();
      setEditingWatchlist(null);
      setEditName('');
      showToast({
        variant: 'success',
        title: 'Watchlist updated',
        message: `Renamed to "${updated.name}"`,
      });
    }
  };

  const handleAddSymbol = () => {
    if (!selectedWatchlist || !newSymbol.trim()) return;

    const symbol = newSymbol.trim().toUpperCase();
    const success = watchlistService.addToWatchlist(selectedWatchlist, symbol);
    
    if (success) {
      loadWatchlists();
      setNewSymbol('');
      refreshPrices();
      showToast({
        variant: 'success',
        title: 'Symbol added',
        message: `Added ${symbol} to watchlist`,
      });
    } else {
      showToast({
        variant: 'error',
        title: 'Failed to add',
        message: 'Symbol may already be in watchlist',
      });
    }
  };

  const handleRemoveSymbol = (symbol: string) => {
    if (!selectedWatchlist) return;

    watchlistService.removeFromWatchlist(selectedWatchlist, symbol);
    loadWatchlists();
    refreshPrices();
    showToast({
      variant: 'info',
      title: 'Symbol removed',
      message: `Removed ${symbol}`,
    });
  };

  const handleSetPriceAlert = (symbol: string) => {
    const alert = priceAlerts.get(symbol);
    if (!alert) return;

    watchlistService.setPriceAlert(symbol, alert.targetPrice, alert.direction);
    priceAlerts.delete(symbol);
    loadWatchlists();
    showToast({
      variant: 'success',
      title: 'Alert set',
      message: `Price alert created for ${symbol}`,
    });
  };

  const currentWatchlist = useMemo(() => {
    return selectedWatchlist ? watchlistService.getWatchlist(selectedWatchlist) : null;
  }, [selectedWatchlist, watchlists]);

  return (
    <div className="watchlist-container">
      <div className="watchlist-header">
      <h2>Watchlists</h2>
        <button
          className="create-watchlist-btn"
          onClick={() => setIsCreating(true)}
        >
          <Plus size={16} />
          New Watchlist
        </button>
      </div>

      {isCreating && (
        <div className="create-watchlist-form">
          <input
            type="text"
            placeholder="Watchlist name..."
            value={newWatchlistName}
            onChange={(e) => setNewWatchlistName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateWatchlist();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewWatchlistName('');
              }
            }}
            autoFocus
          />
          <div className="form-actions">
            <button onClick={handleCreateWatchlist}>
              <Save size={14} />
              Create
            </button>
            <button onClick={() => {
              setIsCreating(false);
              setNewWatchlistName('');
            }}>
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="watchlist-content">
        <div className="watchlist-sidebar">
          <h3>My Watchlists</h3>
          {watchlists.length === 0 ? (
            <div className="empty-state">
              <p>No watchlists yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="watchlist-list">
              {watchlists.map((watchlist) => (
                <div
                  key={watchlist.id}
                  className={`watchlist-item ${selectedWatchlist === watchlist.id ? 'active' : ''}`}
                  onClick={() => setSelectedWatchlist(watchlist.id)}
                >
                  <div className="watchlist-item-content">
                    {editingWatchlist === watchlist.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') {
                            setEditingWatchlist(null);
                            setEditName('');
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className="watchlist-name">{watchlist.name}</span>
                        <span className="watchlist-count">{watchlist.symbols.length} symbols</span>
                      </>
                    )}
                  </div>
                  <div className="watchlist-actions" onClick={(e) => e.stopPropagation()}>
                    {editingWatchlist === watchlist.id ? (
                      <>
                        <button onClick={handleSaveEdit} title="Save">
                          <Save size={14} />
                        </button>
                        <button onClick={() => {
                          setEditingWatchlist(null);
                          setEditName('');
                        }} title="Cancel">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEditWatchlist(watchlist.id)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteWatchlist(watchlist.id)} title="Delete">
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

        <div className="watchlist-main">
          {currentWatchlist ? (
            <>
              <div className="watchlist-details-header">
                <h3>{currentWatchlist.name}</h3>
                <div className="watchlist-stats">
                  <span>{currentWatchlist.symbols.length} symbols</span>
                  <span>{currentWatchlist.alerts.length} alerts</span>
                </div>
              </div>

              <div className="add-symbol-section">
                <input
                  type="text"
                  placeholder="Add symbol (e.g., AAPL, TSLA, BTC)"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSymbol();
                  }}
                />
                <button onClick={handleAddSymbol}>
                  <Plus size={16} />
                  Add
                </button>
              </div>

              {currentWatchlist.symbols.length === 0 ? (
                <div className="empty-state">
                  <p>No symbols in this watchlist. Add some to track their prices!</p>
                </div>
              ) : (
                <div className="symbols-list">
                  <table className="symbols-table">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Price</th>
                        <th>Change</th>
                        <th>Alerts</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentWatchlist.symbols.map((symbol) => {
                        const priceData = symbolPrices.get(symbol);
                        const existingAlerts = currentWatchlist.alerts.filter(a => a.symbol === symbol);

                        return (
                          <tr key={symbol}>
                            <td className="symbol-cell">
                              <strong>{symbol}</strong>
                            </td>
                            <td className="price-cell">
                              {priceData ? formatCurrency(priceData.price) : 'Loading...'}
                            </td>
                            <td className={`change-cell ${priceData && priceData.change >= 0 ? 'positive' : 'negative'}`}>
                              {priceData ? (
                                <>
                                  {priceData.change >= 0 ? (
                                    <TrendingUp size={14} />
                                  ) : (
                                    <TrendingDown size={14} />
                                  )}
                                  {formatPercent(priceData.changePercent, 2, true, true)}
                                </>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="alerts-cell">
                              {existingAlerts.length > 0 ? (
                                <div className="alert-badges">
                                  {existingAlerts.map((a) => (
                                    <span key={a.id} className="alert-badge">
                                      {a.type === 'price' && a.priceAlert ? (
                                        <>
                                          <Bell size={12} />
                                          {a.priceAlert.direction === 'above' ? '>' : '<'} {formatCurrency(a.priceAlert.targetPrice)}
                                          {a.priceAlert.triggered && (
                                            <CheckCircle2 size={12} className="triggered" />
                                          )}
                                        </>
                                      ) : (
                                        <Bell size={12} />
                                      )}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <button
                                  className="set-alert-btn"
                                  onClick={() => {
                                    const currentPrice = priceData?.price || 0;
                                    priceAlerts.set(symbol, {
                                      targetPrice: currentPrice,
                                      direction: 'above',
                                    });
                                    setPriceAlerts(new Map(priceAlerts));
                                  }}
                                >
                                  <Bell size={14} />
                                  Set Alert
                                </button>
                              )}
                            </td>
                            <td className="actions-cell">
                              <button
                                className="remove-btn"
                                onClick={() => handleRemoveSymbol(symbol)}
                                title="Remove symbol"
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

              {priceAlerts.size > 0 && (
                <div className="pending-alerts">
                  <h4>Pending Alerts</h4>
                  {Array.from(priceAlerts.entries()).map(([symbol, alert]) => (
                    <div key={symbol} className="pending-alert">
                      <span>{symbol}: Alert when price goes {alert.direction === 'above' ? 'above' : 'below'} {formatCurrency(alert.targetPrice)}</span>
                      <div className="pending-alert-actions">
                        <input
                          type="number"
                          step="0.01"
                          value={alert.targetPrice}
                          onChange={(e) => {
                            priceAlerts.set(symbol, {
                              ...alert,
                              targetPrice: parseFloat(e.target.value) || 0,
                            });
                            setPriceAlerts(new Map(priceAlerts));
                          }}
                        />
                        <select
                          value={alert.direction}
                          onChange={(e) => {
                            priceAlerts.set(symbol, {
                              ...alert,
                              direction: e.target.value as 'above' | 'below',
                            });
                            setPriceAlerts(new Map(priceAlerts));
                          }}
                        >
                          <option value="above">Above</option>
                          <option value="below">Below</option>
                        </select>
                        <button onClick={() => handleSetPriceAlert(symbol)}>
                          <Save size={14} />
                          Save
                        </button>
                        <button onClick={() => {
                          priceAlerts.delete(symbol);
                          setPriceAlerts(new Map(priceAlerts));
                        }}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>Select a watchlist or create a new one to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Watchlist;
