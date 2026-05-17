// Export module
import { Graph } from 'graphlib';
import { Communities } from '../types/index.js';
import { toJSON } from './json.js';
import { toHTML } from './html.js';

/**
 * Export graph to multiple formats
 */
export class GraphExporter {
  private G: Graph;
  private communities: Communities;

  constructor(G: Graph, communities: Communities) {
    this.G = G;
    this.communities = communities;
  }

  /**
   * Export to JSON format
   */
  toJSON(outputPath: string, options?: { builtAtCommit?: string }): void {
    toJSON(this.G, this.communities, outputPath, options);
  }

  /**
   * Export to HTML visualization
   */
  toHTML(outputPath: string, options?: { communityLabels?: Record<number, string> }): void {
    toHTML(this.G, this.communities, outputPath, options);
  }

  /**
   * Export to both JSON and HTML
   */
  export(outputDir: string, options?: {
    jsonName?: string;
    htmlName?: string;
    communityLabels?: Record<number, string>;
    builtAtCommit?: string;
  }): void {
    const jsonName = options?.jsonName || 'graph.json';
    const htmlName = options?.htmlName || 'graph.html';

    const jsonPath = outputDir + '/' + jsonName;
    const htmlPath = outputDir + '/' + htmlName;

    this.toJSON(jsonPath, { builtAtCommit: options?.builtAtCommit });
    this.toHTML(htmlPath, { communityLabels: options?.communityLabels });

    console.log(`[graphify] Exported to ${jsonPath} and ${htmlPath}`);
  }
}

export { toJSON, toHTML };
export default { toJSON, toHTML };