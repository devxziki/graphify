// Surprising connections detection
import { Graph } from 'graphlib';
import { SurprisingConnection, Communities, Confidence } from '../types/index.js';
import { isFileNode, isConceptNode } from './god-nodes.js';
import { graphEdges, graphNodes } from '../utils/graphlib.js';

/**
 * Get node community map
 */
function nodeCommunityMap(communities: Communities): Map<string, number> {
  const map = new Map<string, number>();
  for (const [cid, nodes] of Object.entries(communities)) {
    for (const node of nodes) {
      map.set(node, parseInt(cid));
    }
  }
  return map;
}

/**
 * Find surprising connections in the graph
 */
export function surprisingConnections(
  G: Graph,
  communities: Communities | null = null,
  topN: number = 5
): SurprisingConnection[] {
  // Identify unique source files
  const sourceFiles = new Set<string>();
  for (const nodeId of graphNodes(G)) {
    const data = G.node(nodeId);
    const source = data?.source_file as string || '';
    if (source) sourceFiles.add(source);
  }

  const isMultiSource = sourceFiles.size > 1;
  const communities_ = communities || {};

  if (isMultiSource) {
    return crossFileSurprises(G, communities_, topN);
  } else {
    return crossCommunitySurprises(G, communities_, topN);
  }
}

/**
 * Find cross-file surprising connections
 */
function crossFileSurprises(
  G: Graph,
  communities: Communities,
  topN: number
): SurprisingConnection[] {
  const nodeCommunity = nodeCommunityMap(communities);
  const candidates: SurprisingConnection[] = [];
  const edges = graphEdges(G);

  for (const [u, v] of edges) {
    const data = G.edge(u, v) as Record<string, unknown>;
    const relation = data.relation as string || '';

    if (['imports', 'imports_from', 'contains', 'method'].includes(relation)) {
      continue;
    }

    if (isFileNode(G, u) || isFileNode(G, v)) continue;
    if (isConceptNode(G, u) || isConceptNode(G, v)) continue;

    const uSource = (G.node(u)?.source_file as string) || '';
    const vSource = (G.node(v)?.source_file as string) || '';

    if (!uSource || !vSource || uSource === vSource) {
      continue;
    }

    const confidence = (data.confidence as Confidence) || 'EXTRACTED';
    let score = 1;
    if (confidence === 'AMBIGUOUS') score = 3;
    else if (confidence === 'INFERRED') score = 2;

    const uComm = nodeCommunity.get(u);
    const vComm = nodeCommunity.get(v);
    if (uComm !== undefined && vComm !== undefined && uComm !== vComm) {
      score += 1;
    }

    candidates.push({
      source: (G.node(u)?.label as string) || u,
      target: (G.node(v)?.label as string) || v,
      source_files: [uSource, vSource],
      confidence,
      relation,
      why: `cross-file ${confidence.toLowerCase()} connection`
    });
  }

  candidates.sort((a, b) => {
    const scoreA = a.confidence === 'AMBIGUOUS' ? 3 : a.confidence === 'INFERRED' ? 2 : 1;
    const scoreB = b.confidence === 'AMBIGUOUS' ? 3 : b.confidence === 'INFERRED' ? 2 : 1;
    return scoreB - scoreA;
  });

  return candidates.slice(0, topN);
}

/**
 * Find cross-community surprising connections
 */
function crossCommunitySurprises(
  G: Graph,
  communities: Communities,
  topN: number
): SurprisingConnection[] {
  if (Object.keys(communities).length === 0) {
    return [];
  }

  const nodeCommunity = nodeCommunityMap(communities);
  const surprises: SurprisingConnection[] = [];
  const edges = graphEdges(G);

  for (const [u, v] of edges) {
    const uComm = nodeCommunity.get(u);
    const vComm = nodeCommunity.get(v);

    // Skip same community or missing community
    if (uComm === undefined || vComm === undefined || uComm === vComm) {
      continue;
    }

    // Skip file/concept nodes
    if (isFileNode(G, u) || isFileNode(G, v)) continue;

    const data = G.edge(u, v) as Record<string, unknown>;
    const relation = data.relation as string || '';

    // Skip structural edges
    if (['imports', 'imports_from', 'contains', 'method'].includes(relation)) {
      continue;
    }

    const confidence = (data.confidence as Confidence) || 'EXTRACTED';

    surprises.push({
      source: (G.node(u)?.label as string) || u,
      target: (G.node(v)?.label as string) || v,
      source_files: [
        (G.node(u)?.source_file as string) || '',
        (G.node(v)?.source_file as string) || ''
      ],
      confidence,
      relation,
      note: `Bridges community ${uComm} → community ${vComm}`
    });
  }

  // Sort: AMBIGUOUS first, then INFERRED, then EXTRACTED
  const order: Record<Confidence, number> = {
    AMBIGUOUS: 0,
    INFERRED: 1,
    EXTRACTED: 2
  };

  surprises.sort((a, b) => order[a.confidence] - order[b.confidence]);

  return surprises.slice(0, topN);
}

export default {
  surprisingConnections
};