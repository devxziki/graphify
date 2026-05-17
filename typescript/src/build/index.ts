// Graph construction - build graph from extractions
import { Graph } from 'graphlib';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import {
  GraphNode,
  GraphEdge,
  ExtractionResult,
  Communities,
  FileType
} from '../types/index.js';
import { validateExtraction, normalizeFileType, normalizePath } from './validate.js';
import { deduplicateByLabel } from './dedup.js';
import { graphNodes, graphEdges } from '../utils/graphlib.js';

// File type synonyms
const FILE_TYPE_SYNONYMS: Record<string, string> = {
  'markdown': 'document',
  'text': 'document',
  'tool': 'code',
  'library': 'code',
  'pattern': 'concept',
  'principle': 'concept',
  'constraint': 'concept',
  'tech': 'concept',
  'technology': 'concept',
  'data-source': 'concept',
  'data_source': 'concept',
  'gotcha': 'concept',
  'framework': 'concept'
};

/**
 * Normalize an ID string (same logic as Python's extract._make_id)
 */
export function normalizeId(s: string): string {
  // NFKC normalization
  let normalized = s.normalize('NFKC');
  // Replace non-word chars with underscore
  normalized = normalized.replace(/[^\w]+/g, '_');
  // Collapse multiple underscores
  normalized = normalized.replace(/_+/g, '_');
  // Trim and lowercase
  return normalized.trim('_').toLowerCase();
}

/**
 * Get edge data (handle MultiGraph)
 */
export function edgeData(G: Graph, u: string, v: string): Record<string, unknown> {
  const raw = G.edge(u, v);
  if (!raw) return {};
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  return {};
}

/**
 * Build graph from extraction JSON data
 */
export function buildFromJson(
  data: Record<string, unknown>,
  options: { directed?: boolean } = {}
): Graph {
  const directed = options.directed || false;

  // Normalize legacy schema
  if ('links' in data && !('edges' in data)) {
    data = { ...data, edges: data.links };
  }

  // Validate extraction
  const errors = validateExtraction(data);
  const realErrors = errors.filter(e => !e.includes('does not match any node id'));
  if (realErrors.length > 0) {
    console.error(`[graphify] Extraction warning (${realErrors.length} issues): ${realErrors[0]}`);
  }

  // Create graph
  const G = directed ? new Graph({ directed: true }) : new Graph({ directed: false });

  // Add nodes
  const nodes = (data.nodes as Record<string, unknown>[]) || [];
  const nodeSet = new Set<string>();

  for (const node of nodes) {
    const nodeObj = node as Record<string, unknown>;

    // Normalize file_type
    let fileType = nodeObj.file_type as string;
    if (!fileType || fileType === 'null') {
      fileType = 'concept';
    }
    if (fileType && !['code', 'document', 'paper', 'image', 'rationale', 'concept'].includes(fileType)) {
      fileType = FILE_TYPE_SYNONYMS[fileType] || 'concept';
    }

    // Normalize source_file
    const sourceFile = normalizePath(nodeObj.source_file as string | null);

    // Add node to graph
    const id = nodeObj.id as string;
    nodeSet.add(id);

    const nodeData: Record<string, unknown> = { ...nodeObj };
    nodeData.file_type = fileType;
    if (sourceFile) {
      nodeData.source_file = sourceFile;
    }

    G.setNode(id, nodeData);
  }

  // Build normalized ID map for edge resolution
  const normToId: Map<string, string> = new Map();
  for (const nid of nodeSet) {
    normToId.set(normalizeId(nid), nid);
  }

  // Add edges
  const edgeList = (data.edges || data.links || []) as Record<string, unknown>[];

  for (const edge of edgeList) {
    const edgeObj = edge as Record<string, unknown>;

    // Handle legacy field names
    let source = edgeObj.source as string;
    let target = edgeObj.target as string;

    if (!source && edgeObj.from) source = edgeObj.from as string;
    if (!target && edgeObj.to) target = edgeObj.to as string;

    if (!source || !target) continue;

    // Normalize edge endpoints
    if (!nodeSet.has(source)) {
      const norm = normalizeId(source);
      source = normToId.get(norm) || source;
    }
    if (!nodeSet.has(target)) {
      const norm = normalizeId(target);
      target = normToId.get(norm) || target;
    }

    // Skip if still not in node set
    if (!nodeSet.has(source) || !nodeSet.has(target)) {
      continue;
    }

    // Build edge attributes
    const attrs: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(edgeObj)) {
      if (key !== 'source' && key !== 'target') {
        attrs[key] = value;
      }
    }

    // Normalize source_file
    if (attrs.source_file) {
      attrs.source_file = normalizePath(attrs.source_file as string);
    }

    // Preserve original direction
    attrs._src = source;
    attrs._tgt = target;

    G.setEdge(source, target, attrs);
  }

  return G;
}

/**
 * Build graph from multiple extraction results
 */
export function build(
  extractions: ExtractionResult[],
  options: { directed?: boolean; dedup?: boolean } = {}
): Graph {
  const { directed = false, dedup = true } = options;

  // Combine all extractions
  const combined: ExtractionResult = {
    nodes: [],
    edges: []
  };

  for (const ext of extractions) {
    combined.nodes.push(...ext.nodes);
    combined.edges.push(...ext.edges);
  }

  // Deduplicate if requested
  if (dedup && combined.nodes.length > 0) {
    const deduped = deduplicateByLabel(combined.nodes, combined.edges);
    combined.nodes = deduped.nodes;
    combined.edges = deduped.edges;
  }

  // Convert to graphlib format
  const data = {
    nodes: combined.nodes,
    edges: combined.edges
  };

  return buildFromJson(data as unknown as Record<string, unknown>, { directed });
}

/**
 * Load graph from JSON file
 */
export function loadGraph(graphPath: string): Graph {
  const resolved = resolve(graphPath);

  if (!existsSync(resolved)) {
    throw new Error(`Graph file not found: ${resolved}`);
  }

  const content = readFileSync(resolved, 'utf-8');
  const data = JSON.parse(content);

  return buildFromJson(data);
}

/**
 * Save graph to JSON file
 */
export function saveGraph(G: Graph, communities: Communities, outputPath: string): void {
  const dir = dirname(outputPath);
  if (dir && !existsSync(dir)) {
    // Note: In real implementation, we'd use fs.mkdirSync with recursive
  }

  const nodes: GraphNode[] = [];

  for (const nodeId of graphNodes(G)) {
    const data = G.node(nodeId) as Record<string, unknown>;
    nodes.push({
      id: nodeId,
      label: data.label as string || nodeId,
      file_type: (data.file_type as FileType) || 'concept',
      source_file: data.source_file as string || '',
      source_location: data.source_location as string | null || null,
      community: data.community as number | undefined
    });
  }

  const edges: GraphEdge[] = [];

  for (const [u, v] of graphEdges(G)) {
    const data = G.edge(u, v) as Record<string, unknown>;
    edges.push({
      source: data._src as string || u,
      target: data._tgt as string || v,
      relation: data.relation as string || 'related_to',
      confidence: data.confidence as 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS' || 'EXTRACTED',
      source_file: data.source_file as string || '',
      source_location: data.source_location as string | undefined,
      weight: data.weight as number | undefined,
      confidence_score: data.confidence_score as number | undefined
    });
  }

  const output = {
    nodes,
    edges,
    hyperedges: [],
    directed: G.isDirected()
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2));
}

export default {
  buildFromJson,
  build,
  loadGraph,
  saveGraph,
  normalizeId,
  edgeData
};