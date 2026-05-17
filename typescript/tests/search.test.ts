import { describe, it, expect } from 'vitest';
import { Graph } from 'graphlib';
import { findNode, bfs, dfs, queryGraph } from '../src/query/search.js';

describe('Search Tests', () => {
  let G: Graph;

  beforeEach(() => {
    G = new Graph({ directed: true });
    G.setNode('a', { label: 'NodeA', source_file: '/a.ts' });
    G.setNode('b', { label: 'NodeB', source_file: '/b.ts' });
    G.setNode('c', { label: 'NodeC', source_file: '/c.ts' });
    G.setNode('d', { label: 'NodeD', source_file: '/d.ts' });
    G.setEdge('a', 'b');
    G.setEdge('b', 'c');
    G.setEdge('a', 'd');
  });

  describe('findNode', () => {
    it('should find nodes by label', () => {
      const results = findNode(G, 'NodeA');
      expect(results).toContain('a');
    });

    it('should return empty for no match', () => {
      const results = findNode(G, 'NotExist');
      expect(results).toHaveLength(0);
    });

    it('should handle partial match', () => {
      const results = findNode(G, 'Node');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('bfs', () => {
    it('should traverse in BFS order', () => {
      const visited: string[] = [];
      bfs(G, 'a', (node) => visited.push(node));
      expect(visited[0]).toBe('a');
    });

    it('should visit all reachable', () => {
      const visited: string[] = [];
      bfs(G, 'a', (node) => visited.push(node));
      expect(visited).toContain('a');
      expect(visited).toContain('b');
      expect(visited).toContain('c');
      expect(visited).toContain('d');
    });

    it('should handle start not in graph', () => {
      const visited: string[] = [];
      bfs(G, 'nonexistent', (node) => visited.push(node));
      expect(visited).toHaveLength(0);
    });
  });

  describe('dfs', () => {
    it('should traverse in DFS order', () => {
      const visited: string[] = [];
      dfs(G, 'a', (node) => visited.push(node));
      expect(visited).toContain('a');
    });

    it('should visit all reachable', () => {
      const visited: string[] = [];
      dfs(G, 'a', (node) => visited.push(node));
      expect(visited).toContain('a');
      expect(visited).toContain('b');
    });
  });

  describe('queryGraph', () => {
    it('should return query result', () => {
      const result = queryGraph(G, 'test query');
      expect(result.answer).toBeDefined();
      expect(result.nodes).toBeDefined();
    });

    it('should handle empty query', () => {
      const result = queryGraph(G, '');
      expect(result.answer).toBeDefined();
    });
  });
});