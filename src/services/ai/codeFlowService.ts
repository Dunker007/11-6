import { useProjectStore } from '@/services/project/projectStore';

export interface CFNode {
  id: string;
  label: string;
  filePath: string;
}

export interface CFEdge {
  from: string;
  to: string;
}

export interface CFGraph {
  nodes: CFNode[];
  edges: CFEdge[];
}

/**
 * codeFlowService
 * Minimal static analysis to build a file-level dependency graph based on import statements.
 * Works in both Electron and browser (no Node-only APIs).
 */
class CodeFlowService {
  buildGraph(): CFGraph {
    const { activeProject, getFileContent } = useProjectStore.getState();
    if (!activeProject) {
      return { nodes: [], edges: [] };
    }

    // Create node per file
    const nodes = activeProject.files
      .filter((f) => !f.isDirectory)
      .map((f) => ({
        id: f.path,
        label: f.name,
        filePath: f.path,
      }));

    // Build edges by scanning imports
    const edges: CFEdge[] = [];
    const filePaths = new Set(nodes.map((n) => n.filePath));

    for (const node of nodes) {
      const content = getFileContent(node.filePath) || '';
      const importMatches = this.extractImports(content);
      for (const spec of importMatches) {
        const resolved = this.resolveImport(node.filePath, spec);
        if (resolved && filePaths.has(resolved) && resolved !== node.filePath) {
          edges.push({ from: node.filePath, to: resolved });
        }
      }
    }

    return { nodes, edges };
  }

  private extractImports(content: string): string[] {
    const specs: string[] = [];
    const importRegex = /import\s+(?:.+?\s+from\s+)?['"]([^'"]+)['"]/g;
    const requireRegex = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
    let m: RegExpExecArray | null;
    while ((m = importRegex.exec(content)) !== null) {
      specs.push(m[1]);
    }
    while ((m = requireRegex.exec(content)) !== null) {
      specs.push(m[1]);
    }
    return specs;
  }

  // naive resolver: handles relative paths with .ts/.tsx/.js/.jsx inference
  private resolveImport(fromFile: string, spec: string): string | null {
    if (!spec.startsWith('.')) return null;
    const baseDir = fromFile.split('/').slice(0, -1).join('/');
    const joined = this.normalizePath(`${baseDir}/${spec}`);
    const candidates = [
      `${joined}.ts`,
      `${joined}.tsx`,
      `${joined}.js`,
      `${joined}.jsx`,
      `${joined}/index.ts`,
      `${joined}/index.tsx`,
      `${joined}/index.js`,
      `${joined}/index.jsx`,
    ];
    // We cannot stat files here; rely on project file list membership
    const { activeProject } = useProjectStore.getState();
    const files = (activeProject?.files || []).filter((f) => !f.isDirectory).map((f) => f.path);
    for (const c of candidates) {
      if (files.includes(c)) return c;
    }
    return null;
  }

  private normalizePath(path: string): string {
    const parts = path.split('/');
    const stack: string[] = [];
    for (const part of parts) {
      if (part === '' || part === '.') continue;
      if (part === '..') {
        stack.pop();
      } else {
        stack.push(part);
      }
    }
    return stack.join('/');
  }
}

export const codeFlowService = new CodeFlowService();


