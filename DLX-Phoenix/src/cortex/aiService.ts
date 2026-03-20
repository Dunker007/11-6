// Multi-Provider AI Service Architecture
// Supports: Gemini, OpenAI, Anthropic, Ollama

export interface AIProvider {
    name: string;
    generateCompletion(prompt: string, systemInstruction?: string): Promise<string>;
    listModels(): Promise<string[]>;
    isAvailable(): Promise<boolean>;
}

export interface ProviderConfig {
    apiKey?: string;
    baseUrl?: string;
    model: string;
}

// ===== GEMINI PROVIDER =====
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider implements AIProvider {
    name = 'Google Gemini';
    private client: GoogleGenerativeAI;
    private config: ProviderConfig;

    constructor(config: ProviderConfig) {
        this.config = config;
        this.client = new GoogleGenerativeAI(config.apiKey || '');
    }

    async generateCompletion(prompt: string, systemInstruction?: string): Promise<string> {
        try {
            const model = this.client.getGenerativeModel({
                model: this.config.model || 'gemini-1.5-flash',
                systemInstruction: systemInstruction || 'You are a helpful AI assistant.'
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini Error:', error);
            throw new Error(`Gemini API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async listModels(): Promise<string[]> {
        return [
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-1.5-pro',
            'gemini-2.0-flash-exp'
        ];
    }

    async isAvailable(): Promise<boolean> {
        return !!this.config.apiKey;
    }
}

// ===== OPENAI PROVIDER =====
export class OpenAIProvider implements AIProvider {
    name = 'OpenAI';
    private config: ProviderConfig;

    constructor(config: ProviderConfig) {
        this.config = config;
    }

    async generateCompletion(prompt: string, systemInstruction?: string): Promise<string> {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model || 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemInstruction || 'You are a helpful AI assistant.' },
                        { role: 'user', content: prompt }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI Error:', error);
            throw new Error(`OpenAI API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async listModels(): Promise<string[]> {
        return [
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-4-turbo',
            'gpt-3.5-turbo'
        ];
    }

    async isAvailable(): Promise<boolean> {
        return !!this.config.apiKey;
    }
}

// ===== ANTHROPIC PROVIDER =====
export class AnthropicProvider implements AIProvider {
    name = 'Anthropic';
    private config: ProviderConfig;

    constructor(config: ProviderConfig) {
        this.config = config;
    }

    async generateCompletion(prompt: string, systemInstruction?: string): Promise<string> {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey || '',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.config.model || 'claude-3-5-sonnet-20241022',
                    max_tokens: 4096,
                    system: systemInstruction || 'You are a helpful AI assistant.',
                    messages: [
                        { role: 'user', content: prompt }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`Anthropic API Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            console.error('Anthropic Error:', error);
            throw new Error(`Anthropic API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async listModels(): Promise<string[]> {
        return [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229'
        ];
    }

    async isAvailable(): Promise<boolean> {
        return !!this.config.apiKey;
    }
}

// ===== OLLAMA PROVIDER (Local) =====
export class OllamaProvider implements AIProvider {
    name = 'Ollama (Local)';
    private config: ProviderConfig;

    constructor(config: ProviderConfig) {
        this.config = config;
        this.config.baseUrl = this.config.baseUrl || 'http://localhost:11434';
    }

    async generateCompletion(prompt: string, systemInstruction?: string): Promise<string> {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.config.model || 'llama3.2',
                    prompt: prompt,
                    system: systemInstruction || 'You are a helpful AI assistant.',
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Ollama Error:', error);
            throw new Error(`Ollama connection failed. Is Ollama running on ${this.config.baseUrl}?`);
        }
    }

    async listModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/tags`);
            if (!response.ok) return [];

            const data = await response.json();
            return data.models?.map((m: any) => m.name) || [];
        } catch {
            return [];
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

// ===== PROVIDER FACTORY =====
export type ProviderType = 'gemini' | 'openai' | 'anthropic' | 'ollama';

export class AIService {
    private providers: Map<ProviderType, AIProvider> = new Map();

    constructor() {
        // Initialize with API keys from env or localStorage
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
        const openaiKey = localStorage.getItem('openai_api_key') || '';
        const anthropicKey = localStorage.getItem('anthropic_api_key') || '';

        this.providers.set('gemini', new GeminiProvider({ apiKey: geminiKey, model: 'gemini-1.5-flash' }));
        this.providers.set('openai', new OpenAIProvider({ apiKey: openaiKey, model: 'gpt-4o-mini' }));
        this.providers.set('anthropic', new AnthropicProvider({ apiKey: anthropicKey, model: 'claude-3-5-sonnet-20241022' }));
        this.providers.set('ollama', new OllamaProvider({ model: 'llama3.2' }));
    }

    getProvider(type: ProviderType): AIProvider {
        const provider = this.providers.get(type);
        if (!provider) {
            throw new Error(`Provider ${type} not found`);
        }
        return provider;
    }

    async generateWithProvider(
        type: ProviderType,
        prompt: string,
        systemInstruction?: string
    ): Promise<string> {
        const provider = this.getProvider(type);
        return provider.generateCompletion(prompt, systemInstruction);
    }

    async checkProviderStatus(type: ProviderType): Promise<boolean> {
        const provider = this.getProvider(type);
        return provider.isAvailable();
    }
}

// Singleton instance
export const aiService = new AIService();

// Legacy export for backward compatibility
export const generateIdea = async (prompt: string, systemInstruction?: string): Promise<string> => {
    return aiService.generateWithProvider('gemini', prompt, systemInstruction);
};
