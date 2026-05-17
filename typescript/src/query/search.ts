// Graph search - BFS/DFS traversal
import { Graph } from 'graphlib';
import { scoreNodes, pickSeeds } from './scoring.js';

export interface QueryResult {
  answer: string;
  nodes: string[];
  edges: string[];
}

/**
 * Find nodes matching a label
 */
export function findNode(G: Graph, label: string): string[] {
  const terms = label.toLowerCase().split(/\s+/);
  const scored = scoreNodes(G, terms);
  return scored.map(s => s.nodeId);
}

/**
 * BFS traversal from seed nodes
 */
function bfsTraverse(
  G: Graph,
  seedNodes: string[],
  depth: number = 2,
  contextFilters?: string[]
): Set<string> {
  const visited = new Set<string>(seedNodes);
  const queue: Array<{ node: string; depth: number }> = seedNodes.map(n => ({ node: n, depth: 0 }));

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.depth >= depth) continue;

    const neighbors = G.neighbors(current.node);
    if (!neighbors) continue;

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        // Check context filters
        if (contextFilters && contextFilters.length > 0) {
          const edgeData = G.edge(current.node, neighbor);
          const relation = (edgeData?.relation as string) || '';
          if (!contextFilters.some(f => relation.toLowerCase().includes(f.toLowerCase()))) {
            continue;
          }
        }

        visited.add(neighbor);
        queue.push({ node: neighbor, depth: current.depth + 1 });
      }
    }
  }

  return visited;
}

/**
 * DFS traversal from seed nodes
 */
function dfsTraverse(
  G: Graph,
  seedNodes: string[],
  depth: number = 2,
  contextFilters?: string[]
): Set<string> {
  const visited = new Set<string>();

  function dfs(node: string, currentDepth: number): void {
    if (currentDepth >= depth || visited.has(node)) return;

    visited.add(node);

    const neighbors = G.neighbors(node);
    if (!neighbors) return;

    for (const neighbor of neighbors) {
      // Check context filters
      if (contextFilters && contextFilters.length > 0) {
        const edgeData = G.edge(node, neighbor);
        const relation = (edgeData?.relation as string) || '';
        if (!contextFilters.some(f => relation.toLowerCase().includes(f.toLowerCase()))) {
          continue;
        }
      }

      dfs(neighbor, currentDepth + 1);
    }
  }

  for (const seed of seedNodes) {
    dfs(seed, 0);
  }

  return visited;
}

/**
 * Query the graph with natural language question
 */
export function queryGraph(
  G: Graph,
  question: string,
  options: {
    mode?: 'bfs' | 'dfs';
    depth?: number;
    tokenBudget?: number;
    contextFilters?: string[];
  } = {}
): QueryResult {
  const {
    mode = 'bfs',
    depth = 2,
    tokenBudget = 2000,
    contextFilters
  } = options;

  // Extract query terms from question
  const terms = question
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);

  if (terms.length === 0) {
    return {
      answer: 'Please provide a valid search query.',
      nodes: [],
      edges: []
    };
  }

  // Score and pick seed nodes
  const scored = scoreNodes(G, terms);
  const seeds = pickSeeds(scored, 3);

  if (seeds.length === 0) {
    return {
      answer: `No nodes found matching: ${question}`,
      nodes: [],
      edges: []
    };
  }

  // Traverse graph
  const visitedNodes = mode === 'dfs'
    ? dfsTraverse(G, seeds, depth, contextFilters)
    : bfsTraverse(G, seeds, depth, contextFilters);

  // Build result
  const nodeLabels = Array.from(visitedNodes).map(nodeId => {
    const data = G.node(nodeId);
    return (data?.label as string) || nodeId;
  });

  // Limit to token budget
  const limitedLabels = nodeLabels.slice(0, Math.floor(tokenBudget / 10));

  const answer = `Found ${visitedNodes.size} nodes related to "${question}":\n` +
    limitedLabels.join(', ') +
    (nodeLabels.length > limitedLabels.length ? ` ... and ${nodeLabels.length - limitedLabels.length} more` : '');

  return {
    answer,
    nodes: Array.from(visitedNodes),
    edges: []
  };
}

export default {
  queryGraph,
  findNode,
  scoreNodes
};