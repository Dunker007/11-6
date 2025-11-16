import { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import { Target, TrendingUp } from 'lucide-react';

const RetirementCalculator = memo(function RetirementCalculator() {
  const retirementPlans = useWealthStore((state) => state.retirementPlans);
  const addRetirementPlan = useWealthStore((state) => state.addRetirementPlan);
  const updateRetirementPlan = useWealthStore((state) => state.updateRetirementPlan);
  const calculateRetirementProjection = useWealthStore((state) => state.calculateRetirementProjection);
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(65);
  const [currentSavings, setCurrentSavings] = useState('0');
  const [monthlyContribution, setMonthlyContribution] = useState('0');
  const [expectedReturnRate, setExpectedReturnRate] = useState('7');
  const [targetAmount, setTargetAmount] = useState('1000000');

  const projections = useMemo(() => {
    if (retirementPlans.length === 0) return [];
    const plan = retirementPlans[0];
    return calculateRetirementProjection(plan.id);
  }, [retirementPlans, calculateRetirementProjection]);

  const handleSavePlan = useCallback(() => {
    if (retirementPlans.length === 0) {
      addRetirementPlan({
        currentAge,
        retirementAge,
        currentSavings: parseFloat(currentSavings) || 0,
        monthlyContribution: parseFloat(monthlyContribution) || 0,
        expectedReturnRate: parseFloat(expectedReturnRate) || 7,
        targetAmount: parseFloat(targetAmount) || 1000000,
      });
    } else {
      updateRetirementPlan(retirementPlans[0].id, {
        currentAge,
        retirementAge,
        currentSavings: parseFloat(currentSavings) || 0,
        monthlyContribution: parseFloat(monthlyContribution) || 0,
        expectedReturnRate: parseFloat(expectedReturnRate) || 7,
        targetAmount: parseFloat(targetAmount) || 1000000,
      });
    }
  }, [
    retirementPlans,
    addRetirementPlan,
    updateRetirementPlan,
    currentAge,
    retirementAge,
    currentSavings,
    monthlyContribution,
    expectedReturnRate,
    targetAmount,
  ]);

  const finalProjection = projections[projections.length - 1];
  const isOnTrack = finalProjection && finalProjection.savings >= parseFloat(targetAmount);

  useEffect(() => {
    if (retirementPlans.length > 0) {
      const plan = retirementPlans[0];
      setCurrentAge(plan.currentAge);
      setRetirementAge(plan.retirementAge);
      setCurrentSavings(plan.currentSavings.toString());
      setMonthlyContribution(plan.monthlyContribution.toString());
      setExpectedReturnRate(plan.expectedReturnRate.toString());
      setTargetAmount(plan.targetAmount.toString());
    }
  }, [retirementPlans]);

  return (
    <div className="retirement-calculator">
      <div className="retirement-calculator-header">
        <h3>Retirement Calculator</h3>
        <button className="retirement-save-btn" onClick={handleSavePlan}>
          Save Plan
        </button>
      </div>

      <div className="retirement-inputs">
        <div className="retirement-input-group">
          <label>
            Current Age
            <input
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(Number(e.target.value))}
              min="18"
              max="100"
            />
          </label>
          <label>
            Retirement Age
            <input
              type="number"
              value={retirementAge}
              onChange={(e) => setRetirementAge(Number(e.target.value))}
              min={currentAge}
              max="100"
            />
          </label>
        </div>

        <div className="retirement-input-group">
          <label>
            Current Savings ($)
            <input
              type="number"
              value={currentSavings}
              onChange={(e) => setCurrentSavings(e.target.value)}
              min="0"
              step="1000"
            />
          </label>
          <label>
            Monthly Contribution ($)
            <input
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              min="0"
              step="100"
            />
          </label>
        </div>

        <div className="retirement-input-group">
          <label>
            Expected Annual Return (%)
            <input
              type="number"
              value={expectedReturnRate}
              onChange={(e) => setExpectedReturnRate(e.target.value)}
              min="0"
              max="20"
              step="0.1"
            />
          </label>
          <label>
            Target Retirement Amount ($)
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              min="0"
              step="10000"
            />
          </label>
        </div>
      </div>

      {projections.length > 0 && (
        <>
          <div className="retirement-status">
            <div className={`retirement-status-card ${isOnTrack ? 'on-track' : 'off-track'}`}>
              <div className="status-icon">
                {isOnTrack ? <Target size={24} /> : <TrendingUp size={24} />}
              </div>
              <div className="status-content">
                <div className="status-label">
                  {isOnTrack ? 'On Track!' : 'Off Track'}
                </div>
                <div className="status-value">
                  ${finalProjection?.savings.toLocaleString()} projected at age {retirementAge}
                </div>
                {!isOnTrack && finalProjection && (
                  <div className="status-gap">
                    Gap: ${(parseFloat(targetAmount) - finalProjection.savings).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="retirement-projection-chart">
            <h4>Projection Chart</h4>
            <div className="chart-container">
              <svg width="100%" height="300" viewBox="0 0 800 300">
                <defs>
                  <linearGradient id="retirementGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--emerald-500)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--emerald-500)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={`grid-${i}`}
                    x1="0"
                    y1={(i * 300) / 4}
                    x2="800"
                    y2={(i * 300) / 4}
                    stroke="rgba(139, 92, 246, 0.1)"
                    strokeWidth="1"
                  />
                ))}
                {/* Projection line */}
                {(() => {
                  const maxSavings = Math.max(...projections.map((p) => p.savings), parseFloat(targetAmount));
                  const points = projections
                    .map((p, idx) => {
                      const x = (idx / (projections.length - 1)) * 800;
                      const y = 300 - (p.savings / maxSavings) * 300;
                      return `${x},${y}`;
                    })
                    .join(' ');
                  const targetY = 300 - (parseFloat(targetAmount) / maxSavings) * 300;
                  return (
                    <>
                      {/* Target line */}
                      <line
                        x1="0"
                        y1={targetY}
                        x2="800"
                        y2={targetY}
                        stroke="var(--violet-500)"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                      <text x="10" y={targetY - 5} fill="var(--violet-500)" fontSize="12">
                        Target: ${parseFloat(targetAmount).toLocaleString()}
                      </text>
                      {/* Projection area */}
                      <polygon
                        points={`0,300 ${points} 800,300`}
                        fill="url(#retirementGradient)"
                      />
                      {/* Projection line */}
                      <polyline
                        points={points}
                        fill="none"
                        stroke="var(--emerald-500)"
                        strokeWidth="2"
                      />
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export default RetirementCalculator;

