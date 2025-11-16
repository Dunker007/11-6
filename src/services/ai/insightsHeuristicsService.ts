import { useProjectStore } from '@/services/project/projectStore';

class InsightsHeuristicsService {
  summarize(): string {
    const { activeProject, getFileContent } = useProjectStore.getState();
    if (!activeProject) return 'No active project.';
    let totalFiles = 0;
    let totalLines = 0;
    const topBySize: Array<{ path: string; lines: number; imports: number }> = [];

    const walk = (file: any) => {
      if (file.isDirectory && file.children) {
        file.children.forEach(walk);
      } else if (!file.isDirectory) {
        totalFiles++;
        const content = getFileContent(file.path) || '';
        const lines = content.split('\n').length;
        const imports = (content.match(/import\s+|require\(/g) || []).length;
        totalLines += lines;
        topBySize.push({ path: file.path, lines, imports });
      }
    };
    activeProject.files.forEach(walk);
    topBySize.sort((a, b) => b.lines - a.lines);
    const top3 = topBySize.slice(0, 3);

    const bullet = (s: string) => `- ${s}`;
    return [
      `Project: ${activeProject.name}`,
      bullet(`Files: ${totalFiles}`),
      bullet(`Total lines (approx): ${totalLines}`),
      bullet('Largest files:'),
      ...top3.map(t => `  - ${t.path} (${t.lines} LOC, ${t.imports} imports)`),
      bullet('Potential hotspots:'),
      '  - High-LOC files (above) may benefit from splitting or refactoring',
      '  - Modules with many imports may be central and deserve tests',
    ].join('\n');
  }
}

export const insightsHeuristicsService = new InsightsHeuristicsService();


