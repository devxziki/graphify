import { describe, it, expect } from 'vitest';
import { graphNodes, graphEdges, graphDegrees, graphDegree, graphNeighbors, setDifference } from '../src/utils/graphlib.js';
import { Graph } from 'graphlib';

describe('Utils - Graphlib Helpers', () => {
  let G: Graph;

  beforeEach(() => {
    G = new Graph({ multigraph: false, directed: true });
    G.setNode('a', { label: 'A' });
    G.setNode('b', { label: 'B' });
    G.setNode('c', { label: 'C' });
    G.setNode('d', { label: 'D' });
    G.setEdge('a', 'b');
    G.setEdge('b', 'c');
    G.setEdge('a', 'c');
  });

  describe('graphNodes', () => {
    it('should return all nodes as array', () => {
      const nodes = graphNodes(G);
      expect(nodes).toContain('a');
      expect(nodes).toContain('b');
      expect(nodes).toContain('c');
      expect(nodes).toContain('d');
    });

    it('should return empty array for empty graph', () => {
      const emptyG = new Graph();
      expect(graphNodes(emptyG)).toHaveLength(0);
    });
  });

  describe('graphEdges', () => {
    it('should return all edges as array', () => {
      const edges = graphEdges(G);
      expect(edges.length).toBeGreaterThan(0);
    });

    it('should handle empty graph', () => {
      const emptyG = new Graph();
      expect(graphEdges(emptyG)).toHaveLength(0);
    });
  });

  describe('graphDegree', () => {
    it('should return degree for single node', () => {
      const deg = graphDegree(G, 'a');
      expect(typeof deg).toBe('number');
    });

    it('should return 0 for non-existent node', () => {
      const deg = graphDegree(G, 'nonexistent');
      expect(deg).toBe(0);
    });
  });

  describe('graphDegrees', () => {
    it('should return degrees for all nodes', () => {
      const degrees = graphDegrees(G);
      expect(Object.keys(degrees).length).toBeGreaterThan(0);
      expect(degrees['a']).toBeDefined();
    });
  });

  describe('graphNeighbors', () => {
    it('should return neighbors for node', () => {
      const neighbors = graphNeighbors(G, 'a');
      expect(neighbors).toContain('b');
      expect(neighbors).toContain('c');
    });

    it('should return empty for isolated node', () => {
      const neighbors = graphNeighbors(G, 'd');
      expect(neighbors).toHaveLength(0);
    });
  });

  describe('setDifference', () => {
    it('should return elements in a but not in b', () => {
      const a = new Set(['a', 'b', 'c']);
      const b = new Set(['b', 'd']);
      const diff = setDifference(a, b);
      expect(diff).toContain('a');
      expect(diff).toContain('c');
      expect(diff).not.toContain('b');
    });

    it('should handle empty sets', () => {
      const a = new Set(['a', 'b']);
      const b = new Set<string>();
      const diff = setDifference(a, b);
      expect(diff).toHaveLength(2);
    });

    it('should handle identical sets', () => {
      const a = new Set(['a', 'b']);
      const b = new Set(['a', 'b']);
      const diff = setDifference(a, b);
      expect(diff).toHaveLength(0);
    });
  });
});