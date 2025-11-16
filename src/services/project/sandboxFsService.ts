/**
 * sandboxFsService
 *
 * Browser-friendly virtual filesystem for “sandbox” projects.
 * Persists via IndexedDB when available, otherwise falls back to localStorage.
 * Integrates with projectService to reflect files in the existing project store.
 */
import { projectService } from './projectService';
import type { Project, ProjectFile } from '@/types/project';

type IDBPromisable<T> = Promise<T>;

function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

const DB_NAME = 'dlx-sandbox-fs';
const DB_STORE = 'files';

async function openDb(): IDBPromisable<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'path' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(path: string, content: string): IDBPromisable<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put({ path, content });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(path: string): IDBPromisable<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).get(path);
    req.onsuccess = () => resolve(req.result ? (req.result.content as string) : null);
    req.onerror = () => reject(req.error);
  });
}

async function idbList(prefix: string): IDBPromisable<Array<{ path: string; content: string }>> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.openCursor ? tx.objectStore(DB_STORE).openCursor() : null;
    const out: Array<{ path: string; content: string }> = [];
    if (!store) {
      resolve(out);
      return;
    }
    store.onsuccess = (ev: any) => {
      const cursor = ev.target.result as IDBCursorWithValue | null;
      if (!cursor) {
        resolve(out);
        return;
      }
      const val = cursor.value as { path: string; content: string };
      if (val.path && val.path.startsWith(prefix)) {
        out.push(val);
      }
      cursor.continue();
    };
    store.onerror = () => reject((store as any).error);
  });
}

class SandboxFsService {
  async createSandboxProject(name: string): Promise<Project> {
    const project = projectService.createProject(name);
    return project;
  }

  async addFile(project: Project, path: string, content: string): Promise<void> {
    projectService.addFile(project.id, path, content);
    if (hasIndexedDB()) {
      await idbPut(`${project.id}:${path}`, content);
    } else {
      localStorage.setItem(`sandbox:${project.id}:${path}`, content);
    }
  }

  async getFile(project: Project, path: string): Promise<string | null> {
    if (hasIndexedDB()) {
      const v = await idbGet(`${project.id}:${path}`);
      return v;
    }
    return localStorage.getItem(`sandbox:${project.id}:${path}`);
  }

  async importFilesToProject(project: Project, files: FileList): Promise<void> {
    for (const f of Array.from(files)) {
      if (f.type === '' && !f.name) continue;
      const text = await f.text();
      const targetPath = `/${f.webkitRelativePath ? f.webkitRelativePath : f.name}`;
      await this.addFile(project, targetPath, text);
    }
  }

  toProjectFileTree(files: Array<{ path: string; content: string }>, rootName: string): ProjectFile {
    const root: ProjectFile = { path: `/${rootName}`, name: rootName, content: '', isDirectory: true, children: [] };
    const ensureDir = (dir: ProjectFile, segments: string[], filePath: string, content: string) => {
      if (segments.length === 0) return;
      const [head, ...rest] = segments;
      if (rest.length === 0) {
        const file: ProjectFile = { path: `${dir.path}/${head}`, name: head, content, isDirectory: false };
        dir.children = dir.children || [];
        dir.children.push(file);
        return;
      }
      dir.children = dir.children || [];
      let next = dir.children.find((c) => c.isDirectory && c.name === head);
      if (!next) {
        next = { path: `${dir.path}/${head}`, name: head, content: '', isDirectory: true, children: [] };
        dir.children.push(next);
      }
      ensureDir(next, rest, filePath, content);
    };
    for (const f of files) {
      const parts = f.path.split('/').filter(Boolean);
      ensureDir(root, parts, f.path, f.content);
    }
    return root;
  }
}

export const sandboxFsService = new SandboxFsService();


