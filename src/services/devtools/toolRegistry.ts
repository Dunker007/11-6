export interface DevTool {
  id: string;
  name: string;
  category: 'version-control' | 'runtime' | 'package-manager' | 'container' | 'build-tool' | 'testing' | 'linting' | 'database' | 'api-tool' | 'terminal';
  description: string;
  command: string; // Command to check if installed (e.g., 'git --version')
  installCommand?: string; // Command to install
  versionCommand?: string; // Command to get version
  website?: string;
  isInstalled: boolean;
  version?: string;
  autoInstall: boolean; // Should auto-install on first run
}

export const DEV_TOOLS: DevTool[] = [
  // Version Control
  {
    id: 'git',
    name: 'Git',
    category: 'version-control',
    description: 'Distributed version control system',
    command: 'git --version',
    installCommand: 'winget install Git.Git',
    versionCommand: 'git --version',
    website: 'https://git-scm.com',
    isInstalled: false,
    autoInstall: true,
  },
  {
    id: 'gh',
    name: 'GitHub CLI',
    category: 'version-control',
    description: 'GitHub command-line tool',
    command: 'gh --version',
    installCommand: 'winget install GitHub.cli',
    versionCommand: 'gh --version',
    website: 'https://cli.github.com',
    isInstalled: false,
    autoInstall: true,
  },
  // Runtimes
  {
    id: 'node',
    name: 'Node.js',
    category: 'runtime',
    description: 'JavaScript runtime',
    command: 'node --version',
    installCommand: 'winget install OpenJS.NodeJS.LTS',
    versionCommand: 'node --version',
    website: 'https://nodejs.org',
    isInstalled: false,
    autoInstall: true,
  },
  {
    id: 'python',
    name: 'Python',
    category: 'runtime',
    description: 'Python programming language',
    command: 'python --version',
    installCommand: 'winget install Python.Python.3.12',
    versionCommand: 'python --version',
    website: 'https://python.org',
    isInstalled: false,
    autoInstall: true,
  },
  // Package Managers
  {
    id: 'npm',
    name: 'npm',
    category: 'package-manager',
    description: 'Node package manager',
    command: 'npm --version',
    versionCommand: 'npm --version',
    website: 'https://npmjs.com',
    isInstalled: false,
    autoInstall: false, // Comes with Node.js
  },
  {
    id: 'yarn',
    name: 'Yarn',
    category: 'package-manager',
    description: 'Fast, reliable package manager',
    command: 'yarn --version',
    installCommand: 'npm install -g yarn',
    versionCommand: 'yarn --version',
    website: 'https://yarnpkg.com',
    isInstalled: false,
    autoInstall: true,
  },
  {
    id: 'pnpm',
    name: 'pnpm',
    category: 'package-manager',
    description: 'Fast, disk space efficient package manager',
    command: 'pnpm --version',
    installCommand: 'npm install -g pnpm',
    versionCommand: 'pnpm --version',
    website: 'https://pnpm.io',
    isInstalled: false,
    autoInstall: true,
  },
  // Containers
  {
    id: 'docker',
    name: 'Docker',
    category: 'container',
    description: 'Containerization platform',
    command: 'docker --version',
    installCommand: 'winget install Docker.DockerDesktop',
    versionCommand: 'docker --version',
    website: 'https://docker.com',
    isInstalled: false,
    autoInstall: true,
  },
  // Build Tools
  {
    id: 'vite',
    name: 'Vite',
    category: 'build-tool',
    description: 'Next generation frontend tooling',
    command: 'vite --version',
    installCommand: 'npm install -g vite',
    versionCommand: 'vite --version',
    website: 'https://vitejs.dev',
    isInstalled: false,
    autoInstall: false,
  },
  // Testing
  {
    id: 'vitest',
    name: 'Vitest',
    category: 'testing',
    description: 'Fast unit test framework',
    command: 'vitest --version',
    installCommand: 'npm install -g vitest',
    versionCommand: 'vitest --version',
    website: 'https://vitest.dev',
    isInstalled: false,
    autoInstall: false,
  },
  {
    id: 'playwright',
    name: 'Playwright',
    category: 'testing',
    description: 'End-to-end testing framework',
    command: 'playwright --version',
    installCommand: 'npm install -g playwright',
    versionCommand: 'playwright --version',
    website: 'https://playwright.dev',
    isInstalled: false,
    autoInstall: false,
  },
];

