import { useState, useMemo } from 'react';
import { BookOpen, CheckCircle2, Circle, ChevronRight, ChevronDown, Play, RotateCcw } from 'lucide-react';
import '../../styles/TestingTutorial.css';

interface TutorialStep {
  id: string;
  title: string;
  objective: string;
  prerequisites?: string[];
  steps: string[];
  expectedResults: string[];
  verification: string[];
}

interface TutorialSection {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
}

const tutorialData: TutorialSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Verify the application launches correctly and understand the basic UI layout, navigation, and system features.',
    steps: [
      {
        id: 'launch',
        title: 'Launch the Application',
        objective: 'Verify the application launches correctly',
        steps: [
          'Double-click DLX Studios Ultimate.exe (or use Start Menu shortcut if installed)',
          'Wait for the application window to appear',
          'Observe the window title bar (should show "DLX Studios Ultimate")',
          'Check for any error dialogs or console errors'
        ],
        expectedResults: [
          'Window opens within 3-5 seconds',
          'Window is properly sized (not minimized)',
          'Title bar shows application name',
          'No error dialogs appear'
        ],
        verification: [
          'Window appears',
          'Title bar visible',
          'No error dialogs',
          'Application responsive'
        ]
      },
      {
        id: 'ui-layout',
        title: 'Observe Initial UI Layout',
        objective: 'Understand the basic UI structure',
        steps: [
          'Look at the top of the window - you should see navigation bar with tabs',
          'Observe tab labels: "LLM Optimization", "Revenue & Monetization", "Vibed Ed", "Crypto Lab", "Wealth Lab", "Idea Lab", "Workflows", "Quick Labs", "Settings"',
          'Look at the main content area - center panel displays active tab content',
          'Check for right sidebar or Command Hub (may be collapsed)'
        ],
        expectedResults: [
          'Navigation bar is centered horizontally',
          'All 9 main tabs are visible',
          'Center panel displays content',
          'Layout is responsive and properly aligned'
        ],
        verification: [
          'Navigation bar centered',
          'All main tabs visible',
          'Content area displays correctly',
          'No layout glitches'
        ]
      },
      {
        id: 'window-controls',
        title: 'Test Window Controls',
        objective: 'Verify window controls work correctly',
        steps: [
          'Click the minimize button (top-right, first button)',
          'Click the application icon in taskbar to restore',
          'Click the maximize button (top-right, second button)',
          'Click maximize again to restore windowed mode',
          'Hover over the title bar (should be draggable)',
          'Drag the window to a new position'
        ],
        expectedResults: [
          'Minimize works',
          'Maximize/restore works',
          'Window is draggable',
          'Close button visible and functional'
        ],
        verification: [
          'Minimize works',
          'Maximize/restore works',
          'Window dragging works',
          'All controls responsive'
        ]
      },
      {
        id: 'tab-navigation',
        title: 'Navigate Between Tabs',
        objective: 'Test tab switching functionality',
        steps: [
          'Click on "LLM Optimization" tab (should already be active)',
          'Click on "Revenue & Monetization" tab',
          'Click on "Vibed Ed" tab',
          'Click on "Crypto Lab" tab',
          'Click on "Wealth Lab" tab',
          'Click on "Idea Lab" tab',
          'Click on "Workflows" tab',
          'Click on "Quick Labs" tab',
          'Click on "Settings" tab',
          'Click back to "LLM Optimization"'
        ],
        expectedResults: [
          'Each tab click switches content smoothly',
          'Active tab is visually highlighted',
          'No loading delays > 1 second',
          'Content loads correctly for each tab'
        ],
        verification: [
          'All tabs clickable',
          'Smooth transitions between tabs',
          'Active tab clearly indicated',
          'Content loads for each tab'
        ]
      },
      {
        id: 'keyboard-shortcuts',
        title: 'Test Keyboard Shortcuts',
        objective: 'Verify keyboard shortcuts for quick navigation',
        steps: [
          'Press Alt+1 (should switch to LLM Optimization tab)',
          'Press Alt+2 (should switch to Revenue & Monetization tab)',
          'Press Alt+3 (should switch to Vibed Ed tab)',
          'Press Alt+4 (should switch to Crypto Lab tab)',
          'Press Alt+5 (should switch to Wealth Lab tab)',
          'Press Alt+6 (should switch to Idea Lab tab)',
          'Press Alt+7 (should switch to Workflows tab)',
          'Press Alt+8 (should switch to Quick Labs tab)',
          'Press Alt+9 (should switch to Settings tab)'
        ],
        expectedResults: [
          'Each Alt+number shortcut switches to corresponding tab',
          'Tab switching is instant',
          'No conflicts with other keyboard shortcuts'
        ],
        verification: [
          'Alt+1 switches to LLM Optimization',
          'Alt+2 switches to Revenue & Monetization',
          'Alt+3 switches to Vibed Ed',
          'Alt+4 switches to Crypto Lab',
          'Alt+5 switches to Wealth Lab',
          'Alt+6 switches to Idea Lab',
          'Alt+7 switches to Workflows',
          'Alt+8 switches to Quick Labs',
          'Alt+9 switches to Settings'
        ]
      },
      {
        id: 'command-palette',
        title: 'Test Command Palette',
        objective: 'Verify Command Palette functionality for quick actions',
        steps: [
          'Press Ctrl+K (or Cmd+K on Mac) to open Command Palette',
          'Observe the search input field (should be focused)',
          'Type "llm" to filter commands',
          'Use arrow keys to navigate filtered results',
          'Press Enter to select a command (e.g., "Go to LLM Optimizer")',
          'Verify the command executes and palette closes',
          'Open Command Palette again (Ctrl+K)',
          'Type "settings" to filter',
          'Select "Open Settings" command',
          'Verify Settings tab opens'
        ],
        expectedResults: [
          'Command Palette opens with Ctrl+K',
          'Search filtering works correctly',
          'Keyboard navigation works (arrow keys, Enter)',
          'Commands execute and navigate correctly',
          'Palette closes after command execution'
        ],
        verification: [
          'Command Palette opens with Ctrl+K',
          'Search filters commands',
          'Arrow keys navigate results',
          'Enter executes selected command',
          'Commands navigate to correct tabs'
        ]
      },
      {
        id: 'update-check',
        title: 'Test Update Check System',
        objective: 'Verify update check functionality and 406 error suppression',
        steps: [
          'Navigate to Settings tab (Alt+9)',
          'Look for "Check for Updates" button or menu item',
          'Click "Check for Updates"',
          'Observe the update check process',
          'Verify that 406 errors (GitHub API format issues) are suppressed silently',
          'Check that no error dialogs appear for 406 errors',
          'Verify that legitimate update errors still display properly',
          'Check version display (should show current version)'
        ],
        expectedResults: [
          'Update check executes without errors',
          '406 errors are suppressed silently (no error dialogs)',
          'Update check results display correctly',
          'Version information is accurate'
        ],
        verification: [
          'Update check button works',
          'No 406 error dialogs appear',
          'Update status displays correctly',
          'Version display accurate'
        ]
      }
    ]
  },
  {
    id: 'llm-optimization',
    title: 'LLM Optimization Tab',
    description: 'Test all features in the LLM Optimization tab including connection status, model catalog, hardware profiling, system health, benchmark runner, and recommendations.',
    steps: [
      {
        id: 'connection-status',
        title: 'Examine Connection Status Bar',
        objective: 'Verify connection status display',
        steps: [
          'Navigate to LLM Optimization tab (Alt+1)',
          'Look at the top of the center panel',
          'Find the "Connection Status" heading (centered, above a horizontal bar)',
          'Observe the Connection Status Bar: should show "X/Y Active", provider icons, and refresh button',
          'Click the refresh button to update connection status',
          'Verify provider status updates'
        ],
        expectedResults: [
          'Connection Status heading is centered',
          'Status bar shows active/total provider count',
          'Provider icons visible (Ollama, LM Studio, Gemini, NotebookLM, OpenRouter)',
          'Refresh button visible and functional'
        ],
        verification: [
          'Connection Status heading visible and centered',
          'Status summary shows (e.g., "2/5 Active")',
          'Provider icons displayed',
          'Refresh button works'
        ]
      },
      {
        id: 'model-catalog',
        title: 'Explore Model Catalog',
        objective: 'Test Model Catalog functionality',
        steps: [
          'Look at the left sidebar in LLM Optimization tab',
          'Find the "Model Catalog" heading (left-aligned)',
          'Observe the catalog: should show list of available models',
          'Check model details: name, provider, size, context window, capabilities',
          'Use search/filter if available',
          'Check if models are scrollable if many models',
          'Select a model to view details'
        ],
        expectedResults: [
          'Model Catalog visible in left sidebar',
          'Models listed with details (name, provider, size, tokens, tags)',
          'Search/filter functionality works',
          'Scrollable if content exceeds height',
          'Model selection works'
        ],
        verification: [
          'Model Catalog visible',
          'Models displayed with details',
          'Search/filter works (if available)',
          'Scrollable (if needed)',
          'Model selection functional'
        ]
      },
      {
        id: 'hardware-profiler',
        title: 'Examine Hardware Profiler',
        objective: 'Verify hardware information display and manual overrides',
        steps: [
          'Scroll down in the center panel (if needed)',
          'Find the "Hardware Profiler" card/section',
          'Observe displayed information: CPU, Memory/RAM, GPU, System specifications',
          'Check for "Auto detected" label',
          'Look for manual override fields (System Memory, GPU Memory, CPU Cores, OS)',
          'Test manual override: enter custom values',
          'Click "Apply Override" button',
          'Verify override values are applied',
          'Click "Reset" button to restore auto-detected values'
        ],
        expectedResults: [
          'Hardware information displayed accurately',
          'Values are readable and formatted',
          'Manual override fields are functional',
          'Override values persist',
          'Reset restores auto-detected values'
        ],
        verification: [
          'Hardware Profiler visible',
          'CPU info displayed',
          'Memory info displayed',
          'GPU info displayed',
          'Manual overrides work',
          'Reset functionality works'
        ]
      },
      {
        id: 'system-health',
        title: 'Test System Health Features',
        objective: 'Verify system health monitoring and cleanup tools',
        steps: [
          'Find the "System Health" section',
          'Observe system health metrics',
          'Click "Clean Temp Files" button',
          'Verify temporary files are cleaned',
          'Click "Clean Cache" button',
          'Verify cache is cleaned',
          'Click "Deep Clean" button',
          'Verify deep clean completes',
          'Check that disk space is freed'
        ],
        expectedResults: [
          'System Health section displays correctly',
          'Clean Temp Files removes temporary files',
          'Clean Cache removes cache files',
          'Deep Clean performs comprehensive cleanup',
          'Disk space is freed after cleanup'
        ],
        verification: [
          'System Health section visible',
          'Clean Temp Files works',
          'Clean Cache works',
          'Deep Clean works',
          'Disk space freed'
        ]
      },
      {
        id: 'benchmark-runner',
        title: 'Test Benchmark Runner',
        objective: 'Verify LLM benchmark functionality',
        steps: [
          'Look for "Benchmark Runner" or "Development Tools" section',
          'Find benchmark controls (if available)',
          'Select a model to benchmark',
          'Start a benchmark test',
          'Observe benchmark progress',
          'Review benchmark results (if available)',
          'Check performance metrics'
        ],
        expectedResults: [
          'Benchmark Runner is accessible',
          'Model selection works',
          'Benchmark executes successfully',
          'Results display correctly',
          'Performance metrics are accurate'
        ],
        verification: [
          'Benchmark Runner accessible',
          'Model selection works',
          'Benchmark executes',
          'Results display',
          'Metrics accurate'
        ]
      },
      {
        id: 'recommendation-panel',
        title: 'Test Recommendation Panel',
        objective: 'Verify LLM recommendations based on hardware',
        steps: [
          'Look for "Recommendation Panel" or model recommendations',
          'Observe recommended models based on hardware',
          'Check recommendation reasoning',
          'Verify recommendations match hardware capabilities',
          'Test selecting a recommended model'
        ],
        expectedResults: [
          'Recommendation Panel displays',
          'Recommendations are hardware-appropriate',
          'Reasoning is clear',
          'Model selection from recommendations works'
        ],
        verification: [
          'Recommendation Panel visible',
          'Recommendations displayed',
          'Hardware matching accurate',
          'Selection works'
        ]
      },
      {
        id: 'development-tools',
        title: 'Test Development Tools',
        objective: 'Verify development tools integration',
        steps: [
          'Find "Development Tools" section',
          'Check Node.js version display',
          'Check Python version display',
          'Check Git version display',
          'Check Docker version display',
          'Check npm/yarn/pnpm version display',
          'Verify tool installation status'
        ],
        expectedResults: [
          'Development Tools section displays',
          'Tool versions are accurate',
          'Installation status is correct',
          'Tools are properly detected'
        ],
        verification: [
          'Development Tools visible',
          'Node.js version correct',
          'Python version correct',
          'Git version correct',
          'Docker version correct',
          'Package manager versions correct'
        ]
      }
    ]
  },
  {
    id: 'revenue-monetization',
    title: 'Revenue & Monetization Tab',
    description: 'Test financial dashboard, revenue streams, expense tracking, and P&L analysis features.',
    steps: [
      {
        id: 'financial-dashboard',
        title: 'Examine Financial Dashboard',
        objective: 'Verify financial dashboard displays correctly',
        steps: [
          'Navigate to Revenue & Monetization tab (Alt+2)',
          'Observe the Financial Dashboard',
          'Check total revenue display',
          'Check total expenses display',
          'Check net profit/loss display',
          'Check P&L charts and graphs',
          'Verify time period selector (if available)',
          'Check revenue trends over time'
        ],
        expectedResults: [
          'Financial Dashboard displays correctly',
          'Revenue metrics are accurate',
          'Expense tracking works',
          'P&L calculations are correct',
          'Charts render properly',
          'Time period selection works'
        ],
        verification: [
          'Dashboard visible',
          'Revenue displayed',
          'Expenses displayed',
          'Net profit calculated',
          'Charts render',
          'Time selector works'
        ]
      },
      {
        id: 'revenue-streams',
        title: 'Test Revenue Streams Display',
        objective: 'Verify revenue stream tracking',
        steps: [
          'Find "Revenue Streams" section',
          'Observe list of revenue streams',
          'Check revenue stream details (name, amount, date)',
          'Verify revenue categorization',
          'Test adding a new revenue stream (if available)',
          'Test editing a revenue stream (if available)',
          'Test deleting a revenue stream (if available)'
        ],
        expectedResults: [
          'Revenue streams display correctly',
          'Stream details are accurate',
          'Categorization works',
          'Add/edit/delete operations work'
        ],
        verification: [
          'Revenue streams visible',
          'Details accurate',
          'Categorization works',
          'CRUD operations work'
        ]
      },
      {
        id: 'expense-tracking',
        title: 'Test Expense Tracking',
        objective: 'Verify expense tracking functionality',
        steps: [
          'Find "Expenses" section',
          'Observe expense list',
          'Check expense details (category, amount, date)',
          'Verify expense categorization',
          'Test filtering expenses by category',
          'Test filtering expenses by date range',
          'Check expense totals by category'
        ],
        expectedResults: [
          'Expenses display correctly',
          'Expense details are accurate',
          'Categorization works',
          'Filtering works',
          'Totals are correct'
        ],
        verification: [
          'Expenses visible',
          'Details accurate',
          'Categorization works',
          'Filters work',
          'Totals correct'
        ]
      },
      {
        id: 'pl-analysis',
        title: 'Test P&L Analysis',
        objective: 'Verify profit and loss analysis features',
        steps: [
          'Find "P&L Analysis" section',
          'Observe profit/loss breakdown',
          'Check revenue vs expenses comparison',
          'Verify profit margin calculations',
          'Check ROI calculations',
          'Review P&L charts and visualizations',
          'Test exporting P&L report (if available)'
        ],
        expectedResults: [
          'P&L Analysis displays correctly',
          'Breakdown is accurate',
          'Comparisons are correct',
          'Calculations are accurate',
          'Charts render properly',
          'Export works'
        ],
        verification: [
          'P&L Analysis visible',
          'Breakdown accurate',
          'Comparisons correct',
          'Calculations accurate',
          'Charts render',
          'Export works'
        ]
      },
      {
        id: 'revenue-charts',
        title: 'Test Revenue Charts and Trends',
        objective: 'Verify revenue visualization features',
        steps: [
          'Find revenue charts section',
          'Observe revenue trend chart',
          'Check time period selector',
          'Select different time periods (week, month, quarter, year)',
          'Verify chart updates',
          'Check chart interactivity (hover, zoom if available)',
          'Review revenue by category chart',
          'Review revenue by source chart'
        ],
        expectedResults: [
          'Revenue charts display correctly',
          'Trends are visible',
          'Time period selection works',
          'Charts update correctly',
          'Interactivity works',
          'Multiple chart types available'
        ],
        verification: [
          'Charts visible',
          'Trends displayed',
          'Time selector works',
          'Charts update',
          'Interactivity works',
          'Multiple chart types available'
        ]
      }
    ]
  },
  {
    id: 'vibed-ed',
    title: 'Vibed Ed IDE Tab',
    description: 'Test the integrated development environment including File Explorer, Monaco Editor, Console Panel, Project Panel, Toolbar, and HW Status HUD.',
    steps: [
      {
        id: 'file-explorer',
        title: 'Test File Explorer',
        objective: 'Verify file explorer functionality for project and system files',
        steps: [
          'Navigate to Vibed Ed tab (Alt+3)',
          'Find File Explorer in the left sidebar',
          'Observe project file tree',
          'Expand/collapse folders',
          'Click on a file to open it in editor',
          'Right-click on a file/folder to see context menu',
          'Test creating a new file',
          'Test creating a new folder',
          'Test renaming a file',
          'Test deleting a file',
          'Switch to "System Files" view',
          'Click on a system file to open it',
          'Test cleaning temporary files in a directory'
        ],
        expectedResults: [
          'File Explorer displays project files',
          'File tree is navigable',
          'Files open in editor on click',
          'Context menu works',
          'File operations (create, rename, delete) work',
          'System files are accessible',
          'Temp file cleanup works'
        ],
        verification: [
          'File Explorer visible',
          'File tree navigable',
          'Files open correctly',
          'Context menu works',
          'File operations work',
          'System files accessible',
          'Temp cleanup works'
        ]
      },
      {
        id: 'monaco-editor',
        title: 'Test Monaco Editor',
        objective: 'Verify Monaco Editor features including syntax highlighting and IntelliSense',
        steps: [
          'Open a file in the editor',
          'Type some code',
          'Verify syntax highlighting works',
          'Test IntelliSense: type a function name and check autocomplete',
          'Test code formatting (if available)',
          'Test find/replace (Ctrl+F)',
          'Test go to line (Ctrl+G)',
          'Test multiple cursors (Alt+Click)',
          'Test code folding',
          'Verify line numbers display',
          'Test editor themes (if available)'
        ],
        expectedResults: [
          'Monaco Editor loads correctly',
          'Syntax highlighting works',
          'IntelliSense provides suggestions',
          'Code formatting works',
          'Find/replace works',
          'Go to line works',
          'Multiple cursors work',
          'Code folding works',
          'Line numbers visible',
          'Themes work'
        ],
        verification: [
          'Editor loads',
          'Syntax highlighting works',
          'IntelliSense works',
          'Formatting works',
          'Find/replace works',
          'Go to line works',
          'Multiple cursors work',
          'Code folding works',
          'Line numbers visible',
          'Themes work'
        ]
      },
      {
        id: 'console-panel',
        title: 'Test Console Panel',
        objective: 'Verify console output display and features',
        steps: [
          'Find Console Panel (usually at bottom)',
          'Observe console output',
          'Test console filters (if available)',
          'Test search in console',
          'Test copy functionality',
          'Test clearing console',
          'Verify output formatting',
          'Check error highlighting',
          'Test console tabs (if available)'
        ],
        expectedResults: [
          'Console Panel displays correctly',
          'Output is readable',
          'Filters work',
          'Search works',
          'Copy works',
          'Clear works',
          'Formatting is correct',
          'Errors are highlighted',
          'Tabs work'
        ],
        verification: [
          'Console visible',
          'Output readable',
          'Filters work',
          'Search works',
          'Copy works',
          'Clear works',
          'Formatting correct',
          'Errors highlighted',
          'Tabs work'
        ]
      },
      {
        id: 'project-panel',
        title: 'Test Project Panel',
        objective: 'Verify project selection and management',
        steps: [
          'Find Project Panel',
          'Observe project list',
          'Select a project',
          'Verify project loads',
          'Test creating a new project',
          'Test project settings',
          'Test switching between projects',
          'Verify project files load correctly'
        ],
        expectedResults: [
          'Project Panel displays correctly',
          'Project list is visible',
          'Project selection works',
          'Projects load correctly',
          'New project creation works',
          'Project switching works',
          'Files load correctly'
        ],
        verification: [
          'Project Panel visible',
          'Project list displayed',
          'Selection works',
          'Projects load',
          'Creation works',
          'Switching works',
          'Files load'
        ]
      },
      {
        id: 'toolbar',
        title: 'Test Toolbar Commands',
        objective: 'Verify toolbar functionality for run, build, deploy commands',
        steps: [
          'Find Toolbar (usually at top of editor)',
          'Observe toolbar buttons',
          'Test "Run" button',
          'Test "Build" button',
          'Test "Deploy" button',
          'Test other toolbar commands',
          'Verify command execution',
          'Check command output in console'
        ],
        expectedResults: [
          'Toolbar displays correctly',
          'Buttons are functional',
          'Commands execute',
          'Output appears in console',
          'Error handling works'
        ],
        verification: [
          'Toolbar visible',
          'Buttons functional',
          'Commands execute',
          'Output in console',
          'Errors handled'
        ]
      },
      {
        id: 'hw-status-hud',
        title: 'Test HW Status HUD',
        objective: 'Verify hardware status display with live stats',
        steps: [
          'Find HW Status HUD (usually compact display)',
          'Observe live hardware metrics',
          'Check CPU usage',
          'Check memory usage',
          'Check GPU usage (if available)',
          'Verify metrics update in real-time',
          'Test clicking HUD to expand (if available)',
          'Verify metric accuracy'
        ],
        expectedResults: [
          'HW Status HUD displays',
          'Metrics are visible',
          'Real-time updates work',
          'Metrics are accurate',
          'Expand/collapse works'
        ],
        verification: [
          'HUD visible',
          'Metrics displayed',
          'Updates work',
          'Metrics accurate',
          'Expand works'
        ]
      }
    ]
  },
  {
    id: 'crypto-lab',
    title: 'Crypto Lab Tab',
    description: 'Test cryptocurrency trading interface including Trading Dashboard, Market Data, Trading Interface, Order Book, Positions, Trade History, and Coinbase integration.',
    steps: [
      {
        id: 'trading-dashboard',
        title: 'Test Trading Dashboard',
        objective: 'Verify trading dashboard displays correctly',
        steps: [
          'Navigate to Crypto Lab tab (Alt+4)',
          'Observe Trading Dashboard',
          'Check portfolio value display',
          'Check profit/loss display',
          'Check open positions summary',
          'Check recent trades',
          'Verify dashboard updates'
        ],
        expectedResults: [
          'Trading Dashboard displays correctly',
          'Portfolio value is accurate',
          'P&L is calculated correctly',
          'Positions summary is accurate',
          'Recent trades display',
          'Updates work'
        ],
        verification: [
          'Dashboard visible',
          'Portfolio value accurate',
          'P&L calculated',
          'Positions summary accurate',
          'Recent trades displayed',
          'Updates work'
        ]
      },
      {
        id: 'market-data',
        title: 'Test Market Data Panel',
        objective: 'Verify market data display and updates',
        steps: [
          'Find Market Data Panel',
          'Observe cryptocurrency prices',
          'Check price changes (24h)',
          'Check volume data',
          'Verify real-time price updates',
          'Test selecting different cryptocurrencies',
          'Check market data refresh'
        ],
        expectedResults: [
          'Market Data Panel displays correctly',
          'Prices are accurate',
          'Price changes display',
          'Volume data is available',
          'Real-time updates work',
          'Cryptocurrency selection works',
          'Refresh works'
        ],
        verification: [
          'Market Data visible',
          'Prices accurate',
          'Changes displayed',
          'Volume available',
          'Updates work',
          'Selection works',
          'Refresh works'
        ]
      },
      {
        id: 'trading-interface',
        title: 'Test Trading Interface',
        objective: 'Verify trading functionality and mode toggle',
        steps: [
          'Find Trading Interface',
          'Test Trading Mode Toggle: switch between Paper and Live mode',
          'Verify mode indicator displays correctly',
          'Test placing a buy order',
          'Test placing a sell order',
          'Enter order details (amount, price, type)',
          'Submit order',
          'Verify order appears in Open Orders',
          'Test order cancellation'
        ],
        expectedResults: [
          'Trading Interface displays correctly',
          'Mode toggle works',
          'Mode indicator is clear',
          'Order placement works',
          'Order details are validated',
          'Orders appear in Open Orders',
          'Order cancellation works'
        ],
        verification: [
          'Trading Interface visible',
          'Mode toggle works',
          'Mode indicator clear',
          'Order placement works',
          'Validation works',
          'Orders appear',
          'Cancellation works'
        ]
      },
      {
        id: 'order-book',
        title: 'Test Order Book',
        objective: 'Verify order book display and functionality',
        steps: [
          'Find Order Book panel',
          'Observe buy orders (bids)',
          'Observe sell orders (asks)',
          'Check order book depth',
          'Verify order book updates',
          'Test selecting an order from order book',
          'Verify order details display'
        ],
        expectedResults: [
          'Order Book displays correctly',
          'Buy and sell orders are visible',
          'Order book depth is accurate',
          'Updates work',
          'Order selection works',
          'Order details display'
        ],
        verification: [
          'Order Book visible',
          'Bids/asks displayed',
          'Depth accurate',
          'Updates work',
          'Selection works',
          'Details display'
        ]
      },
      {
        id: 'open-orders',
        title: 'Test Open Orders Panel',
        objective: 'Verify open orders tracking',
        steps: [
          'Find Open Orders Panel',
          'Observe list of open orders',
          'Check order details (pair, type, amount, price, status)',
          'Test canceling an order',
          'Verify order status updates',
          'Check order execution',
          'Verify filled orders move to Trade History'
        ],
        expectedResults: [
          'Open Orders Panel displays correctly',
          'Orders list is accurate',
          'Order details are correct',
          'Order cancellation works',
          'Status updates work',
          'Order execution works',
          'Filled orders move correctly'
        ],
        verification: [
          'Open Orders visible',
          'Orders listed',
          'Details correct',
          'Cancellation works',
          'Status updates',
          'Execution works',
          'Filled orders move'
        ]
      },
      {
        id: 'positions',
        title: 'Test Positions Panel',
        objective: 'Verify positions tracking and management',
        steps: [
          'Find Positions Panel',
          'Observe open positions',
          'Check position details (pair, size, entry price, current price, P&L)',
          'Verify unrealized P&L calculations',
          'Test closing a position',
          'Verify position updates',
          'Check position history'
        ],
        expectedResults: [
          'Positions Panel displays correctly',
          'Positions list is accurate',
          'Position details are correct',
          'P&L calculations are accurate',
          'Position closing works',
          'Position updates work',
          'Position history is available'
        ],
        verification: [
          'Positions visible',
          'Positions listed',
          'Details correct',
          'P&L calculated',
          'Closing works',
          'Updates work',
          'History available'
        ]
      },
      {
        id: 'trade-history',
        title: 'Test Trade History',
        objective: 'Verify trade history display and filtering',
        steps: [
          'Find Trade History panel',
          'Observe list of completed trades',
          'Check trade details (date, pair, type, amount, price, fee)',
          'Test filtering trades by date range',
          'Test filtering trades by cryptocurrency',
          'Test filtering trades by type (buy/sell)',
          'Verify trade history accuracy'
        ],
        expectedResults: [
          'Trade History displays correctly',
          'Trades list is accurate',
          'Trade details are correct',
          'Date filtering works',
          'Cryptocurrency filtering works',
          'Type filtering works',
          'History is accurate'
        ],
        verification: [
          'Trade History visible',
          'Trades listed',
          'Details correct',
          'Date filter works',
          'Crypto filter works',
          'Type filter works',
          'History accurate'
        ]
      },
      {
        id: 'analytics-panel',
        title: 'Test Analytics Panel',
        objective: 'Verify trading analytics and performance metrics',
        steps: [
          'Find Analytics Panel',
          'Observe trading performance metrics',
          'Check win rate',
          'Check total profit/loss',
          'Check average trade size',
          'Review performance charts',
          'Check risk metrics',
          'Verify analytics accuracy'
        ],
        expectedResults: [
          'Analytics Panel displays correctly',
          'Performance metrics are accurate',
          'Win rate is calculated',
          'P&L is accurate',
          'Charts render properly',
          'Risk metrics are available',
          'Analytics are accurate'
        ],
        verification: [
          'Analytics visible',
          'Metrics accurate',
          'Win rate calculated',
          'P&L accurate',
          'Charts render',
          'Risk metrics available',
          'Analytics accurate'
        ]
      },
      {
        id: 'coinbase-integration',
        title: 'Test Coinbase Integration',
        objective: 'Verify Coinbase API integration',
        steps: [
          'Find Coinbase integration settings',
          'Check Coinbase API connection status',
          'Test connecting Coinbase account',
          'Verify API key configuration',
          'Test fetching account balance',
          'Test fetching trade history',
          'Verify data synchronization',
          'Test disconnecting Coinbase account'
        ],
        expectedResults: [
          'Coinbase integration is accessible',
          'Connection status displays',
          'Account connection works',
          'API key configuration works',
          'Balance fetching works',
          'Trade history fetching works',
          'Data sync works',
          'Disconnection works'
        ],
        verification: [
          'Integration accessible',
          'Status displays',
          'Connection works',
          'API config works',
          'Balance fetched',
          'History fetched',
          'Sync works',
          'Disconnection works'
        ]
      }
    ]
  },
  {
    id: 'wealth-lab',
    title: 'Wealth Lab Premium Tab',
    description: 'Test comprehensive wealth management features including Account Connections, Analytics Dashboard, Budget Dashboard, Spending Analysis, Transaction List enhancements, Export/Import, and all asset types.',
    steps: [
      {
        id: 'net-worth-dashboard',
        title: 'Test Net Worth Dashboard',
        objective: 'Verify net worth tracking with charts and export',
        steps: [
          'Navigate to Wealth Lab tab (Alt+5)',
          'Observe Net Worth Dashboard',
          'Check current net worth display',
          'Check asset breakdown',
          'Check liability breakdown',
          'Test time period selector (1M, 3M, 6M, 1Y, All)',
          'Verify chart updates with period selection',
          'Test comparison view (if available)',
          'Test exporting net worth data',
          'Verify chart interactivity'
        ],
        expectedResults: [
          'Net Worth Dashboard displays correctly',
          'Net worth is calculated accurately',
          'Asset/liability breakdown is correct',
          'Time period selector works',
          'Charts update correctly',
          'Comparison view works',
          'Export works',
          'Chart interactivity works'
        ],
        verification: [
          'Dashboard visible',
          'Net worth accurate',
          'Breakdown correct',
          'Period selector works',
          'Charts update',
          'Comparison works',
          'Export works',
          'Interactivity works'
        ]
      },
      {
        id: 'account-connections',
        title: 'Test Account Connections',
        objective: 'Verify financial institution connection wizard and sync',
        steps: [
          'Find Account Connections section',
          'Click "Connect Account" button',
          'Observe connection wizard',
          'Step 1: Select provider (Plaid, Yodlee, Schwab)',
          'Step 2: Search for institution',
          'Step 3: Authenticate with institution',
          'Complete connection',
          'Verify connection appears in list',
          'Test manual sync for a connection',
          'Check sync status display',
          'Test disconnecting an account',
          'Verify account count updates'
        ],
        expectedResults: [
          'Account Connections section displays',
          'Connection wizard works',
          'Provider selection works',
          'Institution search works',
          'Authentication works',
          'Connection completes',
          'Connection appears in list',
          'Manual sync works',
          'Sync status displays',
          'Disconnection works',
          'Account count updates'
        ],
        verification: [
          'Section visible',
          'Wizard works',
          'Provider selection works',
          'Search works',
          'Authentication works',
          'Connection completes',
          'Connection listed',
          'Sync works',
          'Status displays',
          'Disconnection works',
          'Count updates'
        ]
      },
      {
        id: 'transaction-list',
        title: 'Test Transaction List Enhancements',
        objective: 'Verify advanced transaction management features',
        steps: [
          'Find Transaction List',
          'Test search functionality',
          'Test filtering by category',
          'Test filtering by type (income/expense)',
          'Test filtering by merchant',
          'Test filtering by amount range',
          'Test bulk selection (checkboxes)',
          'Test bulk edit (change category for multiple transactions)',
          'Test bulk delete',
          'Test split transaction',
          'Test merchant grouping',
          'Test pagination',
          'Test sorting'
        ],
        expectedResults: [
          'Transaction List displays correctly',
          'Search works',
          'Category filtering works',
          'Type filtering works',
          'Merchant filtering works',
          'Amount filtering works',
          'Bulk selection works',
          'Bulk edit works',
          'Bulk delete works',
          'Split transaction works',
          'Merchant grouping works',
          'Pagination works',
          'Sorting works'
        ],
        verification: [
          'Transaction List visible',
          'Search works',
          'Category filter works',
          'Type filter works',
          'Merchant filter works',
          'Amount filter works',
          'Bulk selection works',
          'Bulk edit works',
          'Bulk delete works',
          'Split works',
          'Grouping works',
          'Pagination works',
          'Sorting works'
        ]
      },
      {
        id: 'budget-dashboard',
        title: 'Test Budget Dashboard',
        objective: 'Verify budget management with rules and rollover',
        steps: [
          'Find Budget Dashboard',
          'Observe budget overview',
          'Check budget vs actual comparison',
          'Test creating a new budget',
          'Test budget rules engine',
          'Test auto-categorization',
          'Test recurring transactions detection',
          'Test budget rollover',
          'Test budget templates',
          'Test editing a budget',
          'Test deleting a budget'
        ],
        expectedResults: [
          'Budget Dashboard displays correctly',
          'Budget overview is accurate',
          'Budget vs actual comparison works',
          'Budget creation works',
          'Rules engine works',
          'Auto-categorization works',
          'Recurring detection works',
          'Rollover works',
          'Templates work',
          'Edit works',
          'Delete works'
        ],
        verification: [
          'Dashboard visible',
          'Overview accurate',
          'Comparison works',
          'Creation works',
          'Rules work',
          'Auto-categorization works',
          'Recurring detection works',
          'Rollover works',
          'Templates work',
          'Edit works',
          'Delete works'
        ]
      },
      {
        id: 'spending-analysis',
        title: 'Test Spending Analysis',
        objective: 'Verify spending trends, forecasts, and budget vs actual charts',
        steps: [
          'Find Spending Analysis section',
          'Observe spending trends chart',
          'Test time period selection',
          'Check category distribution chart',
          'Check budget vs actual chart',
          'Review spending forecast',
          'Test category trends',
          'Check top spending categories',
          'Verify chart interactivity'
        ],
        expectedResults: [
          'Spending Analysis displays correctly',
          'Trends chart renders',
          'Time period selection works',
          'Category distribution chart renders',
          'Budget vs actual chart renders',
          'Forecast displays',
          'Category trends display',
          'Top categories identified',
          'Chart interactivity works'
        ],
        verification: [
          'Analysis visible',
          'Trends chart renders',
          'Period selector works',
          'Distribution chart renders',
          'Budget vs actual renders',
          'Forecast displays',
          'Trends display',
          'Top categories shown',
          'Interactivity works'
        ]
      },
      {
        id: 'analytics-dashboard',
        title: 'Test Analytics Dashboard',
        objective: 'Verify portfolio analytics and performance metrics',
        steps: [
          'Find Analytics Dashboard',
          'Observe performance metrics',
          'Check Sharpe ratio',
          'Check Sortino ratio',
          'Check alpha and beta',
          'Review asset allocation chart',
          'Check performance attribution',
          'Review benchmark comparison',
          'Check risk metrics',
          'Verify calculations accuracy'
        ],
        expectedResults: [
          'Analytics Dashboard displays correctly',
          'Performance metrics are accurate',
          'Sharpe ratio calculated',
          'Sortino ratio calculated',
          'Alpha/beta calculated',
          'Asset allocation chart renders',
          'Performance attribution works',
          'Benchmark comparison works',
          'Risk metrics available',
          'Calculations are accurate'
        ],
        verification: [
          'Dashboard visible',
          'Metrics accurate',
          'Sharpe calculated',
          'Sortino calculated',
          'Alpha/beta calculated',
          'Allocation chart renders',
          'Attribution works',
          'Benchmark comparison works',
          'Risk metrics available',
          'Calculations accurate'
        ]
      },
      {
        id: 'asset-types',
        title: 'Test Multi-Asset Type Tracking',
        objective: 'Verify tracking for all asset types including stocks, crypto, ETFs, NFTs, real estate, collectibles, private investments, commodities, derivatives',
        steps: [
          'Find Asset List',
          'Observe asset types',
          'Test adding a stock asset',
          'Test adding a cryptocurrency asset',
          'Test adding an ETF asset',
          'Test adding an NFT asset',
          'Test adding a real estate asset',
          'Test adding a collectible asset',
          'Test adding a private investment asset',
          'Test adding a commodity asset',
          'Test adding a derivative asset',
          'Verify asset details display',
          'Test editing an asset',
          'Test deleting an asset'
        ],
        expectedResults: [
          'Asset List displays correctly',
          'All asset types are supported',
          'Asset creation works',
          'Asset details are accurate',
          'Asset editing works',
          'Asset deletion works',
          'Asset types are properly categorized'
        ],
        verification: [
          'Asset List visible',
          'All types supported',
          'Creation works',
          'Details accurate',
          'Editing works',
          'Deletion works',
          'Types categorized'
        ]
      },
      {
        id: 'export-import',
        title: 'Test Export/Import Functionality',
        objective: 'Verify data export and import features',
        steps: [
          'Find Export/Import section',
          'Test exporting net worth to CSV',
          'Test exporting transactions to Excel',
          'Test exporting tax report to PDF',
          'Test importing from CSV',
          'Test importing from Mint',
          'Test importing from Personal Capital',
          'Test importing broker statements',
          'Verify data accuracy after import',
          'Check import error handling'
        ],
        expectedResults: [
          'Export/Import section accessible',
          'CSV export works',
          'Excel export works',
          'PDF export works',
          'CSV import works',
          'Mint import works',
          'Personal Capital import works',
          'Broker statement import works',
          'Data accuracy maintained',
          'Error handling works'
        ],
        verification: [
          'Section accessible',
          'CSV export works',
          'Excel export works',
          'PDF export works',
          'CSV import works',
          'Mint import works',
          'Personal Capital import works',
          'Broker import works',
          'Data accurate',
          'Errors handled'
        ]
      },
      {
        id: 'goals-retirement',
        title: 'Test Goals Tracker and Retirement Calculator',
        objective: 'Verify financial planning features',
        steps: [
          'Find Goals Tracker',
          'Test creating a financial goal',
          'Test goal progress tracking',
          'Test goal visualization',
          'Find Retirement Calculator',
          'Test retirement scenario planning',
          'Test Social Security estimates',
          'Test healthcare cost estimates',
          'Test inflation adjustments',
          'Test Monte Carlo simulations'
        ],
        expectedResults: [
          'Goals Tracker displays correctly',
          'Goal creation works',
          'Progress tracking works',
          'Visualization works',
          'Retirement Calculator displays',
          'Scenario planning works',
          'Social Security estimates work',
          'Healthcare estimates work',
          'Inflation adjustments work',
          'Monte Carlo simulations work'
        ],
        verification: [
          'Goals Tracker visible',
          'Creation works',
          'Progress tracking works',
          'Visualization works',
          'Calculator visible',
          'Scenarios work',
          'Social Security works',
          'Healthcare works',
          'Inflation works',
          'Monte Carlo works'
        ]
      }
    ]
  },
  {
    id: 'idea-lab',
    title: 'Idea Lab Tab',
    description: 'Test idea management features including Idea Inventory, Planning Workspace, and Kai AI Agent interaction.',
    steps: [
      {
        id: 'idea-inventory',
        title: 'Test Idea Inventory',
        objective: 'Verify idea management functionality',
        steps: [
          'Navigate to Idea Lab tab (Alt+6)',
          'Observe Idea Inventory',
          'Check idea list display',
          'Test creating a new idea',
          'Test editing an idea',
          'Test deleting an idea',
          'Test idea status (idea, backlog, in-progress, completed, deployed, archived)',
          'Test filtering ideas by status',
          'Test searching ideas',
          'Test idea details view'
        ],
        expectedResults: [
          'Idea Inventory displays correctly',
          'Idea list is visible',
          'Idea creation works',
          'Idea editing works',
          'Idea deletion works',
          'Status management works',
          'Filtering works',
          'Search works',
          'Details view works'
        ],
        verification: [
          'Inventory visible',
          'List displayed',
          'Creation works',
          'Editing works',
          'Deletion works',
          'Status works',
          'Filtering works',
          'Search works',
          'Details work'
        ]
      },
      {
        id: 'planning-workspace',
        title: 'Test Planning Workspace',
        objective: 'Verify planning and structuring features',
        steps: [
          'Find Planning Workspace',
          'Select an idea to plan',
          'Test structuring an idea',
          'Test creating an execution plan',
          'Review plan steps',
          'Test editing plan steps',
          'Test plan execution tracking',
          'Verify plan visualization'
        ],
        expectedResults: [
          'Planning Workspace displays correctly',
          'Idea selection works',
          'Idea structuring works',
          'Plan creation works',
          'Plan steps display',
          'Plan editing works',
          'Execution tracking works',
          'Visualization works'
        ],
        verification: [
          'Workspace visible',
          'Selection works',
          'Structuring works',
          'Creation works',
          'Steps display',
          'Editing works',
          'Tracking works',
          'Visualization works'
        ]
      },
      {
        id: 'kai-agent',
        title: 'Test Kai AI Agent Interaction',
        objective: 'Verify Kai AI agent functionality for idea brainstorming',
        steps: [
          'Find Kai AI Agent interface',
          'Start a conversation with Kai',
          'Ask Kai to brainstorm an idea',
          'Ask Kai to structure an idea',
          'Ask Kai to create a plan',
          'Verify Kai responses',
          'Test Kai suggestions',
          'Check Kai status indicator',
          'Test Kai memory/context'
        ],
        expectedResults: [
          'Kai Agent interface displays',
          'Conversation starts',
          'Brainstorming works',
          'Structuring works',
          'Plan creation works',
          'Responses are relevant',
          'Suggestions are helpful',
          'Status indicator works',
          'Memory/context works'
        ],
        verification: [
          'Interface visible',
          'Conversation works',
          'Brainstorming works',
          'Structuring works',
          'Plan creation works',
          'Responses relevant',
          'Suggestions helpful',
          'Status works',
          'Memory works'
        ]
      }
    ]
  },
  {
    id: 'workflows',
    title: 'Workflows Tab',
    description: 'Test all 5 workflows (Project, Build, Deploy, Monitor, Monetize) and workflow execution.',
    steps: [
      {
        id: 'project-workflow',
        title: 'Test Project Workflow',
        objective: 'Verify project creation and management workflow',
        steps: [
          'Navigate to Workflows tab (Alt+7)',
          'Select Project Workflow',
          'Observe workflow steps',
          'Test creating a new project',
          'Test project configuration',
          'Test project template selection',
          'Test workflow execution',
          'Verify workflow status',
          'Check workflow completion'
        ],
        expectedResults: [
          'Project Workflow displays correctly',
          'Workflow steps are clear',
          'Project creation works',
          'Configuration works',
          'Template selection works',
          'Execution works',
          'Status updates correctly',
          'Completion is tracked'
        ],
        verification: [
          'Workflow visible',
          'Steps clear',
          'Creation works',
          'Configuration works',
          'Templates work',
          'Execution works',
          'Status updates',
          'Completion tracked'
        ]
      },
      {
        id: 'build-workflow',
        title: 'Test Build Workflow',
        objective: 'Verify build process workflow',
        steps: [
          'Select Build Workflow',
          'Observe build steps',
          'Test selecting a project to build',
          'Test build configuration',
          'Test build execution',
          'Monitor build progress',
          'Verify build output',
          'Check build errors',
          'Test build logs'
        ],
        expectedResults: [
          'Build Workflow displays correctly',
          'Build steps are clear',
          'Project selection works',
          'Configuration works',
          'Execution works',
          'Progress updates',
          'Output displays',
          'Errors are handled',
          'Logs are available'
        ],
        verification: [
          'Workflow visible',
          'Steps clear',
          'Selection works',
          'Configuration works',
          'Execution works',
          'Progress updates',
          'Output displays',
          'Errors handled',
          'Logs available'
        ]
      },
      {
        id: 'deploy-workflow',
        title: 'Test Deploy Workflow',
        objective: 'Verify deployment process workflow',
        steps: [
          'Select Deploy Workflow',
          'Observe deployment steps',
          'Test selecting deployment target',
          'Test deployment configuration',
          'Test deployment execution',
          'Monitor deployment progress',
          'Verify deployment status',
          'Check deployment logs',
          'Test rollback (if available)'
        ],
        expectedResults: [
          'Deploy Workflow displays correctly',
          'Deployment steps are clear',
          'Target selection works',
          'Configuration works',
          'Execution works',
          'Progress updates',
          'Status displays',
          'Logs are available',
          'Rollback works'
        ],
        verification: [
          'Workflow visible',
          'Steps clear',
          'Selection works',
          'Configuration works',
          'Execution works',
          'Progress updates',
          'Status displays',
          'Logs available',
          'Rollback works'
        ]
      },
      {
        id: 'monitor-workflow',
        title: 'Test Monitor Workflow',
        objective: 'Verify monitoring and health check workflow',
        steps: [
          'Select Monitor Workflow',
          'Observe monitoring steps',
          'Test setting up monitoring',
          'Test health check configuration',
          'Test alert configuration',
          'Verify monitoring execution',
          'Check monitoring status',
          'Review monitoring metrics',
          'Test alert notifications'
        ],
        expectedResults: [
          'Monitor Workflow displays correctly',
          'Monitoring steps are clear',
          'Setup works',
          'Health check config works',
          'Alert config works',
          'Execution works',
          'Status displays',
          'Metrics are available',
          'Alerts work'
        ],
        verification: [
          'Workflow visible',
          'Steps clear',
          'Setup works',
          'Health config works',
          'Alert config works',
          'Execution works',
          'Status displays',
          'Metrics available',
          'Alerts work'
        ]
      },
      {
        id: 'monetize-workflow',
        title: 'Test Monetize Workflow',
        objective: 'Verify monetization and revenue tracking workflow',
        steps: [
          'Select Monetize Workflow',
          'Observe monetization steps',
          'Test revenue stream configuration',
          'Test pricing strategy setup',
          'Test subscription management',
          'Verify monetization execution',
          'Check revenue tracking',
          'Review analytics',
          'Test revenue reports'
        ],
        expectedResults: [
          'Monetize Workflow displays correctly',
          'Monetization steps are clear',
          'Revenue stream config works',
          'Pricing strategy works',
          'Subscription management works',
          'Execution works',
          'Revenue tracking works',
          'Analytics work',
          'Reports work'
        ],
        verification: [
          'Workflow visible',
          'Steps clear',
          'Revenue config works',
          'Pricing works',
          'Subscriptions work',
          'Execution works',
          'Tracking works',
          'Analytics work',
          'Reports work'
        ]
      },
      {
        id: 'workflow-execution',
        title: 'Test Workflow Execution and Status',
        objective: 'Verify workflow runner and status tracking',
        steps: [
          'Find Workflow Runner',
          'Test executing a workflow',
          'Monitor workflow execution',
          'Check workflow status updates',
          'Test pausing a workflow',
          'Test resuming a workflow',
          'Test canceling a workflow',
          'Review workflow history',
          'Check workflow logs'
        ],
        expectedResults: [
          'Workflow Runner displays correctly',
          'Execution works',
          'Status updates in real-time',
          'Pausing works',
          'Resuming works',
          'Canceling works',
          'History is available',
          'Logs are accessible'
        ],
        verification: [
          'Runner visible',
          'Execution works',
          'Status updates',
          'Pausing works',
          'Resuming works',
          'Canceling works',
          'History available',
          'Logs accessible'
        ]
      }
    ]
  },
  {
    id: 'quick-labs',
    title: 'Quick Labs Tab',
    description: 'Test quick lab tools including Code Review, Agent Forge, Creator, and Mind Map.',
    steps: [
      {
        id: 'code-review',
        title: 'Test Code Review Tool',
        objective: 'Verify code review and analysis functionality',
        steps: [
          'Navigate to Quick Labs tab (Alt+8)',
          'Select Code Review',
          'Test selecting files to review',
          'Run code review',
          'Review code issues found',
          'Check issue categories (performance, security, style, bug, complexity)',
          'Test issue filtering',
          'Review suggested fixes',
          'Test applying fixes'
        ],
        expectedResults: [
          'Code Review tool displays correctly',
          'File selection works',
          'Review execution works',
          'Issues are identified',
          'Categories are accurate',
          'Filtering works',
          'Fixes are suggested',
          'Applying fixes works'
        ],
        verification: [
          'Tool visible',
          'Selection works',
          'Execution works',
          'Issues found',
          'Categories accurate',
          'Filtering works',
          'Fixes suggested',
          'Applying works'
        ]
      },
      {
        id: 'agent-forge',
        title: 'Test Agent Forge',
        objective: 'Verify AI agent creation and management',
        steps: [
          'Select Agent Forge',
          'Observe agent list',
          'Test creating a new agent',
          'Test agent configuration',
          'Test agent capabilities',
          'Test agent execution',
          'Review agent logs',
          'Test editing an agent',
          'Test deleting an agent'
        ],
        expectedResults: [
          'Agent Forge displays correctly',
          'Agent list displays',
          'Agent creation works',
          'Configuration works',
          'Capabilities work',
          'Execution works',
          'Logs are available',
          'Editing works',
          'Deletion works'
        ],
        verification: [
          'Agent Forge visible',
          'List displayed',
          'Creation works',
          'Configuration works',
          'Capabilities work',
          'Execution works',
          'Logs available',
          'Editing works',
          'Deletion works'
        ]
      },
      {
        id: 'creator',
        title: 'Test Creator Tool',
        objective: 'Verify content creation functionality',
        steps: [
          'Select Creator',
          'Observe creator interface',
          'Test creating content',
          'Test content templates',
          'Test content editing',
          'Test content preview',
          'Test content export',
          'Test content saving'
        ],
        expectedResults: [
          'Creator tool displays correctly',
          'Interface is functional',
          'Content creation works',
          'Templates work',
          'Editing works',
          'Preview works',
          'Export works',
          'Saving works'
        ],
        verification: [
          'Tool visible',
          'Interface functional',
          'Creation works',
          'Templates work',
          'Editing works',
          'Preview works',
          'Export works',
          'Saving works'
        ]
      },
      {
        id: 'mind-map',
        title: 'Test Mind Map Tool',
        objective: 'Verify mind mapping and visualization functionality',
        steps: [
          'Select Mind Map',
          'Observe mind map interface',
          'Test creating a new node',
          'Test connecting nodes',
          'Test editing node content',
          'Test deleting nodes',
          'Test zooming in/out',
          'Test panning',
          'Test exporting mind map',
          'Test saving mind map'
        ],
        expectedResults: [
          'Mind Map tool displays correctly',
          'Interface is functional',
          'Node creation works',
          'Node connections work',
          'Node editing works',
          'Node deletion works',
          'Zooming works',
          'Panning works',
          'Export works',
          'Saving works'
        ],
        verification: [
          'Tool visible',
          'Interface functional',
          'Node creation works',
          'Connections work',
          'Editing works',
          'Deletion works',
          'Zooming works',
          'Panning works',
          'Export works',
          'Saving works'
        ]
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings Tab',
    description: 'Test all settings categories and API key management.',
    steps: [
      {
        id: 'general-settings',
        title: 'Test General Settings',
        objective: 'Verify general application settings',
        steps: [
          'Navigate to Settings tab (Alt+9)',
          'Select General Settings',
          'Observe available settings',
          'Test changing settings',
          'Verify settings persist',
          'Test resetting settings',
          'Check settings validation'
        ],
        expectedResults: [
          'General Settings displays correctly',
          'Settings are accessible',
          'Changes work',
          'Settings persist',
          'Reset works',
          'Validation works'
        ],
        verification: [
          'Settings visible',
          'Settings accessible',
          'Changes work',
          'Persistence works',
          'Reset works',
          'Validation works'
        ]
      },
      {
        id: 'api-settings',
        title: 'Test API Settings',
        objective: 'Verify API key management',
        steps: [
          'Select API Settings',
          'Observe API key list',
          'Test adding an API key',
          'Test editing an API key',
          'Test deleting an API key',
          'Test API key validation',
          'Check API key encryption',
          'Test API key health check',
          'Verify provider status'
        ],
        expectedResults: [
          'API Settings displays correctly',
          'API key list displays',
          'Adding works',
          'Editing works',
          'Deletion works',
          'Validation works',
          'Encryption works',
          'Health check works',
          'Provider status displays'
        ],
        verification: [
          'Settings visible',
          'Key list displayed',
          'Adding works',
          'Editing works',
          'Deletion works',
          'Validation works',
          'Encryption works',
          'Health check works',
          'Status displays'
        ]
      },
      {
        id: 'appearance-settings',
        title: 'Test Appearance Settings',
        objective: 'Verify UI customization options',
        steps: [
          'Select Appearance Settings',
          'Observe appearance options',
          'Test theme selection',
          'Test color customization',
          'Test font size adjustment',
          'Test layout options',
          'Verify changes apply immediately',
          'Test resetting appearance'
        ],
        expectedResults: [
          'Appearance Settings displays correctly',
          'Options are available',
          'Theme selection works',
          'Color customization works',
          'Font size works',
          'Layout options work',
          'Changes apply immediately',
          'Reset works'
        ],
        verification: [
          'Settings visible',
          'Options available',
          'Theme works',
          'Colors work',
          'Font size works',
          'Layout works',
          'Changes apply',
          'Reset works'
        ]
      },
      {
        id: 'advanced-settings',
        title: 'Test Advanced Settings',
        objective: 'Verify advanced configuration options',
        steps: [
          'Select Advanced Settings',
          'Observe advanced options',
          'Test developer mode toggle',
          'Test debug logging',
          'Test performance settings',
          'Test cache management',
          'Test data management',
          'Verify advanced settings persist'
        ],
        expectedResults: [
          'Advanced Settings displays correctly',
          'Options are available',
          'Developer mode works',
          'Debug logging works',
          'Performance settings work',
          'Cache management works',
          'Data management works',
          'Settings persist'
        ],
        verification: [
          'Settings visible',
          'Options available',
          'Developer mode works',
          'Debug logging works',
          'Performance works',
          'Cache works',
          'Data management works',
          'Persistence works'
        ]
      },
      {
        id: 'testing-settings',
        title: 'Test Testing Settings',
        objective: 'Verify testing tutorial access',
        steps: [
          'Select Testing Settings',
          'Observe Testing Tutorial',
          'Verify tutorial is accessible',
          'Test tutorial navigation',
          'Test tutorial completion tracking',
          'Verify tutorial progress saves'
        ],
        expectedResults: [
          'Testing Settings displays correctly',
          'Tutorial is accessible',
          'Navigation works',
          'Completion tracking works',
          'Progress saves'
        ],
        verification: [
          'Settings visible',
          'Tutorial accessible',
          'Navigation works',
          'Tracking works',
          'Progress saves'
        ]
      }
    ]
  },
  {
    id: 'system-features',
    title: 'System Features',
    description: 'Test system-wide features including Update Check (406 fix verification), Version Display, Error Console, Activity Feed, and Notification Center.',
    steps: [
      {
        id: 'update-check-406',
        title: 'Verify Update Check 406 Error Suppression',
        objective: 'Verify that GitHub API 406 errors are suppressed silently',
        steps: [
          'Navigate to Settings tab',
          'Find "Check for Updates" button or menu item',
          'Click "Check for Updates"',
          'Observe update check process',
          'Verify NO error dialog appears for 406 errors',
          'Check that 406 errors are logged but not displayed to user',
          'Verify legitimate update errors still display',
          'Check update check status message',
          'Verify version information displays correctly'
        ],
        expectedResults: [
          'Update check executes',
          '406 errors are suppressed silently',
          'No error dialogs for 406 errors',
          'Legitimate errors still display',
          'Status message displays',
          'Version information is accurate'
        ],
        verification: [
          'Update check works',
          '406 errors suppressed',
          'No dialogs for 406',
          'Legitimate errors display',
          'Status message shows',
          'Version accurate'
        ]
      },
      {
        id: 'version-display',
        title: 'Test Version Display',
        objective: 'Verify version information display',
        steps: [
          'Find Version Display (usually in Settings or About)',
          'Observe current version number',
          'Verify version format (e.g., 1.0.1)',
          'Check build information (if available)',
          'Verify version updates correctly after updates'
        ],
        expectedResults: [
          'Version Display shows current version',
          'Version format is correct',
          'Build information displays',
          'Version updates correctly'
        ],
        verification: [
          'Version displayed',
          'Format correct',
          'Build info shows',
          'Updates correctly'
        ]
      },
      {
        id: 'error-console',
        title: 'Test Error Console',
        objective: 'Verify error logging and display',
        steps: [
          'Find Error Console',
          'Observe error list',
          'Check error details (message, stack trace, timestamp)',
          'Test filtering errors by severity',
          'Test filtering errors by category',
          'Test searching errors',
          'Test clearing errors',
          'Test exporting error log',
          'Verify error capture works'
        ],
        expectedResults: [
          'Error Console displays correctly',
          'Error list is visible',
          'Error details are accurate',
          'Severity filtering works',
          'Category filtering works',
          'Search works',
          'Clearing works',
          'Export works',
          'Error capture works'
        ],
        verification: [
          'Console visible',
          'Errors listed',
          'Details accurate',
          'Severity filter works',
          'Category filter works',
          'Search works',
          'Clearing works',
          'Export works',
          'Capture works'
        ]
      },
      {
        id: 'activity-feed',
        title: 'Test Activity Feed',
        objective: 'Verify activity logging and display',
        steps: [
          'Find Activity Feed (usually in right sidebar)',
          'Observe activity list',
          'Check activity details (type, action, timestamp)',
          'Test filtering activities',
          'Test searching activities',
          'Verify activities update in real-time',
          'Test activity icons',
          'Check activity grouping'
        ],
        expectedResults: [
          'Activity Feed displays correctly',
          'Activity list is visible',
          'Activity details are accurate',
          'Filtering works',
          'Search works',
          'Real-time updates work',
          'Icons display correctly',
          'Grouping works'
        ],
        verification: [
          'Feed visible',
          'Activities listed',
          'Details accurate',
          'Filtering works',
          'Search works',
          'Updates work',
          'Icons display',
          'Grouping works'
        ]
      },
      {
        id: 'notification-center',
        title: 'Test Notification Center',
        objective: 'Verify notification system',
        steps: [
          'Find Notification Center',
          'Observe notification list',
          'Check notification types (info, success, warning, error)',
          'Test marking notifications as read',
          'Test dismissing notifications',
          'Test clearing all notifications',
          'Verify notification icons',
          'Check notification timestamps',
          'Test notification actions'
        ],
        expectedResults: [
          'Notification Center displays correctly',
          'Notifications list is visible',
          'Notification types are correct',
          'Marking as read works',
          'Dismissing works',
          'Clearing works',
          'Icons display correctly',
          'Timestamps are accurate',
          'Actions work'
        ],
        verification: [
          'Center visible',
          'Notifications listed',
          'Types correct',
          'Marking read works',
          'Dismissing works',
          'Clearing works',
          'Icons display',
          'Timestamps accurate',
          'Actions work'
        ]
      },
      {
        id: 'command-palette-integration',
        title: 'Test Command Palette Integration',
        objective: 'Verify Command Palette works across all tabs',
        steps: [
          'Open Command Palette (Ctrl+K) from any tab',
          'Test navigating to different tabs via Command Palette',
          'Test executing commands from Command Palette',
          'Verify Command Palette closes after command execution',
          'Test Command Palette keyboard shortcuts',
          'Verify Command Palette search works',
          'Test Command Palette from different contexts'
        ],
        expectedResults: [
          'Command Palette opens from any tab',
          'Tab navigation works',
          'Command execution works',
          'Palette closes after execution',
          'Keyboard shortcuts work',
          'Search works',
          'Works from all contexts'
        ],
        verification: [
          'Palette opens',
          'Navigation works',
          'Execution works',
          'Closes correctly',
          'Shortcuts work',
          'Search works',
          'All contexts work'
        ]
      }
    ]
  }
];

function TestingTutorial() {
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentStepIndex, setCurrentStepIndex] = useState<{ section: string; step: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const toggleStepCompletion = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  const startTutorial = () => {
    setIsPlaying(true);
    setExpandedSection('getting-started');
    setExpandedStep('launch');
    setCurrentStepIndex({ section: 'getting-started', step: 0 });
  };

  const resetTutorial = () => {
    setIsPlaying(false);
    setCompletedSteps(new Set());
    setCurrentStepIndex(null);
    setExpandedStep(null);
  };

  const totalSteps = useMemo(() => {
    return tutorialData.reduce((sum, section) => sum + section.steps.length, 0);
  }, []);

  const completedCount = completedSteps.size;
  const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  return (
    <div className="testing-tutorial">
      <div className="tutorial-header">
        <div className="header-content">
          <BookOpen size={24} className="header-icon" />
          <div>
            <h1>Manual Testing Tutorial</h1>
            <p className="tutorial-subtitle">Step-by-step guide to test all application features</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="progress-indicator">
            <span className="progress-text">{completedCount} / {totalSteps} completed</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          {!isPlaying ? (
            <button className="tutorial-btn primary" onClick={startTutorial}>
              <Play size={16} />
              Start Tutorial
            </button>
          ) : (
            <button className="tutorial-btn secondary" onClick={resetTutorial}>
              <RotateCcw size={16} />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="tutorial-content">
        {tutorialData.map((section) => (
          <div key={section.id} className="tutorial-section">
            <div
              className="section-header"
              onClick={() => toggleSection(section.id)}
            >
              <div className="section-title-group">
                {expandedSection === section.id ? (
                  <ChevronDown size={20} className="chevron" />
                ) : (
                  <ChevronRight size={20} className="chevron" />
                )}
                <h2>{section.title}</h2>
                <span className="section-badge">
                  {section.steps.length} {section.steps.length === 1 ? 'step' : 'steps'}
                </span>
              </div>
            </div>

            {expandedSection === section.id && (
              <div className="section-content">
                <p className="section-description">{section.description}</p>

                {section.steps.map((step, index) => {
                  const stepId = `${section.id}-${step.id}`;
                  const isCompleted = completedSteps.has(stepId);
                  const isExpanded = expandedStep === stepId;
                  const isCurrent = currentStepIndex?.section === section.id && currentStepIndex?.step === index;

                  return (
                    <div
                      key={step.id}
                      className={`tutorial-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      <div className="step-header" onClick={() => toggleStep(stepId)}>
                        <div className="step-title-group">
                          <div className="step-checkbox" onClick={(e) => {
                            e.stopPropagation();
                            toggleStepCompletion(stepId);
                          }}>
                            {isCompleted ? (
                              <CheckCircle2 size={20} className="check-icon" />
                            ) : (
                              <Circle size={20} className="circle-icon" />
                            )}
                          </div>
                          <div className="step-title-content">
                            <h3>{step.title}</h3>
                            <p className="step-objective">{step.objective}</p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown size={18} className="chevron" />
                        ) : (
                          <ChevronRight size={18} className="chevron" />
                        )}
                      </div>

                      {isExpanded && (
                        <div className="step-content">
                          {step.prerequisites && step.prerequisites.length > 0 && (
                            <div className="step-section">
                              <h4>Prerequisites</h4>
                              <ul>
                                {step.prerequisites.map((prereq, i) => (
                                  <li key={i}>{prereq}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="step-section">
                            <h4>Step-by-Step Instructions</h4>
                            <ol className="instructions-list">
                              {step.steps.map((instruction, i) => (
                                <li key={i}>{instruction}</li>
                              ))}
                            </ol>
                          </div>

                          <div className="step-section">
                            <h4>Expected Results</h4>
                            <ul className="results-list">
                              {step.expectedResults.map((result, i) => (
                                <li key={i}>{result}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="step-section">
                            <h4>Verification</h4>
                            <div className="verification-checklist">
                              {step.verification.map((item, i) => {
                                const checkId = `${stepId}-check-${i}`;
                                const isChecked = completedSteps.has(checkId);
                                return (
                                  <label key={i} className="verification-item">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        const newCompleted = new Set(completedSteps);
                                        if (isChecked) {
                                          newCompleted.delete(checkId);
                                        } else {
                                          newCompleted.add(checkId);
                                        }
                                        setCompletedSteps(newCompleted);
                                      }}
                                    />
                                    <span>{item}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="tutorial-footer">
        <p className="footer-note">
          💡 <strong>Tip:</strong> Follow the tutorials in order and check off each step as you complete it. 
          Document any issues you find for reporting.
        </p>
      </div>
    </div>
  );
}

export default TestingTutorial;

