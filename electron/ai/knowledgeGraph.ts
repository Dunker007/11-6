import * as ts from 'typescript';

// Define the structure of our knowledge graph nodes and edges
export interface CodeNode {
  id: string; // e.g., 'src/services/ai/knowledgeGraph.ts:KnowledgeGraph'
  type: 'File' | 'Component' | 'Function' | 'Interface' | 'Type' | 'Variable' | 'Import';
  name: string;
  filePath: string;
  start: { line: number; column: number };
  end: { line: number; column: number };
  exports?: string[]; // Names of exports from this node
  summary?: string; // AI-generated summary (future)
}

export interface CodeEdge {
  sourceId: string; // ID of the source node
  targetId: string; // ID of the target node
  type: 'IMPORTS' | 'USES' | 'DEFINES' | 'EXTENDS';
}

export interface KnowledgeGraphData {
  nodes: Record<string, CodeNode>;
  edges: CodeEdge[];
}

class KnowledgeGraph {
  private graph: KnowledgeGraphData = { nodes: {}, edges: [] };

  public async indexFile(filePath: string, fileContent: string) {
    // Add the file itself as a node
    const fileId = filePath;
    this.graph.nodes[fileId] = {
      id: fileId,
      type: 'File',
      name: filePath.split('/').pop() || '',
      filePath,
      start: { line: 1, column: 0 },
      end: { line: fileContent.split('\n').length, column: 0 },
    };

    try {
      const sourceFile = ts.createSourceFile(
        filePath,
        fileContent,
        ts.ScriptTarget.Latest,
        true
      );
      this.visit(sourceFile, sourceFile);
    } catch (error) {
      console.error(`Failed to parse ${filePath}:`, error);
    }
  }

  private visit(node: ts.Node, sourceFile: ts.SourceFile) {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isEnumDeclaration(node) ||
      ts.isVariableStatement(node)
    ) {
      this.addNodeFromDeclaration(node, sourceFile);
    }

    ts.forEachChild(node, (child) => this.visit(child, sourceFile));
  }
  
  private addNodeFromDeclaration(declaration: ts.DeclarationStatement | ts.VariableStatement, sourceFile: ts.SourceFile) {
    let nameNode: ts.Node | undefined;

    if(ts.isVariableStatement(declaration)) {
        // Handle const MyComponent = () => {}
        const varDeclaration = declaration.declarationList.declarations[0];
        if (varDeclaration && ts.isIdentifier(varDeclaration.name)) {
            nameNode = varDeclaration.name;
        }
    } else if ('name' in declaration && declaration.name && ts.isIdentifier(declaration.name)) {
        // Handle function MyComponent() {}
        nameNode = declaration.name;
    }

    if (!nameNode) return;

    const name = nameNode.getText(sourceFile);
    const filePath = sourceFile.fileName;
    const nodeId = `${filePath}:${name}`;

    const isExported = !!(ts.getCombinedModifierFlags(declaration as ts.Declaration) & ts.ModifierFlags.Export);

    let nodeType: CodeNode['type'] = 'Variable';
    if(ts.isFunctionDeclaration(declaration) || (ts.isVariableStatement(declaration) && declaration.declarationList.declarations[0].initializer && ts.isArrowFunction(declaration.declarationList.declarations[0].initializer))) {
        nodeType = 'Function';
        if (name[0] === name[0].toUpperCase()) {
            nodeType = 'Component';
        }
    } else if(ts.isInterfaceDeclaration(declaration)) {
        nodeType = 'Interface';
    } else if(ts.isTypeAliasDeclaration(declaration)) {
        nodeType = 'Type';
    }

    const startPos = sourceFile.getLineAndCharacterOfPosition(declaration.getStart(sourceFile));
    const endPos = sourceFile.getLineAndCharacterOfPosition(declaration.getEnd());
    
    this.graph.nodes[nodeId] = {
      id: nodeId,
      type: nodeType,
      name,
      filePath,
      start: { line: startPos.line + 1, column: startPos.character },
      end: { line: endPos.line + 1, column: endPos.character },
      exports: isExported ? [name] : [],
    };
  
    // Add an edge from the file to this new node
    this.graph.edges.push({
      sourceId: filePath,
      targetId: nodeId,
      type: 'DEFINES',
    });
  }

  public getGraph(): KnowledgeGraphData {
    return this.graph;
  }
}

export const knowledgeGraph = new KnowledgeGraph();
