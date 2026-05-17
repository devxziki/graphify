import { describe, it, expect } from 'vitest';
import {
  GraphNode,
  GraphEdge,
  FileType,
  Confidence,
  Communities,
  ExtractionResult,
  GodNode,
  SurprisingConnection,
  NodeExplanation,
  QueryResult as GraphQueryResult
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

    it('should support optional community', () => {
      const node: GraphNode = {
        id: 'test-node',
        label: 'TestNode',
        file_type: 'code',
        source_file: '/test.ts'
      };
      expect(node.community).toBeUndefined();
    });

    it('should support norm_label', () => {
      const node: GraphNode = {
        id: 'test-node',
        label: 'TestNode',
        file_type: 'code',
        source_file: '/test.ts',
        norm_label: 'testnode'
      };
      expect(node.norm_label).toBe('testnode');
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

    it('should support weight field', () => {
      const edge: GraphEdge = {
        source: 'a',
        target: 'b',
        relation: 'calls',
        weight: 2.5
      };
      expect(edge.weight).toBe(2.5);
    });

    it('should support confidence_score', () => {
      const edge: GraphEdge = {
        source: 'a',
        target: 'b',
        relation: 'calls',
        confidence: 'INFERRED',
        confidence_score: 0.75
      };
      expect(edge.confidence_score).toBe(0.75);
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

    it('should reject invalid file types', () => {
      const invalidType = 'invalid' as FileType;
      const node: GraphNode = {
        id: 'test',
        label: 'test',
        file_type: 'code',
        source_file: ''
      };
      expect(node.file_type).not.toBe(invalidType);
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

    it('should handle empty community', () => {
      const communities: Communities = {};
      expect(Object.keys(communities).length).toBe(0);
    });

    it('should handle single node community', () => {
      const communities: Communities = {
        0: ['node1']
      };
      expect(communities[0]).toHaveLength(1);
    });

    it('should support nested communities', () => {
      const communities: Communities = {
        0: ['a', 'b'],
        1: ['c', 'd', 'e'],
        2: ['f']
      };
      expect(communities[0]).toContain('a');
      expect(communities[1]).toContain('d');
      expect(communities[2]).toContain('f');
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

    it('should handle empty extraction', () => {
      const result: ExtractionResult = {
        nodes: [],
        edges: [],
        files: [],
        stats: { nodes: 0, edges: 0 }
      };
      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    });
  });

  describe('GodNode', () => {
    it('should create valid god node', () => {
      const godNode: GodNode = {
        id: 'test-node',
        label: 'TestNode',
        degree: 10
      };
      expect(godNode.id).toBe('test-node');
      expect(godNode.degree).toBe(10);
    });
  });

  describe('SurprisingConnection', () => {
    it('should create valid surprising connection', () => {
      const conn: SurprisingConnection = {
        source: 'nodeA',
        target: 'nodeB',
        source_files: ['/file1.ts', '/file2.ts'],
        confidence: 'EXTRACTED',
        relation: 'calls'
      };
      expect(conn.source).toBe('nodeA');
      expect(conn.target).toBe('nodeB');
      expect(conn.confidence).toBe('EXTRACTED');
    });
  });

  describe('NodeExplanation', () => {
    it('should create valid node explanation', () => {
      const explanation: NodeExplanation = {
        id: 'node1',
        label: 'Node1',
        source_file: '/test.ts',
        source_location: 'L10',
        file_type: 'code',
        community: 1,
        degree: 5,
        connections: ['node2', 'node3']
      };
      expect(explanation.id).toBe('node1');
      expect(explanation.connections).toHaveLength(2);
    });
  });

  describe('QueryResult', () => {
    it('should create valid query result', () => {
      const result: GraphQueryResult = {
        answer: 'Found results',
        nodes: ['node1', 'node2'],
        edges: ['edge1']
      };
      expect(result.answer).toBe('Found results');
      expect(result.nodes).toHaveLength(2);
    });
  });
});