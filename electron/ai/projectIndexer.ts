import { knowledgeGraph } from './knowledgeGraph';
import * as chokidar from 'chokidar';
import * as fs from 'fs/promises';
import * as path from 'path';

class ProjectIndexer {
  private watcher: chokidar.FSWatcher | null = null;
  private isIndexing = false;

  public async startIndexing(projectRoot: string | null) {
    if (this.isIndexing) {
      console.log('Project is already being indexed.');
      return;
    }

    if (!projectRoot) {
      console.error('No active project to index.');
      return;
    }

    this.isIndexing = true;
    console.log(`Starting to index project at: ${projectRoot}`);

    // Initial scan
    await this.scanDirectory(projectRoot);

    // Set up watcher
    this.watcher = chokidar.watch(projectRoot, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on('add', filePath => this.handleFileChange(filePath))
      .on('change', filePath => this.handleFileChange(filePath))
      .on('unlink', filePath => this.handleFileDelete(filePath));

    console.log('Project indexing and watching started.');
  }

  public stopIndexing() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.isIndexing = false;
    console.log('Project indexing stopped.');
  }

  private async scanDirectory(dir: string) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            // Avoid node_modules, dist, etc. for performance
            if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
               await this.scanDirectory(fullPath);
            }
          } else if (this.isSupportedFile(entry.name)) {
            await this.handleFileChange(fullPath);
          }
        }
    } catch (error) {
        console.error(`Error scanning directory ${dir}:`, error);
    }
  }

  private async handleFileChange(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      await knowledgeGraph.indexFile(filePath, content);
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }

  private handleFileDelete(filePath: string) {
    // In a more complete implementation, we would remove nodes and edges related to this file.
    console.log(`File deleted: ${filePath}. Graph needs updating.`);
  }

  private isSupportedFile(fileName: string): boolean {
    const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    return supportedExtensions.includes(path.extname(fileName));
  }
}

export const projectIndexer = new ProjectIndexer();
