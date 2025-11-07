import { useState, useEffect } from 'react';
import { useMonetizeStore } from '../../services/monetize/monetizeStore';
import type { RevenueStream } from '@/types/monetize';
import '../../styles/MonetizeWorkflow.css';

function RevenueStreams() {
  const { revenueStreams, addRevenueStream, deleteRevenueStream, loadRevenueStreams } = useMonetizeStore();
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadRevenueStreams();
  }, [loadRevenueStreams]);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addRevenueStream({
      name: formData.get('name') as string,
      type: formData.get('type') as RevenueStream['type'],
      description: formData.get('description') as string,
      monthlyRevenue: parseFloat(formData.get('monthlyRevenue') as string) || 0,
      growthRate: parseFloat(formData.get('growthRate') as string) || 0,
      status: (formData.get('status') as RevenueStream['status']) || 'active',
    });
    setShowAddForm(false);
    (e.target as HTMLFormElement).reset();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="revenue-streams">
      <div className="streams-header">
        <h3>Revenue Streams</h3>
        <button onClick={() => setShowAddForm(true)} className="add-btn">
          + Add Stream
        </button>
      </div>

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Add Revenue Stream</h4>
              <button onClick={() => setShowAddForm(false)} className="close-btn">×</button>
            </div>
            <form onSubmit={handleAdd} className="add-form">
              <div className="form-group">
                <label>Name *</label>
                <input type="text" name="name" required />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select name="type" required>
                  <option value="saas">SaaS</option>
                  <option value="subscription">Subscription</option>
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                  <option value="affiliate">Affiliate</option>
                  <option value="advertising">Advertising</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Monthly Revenue ($) *</label>
                  <input type="number" name="monthlyRevenue" step="0.01" min="0" required />
                </div>
                <div className="form-group">
                  <label>Growth Rate (%)</label>
                  <input type="number" name="growthRate" step="0.1" defaultValue="0" />
                </div>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status">
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="planning">Planning</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Add Stream</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="streams-list">
        {revenueStreams.length === 0 ? (
          <div className="empty-state">No revenue streams yet. Add your first stream to get started.</div>
        ) : (
          revenueStreams.map((stream) => (
            <div key={stream.id} className="stream-card">
              <div className="stream-main">
                <div className="stream-info">
                  <h4>{stream.name}</h4>
                  <p>{stream.description || 'No description'}</p>
                  <div className="stream-meta">
                    <span className="stream-type">{stream.type}</span>
                    <span className={`stream-status ${stream.status}`}>{stream.status}</span>
                  </div>
                </div>
                <div className="stream-revenue">
                  <div className="revenue-amount">{formatCurrency(stream.monthlyRevenue)}</div>
                  <div className="revenue-label">per month</div>
                  {stream.growthRate > 0 && (
                    <div className="growth-rate positive">+{stream.growthRate}%</div>
                  )}
                </div>
              </div>
              <button onClick={() => deleteRevenueStream(stream.id)} className="delete-btn" title="Delete stream">
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RevenueStreams;

