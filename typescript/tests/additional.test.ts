import { describe, it, expect } from 'vitest';
import { Graph } from 'graphlib';
import { shouldIgnore } from '../src/detect/ignore.js';

describe('Additional Tests', () => {
  describe('Ignore Edge Cases', () => {
    it('should handle empty patterns', () => {
      expect(shouldIgnore('test.js', { patterns: [] })).toBe(false);
    });

    it('should handle single character pattern', () => {
      expect(shouldIgnore('test.js', { patterns: ['a'] })).toBe(false);
    });

    it('should handle null patterns', () => {
      expect(shouldIgnore('test.js')).toBe(false);
    });

    it('should handle whitespace in pattern', () => {
      expect(shouldIgnore('test.js', { patterns: ['  '] })).toBe(false);
    });
  });

  describe('Graph Edge Cases', () => {
    it('should handle self-loops', () => {
      const G = new Graph({ directed: true });
      G.setNode('a');
      G.setEdge('a', 'a');
      expect(G.hasEdge('a', 'a')).toBe(true);
    });

    it('should handle parallel edges', () => {
      const G = new Graph({ multigraph: true, directed: true });
      G.setNode('a');
      G.setNode('b');
      G.setEdge('a', 'b', { label: 'first' });
      G.setEdge('a', 'b', { label: 'second' });
      expect(G.hasEdge('a', 'b')).toBe(true);
    });

    it('should handle node removal', () => {
      const G = new Graph();
      G.setNode('a');
      G.setNode('b');
      G.setEdge('a', 'b');
      G.removeNode('a');
      expect(G.hasNode('a')).toBe(false);
    });

    it('should handle edge removal', () => {
      const G = new Graph();
      G.setNode('a');
      G.setNode('b');
      G.setEdge('a', 'b');
      G.removeEdge('a', 'b');
      expect(G.hasEdge('a', 'b')).toBe(false);
    });
  });

  describe('Search Edge Cases', () => {
    it('should handle empty graph', () => {
      const G = new Graph();
      expect(G.nodes()).toHaveLength(0);
    });

    it('should handle isolated nodes', () => {
      const G = new Graph();
      G.setNode('a');
      G.setNode('b');
      expect(G.neighbors('a')).toBeFalsy();
    });

    it('should handle bidirectional edges', () => {
      const G = new Graph({ directed: true });
      G.setNode('a');
      G.setNode('b');
      G.setEdge('a', 'b');
      G.setEdge('b', 'a');
      expect(G.hasEdge('a', 'b')).toBe(true);
      expect(G.hasEdge('b', 'a')).toBe(true);
    });

    it('should handle empty edge list', () => {
      const G = new Graph();
      G.setNode('a');
      expect(G.edges()).toHaveLength(0);
    });
  });
});