// LuxRig Bridge Client - Phoenix side
// Connects DLX-Phoenix to local LuxRig infrastructure
export interface LuxRigStatus {
    lmstudio: {
        online: boolean;
        url: string;
        error?: string;
    };
    ollama: {
        online: boolean;
        url: string;
        models?: string[];
        error?: string;
    };
}

export interface WorkflowConfig {
    name: string;
    type: 'blog-post' | 'code-generation' | 'content-batch';
    config: {
        topic?: string;
        keywords?: string[];
        description?: string;
        language?: string;
        model?: string;
        items?: any[];
    };
}

export interface Workflow {
    id: number;
    name: string;
    type: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    created: string;
    result?: any;
    error?: string;
}

class LuxRigBridgeClient {
    private baseUrl: string;

    constructor(baseUrl: string = 'http://localhost:3333') {
        this.baseUrl = baseUrl;
    }

    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return response.ok;
        } catch {
            return false;
        }
    }

    async getStatus(): Promise<LuxRigStatus | null> {
        try {
            const response = await fetch(`${this.baseUrl}/status`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Failed to get LuxRig status:', error);
            return null;
        }
    }

    async createWorkflow(workflow: WorkflowConfig): Promise<{ workflowId: number; status: string } | null> {
        try {
            const response = await fetch(`${this.baseUrl}/workflow/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workflow)
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Failed to create workflow:', error);
            return null;
        }
    }

    async getWorkflow(id: number): Promise<Workflow | null> {
        try {
            const response = await fetch(`${this.baseUrl}/workflow/${id}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Failed to get workflow:', error);
            return null;
        }
    }

    async listWorkflows(): Promise<Workflow[]> {
        try {
            const response = await fetch(`${this.baseUrl}/workflows`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error('Failed to list workflows:', error);
            return [];
        }
    }

    async saveFile(filename: string, content: string, subdir: string = ''): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/save-file`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, content, subdir })
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to save file:', error);
            return false;
        }
    }

    // Quick workflow generators for common tasks
    async generateBlogPost(topic: string, keywords: string[], model: string = 'llama3.2'): Promise<number | null> {
        const result = await this.createWorkflow({
            name: `Blog: ${topic}`,
            type: 'blog-post',
            config: { topic, keywords, model }
        });
        return result?.workflowId || null;
    }

    async generateCode(description: string, language: string = 'javascript', model: string = 'codellama'): Promise<number | null> {
        const result = await this.createWorkflow({
            name: `Code: ${description}`,
            type: 'code-generation',
            config: { description, language, model }
        });
        return result?.workflowId || null;
    }

    async generateContentBatch(items: any[], model: string = 'llama3.2'): Promise<number | null> {
        const result = await this.createWorkflow({
            name: `Batch: ${items.length} items`,
            type: 'content-batch',
            config: { items, model }
        });
        return result?.workflowId || null;
    }
}

export const luxRigBridge = new LuxRigBridgeClient();
