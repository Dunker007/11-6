import { useEffect, useCallback, lazy, Suspense } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import NetWorthDashboard from './components/NetWorthDashboard';
import BudgetDashboard from './components/BudgetDashboard';
import AssetList from './components/AssetList';
import AccountConnections from './components/AccountConnections';
import RetirementCalculator from './components/RetirementCalculator';
import GoalsTracker from './components/GoalsTracker';
import { Loading } from '@/components/ui';
import '@/styles/WealthLab.css';

const PortfolioDashboard = lazy(() => import('./components/PortfolioDashboard'));
const PortfolioManager = lazy(() => import('./components/PortfolioManager'));
const CryptoETFCenter = lazy(() => import('./components/CryptoETFCenter'));
const NewsInsightsPanel = lazy(() => import('./components/NewsInsightsPanel'));
const Watchlist = lazy(() => import('./components/Watchlist'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));

type WealthTab = 'overview' | 'portfolios' | 'crypto-etfs' | 'watchlists' | 'news' | 'analytics' | 'budgeting' | 'retirement' | 'estate';

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
          className={`wealth-tab ${activeTab === 'portfolios' ? 'active' : ''}`}
          onClick={() => handleTabChange('portfolios')}
        >
          Portfolios
        </button>
        <button
          className={`wealth-tab ${activeTab === 'crypto-etfs' ? 'active' : ''}`}
          onClick={() => handleTabChange('crypto-etfs')}
        >
          Crypto ETFs
        </button>
        <button
          className={`wealth-tab ${activeTab === 'watchlists' ? 'active' : ''}`}
          onClick={() => handleTabChange('watchlists')}
        >
          Watchlists
        </button>
        <button
          className={`wealth-tab ${activeTab === 'news' ? 'active' : ''}`}
          onClick={() => handleTabChange('news')}
        >
          News & Insights
        </button>
        <button
          className={`wealth-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => handleTabChange('analytics')}
        >
          Analytics
        </button>
        <button
          className={`wealth-tab ${activeTab === 'budgeting' ? 'active' : ''}`}
          onClick={() => handleTabChange('budgeting')}
        >
          Budgeting
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

        {activeTab === 'portfolios' && (
          <Suspense fallback={<Loading />}>
            <PortfolioDashboard />
          </Suspense>
        )}

        {activeTab === 'crypto-etfs' && (
          <Suspense fallback={<Loading />}>
            <CryptoETFCenter />
          </Suspense>
        )}

        {activeTab === 'watchlists' && (
          <Suspense fallback={<Loading />}>
            <Watchlist />
          </Suspense>
        )}

        {activeTab === 'news' && (
          <Suspense fallback={<Loading />}>
            <NewsInsightsPanel />
          </Suspense>
        )}

        {activeTab === 'analytics' && (
          <Suspense fallback={<Loading />}>
            <AnalyticsDashboard />
          </Suspense>
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

