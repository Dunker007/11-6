import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useProjectStore } from './project/projectStore';
import type { Project, ProjectFile } from '@/types/project';

async function addFileToZip(zip: JSZip, basePath: string, file: ProjectFile) {
  const currentPath = file.isDirectory ? `${basePath}${file.name}/` : `${basePath}${file.name}`;
  if (file.isDirectory && file.children) {
    const folder = zip.folder(currentPath) as JSZip;
    for (const child of file.children) {
      await addFileToZip(folder, '', child);
    }
  } else {
    (zip as any).file(currentPath, file.content || '');
  }
}

export async function downloadProjectZip(project: Project) {
  const zip = new JSZip();
  if (project.files && project.files.length > 0) {
    const root = project.files[0];
    const rootFolder = zip.folder(root.name) as JSZip;
    if (root.children) {
      for (const child of root.children) {
        await addFileToZip(rootFolder, '', child);
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${project.name}.zip`);
  }
}

export async function downloadActiveProjectZip() {
  const { activeProject } = useProjectStore.getState();
  if (!activeProject) return;
  await downloadProjectZip(activeProject);
}

export async function downloadFile(path: string) {
  const { activeProject, getFileContent } = useProjectStore.getState();
  if (!activeProject) return;
  const content = getFileContent(path) ?? '';
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const name = path.split('/').pop() || 'file.txt';
  saveAs(blob, name);
}


