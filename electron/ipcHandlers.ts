// electron/ipcHandlers.ts
import { ipcMain } from 'electron';
import { projectIndexer } from './ai/projectIndexer';
import { workflowEngine } from './ai/workflowEngine';

export function registerIpcHandlers() {
  console.log('Registering AI IPC handlers...');

  // Handler to start the project indexing
  ipcMain.handle('ai:startIndexing', (event, projectRoot: string) => {
    console.log('IPC received ai:startIndexing with root:', projectRoot);
    return projectIndexer.startIndexing(projectRoot);
  });

  // Handler to stop the project indexing
  ipcMain.handle('ai:stopIndexing', () => {
    return projectIndexer.stopIndexing();
  });

  // Handler to create a plan from a prompt
  ipcMain.handle('ai:createPlan', async (event, prompt: string) => {
    console.log(`IPC received ai:createPlan with prompt: "${prompt}"`);
    try {
      const plan = await workflowEngine.createPlan(prompt);
      return { success: true, plan };
    } catch (error) {
      console.error('Error creating plan via IPC:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  console.log('AI IPC handlers registered.');
}
