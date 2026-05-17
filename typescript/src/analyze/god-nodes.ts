// God nodes - most connected entities
import { Graph } from 'graphlib';
import { GodNode } from '../types/index.js';
import { graphDegree, graphDegrees } from '../utils/graphlib.js';

/**
 * Check if a node is a file-level hub node
 */
export function isFileNode(G: Graph, nodeId: string): boolean {
  const data = G.node(nodeId);
  if (!data) return false;

  const label = data.label as string || '';
  const sourceFile = data.source_file as string || '';

  if (!label || !sourceFile) return false;

  // File-level hub: label matches the actual source filename
  const fileName = sourceFile.split('/').pop() || '';
  if (label === fileName) {
    return true;
  }

  // Method stub: AST extractor labels methods as '.method_name()'
  if (label.startsWith('.') && label.endsWith('()')) {
    return true;
  }

  // Module-level function stub: labeled 'function_name()' - only has a contains edge
  if (label.endsWith('()') && graphDegree(G, nodeId) <= 1) {
    return true;
  }

  return false;
}

/**
 * Check if a node is a concept node (empty source_file or no file extension)
 */
export function isConceptNode(G: Graph, nodeId: string): boolean {
  const data = G.node(nodeId);
  if (!data) return false;

  const source = data.source_file as string || '';
  if (!source) return true;

  // Has no file extension - probably a concept
  const fileName = source.split('/').pop() || '';
  if (!fileName.includes('.')) return true;

  return false;
}

/**
 * Find the most connected nodes (god nodes)
 */
export function godNodes(G: Graph, topN: number = 10): GodNode[] {
  const degree = graphDegrees(G);
  const sortedNodes = Object.entries(degree)
    .map(([nodeId, deg]) => ({ nodeId, degree: deg }))
    .sort((a, b) => b.degree - a.degree);

  const result: GodNode[] = [];

for (const { nodeId, degree: deg } of sortedNodes) {
    if (isFileNode(G, nodeId) || isConceptNode(G, nodeId)) {
      continue;
    }

    const data = G.node(nodeId);
    result.push({
      id: nodeId,
      label: (data?.label as string) || nodeId,
      degree: deg
    });

    if (result.length >= topN) {
      break;
    }
  }

  return result;
}

export default {
  godNodes
};