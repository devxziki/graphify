// Query module - Graph queries and path finding
import { Graph, alg } from 'graphlib';
import { queryGraph, findNode, QueryResult } from './search.js';
import { scoreNodes } from './scoring.js';
import { GraphNode, NodeExplanation } from '../types/index.js';
import { edgeData } from '../build/index.js';
import { graphDegrees } from '../utils/graphlib.js';

/**
 * Find shortest path between two nodes
 */
export function shortestPath(
  G: Graph,
  from: string,
  to: string
): string[] {
  try {
    // Use graphlib's shortest path
    const path = alg.shortestPath(G, from, to);
    return path || [];
  } catch {
    return [];
  }
}

/**
 * Get all edges in path
 */
function getPathEdges(
  G: Graph,
  path: string[]
): Array<{ from: string; to: string; relation: string; confidence: string }> {
  const edges: Array<{ from: string; to: string; relation: string; confidence: string }> = [];

  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];

    // Check both directions
    let data: Record<string, unknown> | undefined;
    let forward = true;

    if (G.hasEdge(u, v)) {
      data = edgeData(G, u, v) as Record<string, unknown>;
    } else if (G.hasEdge(v, u)) {
      data = edgeData(G, v, u) as Record<string, unknown>;
      forward = false;
    }

    if (data) {
      edges.push({
        from: forward ? u : v,
        to: forward ? v : u,
        relation: (data.relation as string) || '',
        confidence: (data.confidence as string) || 'EXTRACTED'
      });
    }
  }

  return edges;
}

/**
 * Explain a node - show its details and connections
 */
export function explainNode(G: Graph, label: string): NodeExplanation | null {
  const matches = findNode(G, label);

  if (matches.length === 0) {
    return null;
  }

  const nodeId = matches[0];
  const data = G.node(nodeId) as Record<string, unknown>;

  const connections: NodeExplanation['connections'] = [];

  // Get successors (outgoing edges)
  const successors = G.successors(nodeId) || [];
  for (const succ of successors) {
    const edge = edgeData(G, nodeId, succ);
    connections.push({
      direction: 'out',
      node: (G.node(succ)?.label as string) || succ,
      relation: (edge.relation as string) || '',
      confidence: (edge.confidence as 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS') || 'EXTRACTED'
    });
  }

  // Get predecessors (incoming edges)
  const predecessors = G.predecessors(nodeId) || [];
  for (const pred of predecessors) {
    const edge = edgeData(G, pred, nodeId);
    connections.push({
      direction: 'in',
      node: (G.node(pred)?.label as string) || pred,
      relation: (edge.relation as string) || '',
      confidence: (edge.confidence as 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS') || 'EXTRACTED'
    });
  }

  return {
    id: nodeId,
    label: (data?.label as string) || nodeId,
    source_file: (data?.source_file as string) || '',
    source_location: (data?.source_location as string) || undefined,
    file_type: (data?.file_type as 'code' | 'document' | 'paper' | 'image' | 'rationale' | 'concept') || 'code',
    community: (data?.community as number) || 0,
    degree: graphDegrees(G)[nodeId] || 0,
    connections
  };
}

/**
 * Query the graph
 */
export function query(
  G: Graph,
  question: string,
  options?: {
    mode?: 'bfs' | 'dfs';
    depth?: number;
    tokenBudget?: number;
    contextFilters?: string[];
  }
): QueryResult {
  return queryGraph(G, question, options);
}

export default {
  query,
  shortestPath,
  explainNode,
  findNode,
  scoreNodes
};