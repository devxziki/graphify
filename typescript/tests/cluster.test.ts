import { describe, it, expect, beforeEach } from 'vitest';
import { Graph } from 'graphlib';
import { cluster, louvainCommunities } from '../src/cluster/index.js';
import { cohesionScore, scoreAll } from '../src/cluster/cohesion.js';

describe('Cluster Module', () => {
  let G: Graph;

  beforeEach(() => {
    G = new Graph({ multigraph: false, directed: false });
  });

  describe('Louvain Community Detection', () => {
    it('should handle empty graph', () => {
      const result = cluster(G);
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should detect communities in connected graph', () => {
      // Create a simple triangle
      G.setNode('a');
      G.setNode('b');
      G.setNode('c');
      G.setEdge('a', 'b');
      G.setEdge('b', 'c');
      G.setEdge('c', 'a');

      const communities = cluster(G);
      expect(Object.keys(communities).length).toBeGreaterThan(0);
    });

    it('should put isolated nodes in separate communities', () => {
      G.setNode('isolated');
      G.setNode('connected1');
      G.setNode('connected2');
      G.setEdge('connected1', 'connected2');

      const communities = cluster(G);
      expect(Object.keys(communities).length).toBe(2);
      expect(communities[0]).toContain('isolated');
    });

    it('should handle disconnected components', () => {
      // Component 1
      G.setNode('a1');
      G.setNode('a2');
      G.setEdge('a1', 'a2');

      // Component 2
      G.setNode('b1');
      G.setNode('b2');
      G.setEdge('b1', 'b2');

      const communities = cluster(G);
      expect(Object.keys(communities).length).toBe(2);
    });
  });

  describe('Cohesion Score', () => {
    it('should return 1.0 for single node community', () => {
      G.setNode('alone');
      const score = cohesionScore(G, ['alone']);
      expect(score).toBe(1.0);
    });

    it('should return 1.0 for fully connected pair', () => {
      G.setNode('a');
      G.setNode('b');
      G.setEdge('a', 'b');
      const score = cohesionScore(G, ['a', 'b']);
      expect(score).toBe(1.0);
    });

    it('should return 0.0 for disconnected pair', () => {
      G.setNode('a');
      G.setNode('b');
      const score = cohesionScore(G, ['a', 'b']);
      expect(score).toBe(0.0);
    });

    it('should calculate partial cohesion', () => {
      // Triangle has 3 edges, max is 3
      G.setNode('a');
      G.setNode('b');
      G.setNode('c');
      G.setEdge('a', 'b');
      G.setEdge('b', 'c');
      // Missing a-c edge
      const score = cohesionScore(G, ['a', 'b', 'c']);
      expect(score).toBeCloseTo(0.67, 1);
    });

    it('should handle nodes not in graph', () => {
      const score = cohesionScore(G, ['nonexistent']);
      expect(score).toBe(0.0);
    });
  });

  describe('scoreAll', () => {
    it('should score all communities', () => {
      G.setNode('a');
      G.setNode('b');
      G.setNode('c');
      G.setEdge('a', 'b');
      G.setEdge('b', 'c');

      const communities: Record<number, string[]> = {
        0: ['a', 'b'],
        1: ['c']
      };

      const scores = scoreAll(G, communities);
      expect(Object.keys(scores)).toHaveLength(2);
      expect(scores[0]).toBe(1.0); // a-b connected
      expect(scores[1]).toBe(1.0); // single node
    });

    it('should handle empty communities', () => {
      const communities: Record<number, string[]> = {};
      const scores = scoreAll(G, communities);
      expect(Object.keys(scores)).toHaveLength(0);
    });
  });
});