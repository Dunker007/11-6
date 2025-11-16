# Manual Testing Tutorial Guide

**Version:** 1.0.1  
**Last Updated:** 2025-01-09  
**Purpose:** Comprehensive step-by-step manual testing guide for DLX Studios Ultimate

---

## Table of Contents

1. [Setup & Prerequisites](#setup--prerequisites)
2. [Getting Started Tutorial](#getting-started-tutorial)
3. [LLM Optimization Tab Tutorial](#llm-optimization-tab-tutorial)
4. [IdeaLab Tutorial](#idealab-tutorial)
5. [CryptoLab Tutorial](#cryptolab-tutorial)
6. [WealthLab Tutorial](#wealthlab-tutorial)
7. [Vibed Ed Tutorial](#vibed-ed-tutorial)
8. [Workflows Tutorial](#workflows-tutorial)
9. [Command Hub Tutorial](#command-hub-tutorial)
10. [Error Scenarios Tutorial](#error-scenarios-tutorial)
11. [Performance Tutorial](#performance-tutorial)
12. [Accessibility Testing](#accessibility-testing)

---

## Setup & Prerequisites

### Before You Begin

**Required:**
- [ ] Windows 10/11 (or macOS/Linux for cross-platform testing)
- [ ] DLX Studios Ultimate installed (from `release\DLX Studios Ultimate-1.0.0-x64.exe`)
- [ ] Internet connection (for cloud LLM features)
- [ ] Optional: LM Studio or Ollama running locally (for local LLM testing)

**Recommended:**
- [ ] Screen recording software (to capture issues)
- [ ] Notepad open (to note any bugs or observations)
- [ ] Browser DevTools knowledge (F12 to inspect console)

**Testing Environment:**
- **App Location:** `release\win-unpacked\DLX Studios Ultimate.exe` (for unpacked testing)
- **Or:** Use installer: `release\DLX Studios Ultimate-1.0.0-x64.exe`

---

## Getting Started Tutorial

### Objective
Verify the application launches correctly and understand the basic UI layout.

### Prerequisites
- Application installed or unpacked
- No previous session running

### Step-by-Step Instructions

#### Step 1: Launch the Application
1. **Double-click** `DLX Studios Ultimate.exe` (or use Start Menu shortcut if installed)
2. **Wait** for the application window to appear
3. **Observe** the window title bar (should show "DLX Studios Ultimate")

**Expected Result:**
- Window opens within 3-5 seconds
- Window is properly sized (not minimized)
- Title bar shows application name

**Verification:**
- [ ] Window appears
- [ ] Title bar visible
- [ ] No error dialogs

#### Step 2: Observe Initial UI Layout
1. **Look at** the top of the window - you should see:
   - Navigation bar with tabs
   - Window controls (minimize, maximize, close) on the right
   - Itor toolbar (if visible) on the right side of nav bar

2. **Look at** the main content area:
   - Center panel (main content)
   - Right sidebar (Command Hub) - should be visible or collapsed

**Expected Result:**
- Navigation bar is centered horizontally
- Tabs are visible: "LLM Optimization", "Revenue & Monetization", "Vibed Ed", etc.
- Command Hub is visible on the right (or collapsed as icon-only)

**Verification:**
- [ ] Navigation bar centered
- [ ] All main tabs visible
- [ ] Command Hub visible (expanded or collapsed)
- [ ] No layout glitches

#### Step 3: Test Window Controls
1. **Click** the minimize button (top-right, first button)
   - Window should minimize to taskbar
2. **Click** the application icon in taskbar to restore
3. **Click** the maximize button (top-right, second button)
   - Window should fill the screen
4. **Click** maximize again to restore windowed mode
5. **Hover** over the title bar (but don't click close yet)
   - Should be draggable (you can move window by dragging)

**Expected Result:**
- Minimize works
- Maximize/restore works
- Window is draggable
- Close button visible (don't click yet)

**Verification:**
- [ ] Minimize works
- [ ] Maximize/restore works
- [ ] Window dragging works
- [ ] All controls responsive

#### Step 4: Navigate Between Tabs
1. **Click** on "LLM Optimization" tab (should already be active)
2. **Click** on "Revenue & Monetization" tab
   - Center content should change
   - Tab should highlight/activate
3. **Click** on "Vibed Ed" tab
   - Content should switch smoothly
4. **Click** on "Crypto Lab" tab
5. **Click** on "Wealth Lab" tab
6. **Click** on "Idea Lab" tab
7. **Click** back to "LLM Optimization"

**Expected Result:**
- Each tab click switches content smoothly
- Active tab is visually highlighted
- No loading delays > 1 second
- Content loads correctly for each tab

**Verification:**
- [ ] All tabs clickable
- [ ] Smooth transitions between tabs
- [ ] Active tab clearly indicated
- [ ] Content loads for each tab

---

## LLM Optimization Tab Tutorial

### Objective
Test all features in the LLM Optimization tab including connection status, model catalog, hardware profiling, and system health.

### Prerequisites
- Application launched
- On "LLM Optimization" tab

### Step-by-Step Instructions

#### Step 1: Examine Connection Status Bar
1. **Look at** the top of the center panel
2. **Find** the "Connection Status" heading (centered, above a horizontal bar)
3. **Observe** the Connection Status Bar:
   - Should show "X/Y Active" (e.g., "2/5 Active")
   - Should display provider icons (Ollama, LM Studio, OpenRouter)
   - Should have a refresh button on the right

**Expected Result:**
- Connection Status heading is centered
- Status bar shows active/total provider count
- Provider icons visible
- Refresh button visible

**Verification:**
- [ ] Connection Status heading visible and centered
- [ ] Status summary shows (e.g., "2/5 Active")
- [ ] Provider icons displayed
- [ ] Refresh button visible

#### Step 2: Test Connection Status Refresh
1. **Click** the refresh button (Activity icon) on the Connection Status Bar
2. **Observe** the button - it should show a spinning animation while checking
3. **Wait** 2-3 seconds for refresh to complete
4. **Check** if provider statuses updated

**Expected Result:**
- Refresh button shows loading state
- Status updates after refresh
- No errors in console (F12 to check)

**Verification:**
- [ ] Refresh button responds to click
- [ ] Loading animation visible
- [ ] Status updates after refresh
- [ ] No console errors

#### Step 3: Explore Model Catalog (Left Sidebar)
1. **Look at** the left sidebar
2. **Find** the "Model Catalog" heading (left-aligned)
3. **Observe** the catalog:
   - Should show a list of available models
   - Each model should show name, provider, size
   - Should be scrollable if many models

**Expected Result:**
- Model Catalog visible in left sidebar
- Models listed with details
- Scrollable if content exceeds height

**Verification:**
- [ ] Model Catalog visible
- [ ] Models displayed
- [ ] Scrollable (if needed)
- [ ] No layout issues

#### Step 4: Test Model Catalog Search (if available)
1. **Look for** a search input in the Model Catalog
2. **If present**, click in the search box
3. **Type** a model name (e.g., "gpt" or "llama")
4. **Observe** if results filter in real-time
5. **Clear** the search and verify all models return

**Expected Result:**
- Search filters models as you type
- Results update smoothly
- Clearing search shows all models

**Verification:**
- [ ] Search input functional
- [ ] Filtering works
- [ ] Results update smoothly
- [ ] Clear search works

#### Step 5: Examine Hardware Profiler
1. **Scroll down** in the center panel (if needed)
2. **Find** the "Hardware Profiler" card/section
3. **Observe** the displayed information:
   - CPU information
   - Memory/RAM details
   - GPU information (if available)
   - System specifications

**Expected Result:**
- Hardware information displayed
- Values are readable and formatted
- No placeholder text or errors

**Verification:**
- [ ] Hardware Profiler visible
- [ ] CPU info displayed
- [ ] Memory info displayed
- [ ] Information is accurate

#### Step 6: Examine System Health
1. **Scroll down** further (if needed)
2. **Find** the "System Health" section
3. **Observe** health metrics:
   - System status indicators
   - Performance metrics
   - Resource usage

**Expected Result:**
- System Health section visible
- Metrics displayed clearly
- Status indicators show current state

**Verification:**
- [ ] System Health visible
- [ ] Metrics displayed
- [ ] Status indicators working
- [ ] Values update if real-time

#### Step 7: Test Quick Actions (Right Sidebar)
1. **Look at** the right sidebar (Command Hub area)
2. **Find** the "Quick Actions" section
3. **Observe** available quick actions:
   - Should show action buttons or cards
   - Each action should have a label/icon

**Expected Result:**
- Quick Actions section visible
- Actions are clearly labeled
- Buttons are clickable

**Verification:**
- [ ] Quick Actions visible
- [ ] Actions labeled clearly
- [ ] Buttons appear clickable
- [ ] Layout is clean

#### Step 8: Test Quick Action Buttons
1. **Click** on a Quick Action button (choose any available)
2. **Observe** what happens:
   - Does it open a dialog?
   - Does it navigate somewhere?
   - Does it perform an action?
3. **If a dialog opens**, test closing it
4. **Try** another Quick Action button

**Expected Result:**
- Actions respond to clicks
- Appropriate UI feedback (hover effects, etc.)
- Actions perform expected functions

**Verification:**
- [ ] Actions respond to clicks
- [ ] Hover effects work
- [ ] Actions perform correctly
- [ ] No errors occur

---

## IdeaLab Tutorial

### Objective
Test the IdeaLab feature including idea creation, planning canvas, and Kai AI agent interaction.

### Prerequisites
- Application launched
- Navigate to "Idea Lab" tab

### Step-by-Step Instructions

#### Step 1: Navigate to Idea Lab
1. **Click** on the "Idea Lab" tab in the navigation bar
2. **Wait** for the tab to load (may show loading spinner)
3. **Observe** the Idea Lab interface when loaded

**Expected Result:**
- Tab switches to Idea Lab
- Loading indicator appears (if needed)
- Interface loads within 2-3 seconds
- Three-panel layout visible (if applicable)

**Verification:**
- [ ] Tab switches successfully
- [ ] Loading state visible (if applicable)
- [ ] Interface loads completely
- [ ] No errors

#### Step 2: Explore Idea Inventory Panel
1. **Look at** the left panel (Idea Inventory)
2. **Observe** the idea list:
   - Should show existing ideas (if any)
   - Or show empty state if no ideas
3. **Look for** a "Create Idea" or "+" button
4. **Check** if ideas are organized by topics/categories

**Expected Result:**
- Idea Inventory panel visible
- Ideas listed (or empty state shown)
- Create button visible
- Organization clear

**Verification:**
- [ ] Panel visible
- [ ] Ideas displayed (or empty state)
- [ ] Create button present
- [ ] Layout correct

#### Step 3: Create a New Idea
1. **Click** the "Create Idea" or "+" button
2. **If a dialog/form opens:**
   - Enter a title (e.g., "Build a mobile app")
   - Enter a description (e.g., "Create a fitness tracking mobile application")
   - Select a topic/category (if available)
   - Click "Save" or "Create"
3. **Observe** if the idea appears in the list

**Expected Result:**
- Create dialog/form opens
- Form fields are functional
- Idea saves successfully
- Idea appears in list after creation

**Verification:**
- [ ] Create dialog opens
- [ ] Form fields work
- [ ] Save works
- [ ] Idea appears in list

#### Step 4: Select an Idea
1. **Click** on an idea in the Idea Inventory list
2. **Observe** what happens:
   - Does it highlight/select?
   - Does content appear in center panel?
   - Does planning canvas update?

**Expected Result:**
- Idea becomes selected (highlighted)
- Center panel shows idea details
- Planning canvas updates (if applicable)

**Verification:**
- [ ] Idea selects on click
- [ ] Selection visually indicated
- [ ] Center panel updates
- [ ] Canvas updates

#### Step 5: Explore Planning Canvas
1. **Look at** the center panel (Planning Canvas)
2. **Observe** the canvas interface:
   - Should show idea details
   - May show planning tools/features
   - May have editing capabilities
3. **Try** interacting with canvas elements (if interactive)

**Expected Result:**
- Planning Canvas visible
- Idea details displayed
- Interactive elements work
- Layout is clear

**Verification:**
- [ ] Canvas visible
- [ ] Details displayed
- [ ] Interactions work
- [ ] Layout correct

#### Step 6: Test Kai AI Agent Interaction
1. **Look for** Kai AI agent interface (may be in right panel or integrated)
2. **Find** the chat/input area for Kai
3. **Type** a message (e.g., "Help me plan this idea")
4. **Press** Enter or click Send
5. **Wait** for response (if LLM available)
6. **Observe** the response

**Expected Result:**
- Kai interface visible
- Input field functional
- Message sends
- Response appears (or error if no LLM)

**Verification:**
- [ ] Kai interface visible
- [ ] Input works
- [ ] Message sends
- [ ] Response or error message appears

#### Step 7: Edit an Idea
1. **Right-click** on an idea in the list (or find edit button)
2. **If context menu appears**, click "Edit"
3. **Or** click an edit icon/button on the idea
4. **Modify** the idea title or description
5. **Save** changes
6. **Verify** changes appear in the list

**Expected Result:**
- Edit option available
- Edit form/dialog opens
- Changes save successfully
- Updated idea appears in list

**Verification:**
- [ ] Edit option works
- [ ] Edit form opens
- [ ] Changes save
- [ ] Updates visible

#### Step 8: Delete an Idea (Optional)
1. **Right-click** on an idea (or find delete button)
2. **Click** "Delete" or trash icon
3. **Confirm** deletion if prompted
4. **Verify** idea is removed from list

**Expected Result:**
- Delete option available
- Confirmation prompt appears (if implemented)
- Idea is removed after confirmation
- List updates correctly

**Verification:**
- [ ] Delete option works
- [ ] Confirmation appears (if implemented)
- [ ] Deletion works
- [ ] List updates

---

## CryptoLab Tutorial

### Objective
Test the CryptoLab trading interface including market data, paper trading, and order placement.

### Prerequisites
- Application launched
- Navigate to "Crypto Lab" tab
- Optional: Coinbase API credentials (for live trading)

### Step-by-Step Instructions

#### Step 1: Navigate to Crypto Lab
1. **Click** on the "Crypto Lab" tab
2. **Wait** for the interface to load
3. **Observe** the Crypto Lab layout

**Expected Result:**
- Tab switches to Crypto Lab
- Interface loads completely
- Trading interface visible

**Verification:**
- [ ] Tab switches
- [ ] Interface loads
- [ ] Layout visible
- [ ] No errors

#### Step 2: View Market Data
1. **Look at** the market data section (usually top or sidebar)
2. **Observe** displayed information:
   - Current prices
   - Price changes (24h)
   - Trading pairs
   - Market charts (if available)
3. **Check** if data updates in real-time
4. **Try** selecting different trading pairs

**Expected Result:**
- Market data displayed
- Prices shown
- Updates visible (if real-time)
- Pair selection works

**Verification:**
- [ ] Market data visible
- [ ] Prices displayed
- [ ] Updates work (if applicable)
- [ ] Pair selection works

#### Step 3: Check Trading Mode
1. **Look for** a "Paper Trading" or "Live Trading" toggle/indicator
2. **Verify** current mode (should default to Paper Trading)
3. **Observe** if mode indicator is clear and visible

**Expected Result:**
- Trading mode indicator visible
- Mode clearly indicated
- Paper Trading default (safe for testing)

**Verification:**
- [ ] Mode indicator visible
- [ ] Mode clearly shown
- [ ] Paper Trading default

#### Step 4: Explore Trading Panel
1. **Find** the trading panel (order placement area)
2. **Observe** available options:
   - Buy/Sell buttons
   - Order type selection (Market, Limit, etc.)
   - Amount input fields
   - Price input (for limit orders)
3. **Check** if inputs are functional

**Expected Result:**
- Trading panel visible
- Order options available
- Input fields functional
- Buttons clickable

**Verification:**
- [ ] Trading panel visible
- [ ] Options available
- [ ] Inputs work
- [ ] Buttons clickable

#### Step 5: Place a Paper Trade (Buy Order)
1. **Click** on "Buy" button/tab
2. **Select** "Market" order type (if available)
3. **Enter** an amount (e.g., "100" or "0.001" depending on currency)
4. **Select** a trading pair (e.g., BTC-USD)
5. **Click** "Place Order" or "Buy" button
6. **Observe** confirmation or order placement

**Expected Result:**
- Order form fills correctly
- Order places successfully (paper trade)
- Confirmation appears
- Order appears in orders list

**Verification:**
- [ ] Form works
- [ ] Order places
- [ ] Confirmation appears
- [ ] Order in list

#### Step 6: View Open Orders
1. **Find** the "Open Orders" panel/section
2. **Look for** your placed order
3. **Observe** order details:
   - Order type
   - Amount
   - Price
   - Status
   - Timestamp

**Expected Result:**
- Open Orders section visible
- Order appears in list
- Details displayed correctly
- Status accurate

**Verification:**
- [ ] Orders section visible
- [ ] Order in list
- [ ] Details correct
- [ ] Status accurate

#### Step 7: View Portfolio/Positions
1. **Find** the Portfolio or Positions panel
2. **Observe** displayed information:
   - Current holdings
   - Portfolio value
   - P&L (Profit & Loss)
   - Asset allocation
3. **Check** if portfolio updates after trades

**Expected Result:**
- Portfolio section visible
- Holdings displayed
- Values shown
- Updates after trades

**Verification:**
- [ ] Portfolio visible
- [ ] Holdings shown
- [ ] Values displayed
- [ ] Updates work

#### Step 8: Cancel an Order (if applicable)
1. **Find** your open order in the orders list
2. **Look for** a "Cancel" button or action
3. **Click** Cancel
4. **Confirm** cancellation if prompted
5. **Verify** order is removed from open orders

**Expected Result:**
- Cancel option available
- Cancellation works
- Order removed from list
- Status updates

**Verification:**
- [ ] Cancel option works
- [ ] Cancellation succeeds
- [ ] Order removed
- [ ] Status updates

---

## WealthLab Tutorial

### Objective
Test WealthLab features including account connections, net worth tracking, budgeting, and retirement planning.

### Prerequisites
- Application launched
- Navigate to "Wealth Lab" tab

### Step-by-Step Instructions

#### Step 1: Navigate to Wealth Lab
1. **Click** on the "Wealth Lab" tab
2. **Wait** for interface to load
3. **Observe** the Wealth Lab layout

**Expected Result:**
- Tab switches successfully
- Interface loads
- Financial dashboard visible

**Verification:**
- [ ] Tab switches
- [ ] Interface loads
- [ ] Dashboard visible
- [ ] No errors

#### Step 2: View Net Worth Dashboard
1. **Look at** the Net Worth section (usually prominent)
2. **Observe** displayed metrics:
   - Total net worth
   - Assets total
   - Liabilities total
   - Net worth trend (if chart available)
3. **Check** if values are formatted correctly (currency symbols, commas)

**Expected Result:**
- Net Worth section visible
- Metrics displayed
- Formatting correct
- Values readable

**Verification:**
- [ ] Net Worth visible
- [ ] Metrics shown
- [ ] Formatting correct
- [ ] Values readable

#### Step 3: Explore Account Connections
1. **Find** the Account Connections section
2. **Look for** "Add Account" or "Connect Account" button
3. **Observe** existing connections (if any)
4. **Check** connection status indicators

**Expected Result:**
- Account section visible
- Add button present
- Connections listed (or empty state)
- Status indicators visible

**Verification:**
- [ ] Account section visible
- [ ] Add button present
- [ ] Connections shown
- [ ] Status indicators work

#### Step 4: Add a Manual Account (Test)
1. **Click** "Add Account" or "Connect Account"
2. **If dialog opens**, look for "Manual Entry" or "Add Manually" option
3. **Click** manual entry option
4. **Fill in** account details:
   - Account name (e.g., "Checking Account")
   - Account type (e.g., "Bank", "Investment")
   - Balance (e.g., "5000")
5. **Click** "Save" or "Add"
6. **Verify** account appears in list

**Expected Result:**
- Add dialog opens
- Manual entry option available
- Form saves successfully
- Account appears in list

**Verification:**
- [ ] Dialog opens
- [ ] Manual entry works
- [ ] Form saves
- [ ] Account in list

#### Step 5: View Budget Dashboard
1. **Find** the Budget section
2. **Observe** budget information:
   - Monthly budget
   - Spending vs budget
   - Categories breakdown
   - Progress indicators
3. **Check** if budget data is displayed

**Expected Result:**
- Budget section visible
- Budget information displayed
- Categories shown
- Progress indicators visible

**Verification:**
- [ ] Budget section visible
- [ ] Information displayed
- [ ] Categories shown
- [ ] Indicators visible

#### Step 6: Create a Budget
1. **Look for** "Create Budget" or "Edit Budget" button
2. **Click** the button
3. **If budget editor opens:**
   - Set monthly income (e.g., "5000")
   - Add expense categories:
     - Housing: "1500"
     - Food: "500"
     - Transportation: "300"
     - etc.
   - Click "Save"
4. **Verify** budget appears in dashboard

**Expected Result:**
- Budget editor opens
- Form fields work
- Budget saves successfully
- Budget appears in dashboard

**Verification:**
- [ ] Editor opens
- [ ] Form works
- [ ] Budget saves
- [ ] Dashboard updates

#### Step 7: Explore Retirement Calculator
1. **Find** the Retirement Calculator section
2. **Observe** calculator interface:
   - Input fields (age, retirement age, savings, etc.)
   - Calculation results
   - Projections/charts
3. **Try** adjusting input values
4. **Observe** if results update

**Expected Result:**
- Calculator visible
- Inputs functional
- Results displayed
- Updates on input change

**Verification:**
- [ ] Calculator visible
- [ ] Inputs work
- [ ] Results shown
- [ ] Updates work

#### Step 8: Test Retirement Planning
1. **Enter** current age (e.g., "30")
2. **Enter** retirement age (e.g., "65")
3. **Enter** current savings (e.g., "50000")
4. **Enter** monthly contribution (e.g., "500")
5. **Enter** expected return rate (e.g., "7")
6. **Click** "Calculate" or observe auto-calculation
7. **Review** projected retirement savings

**Expected Result:**
- Inputs accept values
- Calculation performs
- Results displayed
- Projections shown

**Verification:**
- [ ] Inputs work
- [ ] Calculation works
- [ ] Results displayed
- [ ] Projections accurate

---

## Vibed Ed Tutorial

### Objective
Test the Vibed Ed IDE including project creation, file operations, code editing, and AI Assistant integration.

### Prerequisites
- Application launched
- Navigate to "Vibed Ed" tab

### Step-by-Step Instructions

#### Step 1: Navigate to Vibed Ed
1. **Click** on the "Vibed Ed" tab
2. **Wait** for the IDE interface to load
3. **Observe** the IDE layout

**Expected Result:**
- Tab switches to Vibed Ed
- IDE interface loads
- Editor visible

**Verification:**
- [ ] Tab switches
- [ ] IDE loads
- [ ] Editor visible
- [ ] No errors

#### Step 2: Create a New Project
1. **Look for** "New Project" button or welcome screen
2. **Click** "New Project"
3. **If dialog opens:**
   - Enter project name (e.g., "test-project")
   - Select project type (if available)
   - Choose location (if applicable)
   - Click "Create"
4. **Wait** for project to initialize
5. **Verify** project appears in file explorer

**Expected Result:**
- New Project option available
- Dialog/form opens
- Project creates successfully
- Project appears in explorer

**Verification:**
- [ ] New Project works
- [ ] Dialog opens
- [ ] Project creates
- [ ] Explorer updates

#### Step 3: Explore File Explorer
1. **Look at** the left sidebar (File Explorer)
2. **Observe** project structure:
   - Files and folders
   - Expand/collapse icons
   - File icons
3. **Try** expanding a folder (click the arrow/icon)
4. **Try** collapsing it again

**Expected Result:**
- File Explorer visible
- Project structure shown
- Expand/collapse works
- Files visible

**Verification:**
- [ ] Explorer visible
- [ ] Structure shown
- [ ] Expand/collapse works
- [ ] Files visible

#### Step 4: Create a New File
1. **Right-click** in the File Explorer (on a folder or root)
2. **Look for** "New File" in context menu
3. **Click** "New File"
4. **Enter** filename (e.g., "app.ts")
5. **Press** Enter or click Create
6. **Verify** file appears in explorer and editor opens

**Expected Result:**
- Context menu appears
- New File option available
- File creates successfully
- Editor opens with new file

**Verification:**
- [ ] Context menu works
- [ ] New File works
- [ ] File creates
- [ ] Editor opens

#### Step 5: Edit Code in Monaco Editor
1. **Click** in the editor area
2. **Type** some code (e.g., `function hello() { console.log("Hello"); }`)
3. **Observe** syntax highlighting:
   - Keywords highlighted
   - Strings colored
   - Functions colored
4. **Try** auto-completion:
   - Type `console.` and see if suggestions appear
   - Press Tab or Enter to accept suggestion
5. **Check** if code is formatted correctly

**Expected Result:**
- Editor accepts input
- Syntax highlighting works
- Auto-completion works
- Code formatted correctly

**Verification:**
- [ ] Editor works
- [ ] Highlighting works
- [ ] Auto-completion works
- [ ] Formatting correct

#### Step 6: Save File
1. **Make** a change to the code
2. **Press** Ctrl+S (or Cmd+S on Mac)
3. **Or** look for Save button/icon
4. **Observe** if save indicator appears
5. **Check** if file persists after closing/reopening

**Expected Result:**
- Save shortcut works
- Save button works (if present)
- Save indicator appears
- File persists

**Verification:**
- [ ] Save shortcut works
- [ ] Save works
- [ ] Indicator appears
- [ ] File persists

#### Step 7: Open AI Assistant
1. **Look for** AI Assistant panel/toggle (may be in sidebar or bottom)
2. **Click** to open AI Assistant
3. **Observe** the AI Assistant interface:
   - Chat area
   - Input field
   - Send button
   - Quick action buttons (if available)

**Expected Result:**
- AI Assistant opens
- Interface visible
- Input field functional
- Quick actions available (if implemented)

**Verification:**
- [ ] Assistant opens
- [ ] Interface visible
- [ ] Input works
- [ ] Actions available

#### Step 8: Use AI Assistant
1. **Click** in the AI Assistant input field
2. **Type** a question (e.g., "Explain this code" or "Refactor this function")
3. **If** a file is open, the AI should have context
4. **Press** Enter or click Send
5. **Wait** for response (if LLM available)
6. **Observe** the response:
   - Should appear in chat
   - May show streaming (if implemented)
   - Should be formatted nicely

**Expected Result:**
- Input works
- Message sends
- Response appears (or error if no LLM)
- Response formatted well

**Verification:**
- [ ] Input works
- [ ] Message sends
- [ ] Response appears
- [ ] Formatting good

#### Step 9: Test Quick Actions (if available)
1. **Look for** quick action buttons (e.g., "Explain", "Refactor", "Fix")
2. **Click** on "Explain" (or similar)
3. **Observe** if it populates the input with a prompt
4. **Send** the message
5. **Try** another quick action

**Expected Result:**
- Quick actions visible
- Actions populate input
- Prompts are relevant
- Actions work correctly

**Verification:**
- [ ] Actions visible
- [ ] Input populates
- [ ] Prompts relevant
- [ ] Actions work

---

## Workflows Tutorial

### Objective
Test all workflow features including Project, Build, Deploy, Monitor, and Monetize workflows.

### Prerequisites
- Application launched
- Navigate to "Workflows" tab

### Step-by-Step Instructions

#### Step 1: Navigate to Workflows
1. **Click** on the "Workflows" tab
2. **Wait** for workflows interface to load
3. **Observe** the workflows layout

**Expected Result:**
- Tab switches to Workflows
- Interface loads
- Workflow types visible

**Verification:**
- [ ] Tab switches
- [ ] Interface loads
- [ ] Workflows visible
- [ ] No errors

#### Step 2: Explore Workflow Types
1. **Look at** the workflow type buttons/sidebar
2. **Observe** available workflows:
   - Project
   - Build
   - Deploy
   - Monitor
   - Monetize
3. **Click** on "Project" workflow
4. **Observe** the workflow interface

**Expected Result:**
- Workflow types listed
- Selection works
- Workflow interface loads
- Content relevant to workflow type

**Verification:**
- [ ] Types listed
- [ ] Selection works
- [ ] Interface loads
- [ ] Content relevant

#### Step 3: Test Project Workflow
1. **Ensure** "Project" workflow is selected
2. **Observe** project workflow features:
   - Project creation options
   - Template selection (if available)
   - Configuration options
3. **Try** creating a project through workflow
4. **Follow** any prompts or steps
5. **Verify** project is created

**Expected Result:**
- Project workflow visible
- Options available
- Creation works
- Project created successfully

**Verification:**
- [ ] Workflow visible
- [ ] Options available
- [ ] Creation works
- [ ] Project created

#### Step 4: Test Build Workflow
1. **Click** on "Build" workflow type
2. **Observe** build workflow interface:
   - Build configuration
   - Build commands
   - Build options
3. **If** a project is selected, check if build settings auto-populate
4. **Try** running a build (if applicable)
5. **Observe** build output/results

**Expected Result:**
- Build workflow visible
- Configuration options available
- Build runs (if implemented)
- Output displayed

**Verification:**
- [ ] Workflow visible
- [ ] Options available
- [ ] Build runs
- [ ] Output shown

#### Step 5: Test Deploy Workflow
1. **Click** on "Deploy" workflow type
2. **Observe** deploy workflow interface:
   - Deployment targets
   - Deployment configuration
   - Deployment options
3. **Explore** deployment settings (don't actually deploy unless testing)
4. **Check** if configuration saves

**Expected Result:**
- Deploy workflow visible
- Configuration options available
- Settings save
- Interface functional

**Verification:**
- [ ] Workflow visible
- [ ] Options available
- [ ] Settings save
- [ ] Interface works

#### Step 6: Test Monitor Workflow
1. **Click** on "Monitor" workflow type
2. **Observe** monitoring interface:
   - Monitoring dashboards
   - Metrics display
   - Alert configuration
3. **Check** if metrics update (if real-time)
4. **Explore** monitoring options

**Expected Result:**
- Monitor workflow visible
- Dashboards displayed
- Metrics shown
- Options available

**Verification:**
- [ ] Workflow visible
- [ ] Dashboards shown
- [ ] Metrics displayed
- [ ] Options available

#### Step 7: Test Monetize Workflow
1. **Click** on "Monetize" workflow type
2. **Observe** monetization interface:
   - Revenue tracking
   - Monetization strategies
   - Pricing configuration
3. **Explore** monetization options
4. **Check** if data persists

**Expected Result:**
- Monetize workflow visible
- Options available
- Data persists
- Interface functional

**Verification:**
- [ ] Workflow visible
- [ ] Options available
- [ ] Data persists
- [ ] Interface works

#### Step 8: Test Workflow Execution (if available)
1. **Select** a workflow
2. **Configure** workflow settings
3. **Look for** "Run" or "Execute" button
4. **Click** to execute workflow
5. **Observe** execution progress/results

**Expected Result:**
- Execution option available
- Workflow runs
- Progress shown
- Results displayed

**Verification:**
- [ ] Execution works
- [ ] Progress shown
- [ ] Results displayed
- [ ] No errors

---

## Command Hub Tutorial

### Objective
Test the Command Hub sidebar including collapse/expand functionality, metric cards, and quick actions.

### Prerequisites
- Application launched
- Command Hub visible (right sidebar)

### Step-by-Step Instructions

#### Step 1: Observe Command Hub State
1. **Look at** the right sidebar
2. **Determine** if Command Hub is:
   - Expanded (showing full content)
   - Collapsed (showing icons only)
3. **Observe** the current state

**Expected Result:**
- Command Hub visible
- State is clear (expanded or collapsed)
- Content or icons visible

**Verification:**
- [ ] Command Hub visible
- [ ] State clear
- [ ] Content visible

#### Step 2: Test Collapse/Expand Toggle
1. **Look for** a collapse/expand button (usually at top of Command Hub)
2. **Click** the toggle button
3. **Observe** the animation:
   - Should smoothly transition
   - Width should change
   - Content should hide/show appropriately
4. **Click** again to toggle back
5. **Verify** smooth transition both ways

**Expected Result:**
- Toggle button visible
- Click works
- Animation smooth
- State changes correctly

**Verification:**
- [ ] Toggle visible
- [ ] Click works
- [ ] Animation smooth
- [ ] State changes

#### Step 3: Explore Metric Cards (Expanded State)
1. **Ensure** Command Hub is expanded
2. **Look at** metric cards displayed
3. **Observe** card information:
   - Metric name/label
   - Metric value
   - Icon/visual indicator
   - Trend indicators (if available)
4. **Count** how many metric cards are visible

**Expected Result:**
- Metric cards visible
- Information displayed clearly
- Icons present
- Values readable

**Verification:**
- [ ] Cards visible
- [ ] Info clear
- [ ] Icons present
- [ ] Values readable

#### Step 4: Test Metric Card Interactions
1. **Hover** over a metric card
2. **Observe** hover effects:
   - Border highlight
   - Background change
   - Cursor change
3. **Click** on a metric card (if clickable)
4. **Observe** what happens:
   - Does it navigate?
   - Does it open a detail view?
   - Does it perform an action?

**Expected Result:**
- Hover effects work
- Cards are clickable (if designed to be)
- Actions perform correctly
- Visual feedback clear

**Verification:**
- [ ] Hover works
- [ ] Click works (if applicable)
- [ ] Actions perform
- [ ] Feedback clear

#### Step 5: Test Collapsed State
1. **Collapse** the Command Hub (click toggle)
2. **Observe** the collapsed state:
   - Should show icons only
   - Width should be minimal
   - Icons should be visible
3. **Hover** over an icon
4. **Check** if tooltip appears (if implemented)
5. **Click** on an icon
6. **Observe** if it expands or performs action

**Expected Result:**
- Collapsed state shows icons
- Width reduced
- Tooltips work (if implemented)
- Icon clicks work

**Verification:**
- [ ] Icons visible
- [ ] Width reduced
- [ ] Tooltips work
- [ ] Clicks work

#### Step 6: Test Quick Actions in Command Hub
1. **Expand** Command Hub (if collapsed)
2. **Find** Quick Actions section
3. **Observe** available quick actions
4. **Click** on a quick action button
5. **Observe** what happens:
   - Dialog opens?
   - Navigation occurs?
   - Action performs?
6. **Try** another quick action

**Expected Result:**
- Quick Actions visible
- Actions clickable
- Actions perform correctly
- Feedback provided

**Verification:**
- [ ] Actions visible
- [ ] Clicks work
- [ ] Actions perform
- [ ] Feedback provided

#### Step 7: Test Responsive Behavior
1. **Resize** the application window (make it narrower)
2. **Observe** Command Hub behavior:
   - Does it auto-collapse?
   - Does width adjust?
   - Does content adapt?
3. **Resize** back to full width
4. **Verify** Command Hub adapts

**Expected Result:**
- Responsive behavior works
- Auto-collapse works (if implemented)
- Width adjusts appropriately
- Content adapts

**Verification:**
- [ ] Responsive works
- [ ] Auto-collapse works
- [ ] Width adjusts
- [ ] Content adapts

---

## Error Scenarios Tutorial

### Objective
Test error handling, error boundaries, and recovery mechanisms throughout the application.

### Prerequisites
- Application launched
- Basic familiarity with app features

### Step-by-Step Instructions

#### Step 1: Test LLM Offline Scenario
1. **Ensure** no local LLMs are running (LM Studio, Ollama)
2. **Ensure** no cloud LLM API keys are configured
3. **Navigate** to LLM Optimization tab
4. **Observe** Connection Status Bar:
   - Should show "0/X Active"
   - Providers should show offline status
5. **Try** using AI Assistant
6. **Observe** error message or fallback behavior

**Expected Result:**
- Offline status displayed correctly
- Error messages are user-friendly
- Fallback behavior works
- No crashes occur

**Verification:**
- [ ] Status correct
- [ ] Messages friendly
- [ ] Fallback works
- [ ] No crashes

#### Step 2: Test Invalid Input Handling
1. **Navigate** to a form (e.g., Create Idea, Add Account)
2. **Try** submitting form with:
   - Empty required fields
   - Invalid characters
   - Extremely long text
   - Special characters
3. **Observe** validation messages
4. **Verify** form doesn't submit with invalid data

**Expected Result:**
- Validation messages appear
- Invalid input rejected
- Messages are clear
- Form doesn't submit

**Verification:**
- [ ] Validation works
- [ ] Invalid input rejected
- [ ] Messages clear
- [ ] Form protected

#### Step 3: Test Error Boundary Recovery
1. **Navigate** to different tabs
2. **Look for** error boundary components
3. **If** an error occurs (or simulate one):
   - Error message should appear
   - "Try Again" button should be available
   - Error details should be accessible
4. **Click** "Try Again"
5. **Verify** component recovers

**Expected Result:**
- Error boundaries catch errors
- Error UI displayed
- Recovery options available
- Recovery works

**Verification:**
- [ ] Boundaries work
- [ ] Error UI shown
- [ ] Recovery options available
- [ ] Recovery succeeds

#### Step 4: Test Network Error Handling
1. **Disconnect** internet (or block network in DevTools)
2. **Try** actions that require network:
   - Refresh LLM status
   - Load market data (CryptoLab)
   - Fetch account data (WealthLab)
3. **Observe** error handling:
   - Error messages appear
   - Retry options available
   - App remains functional
4. **Reconnect** internet
5. **Try** retry actions
6. **Verify** recovery works

**Expected Result:**
- Network errors handled gracefully
- Error messages clear
- Retry options work
- App remains stable

**Verification:**
- [ ] Errors handled
- [ ] Messages clear
- [ ] Retry works
- [ ] App stable

#### Step 5: Test File System Errors (Vibed Ed)
1. **Navigate** to Vibed Ed
2. **Try** creating a file with invalid name:
   - Reserved characters (e.g., `< > : " / \ | ? *`)
   - Very long name
   - Empty name
3. **Observe** error handling
4. **Try** saving to invalid location (if applicable)
5. **Verify** errors are caught

**Expected Result:**
- Invalid names rejected
- Error messages clear
- File operations protected
- No crashes

**Verification:**
- [ ] Invalid names rejected
- [ ] Messages clear
- [ ] Operations protected
- [ ] No crashes

#### Step 6: Test Component Loading Errors
1. **Navigate** between tabs rapidly
2. **Observe** if lazy-loaded components handle errors
3. **Check** loading states:
   - Loading spinners appear
   - Error states handled
   - Fallback content shown (if applicable)
4. **Verify** app doesn't freeze

**Expected Result:**
- Loading states visible
- Errors handled gracefully
- Fallbacks work
- App remains responsive

**Verification:**
- [ ] Loading states work
- [ ] Errors handled
- [ ] Fallbacks work
- [ ] App responsive

---

## Performance Tutorial

### Objective
Test application performance including launch time, responsiveness, and resource usage.

### Prerequisites
- Application not running
- System monitoring tools (Task Manager) ready
- Stopwatch/timer ready

### Step-by-Step Instructions

#### Step 1: Measure App Launch Time
1. **Close** application if running
2. **Open** Task Manager (Ctrl+Shift+Esc)
3. **Start** stopwatch/timer
4. **Double-click** application executable
5. **Stop** timer when main window is fully visible and interactive
6. **Record** launch time

**Expected Result:**
- Launch time < 5 seconds (target: < 3 seconds)
- Window appears promptly
- UI is interactive quickly

**Verification:**
- [ ] Launch time recorded
- [ ] Time < 5 seconds
- [ ] Window appears quickly
- [ ] UI interactive quickly

#### Step 2: Check Initial Memory Usage
1. **After** app launches, wait 10 seconds
2. **Open** Task Manager
3. **Find** "DLX Studios Ultimate" process
4. **Record** memory usage (RAM)
5. **Check** CPU usage (should be low after initial load)

**Expected Result:**
- Memory usage < 500MB (idle)
- CPU usage low (< 5% after load)
- No memory leaks visible

**Verification:**
- [ ] Memory usage recorded
- [ ] Memory < 500MB
- [ ] CPU usage low
- [ ] No leaks

#### Step 3: Test Tab Switching Performance
1. **Start** timer
2. **Click** on "LLM Optimization" tab
3. **Stop** timer when content fully loads
4. **Record** time
5. **Repeat** for other tabs:
   - Revenue & Monetization
   - Vibed Ed
   - Crypto Lab
   - Wealth Lab
   - Idea Lab
6. **Compare** load times

**Expected Result:**
- Tab switch < 1 second (most tabs)
- Lazy-loaded tabs < 2 seconds
- Smooth transitions
- No janky animations

**Verification:**
- [ ] Switch times recorded
- [ ] Times acceptable
- [ ] Transitions smooth
- [ ] No jank

#### Step 4: Test Component Loading Performance
1. **Navigate** to a tab with lazy-loaded components
2. **Open** DevTools (F12)
3. **Go to** Network tab
4. **Clear** network log
5. **Switch** to tab
6. **Observe** chunk loading:
   - Chunks load efficiently
   - No unnecessary requests
   - Loading is fast

**Expected Result:**
- Chunks load efficiently
- Code splitting works
- Loading is fast
- No redundant requests

**Verification:**
- [ ] Chunks load efficiently
- [ ] Code splitting works
- [ ] Loading fast
- [ ] No redundant requests

#### Step 5: Test Scrolling Performance
1. **Navigate** to a tab with scrollable content (e.g., Model Catalog)
2. **Scroll** rapidly up and down
3. **Observe** performance:
   - Smooth scrolling
   - No lag
   - Content renders correctly
4. **Try** scrolling in other areas

**Expected Result:**
- Scrolling smooth (60fps)
- No lag or stutter
- Content renders correctly
- Performance consistent

**Verification:**
- [ ] Scrolling smooth
- [ ] No lag
- [ ] Content correct
- [ ] Performance consistent

#### Step 6: Test Input Responsiveness
1. **Navigate** to Vibed Ed
2. **Create** or open a file
3. **Type** rapidly in the editor
4. **Observe** responsiveness:
   - Keystrokes register immediately
   - No input lag
   - Syntax highlighting keeps up
5. **Try** auto-completion while typing fast

**Expected Result:**
- Input lag < 16ms (60fps)
- Keystrokes register immediately
- Highlighting keeps up
- Auto-completion responsive

**Verification:**
- [ ] Input lag minimal
- [ ] Keystrokes immediate
- [ ] Highlighting keeps up
- [ ] Auto-completion responsive

#### Step 7: Monitor Memory Over Time
1. **Keep** app running for 10-15 minutes
2. **Use** different features:
   - Switch tabs
   - Create/edit files
   - Use AI Assistant
   - Navigate workflows
3. **Periodically** check Task Manager memory usage
4. **Observe** if memory increases significantly
5. **Check** for memory leaks

**Expected Result:**
- Memory stays relatively stable
- No significant leaks
- Garbage collection works
- Performance doesn't degrade

**Verification:**
- [ ] Memory stable
- [ ] No leaks
- [ ] GC works
- [ ] Performance stable

---

## Accessibility Testing

### Objective
Test keyboard navigation, screen reader compatibility, and accessibility features.

### Prerequisites
- Application launched
- Keyboard available
- Optional: Screen reader software

### Step-by-Step Instructions

#### Step 1: Test Tab Navigation
1. **Press** Tab key repeatedly
2. **Observe** focus movement:
   - Focus should move through interactive elements
   - Focus indicator should be visible
   - Focus order should be logical
3. **Press** Shift+Tab to go backwards
4. **Verify** reverse navigation works

**Expected Result:**
- Tab navigation works
- Focus visible
- Order logical
- Reverse navigation works

**Verification:**
- [ ] Tab navigation works
- [ ] Focus visible
- [ ] Order logical
- [ ] Reverse works

#### Step 2: Test Enter/Space Activation
1. **Navigate** to a button using Tab
2. **Press** Enter or Space
3. **Verify** button activates
4. **Try** with different interactive elements:
   - Buttons
   - Links
   - Checkboxes
   - Radio buttons

**Expected Result:**
- Enter activates buttons
- Space activates buttons
- Elements respond correctly
- No focus traps

**Verification:**
- [ ] Enter works
- [ ] Space works
- [ ] Elements respond
- [ ] No traps

#### Step 3: Test Keyboard Shortcuts
1. **Try** common shortcuts:
   - Ctrl+S (Save)
   - Ctrl+N (New - if available)
   - Ctrl+O (Open - if available)
   - Ctrl+W (Close tab - if available)
   - Ctrl+Tab (Switch tabs - if available)
2. **Verify** shortcuts work
3. **Check** if shortcuts are documented

**Expected Result:**
- Shortcuts work
- Common shortcuts supported
- Shortcuts documented (if applicable)
- No conflicts

**Verification:**
- [ ] Shortcuts work
- [ ] Common ones supported
- [ ] Documented
- [ ] No conflicts

#### Step 4: Test Focus Management
1. **Open** a dialog or modal
2. **Observe** focus behavior:
   - Focus should move to dialog
   - Focus should be trapped in dialog
   - Tab should cycle within dialog
3. **Close** dialog (Esc or Close button)
4. **Verify** focus returns to previous element

**Expected Result:**
- Focus moves to dialog
- Focus trapped in dialog
- Focus returns on close
- Esc closes dialog

**Verification:**
- [ ] Focus moves correctly
- [ ] Focus trapped
- [ ] Focus returns
- [ ] Esc works

#### Step 5: Test ARIA Labels (if screen reader available)
1. **Enable** screen reader (NVDA, JAWS, VoiceOver)
2. **Navigate** through interface
3. **Listen** to announced labels:
   - Buttons should have names
   - Forms should have labels
   - Landmarks should be identified
4. **Verify** interface is understandable via screen reader

**Expected Result:**
- Elements have labels
- Labels are descriptive
- Landmarks identified
- Interface understandable

**Verification:**
- [ ] Labels present
- [ ] Labels descriptive
- [ ] Landmarks identified
- [ ] Interface understandable

#### Step 6: Test Color Contrast
1. **Examine** text throughout the application
2. **Check** contrast ratios:
   - Normal text: 4.5:1 minimum
   - Large text: 3:1 minimum
3. **Verify** text is readable
4. **Check** if high contrast mode supported

**Expected Result:**
- Contrast meets WCAG AA
- Text readable
- High contrast supported (if applicable)
- Colors not sole indicator

**Verification:**
- [ ] Contrast adequate
- [ ] Text readable
- [ ] High contrast works
- [ ] Colors not sole indicator

#### Step 7: Test Form Accessibility
1. **Navigate** to a form (e.g., Create Idea, Add Account)
2. **Check** form labels:
   - Each input has a label
   - Labels are associated with inputs
   - Required fields indicated
3. **Test** with keyboard only:
   - Tab to inputs
   - Fill form
   - Submit form
4. **Verify** error messages are accessible

**Expected Result:**
- Labels present
- Labels associated
- Required indicated
- Errors accessible

**Verification:**
- [ ] Labels present
- [ ] Labels associated
- [ ] Required indicated
- [ ] Errors accessible

---

## Testing Checklist Summary

Use this checklist to track your testing progress:

### Getting Started
- [ ] App launches successfully
- [ ] UI layout correct
- [ ] Window controls work
- [ ] Tab navigation works

### LLM Optimization Tab
- [ ] Connection Status Bar works
- [ ] Model Catalog displays
- [ ] Hardware Profiler shows data
- [ ] System Health displays
- [ ] Quick Actions work

### IdeaLab
- [ ] Ideas can be created
- [ ] Planning canvas works
- [ ] Kai AI agent responds
- [ ] Ideas can be edited/deleted

### CryptoLab
- [ ] Market data displays
- [ ] Paper trading works
- [ ] Orders can be placed
- [ ] Portfolio displays

### WealthLab
- [ ] Net worth displays
- [ ] Accounts can be added
- [ ] Budget can be created
- [ ] Retirement calculator works

### Vibed Ed
- [ ] Projects can be created
- [ ] Files can be created/edited
- [ ] Code editor works
- [ ] AI Assistant works

### Workflows
- [ ] All workflow types accessible
- [ ] Workflows can be configured
- [ ] Workflow execution works (if implemented)

### Command Hub
- [ ] Collapse/expand works
- [ ] Metric cards display
- [ ] Quick actions work
- [ ] Responsive behavior works

### Error Scenarios
- [ ] Offline LLM handled
- [ ] Invalid input rejected
- [ ] Error boundaries work
- [ ] Network errors handled

### Performance
- [ ] Launch time acceptable
- [ ] Memory usage reasonable
- [ ] Tab switching fast
- [ ] Scrolling smooth
- [ ] Input responsive

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus management works
- [ ] Shortcuts work
- [ ] Contrast adequate
- [ ] Forms accessible

---

## Reporting Issues

When you find a bug or issue:

1. **Document** the issue:
   - What you were doing
   - What you expected
   - What actually happened
   - Steps to reproduce

2. **Include**:
   - Screenshots (if applicable)
   - Console errors (F12 → Console tab)
   - System information
   - App version

3. **Report** via:
   - GitHub Issues (if repository public)
   - Email/contact form (if available)
   - Internal bug tracker (if available)

---

## Tips for Effective Testing

1. **Test systematically**: Follow the tutorials in order
2. **Take notes**: Document observations and issues
3. **Test edge cases**: Try unusual inputs and scenarios
4. **Test on different systems**: If possible, test on different OS/hardware
5. **Test with real data**: Use realistic data when possible
6. **Test error scenarios**: Don't just test happy paths
7. **Verify fixes**: If reporting bugs, verify they're fixed in updates

---

**Happy Testing! 🧪**

*This guide is a living document. Update it as features change or new testing scenarios are discovered.*

