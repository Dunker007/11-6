/**
 * Template Marketplace Service
 * Manages templates, purchases, and reviews
 */

import { Template, TemplatePurchase, TemplateReview, TemplateCategory } from './types';

class TemplateService {
  private templates: Template[] = [];
  private purchases: TemplatePurchase[] = [];
  private reviews: TemplateReview[] = [];

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Get all available templates
   */
  async getTemplates(): Promise<Template[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...this.templates];
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: TemplateCategory): Promise<Template[]> {
    const templates = await this.getTemplates();
    return templates.filter(template => template.category === category);
  }

  /**
   * Get featured templates
   */
  async getFeaturedTemplates(): Promise<Template[]> {
    const templates = await this.getTemplates();
    return templates.filter(template => template.featured);
  }

  /**
   * Search templates
   */
  async searchTemplates(query: string): Promise<Template[]> {
    const templates = await this.getTemplates();
    const lowerQuery = query.toLowerCase();

    return templates.filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      template.techStack.some(tech => tech.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<Template | null> {
    const templates = await this.getTemplates();
    return templates.find(template => template.id === id) || null;
  }

  /**
   * Purchase a template
   */
  async purchaseTemplate(templateId: string, userId: string): Promise<TemplatePurchase> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const purchase: TemplatePurchase = {
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      userId,
      purchaseDate: Date.now(),
      price: template.price,
      currency: template.currency,
      transactionId: `txn_${Date.now()}`,
      downloadUrl: `https://vibed-ed-studio.com/downloads/${templateId}.zip`,
      licenseKey: template.price > 0 ? `license_${Math.random().toString(36).substr(2, 9)}` : undefined
    };

    this.purchases.push(purchase);

    // Update download count
    const templateIndex = this.templates.findIndex(t => t.id === templateId);
    if (templateIndex !== -1) {
      this.templates[templateIndex].downloads++;
    }

    return purchase;
  }

  /**
   * Get user's purchases
   */
  async getUserPurchases(userId: string): Promise<TemplatePurchase[]> {
    return this.purchases.filter(purchase => purchase.userId === userId);
  }

  /**
   * Add a review
   */
  async addReview(review: Omit<TemplateReview, 'id' | 'createdAt' | 'helpful'>): Promise<TemplateReview> {
    const newReview: TemplateReview = {
      ...review,
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      helpful: 0
    };

    this.reviews.push(newReview);

    // Update template rating
    await this.updateTemplateRating(review.templateId);

    return newReview;
  }

  /**
   * Get reviews for a template
   */
  async getTemplateReviews(templateId: string): Promise<TemplateReview[]> {
    return this.reviews.filter(review => review.templateId === templateId);
  }

  /**
   * Vote on a review
   */
  async voteOnReview(reviewId: string, helpful: boolean): Promise<void> {
    const reviewIndex = this.reviews.findIndex(r => r.id === reviewId);
    if (reviewIndex !== -1) {
      if (helpful) {
        this.reviews[reviewIndex].helpful++;
      }
    }
  }

  /**
   * Initialize sample templates
   */
  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'react-ecommerce-template',
        name: 'React E-Commerce Store',
        description: 'A complete e-commerce solution built with React, Stripe, and Firebase. Features product catalog, shopping cart, user authentication, and admin dashboard.',
        category: 'web-app',
        price: 49,
        currency: 'USD',
        tags: ['react', 'ecommerce', 'stripe', 'firebase', 'tailwind'],
        featured: true,
        downloads: 1250,
        rating: 4.8,
        reviewCount: 89,
        author: {
          name: 'Vibed Ed Studio',
          verified: true
        },
        techStack: ['React', 'TypeScript', 'Stripe', 'Firebase', 'Tailwind CSS'],
        features: [
          'Product catalog with search and filters',
          'Shopping cart with persistent storage',
          'User authentication and profiles',
          'Admin dashboard for inventory management',
          'Stripe payment integration',
          'Order tracking and history',
          'Responsive design for all devices'
        ],
        screenshots: [
          'https://via.placeholder.com/800x600/6366f1/ffffff?text=React+E-Commerce+Store',
          'https://via.placeholder.com/800x600/8b5cf6/ffffff?text=Product+Catalog',
          'https://via.placeholder.com/800x600/a855f7/ffffff?text=Admin+Dashboard'
        ],
        demoUrl: 'https://react-ecommerce-demo.vibed-ed.com',
        documentationUrl: 'https://docs.vibed-ed.com/templates/react-ecommerce',
        version: '2.1.0',
        lastUpdated: Date.now() - 7 * 24 * 60 * 60 * 1000, // 1 week ago
        fileSize: 15 * 1024 * 1024, // 15MB
        compatibility: {
          nodeVersion: '>=18.0.0',
          reactVersion: '>=18.0.0'
        },
        license: 'MIT',
        supportLevel: 'premium'
      },
      {
        id: 'ai-chatbot-template',
        name: 'AI Chatbot Platform',
        description: 'Build intelligent chatbots with OpenAI GPT integration. Features conversation memory, custom personalities, and analytics dashboard.',
        category: 'ai-ml',
        price: 79,
        currency: 'USD',
        tags: ['ai', 'chatbot', 'openai', 'gpt', 'analytics'],
        featured: true,
        downloads: 890,
        rating: 4.9,
        reviewCount: 67,
        author: {
          name: 'Vibed Ed Studio',
          verified: true
        },
        techStack: ['Next.js', 'OpenAI API', 'Prisma', 'PostgreSQL', 'Chart.js'],
        features: [
          'Multiple chatbot personalities',
          'Conversation memory and context',
          'Real-time chat interface',
          'Analytics and usage tracking',
          'Custom training data upload',
          'API rate limiting and caching',
          'Export conversation history'
        ],
        screenshots: [
          'https://via.placeholder.com/800x600/6366f1/ffffff?text=AI+Chatbot+Platform',
          'https://via.placeholder.com/800x600/8b5cf6/ffffff?text=Conversation+Interface'
        ],
        demoUrl: 'https://ai-chatbot-demo.vibed-ed.com',
        version: '1.8.0',
        lastUpdated: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        fileSize: 22 * 1024 * 1024, // 22MB
        compatibility: {
          nodeVersion: '>=16.0.0'
        },
        license: 'MIT',
        supportLevel: 'premium'
      },
      {
        id: 'blockchain-nft-marketplace',
        name: 'NFT Marketplace',
        description: 'Complete NFT marketplace with Ethereum integration, wallet connection, and auction system. Built with Hardhat and Next.js.',
        category: 'blockchain',
        price: 99,
        currency: 'USD',
        tags: ['nft', 'ethereum', 'web3', 'hardhat', 'metamask'],
        featured: false,
        downloads: 567,
        rating: 4.6,
        reviewCount: 43,
        author: {
          name: 'CryptoDev Templates',
          verified: true
        },
        techStack: ['Next.js', 'Solidity', 'Hardhat', 'Ethers.js', 'IPFS'],
        features: [
          'NFT minting and listing',
          'Auction and direct sale system',
          'Wallet integration (MetaMask)',
          'IPFS file storage',
          'Transaction history',
          'Royalty management',
          'Gas optimization'
        ],
        screenshots: [
          'https://via.placeholder.com/800x600/6366f1/ffffff?text=NFT+Marketplace',
          'https://via.placeholder.com/800x600/8b5cf6/ffffff?text=Auction+System'
        ],
        version: '1.5.0',
        lastUpdated: Date.now() - 14 * 24 * 60 * 60 * 1000, // 2 weeks ago
        fileSize: 35 * 1024 * 1024, // 35MB
        compatibility: {
          nodeVersion: '>=16.0.0'
        },
        license: 'MIT',
        supportLevel: 'basic'
      },
      {
        id: 'free-portfolio-template',
        name: 'Developer Portfolio',
        description: 'Beautiful, responsive portfolio website template. Perfect for developers to showcase their work and attract clients.',
        category: 'web-app',
        price: 0,
        currency: 'USD',
        tags: ['portfolio', 'responsive', 'developer', 'showcase'],
        featured: false,
        downloads: 2100,
        rating: 4.7,
        reviewCount: 156,
        author: {
          name: 'Open Source Community',
          verified: false
        },
        techStack: ['HTML', 'CSS', 'JavaScript', 'GSAP'],
        features: [
          'Responsive design for all devices',
          'Smooth animations and transitions',
          'Project showcase gallery',
          'Contact form with validation',
          'Social media integration',
          'SEO optimized',
          'Easy customization'
        ],
        screenshots: [
          'https://via.placeholder.com/800x600/6366f1/ffffff?text=Developer+Portfolio',
          'https://via.placeholder.com/800x600/8b5cf6/ffffff?text=Project+Showcase'
        ],
        demoUrl: 'https://portfolio-demo.vibed-ed.com',
        version: '3.2.0',
        lastUpdated: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        fileSize: 2 * 1024 * 1024, // 2MB
        compatibility: {
          nodeVersion: '>=14.0.0'
        },
        license: 'MIT',
        supportLevel: 'community'
      }
    ];
  }

  /**
   * Update template rating based on reviews
   */
  private async updateTemplateRating(templateId: string): Promise<void> {
    const reviews = await this.getTemplateReviews(templateId);
    if (reviews.length === 0) return;

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    const templateIndex = this.templates.findIndex(t => t.id === templateId);
    if (templateIndex !== -1) {
      this.templates[templateIndex].rating = Math.round(averageRating * 10) / 10;
      this.templates[templateIndex].reviewCount = reviews.length;
    }
  }
}

export const templateService = new TemplateService();
