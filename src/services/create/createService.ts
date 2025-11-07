import { templateService } from './templateService';
import { aiGeneratorService } from './aiGeneratorService';
import { projectService } from '../project/projectService';
import type { ProjectTemplate, TemplateFile } from '@/types/create';
import type { Project } from '@/types/project';

export class CreateService {
  private static instance: CreateService;

  static getInstance(): CreateService {
    if (!CreateService.instance) {
      CreateService.instance = new CreateService();
    }
    return CreateService.instance;
  }

  getAllTemplates(): ProjectTemplate[] {
    return templateService.getAllTemplates();
  }

  getTemplateById(id: string): ProjectTemplate | null {
    return templateService.getTemplateById(id);
  }

  getTemplatesByCategory(category: ProjectTemplate['category']): ProjectTemplate[] {
    return templateService.getTemplatesByCategory(category);
  }

  async createFromTemplate(templateId: string, projectName: string, description?: string): Promise<Project> {
    const files = templateService.instantiateTemplate(templateId, projectName);
    return this.createProjectFromFiles(projectName, description, files);
  }

  async createFromAI(projectName: string, description: string): Promise<Project> {
    const result = await aiGeneratorService.generateProject(projectName, description);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate project');
    }

    return this.createProjectFromFiles(projectName, description, result.files);
  }

  private createProjectFromFiles(
    projectName: string,
    description: string | undefined,
    files: TemplateFile[]
  ): Project {
    // Create the project
    const project = projectService.createProject(projectName, description);

    // Add all files from template/AI
    files.forEach((file) => {
      if (!file.isDirectory) {
        const language = this.detectLanguage(file.path);
        projectService.addFile(project.id, file.path, file.content, language);
      }
    });

    // Reload to get updated project
    return projectService.getProject(project.id) || project;
  }

  private detectLanguage(path: string): string | undefined {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
      sql: 'sql',
      vue: 'vue',
    };
    return langMap[ext || ''];
  }
}

export const createService = CreateService.getInstance();

