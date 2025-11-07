import { useState, useEffect } from 'react';
import { useMonetizeStore } from '../../services/monetize/monetizeStore';
import type { Subscription } from '@/types/monetize';
import '../../styles/MonetizeWorkflow.css';

function SubscriptionManager() {
  const { subscriptions, addSubscription, cancelSubscription, loadSubscriptions } = useMonetizeStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'cancelled'>('all');

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addSubscription({
      customerId: formData.get('customerId') as string,
      customerName: formData.get('customerName') as string,
      planId: formData.get('planId') as string,
      planName: formData.get('planName') as string,
      price: parseFloat(formData.get('price') as string),
      billingCycle: formData.get('billingCycle') as Subscription['billingCycle'],
      status: 'active',
    });
    setShowAddForm(false);
    (e.target as HTMLFormElement).reset();
  };

  const filteredSubs = filter === 'all' 
    ? subscriptions 
    : subscriptions.filter((sub) => sub.status === filter);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="subscription-manager">
      <div className="manager-header">
        <h3>Subscription Manager</h3>
        <div className="header-actions">
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="filter-select">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={() => setShowAddForm(true)} className="add-btn">
            + Add Subscription
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Add Subscription</h4>
              <button onClick={() => setShowAddForm(false)} className="close-btn">×</button>
            </div>
            <form onSubmit={handleAdd} className="add-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input type="text" name="customerName" required />
                </div>
                <div className="form-group">
                  <label>Customer ID</label>
                  <input type="text" name="customerId" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Plan Name *</label>
                  <input type="text" name="planName" required />
                </div>
                <div className="form-group">
                  <label>Plan ID</label>
                  <input type="text" name="planId" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price ($) *</label>
                  <input type="number" name="price" step="0.01" min="0" required />
                </div>
                <div className="form-group">
                  <label>Billing Cycle *</label>
                  <select name="billingCycle" required>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one-time">One-Time</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Add Subscription</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="subscriptions-list">
        {filteredSubs.length === 0 ? (
          <div className="empty-state">No subscriptions found.</div>
        ) : (
          filteredSubs.map((sub) => (
            <div key={sub.id} className={`subscription-card ${sub.status}`}>
              <div className="subscription-main">
                <div className="subscription-info">
                  <h4>{sub.customerName}</h4>
                  <div className="subscription-meta">
                    <span>{sub.planName}</span>
                    <span>•</span>
                    <span>{sub.billingCycle}</span>
                    <span>•</span>
                    <span className={`status-badge ${sub.status}`}>{sub.status}</span>
                  </div>
                  <div className="subscription-dates">
                    <span>Started: {formatDate(sub.startDate)}</span>
                    {sub.nextBillingDate && (
                      <>
                        <span>•</span>
                        <span>Next billing: {formatDate(sub.nextBillingDate)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="subscription-price">
                  <div className="price-amount">{formatCurrency(sub.price)}</div>
                  <div className="price-cycle">
                    {sub.billingCycle === 'monthly' && '/month'}
                    {sub.billingCycle === 'yearly' && '/year'}
                    {sub.billingCycle === 'one-time' && 'one-time'}
                  </div>
                </div>
              </div>
              {sub.status === 'active' && (
                <button
                  onClick={() => cancelSubscription(sub.id)}
                  className="cancel-subscription-btn"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SubscriptionManager;

