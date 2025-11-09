export interface ProjectFile {
  path: string;
  name: string;
  content: string;
  language?: string;
  isDirectory: boolean;
  children?: ProjectFile[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  rootPath: string;
  files: ProjectFile[];
  createdAt: Date;
  updatedAt: Date;
  status: 'idea' | 'backlog' | 'in-progress' | 'completed' | 'deployed' | 'archived';
  activeFile?: string;
}

export interface EditorState {
  openFiles: string[];
  activeFile: string | null;
  cursorPosition?: { line: number; column: number };
  scrollPosition?: { scrollTop: number; scrollLeft: number };
}

