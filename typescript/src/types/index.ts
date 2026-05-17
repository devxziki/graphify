// Type definitions for Graphify

// File types
export type FileType = 'code' | 'document' | 'paper' | 'image' | 'rationale' | 'concept';

// Confidence levels for edges
export type Confidence = 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';

// Graph node
export interface GraphNode {
  id: string;
  label: string;
  file_type: FileType;
  source_file: string;
  source_location?: string | null;
  community?: number;
  norm_label?: string;
  [key: string]: unknown;
}

// Graph edge
export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
  confidence: Confidence;
  source_file: string;
  source_location?: string;
  weight?: number;
  confidence_score?: number;
  // Direction preservation for undirected graphs
  _src?: string;
  _tgt?: string;
  [key: string]: unknown;
}

// Extraction result
export interface ExtractionResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  input_tokens?: number;
  output_tokens?: number;
  error?: string;
  hyperedges?: HyperEdge[];
}

// Hyperedge (group relationships)
export interface HyperEdge {
  id: string;
  label: string;
  nodes: string[];
  confidence: Confidence;
  confidence_score?: number;
}

// Communities (communityId -> nodeIds[])
export interface Communities {
  [communityId: number]: string[];
}

// Community cohesion scores
export interface CohesionScores {
  [communityId: number]: number;
}

// Detection result
export interface DetectionResult {
  files: {
    code: string[];
    document: string[];
    paper: string[];
    image: string[];
    video: string[];
  };
  total_files: number;
  total_words: number;
  needs_graph: boolean;
  warning?: string;
  skipped_sensitive: string[];
  graphifyignore_patterns: number;
}

// Graphify options
export interface GraphifyOptions {
  outputDir?: string;
  skipHtml?: boolean;
  force?: boolean;
  followSymlinks?: boolean;
}

// Graph data for JSON export
export interface GraphData {
  nodes: GraphNode[];
  edges?: GraphEdge[];
  links?: GraphNode[];
  hyperedges?: HyperEdge[];
  directed?: boolean;
  built_at_commit?: string;
}

// God node (most connected)
export interface GodNode {
  id: string;
  label: string;
  degree: number;
}

// Surprising connection
export interface SurprisingConnection {
  source: string;
  target: string;
  source_files: string[];
  confidence: Confidence;
  relation: string;
  why?: string;
  note?: string;
}

// Query result
export interface GraphQueryResult {
  answer: string;
  nodes: string[];
  edges: string[];
}

// Node explanation
export interface NodeExplanation {
  id: string;
  label: string;
  source_file: string;
  source_location?: string;
  file_type: FileType;
  community?: number;
  degree: number;
  connections: {
    direction: 'in' | 'out';
    node: string;
    relation: string;
    confidence: Confidence;
  }[];
}

// Path result
export interface PathResult {
  path: string[];
  hops: number;
  edges: {
    from: string;
    to: string;
    relation: string;
    confidence: Confidence;
  }[];
}

// Analysis result
export interface AnalysisResult {
  god_nodes: GodNode[];
  surprising_connections: SurprisingConnection[];
  communities: Communities;
  cohesion: CohesionScores;
}

// Language types for tree-sitter
export interface LanguageConfig {
  tsModule: string;
  tsLanguageFn?: string;
  classTypes: Set<string>;
  functionTypes: Set<string>;
  importTypes: Set<string>;
  callTypes: Set<string>;
  staticPropTypes?: Set<string>;
  helperFnNames?: Set<string>;
  containerBindMethods?: Set<string>;
  eventListenerProperties?: Set<string>;
  nameField: string;
  nameFallbackChildTypes?: string[];
  bodyField?: string;
  bodyFallbackChildTypes?: string[];
  callFunctionField: string;
  callAccessorNodeTypes?: Set<string>;
  callAccessorField?: string;
  functionBoundaryTypes?: Set<string>;
  importHandler?: ImportHandler;
  resolveFunctionNameFn?: Function;
  functionLabelParens?: boolean;
  extraWalkFn?: Function;
}

export type ImportHandler = (
  node: unknown,
  source: Buffer,
  fileNid: string,
  stem: string,
  edges: GraphEdge[],
  strPath: string
) => void;

// Node matching result
export interface ScoredNode {
  score: number;
  nodeId: string;
}

// Confidence score defaults
export const CONFIDENCE_SCORE_DEFAULTS: Record<Confidence, number> = {
  EXTRACTED: 1.0,
  INFERRED: 0.5,
  AMBIGUOUS: 0.2,
};

// Valid file types
export const VALID_FILE_TYPES: Set<FileType> = new Set([
  'code', 'document', 'paper', 'image', 'rationale', 'concept'
]);

// Valid confidence values
export const VALID_CONFIDENCES: Set<Confidence> = new Set([
  'EXTRACTED', 'INFERRED', 'AMBIGUOUS'
]);