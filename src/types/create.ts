export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'library' | 'other';
  framework?: string;
  language: string;
  icon: string;
  files: TemplateFile[];
  dependencies?: string[];
  scripts?: Record<string, string>;
}

export interface TemplateFile {
  path: string;
  content: string;
  isDirectory?: boolean;
}

export interface ProjectGenerationOptions {
  name: string;
  description?: string;
  templateId?: string;
  aiPrompt?: string;
}

