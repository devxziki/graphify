// Node scoring - TF-IDF based matching
import { Graph } from 'graphlib';
import { graphNodes } from '../utils/graphlib.js';

/**
 * Strip diacritics from text
 */
function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const EXACT_MATCH_BONUS = 1000.0;
const PREFIX_MATCH_BONUS = 100.0;
const SUBSTRING_MATCH_BONUS = 1.0;
const SOURCE_MATCH_BONUS = 0.5;

/**
 * Compute IDF weights for query terms
 */
function computeIDF(G: Graph, terms: string[]): Map<string, number> {
  // Use graph metadata for caching - cast graph to any to add custom properties
  const graphAny = G as unknown as { _idfCache?: Map<string, number> };
  const cache = graphAny._idfCache || new Map();
  graphAny._idfCache = cache;

  const N = graphNodes(G).length || 1;
  const uncached = terms.filter(t => !cache.has(t));

  if (uncached.length > 0) {
    const df: Map<string, number> = new Map(uncached.map(t => [t, 0]));

    for (const nodeId of graphNodes(G)) {
      const data = G.node(nodeId);
      const normLabel = stripDiacritics((data?.label as string) || '').toLowerCase();

      for (const term of uncached) {
        if (normLabel.includes(term)) {
          df.set(term, (df.get(term) || 0) + 1);
        }
      }
    }

    for (const term of uncached) {
      const df_val = df.get(term) || 0;
      cache.set(term, Math.log(1 + N / (1 + df_val)));
    }
  }

  const result = new Map<string, number>();
  for (const term of terms) {
    result.set(term, cache.get(term) || Math.log(1 + N));
  }

  return result;
}

/**
 * Score nodes by query terms
 */
export function scoreNodes(G: Graph, terms: string[]): Array<{ score: number; nodeId: string }> {
  if (terms.length === 0) return [];

  const normTerms = terms.map(t => stripDiacritics(t).toLowerCase());
  const idf = computeIDF(G, normTerms);

  const scored: Array<{ score: number; nodeId: string }> = [];

  for (const nodeId of graphNodes(G)) {
    const data = G.node(nodeId);
    const label = (data?.label as string) || '';
    const normLabel = stripDiacritics(label).toLowerCase();
    const bareLabel = normLabel.replace(/\(\)$/, '');
    const source = ((data?.source_file as string) || '').toLowerCase();

    let score = 0.0;

    for (const term of normTerms) {
      const w = idf.get(term) || 1.0;

      // Exact match
      if (term === normLabel || term === bareLabel) {
        score += EXACT_MATCH_BONUS * w;
      }
      // Prefix match
      else if (normLabel.startsWith(term) || bareLabel.startsWith(term)) {
        score += PREFIX_MATCH_BONUS * w;
      }
      // Substring match
      else if (normLabel.includes(term)) {
        score += SUBSTRING_MATCH_BONUS * w;
      }

      // Source file match
      if (source.includes(term)) {
        score += SOURCE_MATCH_BONUS * w;
      }
    }

    if (score > 0) {
      scored.push({ score, nodeId });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * Select BFS seed nodes from scored nodes
 */
export function pickSeeds(
  scored: Array<{ score: number; nodeId: string }>,
  maxK: number = 3,
  gapRatio: number = 0.2
): string[] {
  if (scored.length === 0) return [];

  const topScore = scored[0].score;
  const seeds: string[] = [];

  for (const { score, nodeId } of scored.slice(0, maxK)) {
    if (seeds.length > 0 && score < topScore * gapRatio) {
      break;
    }
    seeds.push(nodeId);
  }

  return seeds;
}

export default {
  scoreNodes,
  pickSeeds
};