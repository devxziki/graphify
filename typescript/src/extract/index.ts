// Main extraction module
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, extname } from 'path';
import { GraphNode, GraphEdge, ExtractionResult } from '../types/index.js';
import { getLanguageFromExtension, getLanguageConfig } from './languages/types.js';
import { makeId, fileStem, createFileNode, createClassNode, createFunctionNode, createImportEdge, createContainsEdge } from './utils.js';

/**
 * Simple regex-based extraction for JavaScript/TypeScript
 * Note: This is a simplified version. For production, use tree-sitter.
 */
function extractJSLike(
  content: string,
  filePath: string
): ExtractionResult {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const lines = content.split('\n');

  // Create file node
  const fileNode = createFileNode(filePath, 'code');
  nodes.push(fileNode);

  const fileId = fileNode.id;
  const seenClasses = new Set<string>();
  const seenFunctions = new Set<string>();

  // Extract classes
  const classRegex = /(?:export\s+)?class\s+(\w+)/g;
  let match;
  while ((match = classRegex.exec(content)) !== null) {
    const className = match[1];
    if (!seenClasses.has(className)) {
      seenClasses.add(className);
      const lineNum = content.slice(0, match.index).split('\n').length;
      const classNode = createClassNode(className, filePath, lineNum);
      nodes.push(classNode);
      edges.push(createContainsEdge(fileId, classNode.id, filePath, lineNum));
    }
  }

  // Extract functions (including async and arrow)
  const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
  while ((match = funcRegex.exec(content)) !== null) {
    const funcName = match[1];
    if (!seenFunctions.has(funcName)) {
      seenFunctions.add(funcName);
      const lineNum = content.slice(0, match.index).split('\n').length;
      const funcNode = createFunctionNode(funcName, filePath, lineNum);
      nodes.push(funcNode);
      edges.push(createContainsEdge(fileId, funcNode.id, filePath, lineNum));
    }
  }

  // Extract arrow functions assigned to const/let
  const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[^=])\s*=>/g;
  while ((match = arrowRegex.exec(content)) !== null) {
    const funcName = match[1];
    if (!seenFunctions.has(funcName)) {
      seenFunctions.add(funcName);
      const lineNum = content.slice(0, match.index).split('\n').length;
      const funcNode = createFunctionNode(funcName, filePath, lineNum);
      nodes.push(funcNode);
      edges.push(createContainsEdge(fileId, funcNode.id, filePath, lineNum));
    }
  }

  // Extract imports
  const importRegex = /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = importRegex.exec(content)) !== null) {
    const modulePath = match[1];
    const lineNum = content.slice(0, match.index).split('\n').length;

    // Determine import target
    const importId = makeId(modulePath);
    edges.push(createImportEdge(fileId, importId, filePath, lineNum, 'imports_from'));
  }

  // Extract calls to functions within file
  for (const funcNode of nodes.filter(n => n.label.endsWith('()'))) {
    const funcName = funcNode.label.slice(0, -2);
    const callRegex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
    while ((match = callRegex.exec(content)) !== null) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      if (funcNode.source_location) {
        const defLine = parseInt(funcNode.source_location.slice(1));
        if (Math.abs(lineNum - defLine) > 1) {
          edges.push({
            source: fileId,
            target: funcNode.id,
            relation: 'calls',
            confidence: 'EXTRACTED',
            source_file: filePath,
            source_location: `L${lineNum}`,
            weight: 1.0
          });
        }
      }
    }
  }

  return { nodes, edges };
}

/**
 * Simple regex-based extraction for Python
 */
function extractPython(
  content: string,
  filePath: string
): ExtractionResult {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Create file node
  const fileNode = createFileNode(filePath, 'code');
  nodes.push(fileNode);

  const fileId = fileNode.id;
  const seenClasses = new Set<string>();
  const seenFunctions = new Set<string>();

  // Extract classes
  const classRegex = /class\s+(\w+)(?:\([^)]*\))?:/g;
  let match;
  while ((match = classRegex.exec(content)) !== null) {
    const className = match[1];
    if (!seenClasses.has(className)) {
      seenClasses.add(className);
      const lineNum = content.slice(0, match.index).split('\n').length;
      const classNode = createClassNode(className, filePath, lineNum);
      nodes.push(classNode);
      edges.push(createContainsEdge(fileId, classNode.id, filePath, lineNum));
    }
  }

  // Extract functions
  const funcRegex = /def\s+(\w+)\s*\(/g;
  while ((match = funcRegex.exec(content)) !== null) {
    const funcName = match[1];
    if (!seenFunctions.has(funcName)) {
      seenFunctions.add(funcName);
      const lineNum = content.slice(0, match.index).split('\n').length;
      const funcNode = createFunctionNode(funcName, filePath, lineNum);
      nodes.push(funcNode);
      edges.push(createContainsEdge(fileId, funcNode.id, filePath, lineNum));
    }
  }

  // Extract imports
  const importRegex = /(?:^|\n)\s*(?:import\s+([^\n]+)|from\s+([^\s]+)\s+import)/g;
  while ((match = importRegex.exec(content)) !== null) {
    const modulePath = match[1] || match[2];
    if (!modulePath) continue;

    const lineNum = content.slice(0, match.index).split('\n').length;
    const importId = makeId(modulePath.trim());
    edges.push(createImportEdge(fileId, importId, filePath, lineNum, 'imports'));
  }

  return { nodes, edges };
}

/**
 * Extract from a single file
 */
function extractFile(filePath: string): ExtractionResult {
  const ext = extname(filePath).toLowerCase();

  // Check if file exists
  if (!existsSync(filePath)) {
    return { nodes: [], edges: [], error: `File not found: ${filePath}` };
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lang = getLanguageFromExtension(ext);

    // Use appropriate extractor
    if (lang === 'javascript' || lang === 'typescript') {
      return extractJSLike(content, filePath);
    } else if (lang === 'python') {
      return extractPython(content, filePath);
    }

    // For unsupported languages, just create a file node
    return {
      nodes: [createFileNode(filePath, 'code')],
      edges: []
    };
  } catch (error) {
    return {
      nodes: [],
      edges: [],
      error: `Error reading file ${filePath}: ${error}`
    };
  }
}

/**
 * Extract from a directory
 */
export function extract(
  rootPath: string,
  options: {
    includeExtensions?: string[];
    excludeDirs?: string[];
  } = {}
): ExtractionResult {
  const { includeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java'] } = options;
  const allNodes: GraphNode[] = [];
  const allEdges: GraphEdge[] = [];

  // Walk directory
  function walkDir(dir: string): void {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = resolve(dir, entry);

      try {
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip common noise directories
          if (['node_modules', '.git', 'dist', 'build', '__pycache__', 'venv'].includes(entry)) {
            continue;
          }
          walkDir(fullPath);
        } else if (stat.isFile()) {
          const ext = extname(entry).toLowerCase();

          if (includeExtensions.includes(ext)) {
            const result = extractFile(fullPath);
            allNodes.push(...result.nodes);
            allEdges.push(...result.edges);

            if (result.error) {
              console.error(`[graphify] Warning: ${result.error}`);
            }
          }
        }
      } catch {
        // Skip inaccessible files
      }
    }
  }

  walkDir(resolve(rootPath));

  return { nodes: allNodes, edges: allEdges };
}

export default {
  extract,
  extractFile
};