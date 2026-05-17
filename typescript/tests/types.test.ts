import { describe, it, expect } from 'vitest';
import {
  GraphNode,
  GraphEdge,
  FileType,
  Confidence,
  Communities,
  ExtractionResult
} from '../src/types/index.js';

describe('Types', () => {
  describe('GraphNode', () => {
    it('should create a valid node', () => {
      const node: GraphNode = {
        id: 'test-node',
        label: 'TestNode',
        file_type: 'code',
        source_file: '/test/path.ts',
        source_location: 'L10',
        community: 1
      };
      expect(node.id).toBe('test-node');
      expect(node.label).toBe('TestNode');
      expect(node.file_type).toBe('code');
    });

    it('should allow null source_location', () => {
      const node: GraphNode = {
        id: 'test-node',
        label: 'TestNode',
        file_type: 'document',
        source_file: '/test/doc.md',
        source_location: null
      };
      expect(node.source_location).toBeNull();
    });
  });

  describe('GraphEdge', () => {
    it('should create a valid edge', () => {
      const edge: GraphEdge = {
        source: 'node1',
        target: 'node2',
        relation: 'imports',
        confidence: 'EXTRACTED',
        source_file: '/test/file.ts',
        source_location: 'L5'
      };
      expect(edge.source).toBe('node1');
      expect(edge.target).toBe('node2');
      expect(edge.relation).toBe('imports');
      expect(edge.confidence).toBe('EXTRACTED');
    });

    it('should support optional fields', () => {
      const edge: GraphEdge = {
        source: 'node1',
        target: 'node2',
        relation: 'calls'
      };
      expect(edge.weight).toBeUndefined();
      expect(edge.confidence_score).toBeUndefined();
    });
  });

  describe('FileType', () => {
    it('should accept valid file types', () => {
      const validTypes: FileType[] = ['code', 'document', 'paper', 'image', 'rationale', 'concept'];
      validTypes.forEach(type => {
        const node: GraphNode = {
          id: 'test',
          label: 'test',
          file_type: type,
          source_file: ''
        };
        expect(node.file_type).toBe(type);
      });
    });
  });

  describe('Confidence', () => {
    it('should accept valid confidence values', () => {
      const validConfidences: Confidence[] = ['EXTRACTED', 'INFERRED', 'AMBIGUOUS'];
      validConfidences.forEach(conf => {
        const edge: GraphEdge = {
          source: 'a',
          target: 'b',
          relation: 'related',
          confidence: conf
        };
        expect(edge.confidence).toBe(conf);
      });
    });
  });

  describe('Communities', () => {
    it('should create valid community structure', () => {
      const communities: Communities = {
        0: ['node1', 'node2', 'node3'],
        1: ['node4', 'node5'],
        2: ['node6']
      };
      expect(Object.keys(communities).length).toBe(3);
      expect(communities[0]).toHaveLength(3);
      expect(communities[2]).toHaveLength(1);
    });
  });

  describe('ExtractionResult', () => {
    it('should create valid extraction result', () => {
      const result: ExtractionResult = {
        nodes: [
          { id: 'n1', label: 'Node1', file_type: 'code', source_file: '/test.ts' },
          { id: 'n2', label: 'Node2', file_type: 'code', source_file: '/test.ts' }
        ],
        edges: [
          { source: 'n1', target: 'n2', relation: 'imports', source_file: '/test.ts' }
        ],
        files: ['/test.ts'],
        stats: { nodes: 2, edges: 1 }
      };
      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(1);
    });
  });
});