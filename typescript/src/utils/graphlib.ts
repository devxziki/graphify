// Graphlib helper utilities
import { Graph } from 'graphlib';

/**
 * Get all nodes as an array
 */
export function graphNodes(G: Graph): string[] {
  return Array.from(G.nodes());
}

/**
 * Get the degree of a node (number of edges)
 */
export function graphDegree(G: Graph, nodeId: string): number {
  const inEdges = G.inEdges(nodeId) || [];
  const outEdges = G.outEdges(nodeId) || [];
  // For undirected graph, each edge appears twice
  if (!G.isDirected()) {
    return inEdges.length;
  }
  return inEdges.length + outEdges.length;
}

/**
 * Get all node degrees
 */
export function graphDegrees(G: Graph): Record<string, number> {
  const degrees: Record<string, number> = {};
  for (const node of G.nodes()) {
    degrees[node] = graphDegree(G, node);
  }
  return degrees;
}

/**
 * Get neighbors of a node
 */
export function graphNeighbors(G: Graph, nodeId: string): string[] {
  const preds = G.predecessors(nodeId) || [];
  const succs = G.successors(nodeId) || [];
  // Combine and dedupe
  const all = new Set<string>([...preds, ...succs]);
  return Array.from(all);
}

/**
 * Get all edges as array
 */
export function graphEdges(G: Graph): Array<[string, string]> {
  if (G.isDirected()) {
    const edges: Array<[string, string]> = [];
    for (const node of G.nodes()) {
      const succs = G.successors(node);
      if (succs) {
        for (const succ of succs) {
          edges.push([node, succ]);
        }
      }
    }
    return edges;
  } else {
    // For undirected, avoid duplicates
    const seen = new Set<string>();
    const edges: Array<[string, string]> = [];
    for (const node of G.nodes()) {
      const succs = G.successors(node);
      if (succs) {
        for (const succ of succs) {
          const key = node < succ ? `${node}->${succ}` : `${succ}->${node}`;
          if (!seen.has(key)) {
            seen.add(key);
            edges.push([node, succ]);
          }
        }
      }
    }
    return edges;
  }
}

/**
 * Set difference
 */
export function setDifference<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result = new Set<T>();
  for (const item of a) {
    if (!b.has(item)) {
      result.add(item);
    }
  }
  return result;
}

export default {
  graphNodes,
  graphDegree,
  graphDegrees,
  graphNeighbors,
  graphEdges,
  setDifference
};