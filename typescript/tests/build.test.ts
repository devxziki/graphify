import { describe, it, expect, beforeEach } from 'vitest';
import { Graph } from 'graphlib';
import { GraphNode, GraphEdge } from '../src/types/index.js';

describe('Build Module', () => {
  let G: Graph;

  beforeEach(() => {
    G = new Graph({ multigraph: true, directed: true });
  });

  describe('Graph Creation', () => {
    it('should create an empty graph', () => {
      expect(G.nodes()).toHaveLength(0);
      expect(G.edges()).toHaveLength(0);
    });

    it('should set node with data', () => {
      G.setNode('node1', { label: 'Node1', file_type: 'code' });
      expect(G.hasNode('node1')).toBe(true);
      expect(G.node('node1')).toEqual({ label: 'Node1', file_type: 'code' });
    });

    it('should set edge between nodes', () => {
      G.setNode('node1', { label: 'Node1' });
      G.setNode('node2', { label: 'Node2' });
      G.setEdge('node1', 'node2', { relation: 'imports' });
      expect(G.hasEdge('node1', 'node2')).toBe(true);
    });

    it('should handle undirected graphs', () => {
      const undirected = new Graph({ multigraph: false, directed: false });
      undirected.setNode('a');
      undirected.setNode('b');
      undirected.setEdge('a', 'b');
      expect(undirected.hasEdge('a', 'b')).toBe(true);
      expect(undirected.hasEdge('b', 'a')).toBe(true);
    });
  });

  describe('Graph Properties', () => {
    it('should report directed status', () => {
      const directed = new Graph({ directed: true });
      const undirected = new Graph({ directed: false });
      expect(directed.isDirected()).toBe(true);
      expect(undirected.isDirected()).toBe(false);
    });
  });

  describe('Node Operations', () => {
    it('should remove nodes', () => {
      G.setNode('node1');
      G.removeNode('node1');
      expect(G.hasNode('node1')).toBe(false);
    });

    it('should update node data', () => {
      G.setNode('node1', { label: 'Original' });
      G.setNode('node1', { label: 'Updated' });
      expect(G.node('node1')).toEqual({ label: 'Updated' });
    });
  });

  describe('Edge Operations', () => {
    it('should remove edges', () => {
      G.setNode('a');
      G.setNode('b');
      G.setEdge('a', 'b');
      G.removeEdge('a', 'b');
      expect(G.hasEdge('a', 'b')).toBe(false);
    });

    it('should get edge data', () => {
      G.setNode('a');
      G.setNode('b');
      G.setEdge('a', 'b', { relation: 'calls', weight: 1 });
      const edgeData = G.edge('a', 'b');
      expect(edgeData).toEqual({ relation: 'calls', weight: 1 });
    });
  });
});