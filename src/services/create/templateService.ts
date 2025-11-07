import type { ProjectTemplate, TemplateFile } from '@/types/create';

const TEMPLATES: ProjectTemplate[] = [
  // Frontend Templates
  {
    id: 'react-vite',
    name: 'React + Vite',
    description: 'Modern React application with Vite for fast development',
    category: 'frontend',
    framework: 'React',
    language: 'typescript',
    icon: '⚛️',
    files: [
      {
        path: '/package.json',
        content: JSON.stringify({
          name: '{{name}}',
          version: '0.1.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'tsc && vite build',
            preview: 'vite preview',
          },
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
          },
          devDependencies: {
            '@types/react': '^18.2.0',
            '@types/react-dom': '^18.2.0',
            '@vitejs/plugin-react': '^4.2.0',
            typescript: '^5.2.0',
            vite: '^5.0.0',
          },
        }, null, 2),
      },
      {
        path: '/vite.config.ts',
        content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
      },
      {
        path: '/tsconfig.json',
        content: JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            useDefineForClassFields: true,
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            skipLibCheck: true,
            moduleResolution: 'bundler',
            allowImportingTsExtensions: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: 'react-jsx',
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true,
          },
          include: ['src'],
        }, null, 2),
      },
      {
        path: '/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{name}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      },
      {
        path: '/src',
        isDirectory: true,
        content: '',
      },
      {
        path: '/src/main.tsx',
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      },
      {
        path: '/src/App.tsx',
        content: `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>{{name}}</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
    </div>
  )
}

export default App`,
      },
      {
        path: '/src/App.css',
        content: `#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.card {
  padding: 2em;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}

button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}`,
      },
      {
        path: '/src/index.css',
        content: `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}`,
      },
    ],
    dependencies: ['react', 'react-dom'],
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
    },
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    description: 'Full-stack React framework with server-side rendering',
    category: 'fullstack',
    framework: 'Next.js',
    language: 'typescript',
    icon: '▲',
    files: [
      {
        path: '/package.json',
        content: JSON.stringify({
          name: '{{name}}',
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint',
          },
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            next: '^14.0.0',
          },
          devDependencies: {
            '@types/node': '^20.0.0',
            '@types/react': '^18.2.0',
            '@types/react-dom': '^18.2.0',
            typescript: '^5.2.0',
            eslint: '^8.0.0',
            'eslint-config-next': '^14.0.0',
          },
        }, null, 2),
      },
      {
        path: '/tsconfig.json',
        content: JSON.stringify({
          compilerOptions: {
            target: 'es5',
            lib: ['dom', 'dom.iterable', 'esnext'],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: 'esnext',
            moduleResolution: 'bundler',
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: 'preserve',
            incremental: true,
            plugins: [{ name: 'next' }],
            paths: {
              '@/*': ['./*'],
            },
          },
          include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
          exclude: ['node_modules'],
        }, null, 2),
      },
      {
        path: '/next.config.js',
        content: `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig`,
      },
      {
        path: '/app',
        isDirectory: true,
        content: '',
      },
      {
        path: '/app/page.tsx',
        content: `export default function Home() {
  return (
    <main>
      <h1>{{name}}</h1>
      <p>Welcome to your Next.js application</p>
    </main>
  )
}`,
      },
      {
        path: '/app/layout.tsx',
        content: `import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '{{name}}',
  description: 'Generated with DLX Studios',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
      },
    ],
    dependencies: ['next', 'react', 'react-dom'],
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
    },
  },
  {
    id: 'vue-vite',
    name: 'Vue + Vite',
    description: 'Vue 3 application with Vite and TypeScript',
    category: 'frontend',
    framework: 'Vue',
    language: 'typescript',
    icon: '🖖',
    files: [
      {
        path: '/package.json',
        content: JSON.stringify({
          name: '{{name}}',
          version: '0.1.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'vue-tsc && vite build',
            preview: 'vite preview',
          },
          dependencies: {
            vue: '^3.3.0',
          },
          devDependencies: {
            '@vitejs/plugin-vue': '^4.5.0',
            typescript: '^5.2.0',
            'vue-tsc': '^1.8.0',
            vite: '^5.0.0',
          },
        }, null, 2),
      },
      {
        path: '/vite.config.ts',
        content: `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})`,
      },
      {
        path: '/src/main.ts',
        content: `import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')`,
      },
      {
        path: '/src/App.vue',
        content: `<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div>
    <h1>{{name}}</h1>
    <button @click="count++">Count is: {{ count }}</button>
  </div>
</template>

<style scoped>
h1 {
  color: #42b983;
}
</style>`,
      },
    ],
    dependencies: ['vue'],
    scripts: {
      dev: 'vite',
      build: 'vue-tsc && vite build',
    },
  },
  // Backend Templates
  {
    id: 'node-express',
    name: 'Node.js + Express',
    description: 'RESTful API server with Express and TypeScript',
    category: 'backend',
    framework: 'Express',
    language: 'typescript',
    icon: '🚀',
    files: [
      {
        path: '/package.json',
        content: JSON.stringify({
          name: '{{name}}',
          version: '0.1.0',
          main: 'dist/index.js',
          scripts: {
            dev: 'tsx watch src/index.ts',
            build: 'tsc',
            start: 'node dist/index.js',
          },
          dependencies: {
            express: '^4.18.0',
            cors: '^2.8.5',
          },
          devDependencies: {
            '@types/express': '^4.17.0',
            '@types/cors': '^2.8.0',
            '@types/node': '^20.0.0',
            tsx: '^4.7.0',
            typescript: '^5.2.0',
          },
        }, null, 2),
      },
      {
        path: '/tsconfig.json',
        content: JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            module: 'commonjs',
            lib: ['ES2020'],
            outDir: './dist',
            rootDir: './src',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true,
          },
          include: ['src/**/*'],
        }, null, 2),
      },
      {
        path: '/src',
        isDirectory: true,
        content: '',
      },
      {
        path: '/src/index.ts',
        content: `import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to {{name}} API' })
})

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`)
})`,
      },
    ],
    dependencies: ['express', 'cors'],
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsc',
      start: 'node dist/index.js',
    },
  },
  {
    id: 'python-fastapi',
    name: 'Python + FastAPI',
    description: 'Modern Python web framework for building APIs',
    category: 'backend',
    framework: 'FastAPI',
    language: 'python',
    icon: '🐍',
    files: [
      {
        path: '/requirements.txt',
        content: `fastapi==0.104.0
uvicorn[standard]==0.24.0`,
      },
      {
        path: '/main.py',
        content: `from fastapi import FastAPI

app = FastAPI(title="{{name}}")

@app.get("/")
def read_root():
    return {"message": "Welcome to {{name}} API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}`,
      },
      {
        path: '/README.md',
        content: `# {{name}}

FastAPI application

## Run

\`\`\`bash
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\``,
      },
    ],
    dependencies: ['fastapi', 'uvicorn'],
    scripts: {
      dev: 'uvicorn main:app --reload',
    },
  },
  // Library Templates
  {
    id: 'typescript-library',
    name: 'TypeScript Library',
    description: 'TypeScript library with build configuration',
    category: 'library',
    language: 'typescript',
    icon: '📦',
    files: [
      {
        path: '/package.json',
        content: JSON.stringify({
          name: '{{name}}',
          version: '0.1.0',
          main: 'dist/index.js',
          types: 'dist/index.d.ts',
          scripts: {
            build: 'tsc',
            dev: 'tsc --watch',
          },
          devDependencies: {
            typescript: '^5.2.0',
          },
        }, null, 2),
      },
      {
        path: '/tsconfig.json',
        content: JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            module: 'commonjs',
            declaration: true,
            outDir: './dist',
            rootDir: './src',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
          },
          include: ['src/**/*'],
        }, null, 2),
      },
      {
        path: '/src',
        isDirectory: true,
        content: '',
      },
      {
        path: '/src/index.ts',
        content: `export function hello(name: string): string {
  return \`Hello, \${name}!\`
}`,
      },
    ],
    scripts: {
      build: 'tsc',
      dev: 'tsc --watch',
    },
  },
];

export class TemplateService {
  private static instance: TemplateService;

  static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  getAllTemplates(): ProjectTemplate[] {
    return TEMPLATES;
  }

  getTemplateById(id: string): ProjectTemplate | null {
    return TEMPLATES.find((t) => t.id === id) || null;
  }

  getTemplatesByCategory(category: ProjectTemplate['category']): ProjectTemplate[] {
    return TEMPLATES.filter((t) => t.category === category);
  }

  instantiateTemplate(templateId: string, projectName: string): TemplateFile[] {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return template.files.map((file) => ({
      ...file,
      content: file.content.replace(/\{\{name\}\}/g, projectName),
    }));
  }
}

export const templateService = TemplateService.getInstance();

