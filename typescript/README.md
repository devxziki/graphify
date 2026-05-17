# Graphify (TypeScript)

Extract code structure → Build graph → Generate HTML visualization

A TypeScript implementation of graphify for analyzing source code repositories and generating interactive knowledge graphs.

## Quick Start

```bash
# Clone and setup
cd typescript

# Install dependencies
npm install

# Build the project
npm run build

# Extract graph from a repository
node bin/graphify.js build ./my-repo -o ./graphify-out

# View the interactive HTML graph
# Open graphify-out/graph.html in browser
```

## Installation

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Navigate to typescript directory
cd typescript

# Install dependencies
npm install

# Build TypeScript
npm run build
```

## CLI Commands

### Build

Extract and build graph from source code:

```bash
node bin/graphify.js build <path> [options]
```

Options:
- `-o, --output <dir>` - Output directory (default: graphify-out)
- `--no-html` - Skip HTML visualization
- `-f, --force` - Force rebuild

Example:
```bash
node bin/graphify.js build ../python/graphify -o ./graphify-out
```

### Query

Query the graph with a natural language question:

```bash
node bin/graphify.js query <graph.json> "<question>" [options]
```

Options:
- `--dfs` - Use DFS instead of BFS
- `--context <ctx>` - Filter by edge context (repeatable)
- `--budget <tokens>` - Token budget (default: 2000)

Example:
```bash
node bin/graphify.js query ./graphify-out/graph.json "How does authentication work"
```

### Path

Find shortest path between two nodes:

```bash
node bin/graphify.js path <graph.json> "<source>" "<target>"
```

Example:
```bash
node bin/graphify.js path ./graphify-out/graph.json "UserService" "Database"
```

### Explain

Explain a node - show its details and connections:

```bash
node bin/graphify.js explain <graph.json> "<node>"
```

Example:
```bash
node bin/graphify.js explain ./graphify-out/graph.json "AuthService"
```

### Export

Export graph to different formats:

```bash
node bin/graphify.js export <format> <graph.json> [options]
```

Formats:
- `html` - Interactive HTML visualization (vis.js)
- `json` - Raw JSON graph data

Options:
- `-o, --output <path>` - Output path

Example:
```bash
node bin/graphify.js export html ./graphify-out/graph.json -o ./output/graph.html
```

## Programmatic Usage

```typescript
import { Graphify } from './dist/index.js';

const g = new Graphify({
  outputDir: './graphify-out',
  skipHtml: false
});

// Build graph from source
await g.build('/path/to/repo');

// Or use individual modules
import { extract, build, cluster, analyze, toJSON, toHTML } from './dist/index.js';

const extraction = extract('/path/to/repo');
const G = build([extraction]);
const communities = cluster(G);
const analysis = analyze(G, communities);

toJSON(G, communities, './output/graph.json');
toHTML(G, communities, './output/graph.html');
```

## Supported Languages

| Language | Extensions | Status |
|----------|------------|--------|
| JavaScript | .js, .jsx, .mjs | ✅ Supported |
| TypeScript | .ts, .tsx | ✅ Supported |
| Python | .py | ✅ Supported |
| Java | .java | ✅ Supported |
| C | .c, .h | ⚠️ Basic |
| C++ | .cpp, .cc, .hpp | ⚠️ Basic |

## Output Files

| File | Description |
|------|-------------|
| `graph.json` | Graph data in JSON format (nodes, edges, communities) |
| `graph.html` | Interactive visualization using vis.js |

## Project Structure

```
typescript/
├── src/
│   ├── index.ts           # Main exports & Graphify class
│   ├── types/              # TypeScript type definitions
│   ├── detect/            # File discovery & classification
│   ├── extract/           # AST extraction (regex-based)
│   ├── build/             # Graph construction
│   ├── cluster/           # Community detection (Louvain)
│   ├── analyze/           # Graph analysis (god nodes, etc.)
│   ├── export/            # JSON & HTML export
│   ├── query/             # Graph queries (search, path)
│   └── cli/               # CLI commands
├── bin/
│   └── graphify.js        # CLI entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Features

- **File Detection**: Scans directories, respects .graphifyignore patterns
- **AST Extraction**: Extracts classes, functions, imports from source code
- **Graph Building**: Creates nodes and edges from extraction results
- **Community Detection**: Groups related nodes using Louvain algorithm
- **Graph Analysis**: Identifies god nodes, surprising connections
- **HTML Visualization**: Interactive graph with search, filtering, community colors
- **Query Engine**: Natural language queries, shortest path, node explanation

## Troubleshooting

### "Graph file not found" error

Make sure you've run the build command first to generate the graph:
```bash
node bin/graphify.js build ./my-repo -o ./graphify-out
```

### Large graphs slow

For very large repositories, the HTML visualization may be slow. Use `--no-html` to skip:
```bash
node bin/graphify.js build ./large-repo --no-html
```

## License

MIT