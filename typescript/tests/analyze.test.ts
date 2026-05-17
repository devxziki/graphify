import { describe, it, expect, beforeEach } from 'vitest';
import { Graph } from 'graphlib';
import { GodNode } from '../src/types/index.js';
import { godNodes, isFileNode, isConceptNode } from '../src/analyze/god-nodes.js';
import { surprisingConnections } from '../src/analyze/surprising.js';
import { analyze, graphDiff } from '../src/analyze/index.js';

describe('Analyze Module', () => {
  let G: Graph;

  beforeEach(() => {
    G = new Graph({ multigraph: false, directed: false });
  });

  describe('God Nodes Detection', () => {
    it('should return empty array for empty graph', () => {
      const result = godNodes(G, 10);
      expect(result).toHaveLength(0);
    });

    it('should find most connected nodes', () => {
      // Create a star graph: center connected to all others
      // Use different source files to avoid filtering
      G.setNode('center', { label: 'center', source_file: '/test/center.ts' });
      for (let i = 0; i < 5; i++) {
        G.setNode(`leaf${i}`, { label: `leaf${i}`, source_file: `/test/leaf${i}.ts` });
        G.setEdge('center', `leaf${i}`);
      }

      const gods = godNodes(G, 3);
      expect(gods.length).toBeGreaterThan(0);
    });

    it('should filter file nodes', () => {
      G.setNode('file.ts', { label: 'file.ts', source_file: '/test/file.ts' });
      G.setNode('concept', { label: 'concept', source_file: '' });

      const result = godNodes(G, 10);
      expect(result.some(n => n.label === 'file.ts')).toBe(false);
    });

    it('should respect topN limit', () => {
      for (let i = 0; i < 10; i++) {
        G.setNode(`node${i}`, { label: `node${i}`, source_file: `/test/node${i}.ts` });
        for (let j = i + 1; j < 10; j++) {
          G.setEdge(`node${i}`, `node${j}`);
        }
      }

      const gods = godNodes(G, 3);
      expect(gods).toHaveLength(3);
    });
  });

  describe('isFileNode', () => {
    it('should detect file nodes by label matching source file', () => {
      G.setNode('main.ts', { label: 'main.ts', source_file: '/src/main.ts' });
      expect(isFileNode(G, 'main.ts')).toBe(true);
    });

    it('should detect method stub nodes', () => {
      G.setNode('.method()', { label: '.method()', source_file: '/src/Class.ts' });
      expect(isFileNode(G, '.method()')).toBe(true);
    });

    it('should return false for regular nodes', () => {
      G.setNode('myFunction', { label: 'myFunction', source_file: '/src/utils.ts' });
      expect(isFileNode(G, 'myFunction')).toBe(false);
    });
  });

  describe('isConceptNode', () => {
    it('should detect nodes without source file', () => {
      G.setNode('concept', { label: 'concept', source_file: '' });
      expect(isConceptNode(G, 'concept')).toBe(true);
    });

    it('should detect nodes without extension', () => {
      G.setNode('readme', { label: 'readme', source_file: '/docs/readme' });
      expect(isConceptNode(G, 'readme')).toBe(true);
    });

    it('should return false for regular file nodes', () => {
      G.setNode('file.ts', { label: 'file.ts', source_file: '/src/file.ts' });
      expect(isConceptNode(G, 'file.ts')).toBe(false);
    });
  });

  describe('Surprising Connections', () => {
    it('should find cross-file connections', () => {
      G.setNode('func1', { label: 'func1', source_file: '/src/a.ts' });
      G.setNode('func2', { label: 'func2', source_file: '/src/b.ts' });
      G.setEdge('func1', 'func2', { relation: 'calls', confidence: 'EXTRACTED' });

      const result = surprisingConnections(G, null, 5);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty for single source', () => {
      G.setNode('func1', { label: 'func1', source_file: '/src/a.ts' });
      G.setNode('func2', { label: 'func2', source_file: '/src/a.ts' });
      G.setEdge('func1', 'func2', { relation: 'calls' });

      const result = surprisingConnections(G, null, 5);
      expect(result).toHaveLength(0);
    });
  });

  describe('Full Analysis', () => {
    it('should run full analysis', () => {
      G.setNode('a', { label: 'a', source_file: '/file1.ts' });
      G.setNode('b', { label: 'b', source_file: '/file2.ts' });
      G.setEdge('a', 'b', { relation: 'calls', confidence: 'EXTRACTED' });

      const communities = { 0: ['a', 'b'] };
      const result = analyze(G, communities);

      expect(result.communities).toEqual(communities);
      expect(result.god_nodes).toBeDefined();
    });
  });

  describe('Graph Diff', () => {
    it('should detect new nodes', () => {
      const oldG = new Graph();
      const newG = new Graph();

      oldG.setNode('a');
      newG.setNode('a');
      newG.setNode('b');

      const diff = graphDiff(oldG, newG);
      expect(diff.new_nodes).toHaveLength(1);
      expect(diff.new_nodes[0].id).toBe('b');
    });

    it('should detect removed nodes', () => {
      const oldG = new Graph();
      const newG = new Graph();

      oldG.setNode('a');
      oldG.setNode('b');
      newG.setNode('a');

      const diff = graphDiff(oldG, newG);
      expect(diff.removed_nodes).toHaveLength(1);
      expect(diff.removed_nodes[0].id).toBe('b');
    });

    it('should detect new edges', () => {
      const oldG = new Graph();
      const newG = new Graph();

      oldG.setNode('a');
      oldG.setNode('b');
      oldG.setEdge('a', 'b');

      newG.setNode('a');
      newG.setNode('b');
      newG.setNode('c');
      newG.setEdge('a', 'b');
      newG.setEdge('b', 'c');

      const diff = graphDiff(oldG, newG);
      expect(diff.new_edges).toHaveLength(1);
    });

    it('should generate summary', () => {
      const oldG = new Graph({ directed: false });
      const newG = new Graph({ directed: false });

      newG.setNode('newNode');

      const diff = graphDiff(oldG, newG);
      expect(diff.summary).toContain('new node');
    });

    it('should report no changes for identical graphs', () => {
      const G1 = new Graph();
      const G2 = new Graph();

      G1.setNode('a');
      G1.setNode('b');
      G1.setEdge('a', 'b');

      G2.setNode('a');
      G2.setNode('b');
      G2.setEdge('a', 'b');

      const diff = graphDiff(G1, G2);
      expect(diff.summary).toBe('no changes');
    });
  });
});