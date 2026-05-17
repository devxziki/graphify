import { describe, it, expect } from 'vitest';
import { Graph } from 'graphlib';
import { scoreNodes, pickSeeds, computeIDF } from '../src/query/scoring.js';

describe('Scoring Tests', () => {
  let G: Graph;

  beforeEach(() => {
    G = new Graph({ directed: false });
    G.setNode('node1', { label: 'UserService', source_file: '/src/UserService.ts' });
    G.setNode('node2', { label: 'UserController', source_file: '/src/UserController.ts' });
    G.setNode('node3', { label: 'Database', source_file: '/src/Database.ts' });
    G.setNode('node4', { label: 'Config', source_file: '/src/Config.ts' });
    G.setEdge('node1', 'node2');
    G.setEdge('node1', 'node3');
    G.setEdge('node2', 'node3');
  });

  describe('scoreNodes', () => {
    it('should return scored nodes', () => {
      const results = scoreNodes(G, ['User']);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle single term', () => {
      const results = scoreNodes(G, ['Service']);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty for invalid terms', () => {
      const results = scoreNodes(G, ['xyz123']);
      expect(results).toHaveLength(0);
    });

    it('should handle case insensitivity', () => {
      const resultsLower = scoreNodes(G, ['user']);
      const resultsUpper = scoreNodes(G, ['USER']);
      expect(resultsLower.length).toBe(resultsUpper.length);
    });
  });

  describe('pickSeeds', () => {
    it('should select top seeds', () => {
      const scored = [
        { score: 100, nodeId: 'a' },
        { score: 80, nodeId: 'b' },
        { score: 60, nodeId: 'c' }
      ];
      const seeds = pickSeeds(scored, 2);
      expect(seeds).toHaveLength(2);
    });

    it('should return empty for no scored', () => {
      const seeds = pickSeeds([], 3);
      expect(seeds).toHaveLength(0);
    });

    it('should handle all same score', () => {
      const scored = [
        { score: 50, nodeId: 'a' },
        { score: 50, nodeId: 'b' },
        { score: 50, nodeId: 'c' }
      ];
      const seeds = pickSeeds(scored, 3, 0.1);
      expect(seeds.length).toBeGreaterThan(0);
    });
  });
});