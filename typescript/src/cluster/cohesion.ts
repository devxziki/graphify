// Community cohesion scoring
import { Graph } from 'graphlib';
import { graphEdges } from '../utils/graphlib.js';

/**
 * Calculate cohesion score for a community
 * Ratio of actual intra-community edges to maximum possible
 */
export function cohesionScore(G: Graph, communityNodes: string[]): number {
  const n = communityNodes.length;
  if (n <= 1) {
    return 1.0;
  }

  // Count actual edges within the community
  const nodeSet = new Set(communityNodes);
  let actual = 0;
  const allEdges = graphEdges(G);

  for (const [u, v] of allEdges) {
    if (nodeSet.has(u) && nodeSet.has(v)) {
      actual++;
    }
  }

  // Calculate possible edges
  const possible = (n * (n - 1)) / 2;

  return possible > 0 ? Math.round((actual / possible) * 100) / 100 : 0.0;
}

/**
 * Calculate cohesion scores for all communities
 */
export function scoreAll(
  G: Graph,
  communities: Record<number, string[]>
): Record<number, number> {
  const scores: Record<number, number> = {};

  for (const [cid, nodes] of Object.entries(communities)) {
    scores[parseInt(cid)] = cohesionScore(G, nodes);
  }

  return scores;
}

export default {
  cohesionScore,
  scoreAll
};