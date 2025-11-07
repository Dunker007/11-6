import { useEffect } from 'react';
import { useMonetizeStore } from '../../services/monetize/monetizeStore';
import type { PricingStrategy } from '@/types/monetize';
import '../../styles/MonetizeWorkflow.css';

function PricingStrategies() {
  const { pricingStrategies, loadPricingStrategies } = useMonetizeStore();

  useEffect(() => {
    loadPricingStrategies();
  }, [loadPricingStrategies]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="pricing-strategies">
      <div className="strategies-header">
        <h3>Pricing Strategies</h3>
        <p>Choose a pricing model that fits your product</p>
      </div>

      <div className="strategies-grid">
        {pricingStrategies.map((strategy) => (
          <div key={strategy.id} className="strategy-card">
            <div className="strategy-header">
              <h4>{strategy.name}</h4>
              <span className="strategy-type">{strategy.type}</span>
            </div>
            <p className="strategy-description">{strategy.description}</p>

            {strategy.tiers && strategy.tiers.length > 0 && (
              <div className="pricing-tiers">
                {strategy.tiers.map((tier, index) => (
                  <div key={index} className={`pricing-tier ${tier.popular ? 'popular' : ''}`}>
                    {tier.popular && <span className="popular-badge">Most Popular</span>}
                    <div className="tier-name">{tier.name}</div>
                    <div className="tier-price">
                      {tier.price === 0 ? 'Free' : formatCurrency(tier.price)}
                      {tier.price > 0 && <span className="tier-period">/month</span>}
                    </div>
                    <ul className="tier-features">
                      {tier.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {strategy.basePrice !== undefined && (
              <div className="flat-pricing">
                <div className="price-display">
                  {formatCurrency(strategy.basePrice)}
                  {strategy.unitPrice && (
                    <>
                      {' + '}
                      {formatCurrency(strategy.unitPrice)}/{strategy.unitName}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="strategy-features">
              <strong>Features:</strong>
              <ul>
                {strategy.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>

            <div className="strategy-recommended">
              <strong>Recommended for:</strong>
              <div className="recommended-tags">
                {strategy.recommendedFor.map((item, idx) => (
                  <span key={idx} className="recommended-tag">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PricingStrategies;

