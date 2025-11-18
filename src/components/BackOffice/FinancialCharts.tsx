/**
 * FinancialCharts.tsx
 *
 * PURPOSE:
 * Professional chart visualizations for financial data using Chart.js.
 * Provides interactive charts for expenses, income, profit trends, and category breakdowns.
 *
 * FEATURES:
 * ✅ Profit trend line chart (30-day history)
 * ✅ Expense breakdown doughnut chart
 * ✅ Income sources bar chart
 * ✅ Income vs Expenses area chart
 * ✅ Responsive charts
 * ✅ Interactive tooltips
 * ✅ Professional color schemes
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import type { Expense, Income, FinancialSummary } from '@/types/backoffice';
import { formatCurrency } from '@/utils/formatters';
import '../../styles/FinancialCharts.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FinancialChartsProps {
  expenses: Expense[];
  income: Income[];
  summary: FinancialSummary;
}

// Color palettes
const EXPENSE_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
];

const INCOME_COLORS = [
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
];

export function FinancialCharts({ expenses, income, summary }: FinancialChartsProps) {
  // Generate last 30 days for trend chart
  const getLast30Days = () => {
    const days: string[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const days = getLast30Days();

  // Calculate daily profit
  const dailyProfit = days.map(day => {
    const dayIncome = income
      .filter(i => i.date.toISOString().split('T')[0] === day)
      .reduce((sum, i) => sum + i.amount, 0);

    const dayExpenses = expenses
      .filter(e => e.date.toISOString().split('T')[0] === day)
      .reduce((sum, e) => sum + e.amount, 0);

    return dayIncome - dayExpenses;
  });

  // Calculate cumulative profit
  let cumulative = 0;
  const cumulativeProfit = dailyProfit.map(profit => {
    cumulative += profit;
    return cumulative;
  });

  // Profit Trend Chart Data
  const profitTrendData = {
    labels: days.map(day => {
      const date = new Date(day);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        label: 'Daily Profit',
        data: dailyProfit,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Cumulative Profit',
        data: cumulativeProfit,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Expense Breakdown Chart Data
  const expenseCategories = Object.entries(summary.byCategory.expenses)
    .filter(([_, amount]) => amount > 0)
    .sort(([_, a], [__, b]) => b - a);

  const expenseBreakdownData = {
    labels: expenseCategories.map(([category]) =>
      category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    ),
    datasets: [
      {
        label: 'Expenses',
        data: expenseCategories.map(([_, amount]) => amount),
        backgroundColor: EXPENSE_COLORS.slice(0, expenseCategories.length),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  // Income Sources Chart Data
  const incomeSources = Object.entries(summary.byCategory.income)
    .filter(([_, amount]) => amount > 0)
    .sort(([_, a], [__, b]) => b - a);

  const incomeSourcesData = {
    labels: incomeSources.map(([source]) =>
      source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    ),
    datasets: [
      {
        label: 'Income',
        data: incomeSources.map(([_, amount]) => amount),
        backgroundColor: INCOME_COLORS.slice(0, incomeSources.length),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  // Income vs Expenses Over Time
  const dailyIncome = days.map(day =>
    income
      .filter(i => i.date.toISOString().split('T')[0] === day)
      .reduce((sum, i) => sum + i.amount, 0)
  );

  const dailyExpenses = days.map(day =>
    expenses
      .filter(e => e.date.toISOString().split('T')[0] === day)
      .reduce((sum, e) => sum + e.amount, 0)
  );

  const incomeVsExpensesData = {
    labels: days.map(day => {
      const date = new Date(day);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        label: 'Income',
        data: dailyIncome,
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
      },
      {
        label: 'Expenses',
        data: dailyExpenses,
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
      },
    ],
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return formatCurrency(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  return (
    <div className="financial-charts">
      <div className="chart-section">
        <h3>Profit Trend (Last 30 Days)</h3>
        <div className="chart-container" style={{ height: '300px' }}>
          <Line data={profitTrendData} options={lineChartOptions} />
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-section">
          <h3>Expense Breakdown</h3>
          <div className="chart-container" style={{ height: '300px' }}>
            {expenseCategories.length > 0 ? (
              <Doughnut data={expenseBreakdownData} options={doughnutOptions} />
            ) : (
              <div className="empty-chart">No expenses to display</div>
            )}
          </div>
        </div>

        <div className="chart-section">
          <h3>Income Sources</h3>
          <div className="chart-container" style={{ height: '300px' }}>
            {incomeSources.length > 0 ? (
              <Bar data={incomeSourcesData} options={barChartOptions} />
            ) : (
              <div className="empty-chart">No income to display</div>
            )}
          </div>
        </div>
      </div>

      <div className="chart-section">
        <h3>Income vs Expenses (Last 30 Days)</h3>
        <div className="chart-container" style={{ height: '300px' }}>
          <Bar data={incomeVsExpensesData} options={barChartOptions} />
        </div>
      </div>
    </div>
  );
}

export default FinancialCharts;
