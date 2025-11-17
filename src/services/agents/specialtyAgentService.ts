/**
 * specialtyAgentService.ts
 * AI specialty agents for different platform areas.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  description: string;
  capabilities: string[];
  status: 'available' | 'busy' | 'offline';
  personality: string;
  expertise: string[];
}

export interface AgentMessage {
  id: string;
  agentId: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  actions?: AgentAction[];
  metadata?: Record<string, any>;
}

export interface AgentAction {
  id: string;
  label: string;
  description: string;
  action: string;
  params?: Record<string, any>;
  icon?: string;
}

export interface AgentConversation {
  agentId: string;
  messages: AgentMessage[];
  startedAt: Date;
  lastMessageAt: Date;
}

export interface AgentSuggestion {
  id: string;
  agentId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  action?: AgentAction;
  timestamp: Date;
}

class SpecialtyAgentService {
  private agents: Agent[] = [];
  private conversations = new Map<string, AgentConversation>();
  private suggestions: AgentSuggestion[] = [];

  initializeAgents(): void {
    this.agents = [
      {
        id: 'revenue-agent',
        name: 'Revenue Agent',
        role: 'Financial Specialist',
        avatar: '💰',
        description: 'I help you track, optimize, and grow your revenue streams. Ask me about payments, analytics, and earnings.',
        capabilities: [
          'Track revenue across all platforms',
          'Set up payment processors',
          'Generate financial reports',
          'Forecast future earnings',
          'Identify revenue opportunities',
          'Monitor subscription metrics',
        ],
        status: 'available',
        personality: 'Professional, analytical, focused on growth',
        expertise: ['Stripe', 'Gumroad', 'Revenue Analytics', 'Forecasting', 'Tax Reporting'],
      },
      {
        id: 'content-agent',
        name: 'Content Agent',
        role: 'Content Strategist',
        avatar: '✍️',
        description: 'I assist with content creation, optimization, and distribution. Let me help you create amazing content.',
        capabilities: [
          'Generate content ideas',
          'Write blog posts and articles',
          'Optimize for SEO',
          'Schedule content publishing',
          'Analyze content performance',
          'Repurpose content across formats',
        ],
        status: 'available',
        personality: 'Creative, enthusiastic, detail-oriented',
        expertise: ['Content Generation', 'SEO', 'Writing', 'Content Strategy', 'AI Writing'],
      },
      {
        id: 'seo-agent',
        name: 'SEO Agent',
        role: 'Search Optimization Expert',
        avatar: '🔍',
        description: 'I optimize your content for search engines. I track rankings, find keywords, and boost your visibility.',
        capabilities: [
          'Keyword research and tracking',
          'Backlink analysis',
          'SEO audits and recommendations',
          'Competitor analysis',
          'Rank tracking and reporting',
          'Technical SEO fixes',
        ],
        status: 'available',
        personality: 'Data-driven, methodical, results-focused',
        expertise: ['Keyword Research', 'Technical SEO', 'Analytics', 'Ranking', 'Backlinks'],
      },
      {
        id: 'publishing-agent',
        name: 'Publishing Agent',
        role: 'Distribution Specialist',
        avatar: '📤',
        description: 'I handle publishing your content to multiple platforms automatically. WordPress, Medium, and more.',
        capabilities: [
          'Publish to multiple platforms',
          'Schedule content releases',
          'Cross-post automation',
          'Platform-specific optimization',
          'Manage publishing workflows',
          'Track publication status',
        ],
        status: 'available',
        personality: 'Organized, reliable, efficient',
        expertise: ['WordPress', 'Medium', 'Dev.to', 'Automation', 'Multi-platform Publishing'],
      },
      {
        id: 'analytics-agent',
        name: 'Analytics Agent',
        role: 'Data Analyst',
        avatar: '📊',
        description: 'I analyze your data and provide actionable insights. I help you understand what\'s working and what\'s not.',
        capabilities: [
          'Performance analytics',
          'Audience insights',
          'Growth tracking',
          'A/B test analysis',
          'Conversion optimization',
          'Custom reports and dashboards',
        ],
        status: 'available',
        personality: 'Analytical, insightful, clear communicator',
        expertise: ['Data Analysis', 'Metrics', 'Visualization', 'Testing', 'Optimization'],
      },
      {
        id: 'integration-agent',
        name: 'Integration Agent',
        role: 'Integration Specialist',
        avatar: '🔗',
        description: 'I help you connect all your services and tools. Having trouble with an API? I can help troubleshoot.',
        capabilities: [
          'Connect services and APIs',
          'Troubleshoot integrations',
          'Setup webhooks and automation',
          'Manage credentials',
          'Test connections',
          'Fix integration errors',
        ],
        status: 'available',
        personality: 'Helpful, patient, technical',
        expertise: ['APIs', 'OAuth', 'Webhooks', 'Troubleshooting', 'Integration Setup'],
      },
      {
        id: 'idle-agent',
        name: 'Idle Computing Agent',
        role: 'Resource Optimizer',
        avatar: '💻',
        description: 'I optimize your idle computing resources to generate passive income. Let me maximize your earnings.',
        capabilities: [
          'Detect available resources',
          'Recommend best networks',
          'Calculate ROI and costs',
          'Optimize resource allocation',
          'Monitor earnings',
          'Smart scheduling',
        ],
        status: 'available',
        personality: 'Efficient, profit-focused, technical',
        expertise: ['Filecoin', 'Golem', 'Resource Management', 'Crypto', 'Optimization'],
      },
    ];

    logger.info('Specialty agents initialized', { count: this.agents.length });
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.find(a => a.id === agentId);
  }

  getAllAgents(): Agent[] {
    return this.agents;
  }

  getAvailableAgents(): Agent[] {
    return this.agents.filter(a => a.status === 'available');
  }

  async sendMessage(agentId: string, userMessage: string): Promise<AgentMessage> {
    const agent = this.getAgent(agentId);

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Get or create conversation
    let conversation = this.conversations.get(agentId);

    if (!conversation) {
      conversation = {
        agentId,
        messages: [],
        startedAt: new Date(),
        lastMessageAt: new Date(),
      };
      this.conversations.set(agentId, conversation);
    }

    // Add user message
    const userMsg: AgentMessage = {
      id: crypto.randomUUID(),
      agentId,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    conversation.messages.push(userMsg);

    // Generate agent response
    const agentResponse = await this.generateResponse(agent, userMessage, conversation);

    conversation.messages.push(agentResponse);
    conversation.lastMessageAt = new Date();

    activityService.logActivity({
      type: 'agent_interaction',
      message: `Interacted with ${agent.name}`,
      metadata: { agentId, messageLength: userMessage.length },
    });

    logger.info('Agent message sent', { agentId, userMessage: userMessage.substring(0, 50) });

    return agentResponse;
  }

  private async generateResponse(agent: Agent, userMessage: string, conversation: AgentConversation): Promise<AgentMessage> {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 300));

    // Generate contextual response based on agent type
    const response = this.getContextualResponse(agent.id, userMessage);

    const actions = this.generateActions(agent.id, userMessage);

    const agentMessage: AgentMessage = {
      id: crypto.randomUUID(),
      agentId: agent.id,
      role: 'agent',
      content: response,
      timestamp: new Date(),
      actions: actions.length > 0 ? actions : undefined,
    };

    return agentMessage;
  }

  private getContextualResponse(agentId: string, userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    switch (agentId) {
      case 'revenue-agent':
        if (lowerMessage.includes('revenue') || lowerMessage.includes('earning')) {
          return "I can help you track your revenue! I see you have Stripe and Gumroad connected. Would you like me to generate a revenue report showing your earnings across all platforms?";
        }
        if (lowerMessage.includes('setup') || lowerMessage.includes('connect')) {
          return "I can help you set up payment processors. Which would you like to connect: Stripe, Gumroad, or PayPal? I'll guide you through the process step-by-step.";
        }
        return "I'm your Revenue Agent! I can help you track earnings, set up payment processors, generate financial reports, and forecast future revenue. What would you like to do?";

      case 'content-agent':
        if (lowerMessage.includes('write') || lowerMessage.includes('create')) {
          return "I'd love to help you create content! What topic are you interested in? I can generate blog posts, articles, social media content, and more. Just give me a topic and I'll create something amazing.";
        }
        if (lowerMessage.includes('seo') || lowerMessage.includes('optimize')) {
          return "Great question! I can optimize your content for SEO by adding relevant keywords, improving headings, and making it more discoverable. Would you like me to analyze your recent content?";
        }
        return "I'm your Content Agent! I specialize in content creation, optimization, and strategy. Need a blog post? Want to improve your SEO? I'm here to help. What can I create for you today?";

      case 'seo-agent':
        if (lowerMessage.includes('keyword') || lowerMessage.includes('rank')) {
          return "I'm tracking your keyword rankings! I can show you which keywords you're ranking for, find new keyword opportunities, and help improve your positions. Want me to run a keyword analysis?";
        }
        if (lowerMessage.includes('backlink')) {
          return "Backlinks are crucial for SEO! I can analyze your backlink profile, find new linking opportunities, and help you build high-quality backlinks. Should I run a backlink audit?";
        }
        return "I'm your SEO Agent! I help improve your search rankings through keyword research, backlink analysis, and technical SEO. Ready to boost your visibility?";

      case 'publishing-agent':
        if (lowerMessage.includes('publish') || lowerMessage.includes('post')) {
          return "I can publish your content to WordPress, Medium, Dev.to, and more! Just give me the content and I'll distribute it across all your platforms. Want to schedule a publication?";
        }
        if (lowerMessage.includes('wordpress') || lowerMessage.includes('medium')) {
          return "I'm connected to your publishing platforms! Would you like me to publish something now, or set up an automated publishing schedule?";
        }
        return "I'm your Publishing Agent! I handle content distribution across all your platforms. Need to publish something? I can do it automatically. What would you like to publish?";

      case 'analytics-agent':
        if (lowerMessage.includes('analytics') || lowerMessage.includes('data')) {
          return "Let me pull up your analytics! I can show you performance metrics, audience insights, growth trends, and more. What specific data are you interested in?";
        }
        if (lowerMessage.includes('test') || lowerMessage.includes('a/b')) {
          return "A/B testing is powerful! I can help you set up tests, analyze results, and optimize conversions. Want to start a new A/B test?";
        }
        return "I'm your Analytics Agent! I turn data into actionable insights. Want to see how your content is performing? Need to optimize conversions? I've got the data you need.";

      case 'integration-agent':
        if (lowerMessage.includes('connect') || lowerMessage.includes('setup')) {
          return "I can help you connect any service! Which integration are you trying to set up? I'll guide you through the API setup, credential configuration, and testing.";
        }
        if (lowerMessage.includes('error') || lowerMessage.includes('not working')) {
          return "Let me troubleshoot that for you! I can test your connections, check API credentials, and fix common integration issues. Which service is giving you trouble?";
        }
        return "I'm your Integration Agent! I help connect services, troubleshoot APIs, and set up automation. Having integration issues? I can fix them. What needs connecting?";

      case 'idle-agent':
        if (lowerMessage.includes('earn') || lowerMessage.includes('money')) {
          return "I can help you earn passive income from your idle resources! Based on your system, you could earn up to $432/month. Want me to recommend the best networks to join?";
        }
        if (lowerMessage.includes('network') || lowerMessage.includes('join')) {
          return "Great! I recommend starting with Golem Network for compute and Filecoin for storage. Together they can earn ~$144/month. Should I help you join them?";
        }
        return "I'm your Idle Computing Agent! I optimize your unused resources to generate passive income. Your system is capable of earning significant revenue. Want to see your potential?";

      default:
        return "I'm here to help! What can I assist you with today?";
    }
  }

  private generateActions(agentId: string, userMessage: string): AgentAction[] {
    const lowerMessage = userMessage.toLowerCase();
    const actions: AgentAction[] = [];

    switch (agentId) {
      case 'revenue-agent':
        actions.push(
          {
            id: 'generate-report',
            label: 'Generate Revenue Report',
            description: 'Create a detailed revenue report',
            action: 'generate_revenue_report',
            icon: '📊',
          },
          {
            id: 'setup-stripe',
            label: 'Setup Stripe',
            description: 'Connect Stripe payment processor',
            action: 'setup_stripe',
            icon: '💳',
          }
        );
        break;

      case 'content-agent':
        actions.push(
          {
            id: 'generate-content',
            label: 'Generate Content',
            description: 'Create new blog post or article',
            action: 'generate_content',
            icon: '✍️',
          },
          {
            id: 'optimize-seo',
            label: 'Optimize for SEO',
            description: 'Improve content SEO',
            action: 'optimize_seo',
            icon: '🔍',
          }
        );
        break;

      case 'publishing-agent':
        actions.push(
          {
            id: 'publish-now',
            label: 'Publish Now',
            description: 'Publish content to all platforms',
            action: 'publish_content',
            icon: '🚀',
          },
          {
            id: 'schedule-post',
            label: 'Schedule Post',
            description: 'Schedule for later',
            action: 'schedule_post',
            icon: '📅',
          }
        );
        break;

      case 'idle-agent':
        actions.push(
          {
            id: 'join-networks',
            label: 'Join Top Networks',
            description: 'Join recommended networks',
            action: 'join_top_networks',
            icon: '🌐',
          },
          {
            id: 'calculate-roi',
            label: 'Calculate ROI',
            description: 'Show earnings potential',
            action: 'calculate_roi',
            icon: '💰',
          }
        );
        break;
    }

    return actions;
  }

  getConversation(agentId: string): AgentConversation | undefined {
    return this.conversations.get(agentId);
  }

  clearConversation(agentId: string): void {
    this.conversations.delete(agentId);
    logger.info('Conversation cleared', { agentId });
  }

  async executeAction(agentId: string, actionId: string, params?: Record<string, any>): Promise<{ success: boolean; message: string; result?: any }> {
    const agent = this.getAgent(agentId);

    if (!agent) {
      return { success: false, message: 'Agent not found' };
    }

    logger.info('Executing agent action', { agentId, actionId });

    // Simulate action execution
    await new Promise(resolve => setTimeout(resolve, 500));

    activityService.logActivity({
      type: 'agent_action_executed',
      message: `${agent.name} executed ${actionId}`,
      metadata: { agentId, actionId },
    });

    return {
      success: true,
      message: `Action ${actionId} completed successfully!`,
      result: { actionId, executedAt: new Date() },
    };
  }

  generateSuggestions(): AgentSuggestion[] {
    const now = new Date();

    this.suggestions = [
      {
        id: 'setup-revenue-tracking',
        agentId: 'revenue-agent',
        title: 'Setup Revenue Tracking',
        description: 'Connect Stripe to start tracking your earnings automatically',
        priority: 'high',
        action: {
          id: 'setup-stripe',
          label: 'Setup Now',
          description: 'Connect Stripe',
          action: 'setup_stripe',
        },
        timestamp: now,
      },
      {
        id: 'create-first-content',
        agentId: 'content-agent',
        title: 'Create Your First Content',
        description: 'Generate your first blog post with AI assistance',
        priority: 'medium',
        action: {
          id: 'generate-content',
          label: 'Generate Now',
          description: 'Create content',
          action: 'generate_content',
        },
        timestamp: now,
      },
      {
        id: 'optimize-idle-resources',
        agentId: 'idle-agent',
        title: 'Earn from Idle Resources',
        description: 'Your system can earn up to $432/month. Start earning now!',
        priority: 'high',
        action: {
          id: 'join-networks',
          label: 'Start Earning',
          description: 'Join networks',
          action: 'join_top_networks',
        },
        timestamp: now,
      },
    ];

    return this.suggestions;
  }

  getSuggestions(agentId?: string): AgentSuggestion[] {
    if (agentId) {
      return this.suggestions.filter(s => s.agentId === agentId);
    }
    return this.suggestions;
  }

  quickTest() {
    this.initializeAgents();

    // Test conversation
    const revenueAgent = this.getAgent('revenue-agent');
    const contentAgent = this.getAgent('content-agent');

    this.sendMessage('revenue-agent', 'How much revenue am I making?');
    this.sendMessage('content-agent', 'Can you write a blog post about passive income?');

    const suggestions = this.generateSuggestions();

    return {
      totalAgents: this.agents.length,
      availableAgents: this.getAvailableAgents().length,
      agents: this.agents.map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        avatar: a.avatar,
        capabilities: a.capabilities.length,
      })),
      conversations: this.conversations.size,
      suggestions: suggestions.length,
      sampleConversation: this.getConversation('revenue-agent'),
    };
  }
}

export const specialtyAgentService = new SpecialtyAgentService();
if (typeof window !== 'undefined') (window as any).testSpecialtyAgents = () => specialtyAgentService.quickTest();
