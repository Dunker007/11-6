import { knowledgeGraph, CodeNode, KnowledgeGraphData } from './knowledgeGraph';
import * as fs from 'fs/promises';

class SemanticRetriever {
  private graphData: KnowledgeGraphData | null = null;

  public async getContextForPrompt(prompt: string): Promise<string> {
    this.graphData = knowledgeGraph.getGraph();
    if (!this.graphData) {
      return '';
    }

    // 1. Identify keywords and potential file/symbol names from the prompt
    const keywords = this.extractKeywords(prompt);

    // 2. Find relevant nodes from the graph
    const relevantNodes = this.findRelevantNodes(keywords);

    // 3. Rank and select the top N nodes
    const topNodes = this.rankNodes(relevantNodes, keywords).slice(0, 5); // Limit context size

    // 4. Assemble the context string from the selected nodes' file content
    const context = await this.buildContextString(topNodes);

    return context;
  }

  private extractKeywords(prompt: string): string[] {
    // A simple keyword extractor. This can be improved with NLP.
    const words = prompt.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ' ').split(/\s+/);
    // Filter out common stop words
    const stopWords = new Set(['the', 'a', 'an', 'in', 'is', 'to', 'of', 'and', 'for', 'on']);
    return words.filter(word => word.length > 2 && !stopWords.has(word));
  }

  private findRelevantNodes(keywords: string[]): CodeNode[] {
    if (!this.graphData) return [];
    
    const relevantNodes: CodeNode[] = [];
    const addedIds = new Set<string>();

    Object.values(this.graphData.nodes).forEach(node => {
      const nodeNameLower = node.name.toLowerCase();
      const filePathLower = node.filePath.toLowerCase();
      
      for (const keyword of keywords) {
        if (nodeNameLower.includes(keyword) || filePathLower.includes(keyword)) {
          if (!addedIds.has(node.id)) {
            relevantNodes.push(node);
            addedIds.add(node.id);
          }
          break; // Move to next node once a keyword is matched
        }
      }
    });

    return relevantNodes;
  }

  private rankNodes(nodes: CodeNode[], keywords: string[]): CodeNode[] {
    // Simple ranking: more keyword matches = higher score.
    // This can be improved with graph traversal, semantic similarity, etc.
    return nodes.sort((a, b) => {
      const scoreA = keywords.filter(k => a.name.toLowerCase().includes(k) || a.filePath.toLowerCase().includes(k)).length;
      const scoreB = keywords.filter(k => b.name.toLowerCase().includes(k) || b.filePath.toLowerCase().includes(k)).length;
      return scoreB - scoreA;
    });
  }

  private async buildContextString(nodes: CodeNode[]): Promise<string> {
    let context = "Relevant code context:\n\n";
    for (const node of nodes) {
      try {
        const fileContent = await fs.readFile(node.filePath, 'utf-8');
        const lines = fileContent.split('\n');
        // Extract the relevant lines of code for the node.
        const nodeContent = lines.slice(node.start.line - 1, node.end.line).join('\n');

        context += `--- File: ${node.filePath} ---\n`;
        context += `\`\`\`typescript\n${nodeContent}\n\`\`\`\n\n`;
      } catch (error) {
        console.error(`Error reading file for context: ${node.filePath}`, error);
        context += `--- File: ${node.filePath} (Error reading content) ---\n\n`;
      }
    }
    return context;
  }
}

export const semanticRetriever = new SemanticRetriever();
