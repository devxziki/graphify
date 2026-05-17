// Graph analysis module
import { Graph } from 'graphlib';
import { Communities, AnalysisResult, GodNode, SurprisingConnection } from '../types/index.js';
import { godNodes } from './god-nodes.js';
import { surprisingConnections } from './surprising.js';
import { graphEdges, setDifference, graphNeighbors } from '../utils/graphlib.js';

/**
 * Run full analysis on a graph
 */
export function analyze(
  G: Graph,
  communities: Communities
): AnalysisResult {
  const gods = godNodes(G, 10);
  const surprises = surprisingConnections(G, communities, 5);

  return {
    god_nodes: gods,
    surprising_connections: surprises,
    communities,
    cohesion: {} // Will be populated by cluster module
  };
}

/**
 * Compare two graph snapshots
 */
export function graphDiff(
  G_old: Graph,
  G_new: Graph
): {
  new_nodes: { id: string; label: string }[];
  removed_nodes: { id: string; label: string }[];
  new_edges: { source: string; target: string; relation: string }[];
  removed_edges: { source: string; target: string; relation: string }[];
  summary: string;
} {
  const oldNodesSet = new Set(G_old.nodes());
  const newNodesSet = new Set(G_new.nodes());

  const addedNodes = setDifference(newNodesSet, oldNodesSet);
  const removedNodes = setDifference(oldNodesSet, newNodesSet);

  const newNodesList: { id: string; label: string }[] = [];
  for (const id of addedNodes) {
    const data = G_new.node(id);
    newNodesList.push({ id, label: (data?.label as string) || id });
  }

  const removedNodesList: { id: string; label: string }[] = [];
  for (const id of removedNodes) {
    const data = G_old.node(id);
    removedNodesList.push({ id, label: (data?.label as string) || id });
  }

  // Edge comparison using helper
  const oldEdgesArr = graphEdges(G_old);
  const newEdgesArr = graphEdges(G_new);

  const oldEdgesSet = new Set(oldEdgesArr.map(([u, v]) => {
    const data = G_old.edge(u, v);
    return `${u}->${v}->${(data?.relation as string) || ''}`;
  }));

  const newEdgesSet = new Set(newEdgesArr.map(([u, v]) => {
    const data = G_new.edge(u, v);
    return `${u}->${v}->${(data?.relation as string) || ''}`;
  }));

  const addedEdgesSet = setDifference(newEdgesSet, oldEdgesSet);
  const removedEdgesSet = setDifference(oldEdgesSet, newEdgesSet);

  const newEdgesList: { source: string; target: string; relation: string }[] = [];
  for (const e of addedEdgesSet) {
    const parts = e.split('->');
    if (parts.length >= 3) {
      newEdgesList.push({ source: parts[0], target: parts[1], relation: parts[2] });
    }
  }

  const removedEdgesList: { source: string; target: string; relation: string }[] = [];
  for (const e of removedEdgesSet) {
    const parts = e.split('->');
    if (parts.length >= 3) {
      removedEdgesList.push({ source: parts[0], target: parts[1], relation: parts[2] });
    }
  }

  // Summary
  const parts: string[] = [];
  if (newNodesList.length) parts.push(`${newNodesList.length} new node(s)`);
  if (newEdgesList.length) parts.push(`${newEdgesList.length} new edge(s)`);
  if (removedNodesList.length) parts.push(`${removedNodesList.length} removed`);
  if (removedEdgesList.length) parts.push(`${removedEdgesList.length} edge(s) removed`);

  const summary = parts.length ? parts.join(', ') : 'no changes';

  return {
    new_nodes: newNodesList,
    removed_nodes: removedNodesList,
    new_edges: newEdgesList,
    removed_edges: removedEdgesList,
    summary
  };
}

export default {
  analyze,
  graphDiff,
  godNodes,
  surprisingConnections
};