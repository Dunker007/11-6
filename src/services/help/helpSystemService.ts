/**
 * helpSystemService.ts
 *
 * PURPOSE:
 * Provides comprehensive in-app help system with searchable documentation,
 * contextual tooltips, video tutorials, and troubleshooting guides.
 *
 * FEATURES:
 * - Searchable help articles
 * - Categorized documentation
 * - Contextual tooltips
 * - Video tutorial links
 * - FAQ system
 * - Troubleshooting guides
 * - Keyboard shortcuts reference
 *
 * ARCHITECTURE:
 * Service with static help content and search functionality
 */

import { create } from 'zustand';

export interface HelpArticle {
  id: string;
  title: string;
  category: HelpCategory;
  content: string;
  tags: string[];
  videoUrl?: string;
  relatedArticles?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime?: number; // minutes
}

export type HelpCategory =
  | 'getting-started'
  | 'connecting-services'
  | 'content-creation'
  | 'revenue-tracking'
  | 'ai-features'
  | 'automation'
  | 'troubleshooting'
  | 'advanced';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: HelpCategory;
  tags: string[];
}

export interface KeyboardShortcut {
  keys: string;
  description: string;
  category: string;
}

interface HelpSystemState {
  // State
  isOpen: boolean;
  activeCategory: HelpCategory | null;
  activeArticle: HelpArticle | null;
  searchQuery: string;
  searchResults: HelpArticle[];
  favoriteArticles: string[];

  // Actions
  openHelp: (category?: HelpCategory, articleId?: string) => void;
  closeHelp: () => void;
  setActiveCategory: (category: HelpCategory | null) => void;
  setActiveArticle: (article: HelpArticle | null) => void;
  search: (query: string) => void;
  toggleFavorite: (articleId: string) => void;
  clearSearch: () => void;
}

export const useHelpSystemStore = create<HelpSystemState>((set, get) => ({
  // Initial state
  isOpen: false,
  activeCategory: null,
  activeArticle: null,
  searchQuery: '',
  searchResults: [],
  favoriteArticles: [],

  // Actions
  openHelp: (category?: HelpCategory, articleId?: string) => {
    const updates: Partial<HelpSystemState> = { isOpen: true };

    if (category) {
      updates.activeCategory = category;
    }

    if (articleId) {
      const article = helpSystemService.getArticleById(articleId);
      if (article) {
        updates.activeArticle = article;
      }
    }

    set(updates);
  },

  closeHelp: () => {
    set({ isOpen: false });
  },

  setActiveCategory: (category: HelpCategory | null) => {
    set({ activeCategory: category, activeArticle: null });
  },

  setActiveArticle: (article: HelpArticle | null) => {
    set({ activeArticle: article });
  },

  search: (query: string) => {
    set({ searchQuery: query });

    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    const results = helpSystemService.searchArticles(query);
    set({ searchResults: results });
  },

  toggleFavorite: (articleId: string) => {
    const state = get();
    const isFavorite = state.favoriteArticles.includes(articleId);

    set({
      favoriteArticles: isFavorite
        ? state.favoriteArticles.filter((id) => id !== articleId)
        : [...state.favoriteArticles, articleId],
    });
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: [] });
  },
}));

// Static help content
const HELP_ARTICLES: HelpArticle[] = [
  // Getting Started
  {
    id: 'getting-started-intro',
    title: '5-Minute Quick Start Guide',
    category: 'getting-started',
    content: `
# Welcome to DLX Studios!

This guide will get you up and running in 5 minutes.

## Step 1: Connect Your First Service
Navigate to the Credentials section and connect one service (Stripe, WordPress, etc.)

## Step 2: Generate Content
Try the AI Creator to generate your first blog post or social media content.

## Step 3: Track Revenue
If you connected Stripe, you'll see revenue data appear automatically.

## Step 4: Explore Automation
Check out the Workflows section to automate your content pipeline.

That's it! You're ready to start earning with DLX.
    `,
    tags: ['quickstart', 'beginner', 'setup'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    videoUrl: 'https://example.com/quickstart',
  },
  {
    id: 'getting-started-interface',
    title: 'Understanding the DLX Interface',
    category: 'getting-started',
    content: `
# DLX Interface Overview

## Main Dashboard
Your central hub showing revenue, AI status, and recent activity.

## Left Sidebar
Quick access to all major features:
- AI Intelligence
- Content Creator
- Revenue Tracking
- Workflows
- Settings

## Right Panel
Contextual information and quick actions based on your current view.

## Command Palette
Press Ctrl+K to open the command palette for quick navigation.
    `,
    tags: ['interface', 'navigation', 'basics'],
    difficulty: 'beginner',
    estimatedReadTime: 3,
  },

  // Connecting Services
  {
    id: 'connect-stripe',
    title: 'How to Connect Stripe',
    category: 'connecting-services',
    content: `
# Connecting Stripe for Revenue Tracking

## Step 1: Get Your Stripe API Key
1. Log in to your Stripe Dashboard
2. Go to Developers → API Keys
3. Copy your Secret Key (starts with sk_)

## Step 2: Add to DLX
1. Open Settings → Credentials
2. Find "Stripe" and click "Connect"
3. Paste your API key
4. Click "Save"

## Step 3: Verify Connection
You should see a green checkmark and your revenue data will start syncing.

⚠️ **Security Note**: Your API keys are encrypted and stored locally.
    `,
    tags: ['stripe', 'payment', 'revenue', 'api'],
    difficulty: 'beginner',
    estimatedReadTime: 3,
    relatedArticles: ['revenue-tracking-setup'],
  },
  {
    id: 'connect-wordpress',
    title: 'How to Connect WordPress',
    category: 'connecting-services',
    content: `
# Connecting WordPress for Auto-Publishing

## Prerequisites
You need the "Application Passwords" feature (WordPress 5.6+)

## Step 1: Generate Application Password
1. Go to your WordPress admin → Users → Profile
2. Scroll to "Application Passwords"
3. Enter a name (e.g., "DLX Studios")
4. Click "Add New Application Password"
5. Copy the generated password

## Step 2: Add to DLX
1. Open Settings → Credentials
2. Find "WordPress" and click "Connect"
3. Enter your WordPress URL (e.g., https://yourblog.com)
4. Enter your WordPress username
5. Paste the application password
6. Click "Save"

## Step 3: Test Connection
Try publishing a test post from the Content Creator!
    `,
    tags: ['wordpress', 'publishing', 'blog', 'cms'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
  },

  // Content Creation
  {
    id: 'content-generate-blog',
    title: 'Generating Blog Posts with AI',
    category: 'content-creation',
    content: `
# Creating Blog Posts with AI

## Quick Generation
1. Go to Content Creator
2. Select "Blog Post" template
3. Enter your topic
4. Choose tone and style
5. Click "Generate"

## Advanced Options
- **SEO Optimization**: Automatically includes keywords and meta descriptions
- **Brand Voice**: DLX learns your writing style over time
- **Image Suggestions**: Get AI-generated image prompts
- **Multi-language**: Generate in 50+ languages

## Best Practices
- Be specific with your topic
- Review and edit generated content
- Add personal anecdotes for authenticity
- Use SEO suggestions for better ranking
    `,
    tags: ['blog', 'content', 'ai', 'writing', 'seo'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
  },

  // Revenue Tracking
  {
    id: 'revenue-tracking-setup',
    title: 'Setting Up Revenue Tracking',
    category: 'revenue-tracking',
    content: `
# Revenue Tracking Setup

## Supported Revenue Sources
- **Stripe**: Payment processing
- **PayPal**: Online payments
- **Google AdSense**: Ad revenue
- **Amazon Associates**: Affiliate earnings
- **Gumroad**: Digital products
- **Manual Entry**: Custom sources

## How It Works
1. Connect your revenue sources in Credentials
2. DLX automatically syncs transactions
3. View real-time revenue in the Dashboard
4. Generate reports for taxes/accounting

## Revenue Dashboard Features
- Real-time earnings
- Revenue by source
- Monthly/yearly trends
- Export for accounting
    `,
    tags: ['revenue', 'tracking', 'money', 'earnings'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    relatedArticles: ['connect-stripe'],
  },

  // AI Features
  {
    id: 'ai-intelligence-dashboard',
    title: 'Understanding AI Intelligence Dashboard',
    category: 'ai-features',
    content: `
# AI Intelligence Dashboard

## What It Shows
The AI Intelligence Dashboard monitors all AI systems in DLX:

### Active Systems
- Content generation models
- Learning systems
- Prediction engines
- Optimization algorithms

### Performance Metrics
- Response times
- Success rates
- Cost tracking
- Quality scores

### Insights
- AI-generated recommendations
- Performance trends
- Cost optimization suggestions
- Learning progress

## How to Use It
Monitor your AI systems to ensure they're performing well and staying within budget.
    `,
    tags: ['ai', 'monitoring', 'dashboard', 'intelligence'],
    difficulty: 'intermediate',
    estimatedReadTime: 4,
  },

  // Automation
  {
    id: 'automation-first-workflow',
    title: 'Creating Your First Workflow',
    category: 'automation',
    content: `
# Your First Automation Workflow

## Simple Blog Post Workflow

### Step 1: Create Workflow
1. Go to Workflows → New Workflow
2. Name it "Daily Blog Post"

### Step 2: Add Trigger
- Trigger: Schedule (Daily at 9 AM)

### Step 3: Add Actions
1. Generate blog post with AI
2. Optimize for SEO
3. Publish to WordPress
4. Share to Twitter

### Step 4: Activate
Click "Activate" and your workflow runs automatically!

## Workflow Templates
Start with pre-built templates for common tasks.
    `,
    tags: ['automation', 'workflow', 'scheduling', 'auto-publish'],
    difficulty: 'intermediate',
    estimatedReadTime: 6,
  },

  // Troubleshooting
  {
    id: 'troubleshoot-connection-errors',
    title: 'Troubleshooting Connection Errors',
    category: 'troubleshooting',
    content: `
# Fixing Connection Errors

## Common Issues

### "Invalid API Key"
- Check that you copied the entire key
- Ensure you're using the correct key type (secret key, not publishable)
- Verify the key hasn't been revoked

### "Connection Timeout"
- Check your internet connection
- Verify the service isn't down
- Try again in a few minutes

### "Permission Denied"
- Ensure your API key has the necessary permissions
- Check your account status with the service

## Still Having Issues?
1. Check the service status page
2. Regenerate your API key
3. Contact support with error details
    `,
    tags: ['troubleshooting', 'errors', 'connection', 'api'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
  },
];

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-cost',
    question: 'How much does DLX cost?',
    answer: 'DLX Studios is free to use. You only pay for the AI services and third-party integrations you use (OpenAI, etc.).',
    category: 'getting-started',
    tags: ['pricing', 'cost', 'free'],
  },
  {
    id: 'faq-secure',
    question: 'Is my data secure?',
    answer: 'Yes! All credentials are encrypted with AES-256 and stored locally on your machine. We never send your API keys to external servers.',
    category: 'getting-started',
    tags: ['security', 'privacy', 'encryption'],
  },
  {
    id: 'faq-offline',
    question: 'Can I use DLX offline?',
    answer: 'Some features work offline, but content generation and revenue syncing require an internet connection.',
    category: 'getting-started',
    tags: ['offline', 'connectivity'],
  },
  {
    id: 'faq-revenue-sync',
    question: 'How often does revenue sync?',
    answer: 'Revenue data syncs in real-time for most services. You can also manually refresh at any time.',
    category: 'revenue-tracking',
    tags: ['revenue', 'syncing', 'real-time'],
  },
];

const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { keys: 'Ctrl+K', description: 'Open command palette', category: 'Navigation' },
  { keys: 'Ctrl+/', description: 'Toggle sidebar', category: 'Navigation' },
  { keys: 'Ctrl+Shift+I', description: 'Toggle insights stream', category: 'Navigation' },
  { keys: '?', description: 'Show keyboard shortcuts', category: 'Help' },
  { keys: 'Ctrl+N', description: 'New content', category: 'Content' },
  { keys: 'Ctrl+S', description: 'Save current work', category: 'General' },
  { keys: 'Ctrl+,', description: 'Open settings', category: 'General' },
  { keys: 'Esc', description: 'Close modal/panel', category: 'General' },
];

// Service methods
export const helpSystemService = {
  /**
   * Get all help articles
   */
  getAllArticles(): HelpArticle[] {
    return HELP_ARTICLES;
  },

  /**
   * Get articles by category
   */
  getArticlesByCategory(category: HelpCategory): HelpArticle[] {
    return HELP_ARTICLES.filter((article) => article.category === category);
  },

  /**
   * Get article by ID
   */
  getArticleById(id: string): HelpArticle | undefined {
    return HELP_ARTICLES.find((article) => article.id === id);
  },

  /**
   * Search articles
   */
  searchArticles(query: string): HelpArticle[] {
    const lowerQuery = query.toLowerCase();
    return HELP_ARTICLES.filter(
      (article) =>
        article.title.toLowerCase().includes(lowerQuery) ||
        article.content.toLowerCase().includes(lowerQuery) ||
        article.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    ).slice(0, 10); // Limit to 10 results
  },

  /**
   * Get FAQ items
   */
  getAllFAQs(): FAQItem[] {
    return FAQ_ITEMS;
  },

  /**
   * Get FAQs by category
   */
  getFAQsByCategory(category: HelpCategory): FAQItem[] {
    return FAQ_ITEMS.filter((faq) => faq.category === category);
  },

  /**
   * Search FAQs
   */
  searchFAQs(query: string): FAQItem[] {
    const lowerQuery = query.toLowerCase();
    return FAQ_ITEMS.filter(
      (faq) =>
        faq.question.toLowerCase().includes(lowerQuery) ||
        faq.answer.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Get keyboard shortcuts
   */
  getKeyboardShortcuts(): KeyboardShortcut[] {
    return KEYBOARD_SHORTCUTS;
  },

  /**
   * Get category name
   */
  getCategoryName(category: HelpCategory): string {
    const names: Record<HelpCategory, string> = {
      'getting-started': 'Getting Started',
      'connecting-services': 'Connecting Services',
      'content-creation': 'Content Creation',
      'revenue-tracking': 'Revenue Tracking',
      'ai-features': 'AI Features',
      automation: 'Automation',
      troubleshooting: 'Troubleshooting',
      advanced: 'Advanced Features',
    };
    return names[category];
  },

  /**
   * Get category icon
   */
  getCategoryIcon(category: HelpCategory): string {
    const icons: Record<HelpCategory, string> = {
      'getting-started': '🚀',
      'connecting-services': '🔌',
      'content-creation': '✍️',
      'revenue-tracking': '💰',
      'ai-features': '🤖',
      automation: '⚙️',
      troubleshooting: '🔧',
      advanced: '⚡',
    };
    return icons[category];
  },

  /**
   * Get related articles
   */
  getRelatedArticles(articleId: string): HelpArticle[] {
    const article = this.getArticleById(articleId);
    if (!article || !article.relatedArticles) return [];

    return article.relatedArticles
      .map((id) => this.getArticleById(id))
      .filter((a): a is HelpArticle => a !== undefined);
  },
};
