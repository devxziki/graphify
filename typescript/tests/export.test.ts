import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Graph } from 'graphlib';
import { writeFileSync, unlinkSync, mkdirSync, rmdirSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { toJSON } from '../src/export/json.js';
import { toHTML } from '../src/export/html.js';
import { Communities } from '../src/types/index.js';

describe('Export Module', () => {
  let testDir: string;
  let G: Graph;
  let communities: Communities;

  beforeEach(() => {
    testDir = join(tmpdir(), `graphify-test-${Date.now()}`);
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

  describe('JSON Export', () => {
    it('should export graph to JSON', () => {
      const outputPath = join(testDir, 'graph.json');
      toJSON(G, communities, outputPath);

      expect(existsSync(outputPath)).toBe(true);
    });

    it('should include nodes in export', () => {
      const outputPath = join(testDir, 'graph.json');
      toJSON(G, communities, outputPath);

      const content = require('fs').readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.nodes).toHaveLength(3);
      expect(data.nodes.some((n: any) => n.label === 'Node1')).toBe(true);
    });

    it('should include edges in export', () => {
      const outputPath = join(testDir, 'graph.json');
      toJSON(G, communities, outputPath);

      const content = require('fs').readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.edges).toHaveLength(2);
    });

    it('should include community information', () => {
      const outputPath = join(testDir, 'graph.json');
      toJSON(G, communities, outputPath);

      const content = require('fs').readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);

      const node1 = data.nodes.find((n: any) => n.id === 'node1');
      expect(node1.community).toBe(0);
    });

    it('should include normalized labels', () => {
      const outputPath = join(testDir, 'graph.json');
      toJSON(G, communities, outputPath);

      const content = require('fs').readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);

      const node1 = data.nodes.find((n: any) => n.label === 'Node1');
      expect(node1.norm_label).toBe('node1');
    });
  });

  describe('HTML Export', () => {
    it('should export graph to HTML', () => {
      const outputPath = join(testDir, 'graph.html');
      toHTML(G, communities, outputPath);

      expect(existsSync(outputPath)).toBe(true);
    });

    it('should include vis.js dependencies', () => {
      const outputPath = join(testDir, 'graph.html');
      toHTML(G, communities, outputPath);

      const content = require('fs').readFileSync(outputPath, 'utf-8');
      expect(content).toContain('vis-network');
    });

    it('should include node data', () => {
      const outputPath = join(testDir, 'graph.html');
      toHTML(G, communities, outputPath);

      const content = require('fs').readFileSync(outputPath, 'utf-8');
      expect(content).toContain('Node1');
    });

    it('should include community colors', () => {
      const outputPath = join(testDir, 'graph.html');
      toHTML(G, communities, outputPath);

      const content = require('fs').readFileSync(outputPath, 'utf-8');
      expect(content).toContain('#4E79A7'); // First community color
    });

    it('should show graph statistics', () => {
      const outputPath = join(testDir, 'graph.html');
      toHTML(G, communities, outputPath);

      const content = require('fs').readFileSync(outputPath, 'utf-8');
      expect(content).toContain('nodes');
      expect(content).toContain('edges');
    });
  });

  describe('Large Graph Handling', () => {
    it('should handle graphs with many nodes', () => {
      const largeG = new Graph({ multigraph: true, directed: true });

      for (let i = 0; i < 100; i++) {
        largeG.setNode(`node${i}`, { label: `Node${i}`, file_type: 'code' });
      }

      // Add some edges with data
      for (let i = 0; i < 99; i++) {
        largeG.setEdge(`node${i}`, `node${i + 1}`, { relation: 'related', confidence: 'EXTRACTED' });
      }

      const outputPath = join(testDir, 'large.json');
      toJSON(largeG, { 0: [] }, outputPath);

      const content = require('fs').readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);
      expect(data.nodes).toHaveLength(100);
    });
  });
});