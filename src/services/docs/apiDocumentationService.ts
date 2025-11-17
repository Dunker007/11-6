/**
 * apiDocumentationService.ts
 * Automated API documentation generation and interactive explorer.
 */

import { logger } from '../logging/loggerService';

export interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  examples: APIExample[];
  deprecated?: boolean;
}

export interface APIParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  type: string;
  description: string;
  default?: any;
}

export interface APIRequestBody {
  contentType: string;
  schema: any;
  example: any;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  schema?: any;
  example?: any;
}

export interface APIExample {
  name: string;
  request: any;
  response: any;
}

export interface APIDocumentation {
  title: string;
  version: string;
  baseUrl: string;
  description: string;
  endpoints: APIEndpoint[];
}

class APIDocumentationService {
  private documentation: APIDocumentation = {
    title: 'DLX Studios API',
    version: '1.0.0',
    baseUrl: 'https://api.dlxstudios.com',
    description: 'Complete API for passive income automation platform',
    endpoints: [],
  };

  registerEndpoint(endpoint: Omit<APIEndpoint, 'id'>): APIEndpoint {
    const fullEndpoint: APIEndpoint = {
      id: crypto.randomUUID(),
      ...endpoint,
    };

    this.documentation.endpoints.push(fullEndpoint);

    logger.info('API endpoint registered', {
      method: endpoint.method,
      path: endpoint.path,
    });

    return fullEndpoint;
  }

  getDocumentation(): APIDocumentation {
    return this.documentation;
  }

  getEndpoint(path: string, method: string): APIEndpoint | undefined {
    return this.documentation.endpoints.find(e => e.path === path && e.method === method);
  }

  getEndpointsByTag(tag: string): APIEndpoint[] {
    return this.documentation.endpoints.filter(e => e.tags.includes(tag));
  }

  searchEndpoints(query: string): APIEndpoint[] {
    const lowerQuery = query.toLowerCase();

    return this.documentation.endpoints.filter(e => {
      const pathMatch = e.path.toLowerCase().includes(lowerQuery);
      const summaryMatch = e.summary.toLowerCase().includes(lowerQuery);
      const tagMatch = e.tags.some(t => t.toLowerCase().includes(lowerQuery));

      return pathMatch || summaryMatch || tagMatch;
    });
  }

  generateOpenAPISpec(): any {
    return {
      openapi: '3.0.0',
      info: {
        title: this.documentation.title,
        version: this.documentation.version,
        description: this.documentation.description,
      },
      servers: [
        {
          url: this.documentation.baseUrl,
        },
      ],
      paths: this.generatePaths(),
    };
  }

  private generatePaths(): any {
    const paths: any = {};

    this.documentation.endpoints.forEach(endpoint => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: this.formatResponses(endpoint.responses),
        deprecated: endpoint.deprecated,
      };
    });

    return paths;
  }

  private formatResponses(responses: APIResponse[]): any {
    const formatted: any = {};

    responses.forEach(r => {
      formatted[r.statusCode] = {
        description: r.description,
        content: r.schema
          ? {
              'application/json': {
                schema: r.schema,
                example: r.example,
              },
            }
          : undefined,
      };
    });

    return formatted;
  }

  generateMarkdown(): string {
    let markdown = `# ${this.documentation.title}\n\n`;
    markdown += `Version: ${this.documentation.version}\n\n`;
    markdown += `${this.documentation.description}\n\n`;
    markdown += `Base URL: \`${this.documentation.baseUrl}\`\n\n`;

    const tags = [...new Set(this.documentation.endpoints.flatMap(e => e.tags))];

    tags.forEach(tag => {
      markdown += `## ${tag}\n\n`;

      const endpoints = this.getEndpointsByTag(tag);

      endpoints.forEach(endpoint => {
        markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;
        markdown += `${endpoint.summary}\n\n`;
        markdown += `${endpoint.description}\n\n`;

        if (endpoint.parameters.length > 0) {
          markdown += `**Parameters:**\n\n`;
          endpoint.parameters.forEach(p => {
            markdown += `- \`${p.name}\` (${p.in}) - ${p.type} - ${p.description}${p.required ? ' **(required)**' : ''}\n`;
          });
          markdown += '\n';
        }

        markdown += `**Responses:**\n\n`;
        endpoint.responses.forEach(r => {
          markdown += `- ${r.statusCode}: ${r.description}\n`;
        });
        markdown += '\n';
      });
    });

    return markdown;
  }

  generateHTML(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>${this.documentation.title}</title>
  <style>
    body { font-family: system-ui; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .endpoint { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    .method { display: inline-block; padding: 3px 8px; border-radius: 3px; font-weight: bold; }
    .GET { background: #61affe; color: white; }
    .POST { background: #49cc90; color: white; }
    .PUT { background: #fca130; color: white; }
    .DELETE { background: #f93e3e; color: white; }
  </style>
</head>
<body>
  <h1>${this.documentation.title}</h1>
  <p>${this.documentation.description}</p>
  ${this.documentation.endpoints
    .map(
      e => `
    <div class="endpoint">
      <span class="method ${e.method}">${e.method}</span>
      <code>${e.path}</code>
      <p>${e.summary}</p>
    </div>
  `
    )
    .join('')}
</body>
</html>`;
  }

  initializeDefaultEndpoints(): void {
    // Content endpoints
    this.registerEndpoint({
      method: 'POST',
      path: '/api/content/generate',
      summary: 'Generate new content',
      description: 'Generate AI-powered content based on topic and style',
      tags: ['Content'],
      parameters: [],
      requestBody: {
        contentType: 'application/json',
        schema: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            style: { type: 'string' },
          },
        },
        example: { topic: 'Passive Income', style: 'professional' },
      },
      responses: [
        { statusCode: 200, description: 'Content generated successfully' },
        { statusCode: 400, description: 'Invalid request' },
      ],
      examples: [],
    });

    this.registerEndpoint({
      method: 'GET',
      path: '/api/content',
      summary: 'List all content',
      description: 'Retrieve list of all generated content',
      tags: ['Content'],
      parameters: [
        { name: 'limit', in: 'query', required: false, type: 'number', description: 'Number of items to return' },
        { name: 'offset', in: 'query', required: false, type: 'number', description: 'Pagination offset' },
      ],
      responses: [{ statusCode: 200, description: 'Content list retrieved' }],
      examples: [],
    });

    // Revenue endpoints
    this.registerEndpoint({
      method: 'GET',
      path: '/api/revenue/stats',
      summary: 'Get revenue statistics',
      description: 'Retrieve comprehensive revenue statistics and analytics',
      tags: ['Revenue'],
      parameters: [
        { name: 'period', in: 'query', required: false, type: 'string', description: 'Time period (day, week, month)' },
      ],
      responses: [{ statusCode: 200, description: 'Statistics retrieved' }],
      examples: [],
    });

    // Analytics endpoints
    this.registerEndpoint({
      method: 'GET',
      path: '/api/analytics/dashboard',
      summary: 'Get dashboard data',
      description: 'Retrieve unified analytics dashboard data',
      tags: ['Analytics'],
      parameters: [],
      responses: [{ statusCode: 200, description: 'Dashboard data retrieved' }],
      examples: [],
    });

    logger.info('Default API endpoints initialized', { count: this.documentation.endpoints.length });
  }

  quickTest() {
    this.initializeDefaultEndpoints();

    const openapi = this.generateOpenAPISpec();
    const markdown = this.generateMarkdown();
    const contentEndpoints = this.getEndpointsByTag('Content');
    const searchResults = this.searchEndpoints('revenue');

    return {
      totalEndpoints: this.documentation.endpoints.length,
      tags: [...new Set(this.documentation.endpoints.flatMap(e => e.tags))],
      contentEndpoints: contentEndpoints.length,
      searchResults: searchResults.length,
      openAPIVersion: openapi.openapi,
      markdownPreview: markdown.substring(0, 300) + '...',
    };
  }
}

export const apiDocumentationService = new APIDocumentationService();
if (typeof window !== 'undefined') (window as any).testAPIDocumentation = () => apiDocumentationService.quickTest();
