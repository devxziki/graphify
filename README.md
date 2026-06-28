<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/TypeScript-Node_18+-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/github/last-commit/devxziki/graphify" alt="Last Commit"/>
</p>

# Graphify

Extract code structure → Build knowledge graph → Generate interactive visualization

Graphify scans source code repositories, extracts classes, functions, and imports, builds a dependency graph, detects communities, and renders an interactive HTML visualization. Available in Python and TypeScript.

---

## Quick Start

### TypeScript

```bash
cd typescript
npm install && npm run build
node bin/graphify.js build ./your-repo -o ./graphify-out
# Open graphify-out/graph.html in browser
```

### Python

```bash
cd python
pip install -e .
graphify build ./your-repo -o ./graphify-out
```

---

## Implementations

| Language | Status | CLI | Engine |
|----------|--------|-----|--------|
| [TypeScript](./typescript/) | ✅ Complete | `node bin/graphify.js` | graphlib, tree-sitter WASM, vis.js |
| [Python](./python/) | ✅ Complete | `graphify` | NetworkX, tree-sitter, graspologic |

### TypeScript Features
- CLI commands: `build`, `query`, `path`, `explain`, `export`
- Interactive HTML visualization (vis.js) with search, filtering, community colors
- AST extraction for 6 languages (JS, TS, Python, Java, C, C++)
- Louvain community detection
- Natural language query engine with BFS/DFS

### Python Features
- Full CLI with `/graphify` AI skill integration
- Supports 31+ programming languages
- PDF, image, video, audio extraction
- MCP server, Neo4j export, SVG export
- Multi-backend LLM support (Claude, Gemini, OpenAI, Ollama, Bedrock)

---

## Output

```
graphify-out/
├── graph.html       Interactive visualization (vis.js)
├── graph.json       Full graph data (nodes, edges, communities)
└── GRAPH_REPORT.md  Analysis report
```

---

## Repository Structure

```
graphify/
├── typescript/       TypeScript implementation
├── python/           Python implementation (forked from safishamsi/graphify)
├── ARCHITECTURE.md   Pipeline architecture
└── README.md         This file
```

---

## License

MIT
