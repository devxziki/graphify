import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Graph } from 'graphlib';
import { mkdirSync, rmdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { toJSON, toJSONCompact } from '../src/export/json.js';
import { toHTML } from '../src/export/html.js';
import { Communities } from '../src/types/index.js';

describe('Export Tests', () => {
  let testDir: string;
  let G: Graph;
  let communities: Communities;

  beforeEach(() => {
    testDir = join(tmpdir(), `export-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    
    G = new Graph({ multigraph: true, directed: true });
    G.setNode('node1', { label: 'Node1', file_type: 'code', source_file: '/src/main.ts' });
    G.setNode('node2', { label: 'Node2', file_type: 'code', source_file: '/src/util.ts' });
    G.setNode('node3', { label: 'Node3', file_type: 'document', source_file: '/docs/readme.md' });
    G.setEdge('node1', 'node2', { relation: 'imports', confidence: 'EXTRACTED' });
    G.setEdge('node2', 'node3', { relation: 'references', confidence: 'INFERRED' });

    communities = {
      0: ['node1', 'node2'],
      1: ['node3']
    };
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmdirSync(testDir, { recursive: true });
    }
  });

  describe('toJSON', () => {
    it('should export graph to JSON', () => {
      const outputPath = join(testDir, 'graph.json');
      toJSON(G, communities, outputPath);
      expect(existsSync(outputPath)).toBe(true);
    });

    it('should include nodes in export', () => {
      const outputPath = join(testDir, 'graph.json');
      toJSON(G, communities, outputPath);
      
      const content = readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data.nodes).toHaveLength(3);
      expect(data.nodes.some((n: any) => n.label === 'Node1')).toBe(true);
    });

    it('should include edges in export', () => {
      const outputPath = join(testDir, 'graph.json');
      toJSON(G, communities, outputPath);
      
      const content = readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data.edges).toHaveLength(2);
    });

    it('should include community information', () => {
      const outputPath = join(testDir, 'graph.json');
      toJSON(G, communities, outputPath);
      
      const content = readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);
      
      const node1 = data.nodes.find((n: any) => n.id === 'node1');
      expect(node1.community).toBe(0);
    });

    it('should include normalized labels', () => {
      const outputPath = join(testDir, 'graph.json');
      toJSON(G, communities, outputPath);
      
      const content = readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data.nodes[0].norm_label).toBeDefined();
    });

    it('should set directed flag', () => {
      const outputPath = join(testDir, 'graph.json');
      toJSON(G, communities, outputPath);
      
      const content = readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data.directed).toBe(true);
    });

    it('should handle empty graph', () => {
      const emptyG = new Graph();
      const outputPath = join(testDir, 'empty.json');
      toJSON(emptyG, {}, outputPath);
      
      const content = readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data.nodes).toHaveLength(0);
      expect(data.edges).toHaveLength(0);
    });

    it('should handle weighted edges', () => {
      G.setEdge('node1', 'node2', { relation: 'calls', weight: 2.5 });
      
      const outputPath = join(testDir, 'weighted.json');
      toJSON(G, communities, outputPath);
      
      const content = readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data.edges).toHaveLength(3);
    });
  });

  describe('toHTML', () => {
    it('should export graph to HTML', () => {
      const outputPath = join(testDir, 'graph.html');
      toHTML(G, communities, outputPath);
      expect(existsSync(outputPath)).toBe(true);
    });

    it('should include vis.js dependencies', () => {
      const outputPath = join(testDir, 'graph.html');
      toHTML(G, communities, outputPath);
      
      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('vis-network');
    });

    it('should include node data', () => {
      const outputPath = join(testDir, 'graph.html');
      toHTML(G, communities, outputPath);
      
      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('Node1');
    });

    it('should include community colors', () => {
      const outputPath = join(testDir, 'graph.html');
      toHTML(G, communities, outputPath);
      
      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('#4E79A7');
    });

    it('should show graph statistics', () => {
      const outputPath = join(testDir, 'graph.html');
      toHTML(G, communities, outputPath);
      
      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('nodes');
      expect(content).toContain('edges');
    });

    it('should handle custom community labels', () => {
      const outputPath = join(testDir, 'graph.html');
      const labels = { 0: 'Code', 1: 'Docs' };
      toHTML(G, communities, outputPath, { communityLabels: labels });
      
      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('Code');
    });

    it('should include search functionality', () => {
      const outputPath = join(testDir, 'graph.html');
      toHTML(G, communities, outputPath);
      
      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('search');
    });
  });

  describe('Large Graph Handling', () => {
    it('should handle graphs with many nodes', () => {
      const largeG = new Graph({ multigraph: true, directed: true });

      for (let i = 0; i < 100; i++) {
        largeG.setNode(`node${i}`, { label: `Node${i}`, file_type: 'code' });
      }

      for (let i = 0; i < 99; i++) {
        largeG.setEdge(`node${i}`, `node${i + 1}`, { relation: 'related', confidence: 'EXTRACTED' });
      }

      const outputPath = join(testDir, 'large.json');
      toJSON(largeG, { 0: [] }, outputPath);

      const content = readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);
      expect(data.nodes).toHaveLength(100);
    });
  });
});