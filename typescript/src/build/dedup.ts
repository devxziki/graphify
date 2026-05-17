// Node deduplication
import { GraphNode, GraphEdge } from '../types/index.js';

/**
 * Normalize a label for comparison
 */
function normLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

/**
 * Merge nodes that share a normalised label
 */
export function deduplicateByLabel(
  nodes: GraphNode[],
  edges: GraphEdge[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const chunkSuffixRegex = /_c\d+$/;

  const canonical: Map<string, GraphNode> = new Map();  // normLabel -> surviving node
  const remap: Map<string, string> = new Map();         // old_id -> surviving_id

  for (const node of nodes) {
    const key = normLabel(node.label || node.id);
    if (!key) continue;

    const existing = canonical.get(key);

    if (!existing) {
      canonical.set(key, node);
    } else {
      // Determine which node survives
      const hasSuffix = chunkSuffixRegex.test(node.id);
      const existingHasSuffix = chunkSuffixRegex.test(existing.id);

      if (hasSuffix && !existingHasSuffix) {
        // New node has suffix, old doesn't - keep old
        remap.set(node.id, existing.id);
      } else if (existingHasSuffix && !hasSuffix) {
        // Old has suffix, new doesn't - keep new
        remap.set(existing.id, node.id);
        canonical.set(key, node);
      } else if (node.id.length < existing.id.length) {
        // Shorter ID wins
        remap.set(existing.id, node.id);
        canonical.set(key, node);
      } else {
        remap.set(node.id, existing.id);
      }
    }
  }

  if (remap.size === 0) {
    return { nodes, edges };
  }

  console.error(`[graphify] Deduplicated ${remap.size} duplicate node(s) by label.`);

  // Remap edges
  const dedupedNodes = Array.from(canonical.values());
  const dedupedEdges: GraphEdge[] = [];

  for (const edge of edges) {
    const newEdge = { ...edge };
    newEdge.source = remap.get(edge.source) || edge.source;
    newEdge.target = remap.get(edge.target) || edge.target;

    // Remove self-loops
    if (newEdge.source !== newEdge.target) {
      dedupedEdges.push(newEdge);
    }
  }

  return { nodes: dedupedNodes, edges: dedupedEdges };
}

export default {
  deduplicateByLabel
};