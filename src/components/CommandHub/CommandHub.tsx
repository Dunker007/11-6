import { useMemo, memo, useCallback } from 'react';
import { DollarSign, TrendingUp, Bitcoin, PieChart, Code, Lightbulb, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinancialStore } from '@/services/backoffice/financialStore';
import { useLLMStore } from '@/services/ai/llmStore';
import { useProjectStore } from '@/services/project/projectStore';
import { useWealthStore } from '@/services/wealth/wealthStore';
import { formatCurrency } from '@/utils/formatters';
import { useLocalStorage } from '@/utils/hooks/useLocalStorage';
import '../../styles/CommandHub.css';

interface MetricCard {
  id: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color: 'violet' | 'cyan' | 'amber' | 'emerald' | 'red';
  onClick?: () => void;
}

// Memoized MetricCard component to prevent unnecessary re-renders
const MetricCardComponent = memo(function MetricCardComponent({ metric, isCollapsed }: { metric: MetricCard; isCollapsed: boolean }) {
  const handleClick = useCallback(() => {
    if (metric.onClick) {
      metric.onClick();
    }
  }, [metric.onClick]);

  return (
    <div
      className={`metric-card metric-card-${metric.color} ${isCollapsed ? 'collapsed' : ''}`}
      onClick={handleClick}
      title={isCollapsed ? `${metric.label}: ${metric.value}` : undefined}
    >
      <div className="metric-icon">{metric.icon}</div>
      {!isCollapsed && (
        <div className="metric-content">
          <div className="metric-label">{metric.label}</div>
          <div className={`metric-value metric-value-${metric.trend || 'neutral'}`}>
            {metric.value}
          </div>
        </div>
      )}
      {!isCollapsed && metric.trend && metric.trend !== 'neutral' && (
        <div className={`metric-trend metric-trend-${metric.trend}`}>
          {metric.trend === 'up' ? '↑' : '↓'}
        </div>
      )}
    </div>
  );
});

function CommandHub() {
  const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>('commandHubCollapsed', true);

  // Financial Store
  const { summary, expenses } = useFinancialStore();
  
  // LLM Store
  const { models } = useLLMStore();
  const activeModel = models.length > 0 ? models[0]?.name : 'None';
  
  // Project Store
  const { projects } = useProjectStore();
  const activeProjects = projects.filter(p => p.status === 'in-progress' || p.status === 'backlog');
  
  // Crypto Store
  const cryptoProfit = 0; // Will be populated when crypto store has totalPnL property
  
  // Wealth Store
  const { netWorth } = useWealthStore();
  const totalNetWorth = typeof netWorth === 'number' ? netWorth : 0;

  // Calculate LLM costs
  const llmCosts = useMemo(() => {
    if (!expenses || !summary) return { monthly: 0, total: 0 };
    const apiCosts = expenses
      .filter(exp => exp.category === 'api_costs')
      .reduce((sum, exp) => sum + exp.amount, 0);
    return {
      monthly: apiCosts,
      total: summary.byCategory?.expenses?.api_costs || 0,
    };
  }, [expenses, summary]);

  // Calculate revenue metrics
  const revenueMetrics = useMemo(() => {
    if (!summary) {
      return { total: 0, netProfit: 0, roi: 0 };
    }
    const netProfit = summary.profit;
    const roi = llmCosts.total > 0 
      ? ((summary.totalIncome / llmCosts.total) * 100) 
      : 0;
    return {
      total: summary.totalIncome,
      netProfit,
      roi,
    };
  }, [summary, llmCosts]);

  // Build metrics cards
  const metrics: MetricCard[] = useMemo(() => {
    const cards: MetricCard[] = [
      {
        id: 'revenue',
        label: 'Total Revenue',
        value: formatCurrency(revenueMetrics.total),
        icon: <DollarSign size={20} />,
        trend: revenueMetrics.total > 0 ? 'up' : 'neutral',
        color: 'emerald',
      },
      {
        id: 'profit',
        label: 'Net Profit',
        value: formatCurrency(revenueMetrics.netProfit),
        icon: <TrendingUp size={20} />,
        trend: revenueMetrics.netProfit > 0 ? 'up' : revenueMetrics.netProfit < 0 ? 'down' : 'neutral',
        color: revenueMetrics.netProfit > 0 ? 'emerald' : 'red',
      },
      {
        id: 'llm-cost',
        label: 'LLM Costs',
        value: formatCurrency(llmCosts.monthly),
        icon: <Zap size={20} />,
        trend: 'neutral',
        color: 'amber',
      },
      {
        id: 'crypto-profit',
        label: 'Crypto P&L',
        value: formatCurrency(cryptoProfit),
        icon: <Bitcoin size={20} />,
        trend: cryptoProfit > 0 ? 'up' : cryptoProfit < 0 ? 'down' : 'neutral',
        color: cryptoProfit > 0 ? 'emerald' : cryptoProfit < 0 ? 'red' : 'cyan',
      },
      {
        id: 'net-worth',
        label: 'Net Worth',
        value: formatCurrency(totalNetWorth),
        icon: <PieChart size={20} />,
        trend: 'neutral',
        color: 'violet',
      },
      {
        id: 'projects',
        label: 'Active Projects',
        value: activeProjects.length,
        icon: <Code size={20} />,
        trend: 'neutral',
        color: 'cyan',
      },
      {
        id: 'ideas',
        label: 'Ideas',
        value: '—', // Will be populated when IdeaLab store is available
        icon: <Lightbulb size={20} />,
        trend: 'neutral',
        color: 'amber',
      },
      {
        id: 'llm-model',
        label: 'Active Model',
        value: activeModel,
        icon: <Zap size={20} />,
        trend: 'neutral',
        color: 'violet',
      },
    ];
    return cards;
  }, [
    revenueMetrics,
    llmCosts,
    cryptoProfit,
    totalNetWorth,
    activeProjects.length,
    activeModel,
  ]);

  // Toggle collapse handler
  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, [setIsCollapsed]);

  return (
    <div className={`command-hub ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="command-hub-header">
        {!isCollapsed && (
          <>
            <h3 className="command-hub-title">Command Hub</h3>
            <span className="command-hub-subtitle">Unified Dashboard</span>
          </>
        )}
        <button
          className="command-hub-toggle"
          onClick={handleToggleCollapse}
          aria-label={isCollapsed ? 'Expand Command Hub' : 'Collapse Command Hub'}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? 'Expand to show details' : 'Collapse to icons only'}
        >
          {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      <div className="command-hub-metrics">
        {metrics.map((metric) => (
          <MetricCardComponent key={metric.id} metric={metric} isCollapsed={isCollapsed} />
        ))}
      </div>
      {!isCollapsed && (
        <div className="command-hub-footer">
          <div className="command-hub-status">
            <span className="status-indicator status-online"></span>
            <span>All systems operational</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(CommandHub);

