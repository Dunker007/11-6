import { useEffect, useCallback } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import NetWorthDashboard from './components/NetWorthDashboard';
import BudgetDashboard from './components/BudgetDashboard';
import AssetList from './components/AssetList';
import AccountConnections from './components/AccountConnections';
import RetirementCalculator from './components/RetirementCalculator';
import GoalsTracker from './components/GoalsTracker';
import '@/styles/WealthLab.css';

type WealthTab = 'overview' | 'budgeting' | 'investments' | 'retirement' | 'estate';

function WealthLab() {
  const {
    activeTab,
    setActiveTab,
    refresh,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
  } = useWealthStore();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleTabChange = useCallback((tab: WealthTab) => {
    setActiveTab(tab);
  }, [setActiveTab]);

  return (
    <div className="wealth-lab-container">
      {/* Tab Navigation */}
      <div className="wealth-lab-tabs">
        <button
          className={`wealth-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        <button
          className={`wealth-tab ${activeTab === 'budgeting' ? 'active' : ''}`}
          onClick={() => handleTabChange('budgeting')}
        >
          Budgeting
        </button>
        <button
          className={`wealth-tab ${activeTab === 'investments' ? 'active' : ''}`}
          onClick={() => handleTabChange('investments')}
        >
          Investments
        </button>
        <button
          className={`wealth-tab ${activeTab === 'retirement' ? 'active' : ''}`}
          onClick={() => handleTabChange('retirement')}
        >
          Retirement
        </button>
        <button
          className={`wealth-tab ${activeTab === 'estate' ? 'active' : ''}`}
          onClick={() => handleTabChange('estate')}
        >
          Estate Planning
        </button>
      </div>

      {/* Tab Content */}
      <div className="wealth-lab-content">
        {activeTab === 'overview' && (
          <div className="wealth-overview-layout">
            <div className="wealth-main-panel">
              <NetWorthDashboard />
            </div>
            <div className="wealth-sidebar">
              <AccountConnections />
            </div>
          </div>
        )}

        {activeTab === 'budgeting' && (
          <div className="wealth-budgeting-layout">
            <div className="wealth-main-panel">
              <BudgetDashboard month={selectedMonth} year={selectedYear} />
            </div>
            <div className="wealth-sidebar">
              <div className="wealth-sidebar-section">
                <h3>Month Selector</h3>
                <div className="month-year-selector">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'investments' && (
          <div className="wealth-investments-layout">
            <div className="wealth-main-panel">
              <AssetList />
            </div>
            <div className="wealth-sidebar">
              <AccountConnections />
            </div>
          </div>
        )}

        {activeTab === 'retirement' && (
          <div className="wealth-retirement-layout">
            <div className="wealth-main-panel">
              <RetirementCalculator />
            </div>
          </div>
        )}

        {activeTab === 'estate' && (
          <div className="wealth-estate-layout">
            <div className="wealth-main-panel">
              <GoalsTracker />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WealthLab;

