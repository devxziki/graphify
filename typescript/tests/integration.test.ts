import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Graph } from 'graphlib';
import { mkdirSync, rmdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { toJSON } from '../src/export/json.js';
import { toHTML } from '../src/export/html.js';
import { cluster } from '../src/cluster/index.js';
import { cohesionScore, scoreAll } from '../src/cluster/cohesion.js';
import { analyze } from '../src/analyze/index.js';
import { Communities } from '../src/types/index.js';

describe('Integration Tests', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `integration-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmdirSync(testDir, { recursive: true });
    }
  });

  describe('Full Pipeline', () => {
    it('should build graph, cluster, and export', () => {
      // Create a sample graph
      const G = new Graph({ multigraph: true, directed: true });
      
      G.setNode('User', { label: 'User', source_file: '/src/models/User.ts' });
      G.setNode('UserService', { label: 'UserService', source_file: '/src/services/UserService.ts' });
      G.setNode('AuthController', { label: 'AuthController', source_file: '/src/controllers/AuthController.ts' });
      G.setNode('Database', { label: 'Database', source_file: '/src/db/Database.ts' });
      
      G.setEdge('UserService', 'User', { relation: 'imports', confidence: 'EXTRACTED' });
      G.setEdge('AuthController', 'UserService', { relation: 'imports', confidence: 'EXTRACTED' });
      G.setEdge('UserService', 'Database', { relation: 'imports', confidence: 'EXTRACTED' });
      
      // Cluster the graph
      const communities = cluster(G);
      expect(Object.keys(communities).length).toBeGreaterThan(0);
      
      // Analyze the graph
      const analysis = analyze(G, communities);
      expect(analysis.communities).toBeDefined();
      expect(analysis.god_nodes).toBeDefined();
      
      // Export to JSON
      const jsonPath = join(testDir, 'test.json');
      toJSON(G, communities, jsonPath);
      expect(existsSync(jsonPath)).toBe(true);
      
      const jsonContent = JSON.parse(readFileSync(jsonPath, 'utf-8'));
      expect(jsonContent.nodes).toHaveLength(4);
      expect(jsonContent.edges).toHaveLength(3);
      
      // Export to HTML
      const htmlPath = join(testDir, 'test.html');
      toHTML(G, communities, htmlPath);
      expect(existsSync(htmlPath)).toBe(true);
      
      const htmlContent = readFileSync(htmlPath, 'utf-8');
      expect(htmlContent).toContain('vis-network');
    });

    it('should handle large graphs', () => {
      const G = new Graph({ multigraph: true, directed: true });
      
      // Create 50 nodes
      for (let i = 0; i < 50; i++) {
        G.setNode(`node${i}`, { label: `Node${i}`, source_file: `/src/file${i}.ts` });
      }
      
      // Create chain of edges
      for (let i = 0; i < 49; i++) {
        G.setEdge(`node${i}`, `node${i + 1}`, { relation: 'calls', confidence: 'EXTRACTED' });
      }
      
      const communities = cluster(G);
      expect(Object.keys(communities).length).toBeGreaterThan(0);
      
      const jsonPath = join(testDir, 'large.json');
      toJSON(G, communities, jsonPath);
      
      const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
      expect(data.nodes).toHaveLength(50);
      expect(data.edges).toHaveLength(49);
    });

    it('should handle disconnected components', () => {
      const G = new Graph({ directed: false });
      
      // Component 1
      G.setNode('a1');
      G.setNode('a2');
      G.setNode('a3');
      G.setEdge('a1', 'a2');
      G.setEdge('a2', 'a3');
      
      // Component 2
      G.setNode('b1');
      G.setNode('b2');
      G.setEdge('b1', 'b2');
      
      // Component 3 (isolated)
      G.setNode('c1');
      
      const communities = cluster(G);
      const communityCounts = Object.values(communities).map(c => c.length);
      
      expect(communityCounts).toContain(3); // Component 1
      expect(communityCounts).toContain(2); // Component 2
      expect(communityCounts).toContain(1); // Component 3
    });

    it('should calculate cohesion scores', () => {
      const G = new Graph({ directed: false });
      
      G.setNode('a');
      G.setNode('b');
      G.setNode('c');
      G.setEdge('a', 'b');
      G.setEdge('b', 'c');
      G.setEdge('a', 'c'); // Fully connected triangle
      
      const communities = { 0: ['a', 'b', 'c'] };
      const scores = scoreAll(G, communities);
      
      expect(scores[0]).toBe(1.0); // Fully connected
    });

    it('should analyze star graph', () => {
      const G = new Graph({ directed: false });
      
      G.setNode('center', { label: 'center', source_file: '/src/center.ts' });
      for (let i = 0; i < 5; i++) {
        G.setNode(`leaf${i}`, { label: `leaf${i}`, source_file: `/src/leaf${i}.ts` });
        G.setEdge('center', `leaf${i}`);
      }
      
      const communities = cluster(G);
      const analysis = analyze(G, communities);
      
      expect(analysis.god_nodes.length).toBeGreaterThan(0);
    });
  });
});