// JSON export for graph.json
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { Graph } from 'graphlib';
import { GraphNode, GraphEdge, Communities, FileType } from '../types/index.js';
import { graphNodes, graphEdges } from '../utils/graphlib.js';

const CONFIDENCE_SCORE_DEFAULTS: Record<string, number> = {
  EXTRACTED: 1.0,
  INFERRED: 0.5,
  AMBIGUOUS: 0.2
};

/**
 * Strip diacritics from text for normalized labels
 */
function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Export graph to JSON
 */
export function toJSON(
  G: Graph,
  communities: Communities,
  outputPath: string,
  options: {
    force?: boolean;
    builtAtCommit?: string;
  } = {}
): void {
  // Ensure directory exists
  const dir = dirname(outputPath);
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Get node community map
  const nodeCommunity: Map<string, number> = new Map();
  for (const [cid, nodes] of Object.entries(communities)) {
    for (const node of nodes) {
      nodeCommunity.set(node, parseInt(cid));
    }
  }

  // Build nodes
  const nodes: GraphNode[] = graphNodes(G).map(nodeId => {
    const data = G.node(nodeId) as Record<string, unknown>;
    return {
      id: nodeId,
      label: (data.label as string) || nodeId,
      file_type: (data.file_type as FileType) || 'concept',
      source_file: (data.source_file as string) || '',
      source_location: (data.source_location as string | null) || null,
      community: nodeCommunity.get(nodeId),
      norm_label: stripDiacritics((data.label as string) || '').toLowerCase()
    };
  });

  // Build edges
  const edges: GraphEdge[] = graphEdges(G).map(([u, v]) => {
    const data = G.edge(u, v) as Record<string, unknown>;

    const confidence = (data.confidence as string) || 'EXTRACTED';
    const confidenceScore = data.confidence_score as number ||
      CONFIDENCE_SCORE_DEFAULTS[confidence] ||
      1.0;

    // Restore original edge direction
    const trueSrc = data._src as string || u;
    const trueTgt = data._tgt as string || v;

    return {
      source: trueSrc,
      target: trueTgt,
      relation: (data.relation as string) || 'related_to',
      confidence: confidence as 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS',
      source_file: (data.source_file as string) || '',
      source_location: (data.source_location as string) || undefined,
      weight: (data.weight as number) || 1.0,
      confidence_score: confidenceScore
    };
  });

  // Build output
  const output: Record<string, unknown> = {
    nodes,
    edges,
    directed: G.isDirected()
  };

  // Add git commit if available
  if (options.builtAtCommit) {
    output.built_at_commit = options.builtAtCommit;
  }

  writeFileSync(outputPath, JSON.stringify(output, null, 2));
}

export default {
  toJSON
};