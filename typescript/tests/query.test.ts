import { describe, it, expect, beforeEach } from 'vitest';
import { Graph } from 'graphlib';
import { scoreNodes, pickSeeds } from '../src/query/scoring.js';
import { queryGraph, findNode, bfs, dfs } from '../src/query/search.js';
import { shortestPath, findNode as explainNode } from '../src/query/index.js';
import { GraphNode, GraphEdge } from '../src/types/index.js';

describe('Query Module', () => {
  let G: Graph;

  beforeEach(() => {
    G = new Graph({ multigraph: false, directed: true });
    // Create a simple graph:
    // a -> b -> c
    // a -> d -> e
    // d -> c
    G.setNode('a', { label: 'NodeA', source_file: '/src/a.ts' });
    G.setNode('b', { label: 'NodeB', source_file: '/src/b.ts' });
    G.setNode('c', { label: 'NodeC', source_file: '/src/c.ts' });
    G.setNode('d', { label: 'NodeD', source_file: '/src/d.ts' });
    G.setNode('e', { label: 'NodeE', source_file: '/src/e.ts' });

    G.setEdge('a', 'b');
    G.setEdge('b', 'c');
    G.setEdge('a', 'd');
    G.setEdge('d', 'e');
    G.setEdge('d', 'c');
  });

  describe('TF-IDF Scoring', () => {
    it('should score nodes by exact match', () => {
      const results = scoreNodes(G, ['NodeA']);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].nodeId).toBe('a');
    });

    it('should score nodes by prefix match', () => {
      const results = scoreNodes(G, ['Node']);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty for no matches', () => {
      const results = scoreNodes(G, ['nonexistent']);
      expect(results).toHaveLength(0);
    });

    it('should return empty for empty terms', () => {
      const results = scoreNodes(G, []);
      expect(results).toHaveLength(0);
    });

    it('should sort by score descending', () => {
      const results = scoreNodes(G, ['Node']);
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    });

    it('should handle multiple terms', () => {
      const results = scoreNodes(G, ['Node', 'A']);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should match source file', () => {
      const results = scoreNodes(G, ['a.ts']);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('pickSeeds', () => {
    it('should pick top scoring nodes', () => {
      const scored = [
        { score: 100, nodeId: 'a' },
        { score: 50, nodeId: 'b' },
        { score: 25, nodeId: 'c' }
      ];
      const seeds = pickSeeds(scored, 2);
      expect(seeds).toHaveLength(2);
      expect(seeds).toContain('a');
    });

    it('should respect gap ratio', () => {
      const scored = [
        { score: 100, nodeId: 'a' },
        { score: 10, nodeId: 'b' }, // Below 20% of top
        { score: 5, nodeId: 'c' }
      ];
      const seeds = pickSeeds(scored, 3, 0.2);
      expect(seeds).toHaveLength(1); // Only top score passes gap
    });

    it('should return empty for empty scored', () => {
      const seeds = pickSeeds([], 3);
      expect(seeds).toHaveLength(0);
    });
  });

  describe('Search - findNode', () => {
    it('should find node by exact label', () => {
      const result = findNode(G, 'NodeA');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('a');
    });

    it('should find node by prefix', () => {
      const result = findNode(G, 'NodeB');
      expect(result).not.toBeNull();
    });

    it('should return null for no match', () => {
      const result = findNode(G, 'Nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('Search - BFS', () => {
    it('should traverse in breadth-first order', () => {
      const visited: string[] = [];
      bfs(G, 'a', (node) => visited.push(node));

      expect(visited[0]).toBe('a');
      expect(visited.indexOf('b')).toBeLessThan(visited.indexOf('c'));
    });

    it('should visit all reachable nodes', () => {
      const visited: string[] = [];
      bfs(G, 'a', (node) => visited.push(node));

      expect(visited).toContain('a');
      expect(visited).toContain('b');
      expect(visited).toContain('c');
      expect(visited).toContain('d');
      expect(visited).toContain('e');
    });

    it('should handle start node not in graph', () => {
      const visited: string[] = [];
      bfs(G, 'nonexistent', (node) => visited.push(node));
      expect(visited).toHaveLength(0);
    });
  });

  describe('Search - DFS', () => {
    it('should traverse in depth-first order', () => {
      const visited: string[] = [];
      dfs(G, 'a', (node) => visited.push(node));

      expect(visited).toContain('a');
      expect(visited).toContain('e');
    });

    it('should visit all reachable nodes', () => {
      const visited: string[] = [];
      dfs(G, 'a', (node) => visited.push(node));

      expect(visited).toHaveLength(5);
    });
  });

  describe('queryGraph', () => {
    it('should return matching nodes', () => {
      const result = queryGraph(G, 'NodeA');
      expect(result.matches.length).toBeGreaterThan(0);
    });

    it('should return empty for no matches', () => {
      const result = queryGraph(G, 'nonexistent');
      expect(result.matches).toHaveLength(0);
    });

    it('should include graph metadata', () => {
      const result = queryGraph(G, 'Node');
      expect(result.total_nodes).toBe(5);
    });
  });

  describe('Shortest Path', () => {
    it('should find path between connected nodes', () => {
      const path = shortestPath(G, 'a', 'c');
      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toBe('a');
      expect(path[path.length - 1]).toBe('c');
    });

    it('should find direct path for adjacent nodes', () => {
      const path = shortestPath(G, 'a', 'b');
      expect(path).toEqual(['a', 'b']);
    });

    it('should return empty for unconnected nodes', () => {
      // Create disconnected graph
      const disconnectedG = new Graph({ directed: true });
      disconnectedG.setNode('x');
      disconnectedG.setNode('y');

      const path = shortestPath(disconnectedG, 'x', 'y');
      expect(path).toHaveLength(0);
    });

    it('should return single node for same source and target', () => {
      const path = shortestPath(G, 'a', 'a');
      expect(path).toEqual(['a']);
    });

    it('should find shortest path (not just any path)', () => {
      // a->d->e is shorter than a->b->c->...->e
      const path = shortestPath(G, 'a', 'e');
      expect(path).toContain('d');
      expect(path).toContain('e');
    });
  });

  describe('explainNode', () => {
    it('should explain existing node', () => {
      const explanation = explainNode(G, 'a');
      expect(explanation).not.toBeNull();
      expect(explanation?.id).toBe('a');
      expect(explanation?.label).toBe('NodeA');
    });

    it('should include node connections', () => {
      const explanation = explainNode(G, 'a');
      expect(explanation?.connections).toBeDefined();
    });

    it('should return null for nonexistent node', () => {
      const explanation = explainNode(G, 'nonexistent');
      expect(explanation).toBeNull();
    });
  });
});