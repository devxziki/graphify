import { describe, it, expect } from 'vitest';
import { Graph } from 'graphlib';
import { shortestPath, explainNode, query } from '../src/query/index.js';

describe('Query Index Tests', () => {
  let G: Graph;

  beforeEach(() => {
    G = new Graph({ directed: true });
    G.setNode('a', { label: 'A', source_file: '/a.ts' });
    G.setNode('b', { label: 'B', source_file: '/b.ts' });
    G.setNode('c', { label: 'C', source_file: '/c.ts' });
    G.setNode('d', { label: 'D', source_file: '/d.ts' });
    G.setEdge('a', 'b');
    G.setEdge('b', 'c');
    G.setEdge('a', 'd');
    G.setEdge('d', 'c');
  });

  describe('shortestPath', () => {
    it('should find path a -> b', () => {
      const path = shortestPath(G, 'a', 'b');
      expect(path).toEqual(['a', 'b']);
    });

    it('should find path a -> c via b', () => {
      const path = shortestPath(G, 'a', 'c');
      expect(path).toContain('a');
      expect(path).toContain('c');
    });

    it('should return empty for same node', () => {
      const path = shortestPath(G, 'a', 'a');
      expect(path).toEqual(['a']);
    });

    it('should return empty for unconnected', () => {
      const G2 = new Graph({ directed: true });
      G2.setNode('x');
      G2.setNode('y');
      const path = shortestPath(G2, 'x', 'y');
      expect(path).toHaveLength(0);
    });
  });

  describe('explainNode', () => {
    it('should explain existing node', () => {
      const result = explainNode(G, 'a');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('a');
      expect(result?.label).toBe('A');
    });

    it('should return null for nonexistent', () => {
      const result = explainNode(G, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('query', () => {
    it('should return query result', () => {
      const result = query(G, 'test query');
      expect(result).toBeDefined();
    });
  });
});