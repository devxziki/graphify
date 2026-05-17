#!/usr/bin/env node

// Graphify CLI
const { Command } = require('commander');
const { Graphify, loadGraph, cluster, toJSON, toHTML, query, shortestPath, explainNode } = require('../dist/index.js');
const { readFileSync, existsSync } = require('fs');
const path = require('path');

const program = new Command();

program
  .name('graphify')
  .description('Extract code structure → Build graph → Generate HTML visualization')
  .version('1.0.0');

// Build command
program
  .command('build <path>')
  .description('Extract and build graph from source code')
  .option('-o, --output <dir>', 'Output directory', 'graphify-out')
  .option('--no-html', 'Skip HTML visualization')
  .option('-f, --force', 'Force rebuild')
  .action(async (sourcePath, options) => {
    const graphify = new Graphify({
      outputDir: options.output,
      skipHtml: !options.html
    });

    try {
      await graphify.build(sourcePath);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// Query command
program
  .command('query <graph.json> <question>')
  .description('Query the graph with a question')
  .option('--dfs', 'Use DFS instead of BFS')
  .option('--context <ctx>', 'Filter by edge context (repeatable)', (val, acc) => { acc.push(val); return acc; }, [])
  .option('--budget <tokens>', 'Token budget', '2000')
  .action((graphPath, question, options) => {
    if (!existsSync(graphPath)) {
      console.error(`Error: Graph file not found: ${graphPath}`);
      process.exit(1);
    }

    const G = loadGraph(graphPath);
    const result = query(G, question, {
      mode: options.dfs ? 'dfs' : 'bfs',
      contextFilters: options.context,
      tokenBudget: parseInt(options.budget)
    });

    console.log(result.answer);
  });

// Path command
program
  .command('path <graph.json> <source> <target>')
  .description('Find shortest path between two nodes')
  .action((graphPath, source, target) => {
    if (!existsSync(graphPath)) {
      console.error(`Error: Graph file not found: ${graphPath}`);
      process.exit(1);
    }

    const G = loadGraph(graphPath);
    const fromMatches = G.nodes().filter(n => n.toLowerCase().includes(source.toLowerCase()));
    const toMatches = G.nodes().filter(n => n.toLowerCase().includes(target.toLowerCase()));

    if (fromMatches.length === 0) {
      console.error(`No node matching '${source}' found.`);
      process.exit(1);
    }
    if (toMatches.length === 0) {
      console.error(`No node matching '${target}' found.`);
      process.exit(1);
    }

    const pathNodes = shortestPath(G, fromMatches[0], toMatches[0]);

    if (pathNodes.length === 0) {
      console.log(`No path found between '${source}' and '${target}'.`);
      process.exit(0);
    }

    console.log(`Shortest path (${pathNodes.length - 1} hops):`);
    console.log('  ' + pathNodes.join(' → '));
  });

// Explain command
program
  .command('explain <graph.json> <node>')
  .description('Explain a node - show its details and connections')
  .action((graphPath, nodeLabel) => {
    if (!existsSync(graphPath)) {
      console.error(`Error: Graph file not found: ${graphPath}`);
      process.exit(1);
    }

    const G = loadGraph(graphPath);
    const explanation = explainNode(G, nodeLabel);

    if (!explanation) {
      console.log(`No node matching '${nodeLabel}' found.`);
      process.exit(0);
    }

    console.log(`Node: ${explanation.label}`);
    console.log(`  ID:        ${explanation.id}`);
    console.log(`  Source:    ${explanation.source_file} ${explanation.source_location || ''}`.trim());
    console.log(`  Type:      ${explanation.file_type}`);
    console.log(`  Community: ${explanation.community}`);
    console.log(`  Degree:    ${explanation.degree}`);

    if (explanation.connections.length > 0) {
      console.log(`\nConnections (${explanation.connections.length}):`);
      for (const conn of explanation.connections.slice(0, 20)) {
        const arrow = conn.direction === 'out' ? '-->' : '<--';
        console.log(`  ${arrow} ${conn.node} [${conn.relation}] [${conn.confidence}]`);
      }
      if (explanation.connections.length > 20) {
        console.log(`  ... and ${explanation.connections.length - 20} more`);
      }
    }
  });

// Export command
program
  .command('export <format> <graph.json>')
  .description('Export graph to specified format')
  .option('-o, --output <path>', 'Output path')
  .action((format, graphPath, options) => {
    if (!existsSync(graphPath)) {
      console.error(`Error: Graph file not found: ${graphPath}`);
      process.exit(1);
    }

    const G = loadGraph(graphPath);
    const communities = {};

    if (format === 'html') {
      const output = options.output || graphPath.replace('.json', '.html');
      toHTML(G, communities, output);
      console.log(`Exported to ${output}`);
    } else if (format === 'json') {
      const output = options.output || graphPath;
      toJSON(G, communities, output);
      console.log(`Exported to ${output}`);
    } else {
      console.error(`Unknown format: ${format}. Use 'html' or 'json'.`);
      process.exit(1);
    }
  });

// Parse command line
program.parse(process.argv);

// Show help if no command
if (process.argv.length === 2) {
  program.help();
}