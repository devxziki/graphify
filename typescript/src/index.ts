// Main exports for graphify
export * from './types/index.js';
export * from './detect/file-type.js';
export * from './detect/ignore.js';
export * from './build/index.js';
export * from './build/validate.js';
export * from './build/dedup.js';
export * from './cluster/index.js';
export * from './cluster/cohesion.js';
export * from './analyze/index.js';
export * from './export/index.js';
export * from './query/index.js';
export * from './extract/index.js';
export * from './extract/utils.js';
export * from './extract/languages/types.js';

/**
 * Graphify class - main API
 */
import { Graph } from 'graphlib';
import { graphNodes, graphEdges } from './utils/graphlib.js';
import { extract } from './extract/index.js';
import { build } from './build/index.js';
import { cluster } from './cluster/index.js';
import { analyze } from './analyze/index.js';
import { toJSON, toHTML } from './export/index.js';

export interface GraphifyOptions {
  outputDir?: string;
  includeExtensions?: string[];
  skipHtml?: boolean;
}

export class Graphify {
  private options: GraphifyOptions;

  constructor(options: GraphifyOptions = {}) {
    this.options = {
      outputDir: './graphify-out',
      includeExtensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java'],
      skipHtml: false,
      ...options
    };
  }

  /**
   * Build graph from source path
   */
  async build(sourcePath: string, outputDir?: string): Promise<{
    graph: Graph;
    communities: Record<number, string[]>;
  }> {
    const outDir = outputDir || this.options.outputDir || './graphify-out';

    console.log(`[graphify] Extracting from ${sourcePath}...`);
    const extraction = extract(sourcePath, {
      includeExtensions: this.options.includeExtensions
    });

    console.log(`[graphify] Found ${extraction.nodes.length} nodes, ${extraction.edges.length} edges`);

    console.log(`[graphify] Building graph...`);
    const G = build([extraction], { directed: false });

    console.log(`[graphify] Clustering...`);
    const communities = cluster(G);

    console.log(`[graphify] Analyzing...`);
    const analysis = analyze(G, communities);

    console.log(`[graphify] Exporting to ${outDir}/...`);

    // Export JSON
    const jsonPath = outDir + '/graph.json';
    toJSON(G, communities, jsonPath);
    console.log(`[graphify] Written: ${jsonPath}`);

    // Export HTML (if not skipped)
    if (!this.options.skipHtml) {
      const htmlPath = outDir + '/graph.html';
      toHTML(G, communities, htmlPath);
      console.log(`[graphify] Written: ${htmlPath}`);
    }

    console.log(`[graphify] Done!`);
    console.log(`\nGraph Summary:`);
    console.log(`  - ${graphNodes(G).length} nodes`);
    console.log(`  - ${graphEdges(G).length} edges`);
    console.log(`  - ${Object.keys(communities).length} communities`);
    console.log(`  - ${analysis.god_nodes.length} god nodes`);

    return { graph: G, communities };
  }

  /**
   * Export existing graph to JSON
   */
  toJSON(G: Graph, communities: Record<number, string[]>, outputPath: string): void {
    toJSON(G, communities, outputPath);
  }

  /**
   * Export existing graph to HTML
   */
  toHTML(G: Graph, communities: Record<number, string[]>, outputPath: string): void {
    toHTML(G, communities, outputPath);
  }
}

export default {
  Graphify,
  extract,
  build,
  cluster,
  analyze,
  toJSON,
  toHTML
};