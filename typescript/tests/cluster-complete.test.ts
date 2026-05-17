import { describe, it, expect, beforeEach } from 'vitest';
import { Graph } from 'graphlib';
import { cluster, louvainCommunities } from '../src/cluster/index.js';
import { cohesionScore, scoreAll } from '../src/cluster/cohesion.js';

describe('Cluster Tests', () => {
  let G: Graph;

  beforeEach(() => {
    G = new Graph({ multigraph: false, directed: false });
  });

  describe('cluster', () => {
    it('should handle empty graph', () => {
      const result = cluster(G);
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should detect single community', () => {
      G.setNode('a');
      G.setNode('b');
      G.setNode('c');
      G.setEdge('a', 'b');
      G.setEdge('b', 'c');
      
      const result = cluster(G);
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('should put disconnected in separate communities', () => {
      G.setNode('a');
      G.setNode('b');
      G.setEdge('a', 'a'); // self-loop
      
      G.setNode('c');
      G.setNode('d');
      G.setEdge('c', 'd');
      
      const result = cluster(G);
      expect(Object.keys(result).length).toBe(2);
    });

    it('should handle isolated nodes', () => {
      G.setNode('isolated');
      G.setNode('a');
      G.setNode('b');
      G.setEdge('a', 'b');
      
      const result = cluster(G);
      expect(Object.keys(result).length).toBeGreaterThanOrEqual(2);
    });

    it('should handle large graphs', () => {
      for (let i = 0; i < 50; i++) {
        G.setNode(`n${i}`);
      }
      // Connect in a chain
      for (let i = 0; i < 49; i++) {
        G.setEdge(`n${i}`, `n${i + 1}`);
      }
      
      const result = cluster(G);
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('should return Communities type', () => {
      G.setNode('a');
      G.setNode('b');
      G.setEdge('a', 'b');
      
      const result = cluster(G);
      expect(result[0]).toBeDefined();
    });
  });

  describe('louvainCommunities', () => {
    it('should return Map', () => {
      G.setNode('a');
      G.setNode('b');
      G.setEdge('a', 'b');
      
      const result = louvainCommunities(G);
      expect(result).toBeDefined();
    });

    it('should handle empty graph', () => {
      const result = louvainCommunities(G);
      expect(result.size).toBe(0);
    });

    it('should handle single node', () => {
      G.setNode('alone');
      const result = louvainCommunities(G);
      expect(result.get('alone')).toBeDefined();
    });

    it('should use seed parameter', () => {
      G.setNode('a');
      G.setNode('b');
      G.setEdge('a', 'b');
      
      const result1 = louvainCommunities(G, 42);
      const result2 = louvainCommunities(G, 42);
      
      expect(result1.size).toBe(result2.size);
    });
  });

  describe('cohesionScore', () => {
    it('should return 1 for single node', () => {
      G.setNode('alone');
      const score = cohesionScore(G, ['alone']);
      expect(score).toBe(1.0);
    });

    it('should return 1 for fully connected pair', () => {
      G.setNode('a');
      G.setNode('b');
      G.setEdge('a', 'b');
      
      const score = cohesionScore(G, ['a', 'b']);
      expect(score).toBe(1.0);
    });

    it('should return 0 for disconnected', () => {
      G.setNode('a');
      G.setNode('b');
      
      const score = cohesionScore(G, ['a', 'b']);
      expect(score).toBe(0.0);
    });

    it('should handle partial connectivity', () => {
      G.setNode('a');
      G.setNode('b');
      G.setNode('c');
      G.setEdge('a', 'b');
      G.setEdge('b', 'c');
      
      const score = cohesionScore(G, ['a', 'b', 'c']);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });

    it('should handle empty community', () => {
      const score = cohesionScore(G, []);
      expect(score).toBe(1.0);
    });
  });

  describe('scoreAll', () => {
    it('should score all communities', () => {
      G.setNode('a');
      G.setNode('b');
      G.setEdge('a', 'b');
      
      const communities = { 0: ['a', 'b'] };
      const scores = scoreAll(G, communities);
      
      expect(scores[0]).toBeDefined();
    });

    it('should handle empty communities', () => {
      const communities: Record<number, string[]> = {};
      const scores = scoreAll(G, communities);
      
      expect(Object.keys(scores)).toHaveLength(0);
    });

    it('should handle multiple communities', () => {
      G.setNode('a');
      G.setNode('b');
      G.setEdge('a', 'b');
      G.setNode('c');
      
      const communities = { 0: ['a', 'b'], 1: ['c'] };
      const scores = scoreAll(G, communities);
      
      expect(Object.keys(scores)).toHaveLength(2);
    });
  });
});