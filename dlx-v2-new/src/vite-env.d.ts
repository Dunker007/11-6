/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_CLAUDE_API_KEY?: string;
  readonly VITE_STRIPE_SECRET_KEY?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_STRIPE_WEBHOOK_SECRET?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ENVIRONMENT?: 'development' | 'staging' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
