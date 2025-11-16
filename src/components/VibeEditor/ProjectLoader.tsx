import { useRef, useState } from 'react';
import { useProjectStore } from '@/services/project/projectStore';
import { sandboxFsService } from '@/services/project/sandboxFsService';
import TechIcon from '../Icons/TechIcon';
import { FolderPlus, FilePlus, FolderOpen, Upload, Download } from 'lucide-react';
import { downloadActiveProjectZip } from '@/services/project/zipService';
import '@/styles/ProjectLoader.css';

interface ProjectLoaderProps {
  onProjectLoaded?: () => void;
}

function ProjectLoader({ onProjectLoaded }: ProjectLoaderProps) {
  const { activeProject, createProject, addFile, setActiveProject } = useProjectStore();
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleNewSandbox = async () => {
    const name = prompt('New project name:', 'Sandbox Project');
    if (!name) return;
    const p = await sandboxFsService.createSandboxProject(name);
    setActiveProject(p.id);
    onProjectLoaded?.();
    setOpen(false);
  };

  const handleAddFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    if (!useProjectStore.getState().activeProject) {
      const p = await sandboxFsService.createSandboxProject('Sandbox');
      setActiveProject(p.id);
    }
    const proj = useProjectStore.getState().activeProject!;
    await sandboxFsService.importFilesToProject(proj, files);
    // Also mirror into projectStore via addFile for immediate UI
    for (const f of Array.from(files)) {
      const text = await f.text();
      const path = `/${f.webkitRelativePath ? f.webkitRelativePath : f.name}`;
      addFile(path, text);
    }
    onProjectLoaded?.();
    setOpen(false);
    // reset input
    e.target.value = '';
  };

  const setupDrop = () => {
    if (!dropRef.current) return;
    const el = dropRef.current;
    const onDragOver = (ev: DragEvent) => {
      ev.preventDefault();
      el.classList.add('drag-over');
    };
    const onDragLeave = (ev: DragEvent) => {
      ev.preventDefault();
      el.classList.remove('drag-over');
    };
    const onDrop = async (ev: DragEvent) => {
      ev.preventDefault();
      el.classList.remove('drag-over');
      const dt = ev.dataTransfer;
      if (!dt) return;
      // Prefer FileList import
      if (dt.files && dt.files.length) {
        if (!useProjectStore.getState().activeProject) {
          const p = await sandboxFsService.createSandboxProject('Sandbox');
          setActiveProject(p.id);
        }
        const proj = useProjectStore.getState().activeProject!;
        await sandboxFsService.importFilesToProject(proj, dt.files);
        for (const f of Array.from(dt.files)) {
          const text = await f.text();
          const path = `/${(f as any).webkitRelativePath ? (f as any).webkitRelativePath : f.name}`;
          addFile(path, text);
        }
        onProjectLoaded?.();
      }
    };
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('drop', onDrop);
    return () => {
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('dragleave', onDragLeave);
      el.removeEventListener('drop', onDrop);
    };
  };

  // initialize drag handlers once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(setupDrop);

  return (
    <div className="project-loader">
      <button
        className="icon-btn"
        onClick={() => setOpen(!open)}
        title="Open / Sandbox"
      >
        <TechIcon icon={FolderOpen} size={18} glow="cyan" />
      </button>
      {open && (
        <div className="loader-menu">
          <button className="loader-item" onClick={handleNewSandbox}>
            <TechIcon icon={FolderPlus} size={16} glow="green" /> New Sandbox Project
          </button>
          <button
            className="loader-item"
            onClick={() => fileInputRef.current?.click()}
          >
            <TechIcon icon={FilePlus} size={16} glow="violet" /> Add File(s)
          </button>
          <button
            className="loader-item"
            onClick={() => dirInputRef.current?.click()}
          >
            <TechIcon icon={Upload} size={16} glow="amber" /> Import Folder
          </button>
          <div className="loader-drop" ref={dropRef}>
            Drag & drop files or folders here
          </div>
          {activeProject && (
            <button className="loader-item" onClick={() => { downloadActiveProjectZip(); setOpen(false); }}>
              <TechIcon icon={Download} size={16} glow="cyan" /> Download Project (.zip)
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleAddFile}
          />
          <input
            ref={dirInputRef}
            type="file"
            // @ts-ignore non-standard but supported in Chromium
            webkitdirectory="true"
            directory="true"
            multiple
            style={{ display: 'none' }}
            onChange={handleAddFile}
          />
        </div>
      )}
    </div>
  );
}

export default ProjectLoader;


