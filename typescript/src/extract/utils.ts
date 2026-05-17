// Extract utilities - ID generation, file helpers
import { GraphNode, GraphEdge, FileType } from '../types/index.js';

/**
 * Make a stable node ID from name parts
 * Matches Python's extract._make_id logic
 */
export function makeId(...parts: string[]): string {
  // Combine parts with underscores
  let combined = parts
    .map(p => p.trim().replace(/^[._]+|[._]+$/g, ''))
    .filter(p => p.length > 0)
    .join('_');

  // NFKC normalization
  combined = combined.normalize('NFKC');

  // Replace non-word chars with underscore
  combined = combined.replace(/[^\w]+/g, '_');

  // Collapse multiple underscores
  combined = combined.replace(/_+/g, '_');

  // Trim and lowercase
  return combined.replace(/^_+|_+$/g, '').toLowerCase();
}

/**
 * Get file stem (parent.filename)
 */
export function fileStem(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/');
  const filename = parts[parts.length - 1] || '';
  const lastDot = filename.lastIndexOf('.');
  const stem = lastDot > 0 ? filename.slice(0, lastDot) : filename;

  // Include parent dir to avoid collisions
  if (parts.length >= 2) {
    const parent = parts[parts.length - 2];
    if (parent && parent !== '.' && parent !== '') {
      return `${parent}.${stem}`;
    }
  }

  return stem;
}

/**
 * Create a file node
 */
export function createFileNode(
  path: string,
  fileType: FileType = 'code'
): GraphNode {
  const stem = fileStem(path);
  return {
    id: makeId(path),
    label: path.split('/').pop() || stem,
    file_type: fileType,
    source_file: path
  };
}

/**
 * Create a class node
 */
export function createClassNode(
  className: string,
  filePath: string,
  line: number
): GraphNode {
  const stem = fileStem(filePath);
  return {
    id: makeId(stem, className),
    label: className,
    file_type: 'code',
    source_file: filePath,
    source_location: `L${line}`
  };
}

/**
 * Create a function node
 */
export function createFunctionNode(
  funcName: string,
  filePath: string,
  line: number
): GraphNode {
  const stem = fileStem(filePath);
  return {
    id: makeId(stem, funcName),
    label: `${funcName}()`,
    file_type: 'code',
    source_file: filePath,
    source_location: `L${line}`
  };
}

/**
 * Create an import edge
 */
export function createImportEdge(
  sourceId: string,
  targetId: string,
  filePath: string,
  line: number,
  type: 'imports' | 'imports_from' = 'imports'
): GraphEdge {
  return {
    source: sourceId,
    target: targetId,
    relation: type,
    confidence: 'EXTRACTED',
    source_file: filePath,
    source_location: `L${line}`,
    weight: 1.0
  };
}

/**
 * Create a contains edge
 */
export function createContainsEdge(
  sourceId: string,
  targetId: string,
  filePath: string,
  line: number
): GraphEdge {
  return {
    source: sourceId,
    target: targetId,
    relation: 'contains',
    confidence: 'EXTRACTED',
    source_file: filePath,
    source_location: `L${line}`,
    weight: 1.0
  };
}

/**
 * Create a calls edge
 */
export function createCallsEdge(
  sourceId: string,
  targetId: string,
  filePath: string,
  line: number
): GraphEdge {
  return {
    source: sourceId,
    target: targetId,
    relation: 'calls',
    confidence: 'EXTRACTED',
    source_file: filePath,
    source_location: `L${line}`,
    weight: 1.0
  };
}

export default {
  makeId,
  fileStem,
  createFileNode,
  createClassNode,
  createFunctionNode,
  createImportEdge,
  createContainsEdge,
  createCallsEdge
};