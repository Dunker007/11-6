/**
 * Template Marketplace Types
 */

export type TemplateCategory =
  | 'web-app'
  | 'mobile-app'
  | 'ai-ml'
  | 'blockchain'
  | 'game-dev'
  | 'data-science'
  | 'dev-tools'
  | 'business';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  price: number; // 0 for free templates
  currency: 'USD' | 'VIBE';
  tags: string[];
  featured: boolean;
  downloads: number;
  rating: number; // 1-5 stars
  reviewCount: number;
  author: {
    name: string;
    avatar?: string;
    verified: boolean;
  };
  techStack: string[];
  features: string[];
  screenshots: string[];
  demoUrl?: string;
  documentationUrl?: string;
  version: string;
  lastUpdated: number; // timestamp
  fileSize: number; // in bytes
  compatibility: {
    nodeVersion?: string;
    reactVersion?: string;
    framework?: string;
  };
  license: string;
  supportLevel: 'community' | 'basic' | 'premium';
}

export interface TemplatePurchase {
  id: string;
  templateId: string;
  userId: string;
  purchaseDate: number;
  price: number;
  currency: string;
  transactionId: string;
  downloadUrl?: string;
  licenseKey?: string;
}

export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: number;
  helpful: number; // number of helpful votes
}
