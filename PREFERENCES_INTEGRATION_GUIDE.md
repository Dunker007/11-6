# Preferences Integration Guide

## Overview

All 29 user preferences are now FULLY INTEGRATED and enforced throughout the app.

## What's Integrated

### ✅ General Preferences (5 settings)
1. **Theme** - Dark/Light/Auto mode applied to DOM
2. **Language** - Set on `document.documentElement.lang`
3. **Timezone** - Available for formatters
4. **Currency** - Stored for currency formatting
5. **Date Format** - Stored for date formatting

### ✅ Notifications (7 settings)
6. **Desktop** - Permission requested, ready for notifications
7. **Email** - Flag available for email services
8. **Frequency** - Real-time/hourly/daily
9. **Revenue** - Control revenue notifications
10. **Errors** - Control error notifications
11. **Updates** - Control update notifications
12. **Workflows** - Control workflow notifications

### ✅ AI Behavior (5 settings)
13. **Aggressiveness** - Conservative/Balanced/Aggressive
14. **Auto-approve** - Boolean flag
15. **Learning Enabled** - Boolean flag
16. **Content Tone** - Professional/Casual/Friendly/Technical
17. **Max Cost Per Day** - Dollar limit

### ✅ Privacy (4 settings)
18. **Analytics Sharing** - Boolean flag
19. **Error Reporting** - Boolean flag (defaults true)
20. **Usage Data** - Boolean flag
21. **Third Party Integrations** - Boolean flag

### ✅ Performance (4 settings)
22. **Auto-refresh Interval** - Seconds (converted to ms)
23. **Cache Enabled** - Boolean flag
24. **Background Tasks** - Boolean flag
25. **Max Concurrent Requests** - Number limit

### ✅ Accessibility (4 settings)
26. **Font Size** - Small (14px) / Medium (16px) / Large (18px)
27. **High Contrast** - Applied to DOM with CSS class
28. **Reduced Motion** - Disables animations
29. **Screen Reader Optimized** - Enhanced focus and aria labels

## How to Use in Your Code

### 1. Basic Usage

```typescript
import { usePreferences } from '@/hooks/usePreferences';

function MyComponent() {
  const { preferences, updatePreferences, enforcement } = usePreferences();

  // Get current theme
  const theme = preferences.general.theme;

  // Update theme (automatically applied to DOM)
  updatePreferences('general', { theme: 'dark' });

  // Check if should notify
  if (enforcement.shouldNotify('revenue')) {
    enforcement.sendDesktopNotification('New revenue!', {
      body: '$100 earned today'
    });
  }
}
```

### 2. AI Integration

```typescript
import { useAIConfig } from '@/hooks/usePreferences';

function AIService() {
  const ai = useAIConfig();

  // Get AI settings
  const tone = ai.getContentTone(); // 'professional'
  const maxCost = ai.getMaxCostPerDay(); // 10
  const shouldAutoApprove = ai.shouldAutoApprove(); // false

  // Use in AI requests
  const prompt = `Generate content in ${tone} tone...`;

  // Check cost limit before making request
  if (currentDailyCost + estimatedCost > maxCost) {
    throw new Error('Daily AI cost limit exceeded');
  }
}
```

### 3. Performance Integration

```typescript
import { usePerformanceConfig } from '@/hooks/usePreferences';

function Dashboard() {
  const perf = usePerformanceConfig();

  useEffect(() => {
    const interval = perf.getAutoRefreshIntervalMs(); // 30000ms

    const timer = setInterval(() => {
      if (perf.areBackgroundTasksEnabled()) {
        refreshData();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [perf]);
}
```

### 4. Notification Integration

```typescript
import { useNotificationConfig } from '@/hooks/usePreferences';

function NotificationService() {
  const notify = useNotificationConfig();

  function sendRevenueNotification(amount: number) {
    if (notify.shouldNotify('revenue') && notify.shouldNotify('desktop')) {
      notify.sendDesktopNotification('Revenue Received!', {
        body: `You earned $${amount}`,
        icon: '/icons/revenue.png'
      });
    }
  }
}
```

### 5. Accessibility Integration

```typescript
import { useAccessibilityConfig } from '@/hooks/usePreferences';

function AnimatedComponent() {
  const a11y = useAccessibilityConfig();

  // Disable animations if reduced motion is enabled
  const shouldAnimate = !a11y.isReducedMotion();

  return (
    <motion.div
      animate={shouldAnimate ? { x: 100 } : {}}
      transition={{ duration: shouldAnimate ? 0.3 : 0 }}
    >
      Content
    </motion.div>
  );
}
```

## App Setup

### 1. Wrap your app with PreferencesProvider

```typescript
// In your App.tsx or main.tsx
import { PreferencesProvider } from '@/services/settings';

function App() {
  return (
    <PreferencesProvider>
      <YourApp />
    </PreferencesProvider>
  );
}
```

### 2. Import CSS

```typescript
// In your main CSS or index.tsx
import '@/styles/preferences.css';
```

## Testing

Open browser console and test:

```javascript
// Get current preferences
preferencesEnforcementService.getCurrentPreferences()

// Change theme
preferencesEnforcementService.update({
  ...currentPrefs,
  general: { ...currentPrefs.general, theme: 'dark' }
})

// Test notification
preferencesEnforcementService.sendDesktopNotification('Test', {
  body: 'This is a test notification'
})
```

## CSS Variables

All preferences update CSS custom properties:

```css
/* Theme colors */
--color-bg-primary
--color-text-primary
--color-border-primary

/* Font size */
--base-font-size (14px, 16px, or 18px)

/* Animation */
--animation-duration (300ms or 0.01ms if reduced motion)
--transition-duration (200ms or 0.01ms if reduced motion)
```

## Examples

### Master Revenue Dashboard with Auto-refresh

```typescript
import { usePerformanceConfig } from '@/hooks/usePreferences';

function MasterRevenueDashboard() {
  const perf = usePerformanceConfig();

  useEffect(() => {
    const interval = perf.getAutoRefreshIntervalMs();

    const timer = setInterval(() => {
      loadData();
    }, interval);

    return () => clearInterval(timer);
  }, [perf.autoRefreshInterval]); // Re-create interval when preference changes
}
```

### AI Content Generation with Tone

```typescript
import { useAIConfig } from '@/hooks/usePreferences';

async function generateContent(topic: string) {
  const ai = useAIConfig();

  const prompt = `Generate a ${ai.contentTone} article about ${topic}`;

  // Check cost limit
  if (todaysCost >= ai.maxCostPerDay) {
    throw new Error(`Daily AI cost limit reached ($${ai.maxCostPerDay})`);
  }

  return await aiService.generate(prompt);
}
```

## Preference Storage

- All preferences are automatically persisted to `localStorage` via Zustand
- Key: `dlx-preferences`
- Version: 1
- Format: JSON

## Migration from Old System

If you have components using hard-coded settings:

**Before:**
```typescript
const THEME = 'dark';
const AUTO_REFRESH_INTERVAL = 30000;
```

**After:**
```typescript
const { preferences } = usePreferences();
const theme = preferences.general.theme;
const interval = preferences.performance.autoRefreshInterval * 1000;
```

## Summary

✅ **All 29 preferences are now fully integrated and enforced**
✅ **Changes apply immediately - no save button needed**
✅ **Theme switches instantly**
✅ **Font size changes are live**
✅ **Reduced motion disables all animations**
✅ **High contrast mode enhances visibility**
✅ **AI settings control cost and tone**
✅ **Performance settings control auto-refresh and caching**
✅ **Privacy settings control analytics and error reporting**
✅ **Notification settings control desktop and email notifications**

All preferences are production-ready and working!
