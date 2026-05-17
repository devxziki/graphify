// Schema validation for extraction JSON
import {
  GraphNode,
  GraphEdge,
  FileType,
  Confidence,
  VALID_FILE_TYPES,
  VALID_CONFIDENCES
} from '../types/index.js';

export interface ValidationError {
  type: 'node' | 'edge';
  index: number;
  message: string;
}

const REQUIRED_NODE_FIELDS = ['id', 'label', 'file_type', 'source_file'];
const REQUIRED_EDGE_FIELDS = ['source', 'target', 'relation', 'confidence', 'source_file'];

/**
 * Validate an extraction JSON object
 * Returns array of error strings - empty means valid
 */
export function validateExtraction(data: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return ['Extraction must be a JSON object'];
  }

  // Validate nodes
  if (!('nodes' in data)) {
    errors.push("Missing required key 'nodes'");
  } else if (!Array.isArray(data.nodes)) {
    errors.push("'nodes' must be an array");
  } else {
    const nodeIds = new Set<string>();

    for (let i = 0; i < data.nodes.length; i++) {
      const node = data.nodes[i];

      if (typeof node !== 'object' || node === null) {
        errors.push(`Node ${i} must be an object`);
        continue;
      }

      const nodeObj = node as Record<string, unknown>;

      // Check required fields
      for (const field of REQUIRED_NODE_FIELDS) {
        if (!(field in nodeObj)) {
          errors.push(`Node ${i} (id=${nodeObj.id || '?'}) missing required field '${field}'`);
        }
      }

      // Validate file_type
      if ('file_type' in nodeObj && nodeObj.file_type) {
        const fileType = nodeObj.file_type as string;
        if (!VALID_FILE_TYPES.has(fileType as FileType)) {
          errors.push(
            `Node ${i} (id=${nodeObj.id || '?'}) has invalid file_type '${fileType}'`
          );
        }
      }

      // Track node IDs
      if (typeof nodeObj.id === 'string') {
        nodeIds.add(nodeObj.id);
      }
    }

    // Validate edges
    const edgeKey = 'edges' in data ? 'edges' : 'links';
    if (!(edgeKey in data)) {
      errors.push("Missing required key 'edges' or 'links'");
    } else if (!Array.isArray(data[edgeKey])) {
      errors.push("'edges' must be an array");
    } else {
      const edgeList = data[edgeKey] as Record<string, unknown>[];

      for (let i = 0; i < edgeList.length; i++) {
        const edge = edgeList[i];

        if (typeof edge !== 'object' || edge === null) {
          errors.push(`Edge ${i} must be an object`);
          continue;
        }

        const edgeObj = edge as Record<string, unknown>;

        // Check required fields
        for (const field of REQUIRED_EDGE_FIELDS) {
          if (!(field in edgeObj)) {
            errors.push(`Edge ${i} missing required field '${field}'`);
          }
        }

        // Validate confidence
        if ('confidence' in edgeObj && edgeObj.confidence) {
          const confidence = edgeObj.confidence as string;
          if (!VALID_CONFIDENCES.has(confidence as Confidence)) {
            errors.push(
              `Edge ${i} has invalid confidence '${confidence}'`
            );
          }
        }

        // Check node references
        const source = edgeObj.source as string;
        const target = edgeObj.target as string;

        if (source && nodeIds.size > 0 && !nodeIds.has(source)) {
          errors.push(`Edge ${i} source '${source}' does not match any node id`);
        }

        if (target && nodeIds.size > 0 && !nodeIds.has(target)) {
          errors.push(`Edge ${i} target '${target}' does not match any node id`);
        }
      }
    }
  }

  return errors;
}

/**
 * Raise ValueError with all errors if extraction is invalid
 */
export function assertValid(data: Record<string, unknown>): void {
  const errors = validateExtraction(data);
  if (errors.length > 0) {
    const msg = `Extraction JSON has ${errors.length} error(s):\n` +
      errors.map(e => `  • ${e}`).join('\n');
    throw new Error(msg);
  }
}

/**
 * Normalize file_type synonyms (handle common invalid values)
 */
export function normalizeFileType(fileType: string | undefined): string {
  if (!fileType) {
    return 'concept';
  }

  const synonyms: Record<string, string> = {
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

  const lower = fileType.toLowerCase();
  return synonyms[lower] || fileType;
}

/**
 * Normalize path separators to forward slashes
 */
export function normalizePath(path: string | undefined | null): string | null {
  if (!path) return null;
  return path.replace(/\\/g, '/');
}

export default {
  validateExtraction,
  assertValid,
  normalizeFileType,
  normalizePath
};