# WealthLab Guide

## Overview

WealthLab is a comprehensive financial management system integrated into DLX Studios Ultimate. It provides portfolio management, watchlists, news insights, budgeting, retirement planning, and crypto ETF tracking.

## Architecture

### Service Layer

```
wealthStore.ts (Zustand store)
├── wealthService.ts (Core wealth operations)
├── portfolioService.ts (Portfolio management)
├── watchlistService.ts (Watchlists and alerts)
├── newsService.ts (Financial news and insights)
├── wealthMarketDataService.ts (Market data)
└── portfolioAnalyticsService.ts (Analytics calculations)
```

### Component Structure

```
WealthLab.tsx (Main component)
├── components/
│   ├── AnalyticsDashboard.tsx (Performance analytics)
│   ├── PortfolioManager.tsx (Portfolio management)
│   ├── Watchlist.tsx (Watchlist management)
│   ├── NewsInsightsPanel.tsx (News and insights)
│   ├── PortfolioDashboard.tsx (Portfolio overview)
│   ├── NetWorthDashboard.tsx (Net worth tracking)
│   ├── BudgetDashboard.tsx (Budget management)
│   └── ... (other components)
```

## Core Services

### wealthStore.ts

**Purpose:** Comprehensive Zustand store for all wealth management state.

**State Managed:**
- Accounts, Assets, Liabilities
- Portfolios and Watchlists
- News and Market Insights
- Budgets and Transactions
- Retirement Plans
- Crypto ETFs
- Net Worth and History

**Usage:**
```typescript
import { useWealthStore } from '@/services/wealth/wealthStore';

function WealthDashboard() {
  const { 
    netWorth, 
    portfolios, 
    selectedPortfolioId,
    loadPortfolios 
  } = useWealthStore();
  
  useEffect(() => {
    loadPortfolios();
  }, []);
}
```

### portfolioService.ts

**Purpose:** Portfolio management operations.

**Features:**
- Create, update, delete portfolios
- Add/remove positions
- Calculate performance metrics
- Track asset allocation

**Usage:**
```typescript
import { portfolioService } from '@/services/wealth/portfolioService';

// Create portfolio
const portfolio = portfolioService.createPortfolio({
  name: 'My Portfolio',
  description: 'Main investment portfolio',
});

// Add position
portfolioService.addPosition(portfolio.id, {
  symbol: 'AAPL',
  quantity: 100,
  purchasePrice: 150,
});
```

### portfolioAnalyticsService.ts

**Purpose:** Portfolio analytics and performance calculations.

**Features:**
- Performance metrics (returns, volatility, Sharpe ratio)
- Asset allocation analysis
- Performance attribution
- Benchmark comparison

**Usage:**
```typescript
import { portfolioAnalyticsService } from '@/services/wealth/portfolioAnalyticsService';

// Calculate performance metrics
const metrics = await portfolioAnalyticsService.calculatePerformanceMetrics('1Y', 'SPY');

// Calculate asset allocation
const allocation = portfolioAnalyticsService.calculateAssetAllocation();

// Performance attribution
const attribution = await portfolioAnalyticsService.calculatePerformanceAttribution('1Y');
```

## Components

### AnalyticsDashboard.tsx

**Purpose:** Comprehensive portfolio analytics visualization.

**Features:**
- Performance metrics display
- Asset allocation visualization
- Top contributors list
- Benchmark comparison
- Time period filtering

**Formatting Standards:**
- Currency: 0 decimal places (whole dollars)
- Percentages: + signs for positive values

### PortfolioManager.tsx

**Purpose:** Portfolio management interface.

**Features:**
- Create/edit/delete portfolios
- Add/remove positions
- Track performance
- Visualize asset allocation

### Watchlist.tsx

**Purpose:** Watchlist and price alert management.

**Features:**
- Create/edit watchlists
- Add/remove symbols
- Set price alerts
- Track price changes

### NewsInsightsPanel.tsx

**Purpose:** Financial news and AI-generated market insights.

**Features:**
- News article display
- Market insights
- Sentiment analysis
- Filtering and search

## Data Flow

1. **Data Loading:** Components call store methods (e.g., `loadPortfolios()`)
2. **Store Actions:** Store methods call services (e.g., `portfolioService.getAllPortfolios()`)
3. **Service Operations:** Services perform calculations and return data
4. **State Update:** Store updates state, components re-render

## Formatting Standards

**Currency:**
```typescript
import { formatCurrency } from '@/utils/formatters';

formatCurrency(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
// "$1,234" (whole dollars)
```

**Percentages:**
```typescript
import { formatPercent } from '@/utils/formatters';

formatPercent(value, 2, false, true);
// "+15.50%" (with + sign for positive)
```

## Common Patterns

### Loading Portfolio Data

```typescript
function PortfolioComponent() {
  const { portfolios, loadPortfolios, isLoading } = useWealthStore();
  
  useEffect(() => {
    loadPortfolios();
  }, []);
  
  if (isLoading) return <LoadingSpinner />;
  return <PortfolioList portfolios={portfolios} />;
}
```

### Calculating Analytics

```typescript
function AnalyticsComponent() {
  const { assets, accounts } = useWealthStore();
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    const calculate = async () => {
      const result = await portfolioAnalyticsService.calculatePerformanceMetrics('1Y', 'SPY');
      setMetrics(result);
    };
    calculate();
  }, [assets, accounts]);
}
```

## Related Files

- `src/services/wealth/wealthStore.ts` - Main store
- `src/services/wealth/portfolioService.ts` - Portfolio operations
- `src/services/wealth/portfolioAnalyticsService.ts` - Analytics calculations
- `src/components/LLMOptimizer/WealthLab/WealthLab.tsx` - Main component
- `src/utils/formatters.ts` - Formatting utilities

