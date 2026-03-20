// Enhanced Ollama Service - Deep Integration with Local Models
// Provides model discovery, health checks, and advanced features

export interface OllamaModel {
    name: string;
    size: number;
    digest: string;
    modified_at: string;
    details?: {
        format: string;
        family: string;
        families: string[];
        parameter_size: string;
        quantization_level: string;
    };
}

export interface OllamaStatus {
    available: boolean;
    version?: string;
    models: OllamaModel[];
    error?: string;
}

export interface OllamaGenerateOptions {
    model: string;
    prompt: string;
    system?: string;
    temperature?: number;
    top_p?: number;
    stream?: boolean;
}

export class OllamaService {
    private baseUrl: string;

    constructor(baseUrl: string = 'http://localhost:11434') {
        this.baseUrl = baseUrl;
    }

    /**
     * Check if Ollama is running and accessible
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            return response.ok;
        } catch (error) {
            console.error('Ollama health check failed:', error);
            return false;
        }
    }

    /**
     * Get detailed status including available models
     */
    async getStatus(): Promise<OllamaStatus> {
        try {
            const isHealthy = await this.checkHealth();
            
            if (!isHealthy) {
                return {
                    available: false,
                    models: [],
                    error: 'Ollama is not running or not accessible'
                };
            }

            const models = await this.listModels();

            return {
                available: true,
                models: models,
                version: 'unknown' // Ollama doesn't expose version easily
            };
        } catch (error) {
            return {
                available: false,
                models: [],
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * List all available models with detailed information
     */
    async listModels(): Promise<OllamaModel[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }

            const data = await response.json();
            return data.models || [];
        } catch (error) {
            console.error('Failed to list Ollama models:', error);
            return [];
        }
    }

    /**
     * Get information about a specific model
     */
    async getModelInfo(modelName: string): Promise<OllamaModel | null> {
        const models = await this.listModels();
        return models.find(m => m.name === modelName) || null;
    }

    /**
     * Generate completion with a model
     */
    async generate(options: OllamaGenerateOptions): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: options.model,
                    prompt: options.prompt,
                    system: options.system || 'You are a helpful AI assistant.',
                    temperature: options.temperature || 0.7,
                    top_p: options.top_p || 0.9,
                    stream: options.stream || false
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama generate failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.response || '';
        } catch (error) {
            console.error('Ollama generation error:', error);
            throw new Error(`Failed to generate with Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Pull a model from Ollama library
     */
    async pullModel(modelName: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName, stream: false })
            });

            return response.ok;
        } catch (error) {
            console.error('Failed to pull model:', error);
            return false;
        }
    }

    /**
     * Delete a model
     */
    async deleteModel(modelName: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName })
            });

            return response.ok;
        } catch (error) {
            console.error('Failed to delete model:', error);
            return false;
        }
    }

    /**
     * Format model size for display
     */
    formatModelSize(bytes: number): string {
        const gb = bytes / (1024 ** 3);
        if (gb >= 1) return `${gb.toFixed(2)} GB`;
        
        const mb = bytes / (1024 ** 2);
        return `${mb.toFixed(2)} MB`;
    }

    /**
     * Get recommended models for specific tasks
     */
    getRecommendedModels(task: 'code' | 'chat' | 'creative'): string[] {
        switch (task) {
            case 'code':
                return ['codellama:13b', 'deepseek-coder:6.7b', 'starcoder2:7b'];
            case 'chat':
                return ['llama3.2:3b', 'mistral:7b', 'phi3:mini'];
            case 'creative':
                return ['llama3.1:8b', 'gemma2:9b', 'qwen2.5:7b'];
            default:
                return ['llama3.2:3b'];
        }
    }
}

// Singleton instance
export const ollamaService = new OllamaService();
