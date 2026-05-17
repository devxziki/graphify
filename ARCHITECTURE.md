# Architecture

Graphify is a multi-language knowledge graph tool for code analysis. Each language implementation follows the same pipeline architecture.

## Multi-Language Structure

```
graphify/
├── python/              # Python implementation (original)
├── typescript/          # TypeScript implementation (Node.js)
├── go/                  # Go implementation (coming soon)
├── rust/                # Rust implementation (coming soon)
└── java/                # Java implementation (coming soon)
```

## Pipeline (Shared by All Implementations)

```
detect()  →  extract()  →  build()  →  cluster()  →  analyze()  →  report()  →  export()
```

Each stage is a single function in its own module. They communicate through plain data structures.

---

# Python Implementation (`python/`)

Built with NetworkX, tree-sitter, and graspologic.

## Module responsibilities

| Module | Function | Input → Output |
|--------|----------|----------------|
| `detect.py` | `detect(root)` | directory → filtered file list |
| `extract.py` | `extract(path)` | file path → `{nodes, edges}` dict |
| `build.py` | `build(extractions)` | list of extractions → nx.Graph |
| `cluster.py` | `cluster(G)` | graph → communities (Leiden/Louvain) |
| `analyze.py` | `analyze(G)` | graph → god nodes, surprises |
| `report.py` | `generate(...)` | graph + analysis → GRAPH_REPORT.md |
| `export.py` | `export(G, out_dir)` | graph → JSON, HTML, Obsidian |

---

# TypeScript Implementation (`typescript/`)

Built with graphology, web-tree-sitter, and leiden-ts.

## Module responsibilities

| Module | File | Description |
|--------|------|-------------|
| Detect | `src/detect/` | File discovery & classification |
| Extract | `src/extract/` | Language parsing (tree-sitter WASM) |
| Build | `src/build/` | Graph construction (graphology) |
| Cluster | `src/cluster/` | Community detection (leiden-ts) |
| Analyze | `src/analyze/` | God nodes, surprising connections |
| Report | `src/report/` | Markdown report generation |
| Export | `src/export/` | JSON export |
| LLM | `src/llm/` | Groq API integration |

## Supported Languages (TypeScript)

- JavaScript / TypeScript
- Python
- Go
- Rust
- Java / Kotlin / Scala
- JSON

---

# Adding a New Language

Each implementation follows the same pattern:

1. **Create language extractor** - Parse AST, extract nodes (functions, classes, imports) and edges (calls, inherits, contains)
2. **Register extension** - Add to extension map
3. **Add to detection** - Include in CODE_EXTENSIONS

---

# Extraction Schema (Shared)

Every extractor returns:

```json
{
  "nodes": [
    {"id": "unique_string", "label": "human name", "source_file": "path", "source_location": "L42"}
  ],
  "edges": [
    {"source": "id_a", "target": "id_b", "relation": "calls|imports|contains|...", "confidence": "EXTRACTED|INFERRED|AMBIGUOUS"}
  ]
}
```

## Confidence Labels

| Label | Meaning |
|-------|---------|
| `EXTRACTED` | Explicitly stated in source (e.g., import statement, direct call) |
| `INFERRED` | Reasonable deduction (e.g., call-graph second pass) |
| `AMBIGUOUS` | Uncertain - flagged for human review |

---

# Testing

**Python**: `pytest tests/ -q`

**TypeScript**: `cd typescript && npm test`

---

# API Keys

For LLM-powered queries, users provide their own API keys:
- Python: OpenAI, Anthropic, Ollama, etc.
- TypeScript: Groq API