import { describe, it, expect, beforeEach } from 'vitest';
import { Graph } from 'graphlib';
import { godNodes, isFileNode, isConceptNode } from '../src/analyze/god-nodes.js';
import { surprisingConnections } from '../src/analyze/surprising.js';
import { analyze, graphDiff } from '../src/analyze/index.js';
import { Communities } from '../src/types/index.js';

describe('Analyze Tests', () => {
  let G: Graph;

  beforeEach(() => {
    G = new Graph({ directed: false });
  });

  describe('godNodes', () => {
    it('should return empty for empty graph', () => {
      const result = godNodes(G, 10);
      expect(result).toHaveLength(0);
    });

    it('should find god nodes in connected graph', () => {
      G.setNode('hub', { label: 'hub', source_file: '/hub.ts' });
      G.setNode('a', { label: 'a', source_file: '/a.ts' });
      G.setNode('b', { label: 'b', source_file: '/b.ts' });
      G.setNode('c', { label: 'c', source_file: '/c.ts' });
      G.setEdge('hub', 'a');
      G.setEdge('hub', 'b');
      G.setEdge('hub', 'c');
      
      const gods = godNodes(G, 5);
      expect(gods.length).toBeGreaterThan(0);
    });

    it('should respect topN', () => {
      for (let i = 0; i < 20; i++) {
        G.setNode(`node${i}`, { label: `node${i}`, source_file: `/f${i}.ts` });
        for (let j = i + 1; j < 20; j++) {
          G.setEdge(`node${i}`, `node${j}`);
        }
      }
      
      const gods = godNodes(G, 5);
      expect(gods).toHaveLength(5);
    });
  });

  describe('isFileNode', () => {
    it('should detect file node', () => {
      G.setNode('test.ts', { label: 'test.ts', source_file: '/test.ts' });
      expect(isFileNode(G, 'test.ts')).toBe(true);
    });

    it('should detect method stub', () => {
      G.setNode('.method()', { label: '.method()', source_file: '/C.ts' });
      expect(isFileNode(G, '.method()')).toBe(true);
    });

    it('should return false for regular nodes', () => {
      G.setNode('myFunc', { label: 'myFunc', source_file: '/f.ts' });
      expect(isFileNode(G, 'myFunc')).toBe(false);
    });
  });

  describe('isConceptNode', () => {
    it('should detect concept without source', () => {
      G.setNode('concept', { label: 'concept', source_file: '' });
      expect(isConceptNode(G, 'concept')).toBe(true);
    });

    it('should detect concept without extension', () => {
      G.setNode('readme', { label: 'readme', source_file: '/docs/readme' });
      expect(isConceptNode(G, 'readme')).toBe(true);
    });

    it('should return false for file nodes', () => {
      G.setNode('file.ts', { label: 'file.ts', source_file: '/f.ts' });
      expect(isConceptNode(G, 'file.ts')).toBe(false);
    });
  });

  describe('surprisingConnections', () => {
    it('should find cross-file connections', () => {
      G.setNode('func1', { label: 'func1', source_file: '/a.ts' });
      G.setNode('func2', { label: 'func2', source_file: '/b.ts' });
      G.setEdge('func1', 'func2', { relation: 'calls', confidence: 'EXTRACTED' });
      
      const result = surprisingConnections(G, null, 5);
      expect(result).toBeDefined();
    });

    it('should return empty for single file', () => {
      G.setNode('func1', { label: 'func1', source_file: '/a.ts' });
      G.setNode('func2', { label: 'func2', source_file: '/a.ts' });
      G.setEdge('func1', 'func2', { relation: 'calls' });
      
      const result = surprisingConnections(G, null, 5);
      expect(result).toHaveLength(0);
    });
  });

  describe('analyze', () => {
    it('should run full analysis', () => {
      G.setNode('a', { label: 'a', source_file: '/a.ts' });
      G.setNode('b', { label: 'b', source_file: '/b.ts' });
      G.setEdge('a', 'b', { relation: 'calls', confidence: 'EXTRACTED' });
      
      const communities: Communities = { 0: ['a', 'b'] };
      const result = analyze(G, communities);
      
      expect(result.communities).toEqual(communities);
      expect(result.god_nodes).toBeDefined();
    });
  });

  describe('graphDiff', () => {
    it('should detect new nodes', () => {
      const oldG = new Graph();
      const newG = new Graph();
      
      oldG.setNode('a');
      newG.setNode('a');
      newG.setNode('b');
      
      const diff = graphDiff(oldG, newG);
      expect(diff.new_nodes).toHaveLength(1);
    });

    it('should detect removed nodes', () => {
      const oldG = new Graph();
      const newG = new Graph();
      
      oldG.setNode('a');
      oldG.setNode('b');
      newG.setNode('a');
      
      const diff = graphDiff(oldG, newG);
      expect(diff.removed_nodes).toHaveLength(1);
    });

    it('should detect new edges', () => {
      const oldG = new Graph({ directed: false });
      const newG = new Graph({ directed: false });
      
      oldG.setNode('a');
      oldG.setNode('b');
      oldG.setEdge('a', 'b');
      
      newG.setNode('a');
      newG.setNode('b');
      newG.setNode('c');
      newG.setEdge('a', 'b');
      newG.setEdge('b', 'c');
      
      const diff = graphDiff(oldG, newG);
      expect(diff.new_edges.length).toBe(1);
    });

    it('should report no changes', () => {
      const G1 = new Graph({ directed: false });
      const G2 = new Graph({ directed: false });
      
      G1.setNode('a');
      G1.setEdge('a', 'a');
      G2.setNode('a');
      G2.setEdge('a', 'a');
      
      const diff = graphDiff(G1, G2);
      expect(diff.summary).toBe('no changes');
    });

    it('should generate summary with changes', () => {
      const oldG = new Graph();
      const newG = new Graph();
      
      newG.setNode('newNode');
      
      const diff = graphDiff(oldG, newG);
      expect(diff.summary).toContain('new');
    });
  });
});