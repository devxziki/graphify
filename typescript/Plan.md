# TypeScript Graphify - Implementation Plan

## 1. Project Overview

**Goal**: Port Python graphify to TypeScript as a Node.js library + CLI tool for generating graph.json + graph.html visualization from source code.

**User Flow**: Button click → Run graphify → Output HTML/JSON files → Add to repo

---

## 2. Project Structure

```
typescript/
├── package.json              # npm config (local use only)
├── tsconfig.json            # TypeScript config
├── .gitignore               # Ignores dist/, node_modules/
├── README.md                # User manual
│
├── src/                     # Source TypeScript (~6000 lines total)
│   ├── index.ts             # Main exports
│   │
│   ├── types/               # Type definitions (~150 lines)
│   │   └── index.ts         # Node, Edge, Graph, Communities types
│   │
│   ├── detect/              # File discovery & classification (~1000 lines)
│   │   ├── index.ts         # detect() function
│   │   ├── file-type.ts     # classifyFile()
│   │   ├── ignore.ts        # .graphifyignore handling
│   │   └── corpus.ts       # Word count, corpus health
│   │
│   ├── extract/             # AST extraction (tree-sitter) (~1500 lines)
│   │   ├── index.ts         # Main extraction logic
│   │   ├── parser.ts        # Tree-sitter integration
│   │   ├── languages/       # Language configs
│   │   │   ├── types.ts     # LanguageConfig interface
│   │   │   ├── javascript.ts
│   │   │   ├── typescript.ts
│   │   │   ├── python.ts
│   │   │   └── java.ts
│   │   └── utils.ts         # makeId(), file stem helpers
│   │
│   ├── build/               # Graph construction (~400 lines)
│   │   ├── index.ts         # build(), buildFromJson()
│   │   ├── dedup.ts         # Node deduplication
│   │   └── validate.ts      # Schema validation
│   │
│   ├── cluster/             # Community detection (~250 lines)
│   │   ├── index.ts         # cluster() - Louvain
│   │   └── cohesion.ts      # cohesionScore()
│   │
│   ├── analyze/             # Graph analysis (~650 lines)
│   │   ├── index.ts
│   │   ├── god-nodes.ts     # Most connected nodes
│   │   └── surprising.ts    # Cross-community edges
│   │
│   ├── export/              # Export formats (~1300 lines)
│   │   ├── index.ts
│   │   ├── json.ts          # toJSON()
│   │   └── html.ts          # toHTML() - vis.js
│   │
│   ├── query/               # Graph queries (~500 lines)
│   │   ├── index.ts
│   │   ├── search.ts        # BFS/DFS traversal
│   │   └── scoring.ts       # TF-IDF node matching
│   │
│   └── cli/                 # CLI commands (~400 lines)
│       ├── index.ts         # Commander setup
│       └── commands/        # CLI subcommands
│           ├── build.ts
│           ├── query.ts
│           ├── path.ts
│           └── explain.ts
│
├── bin/                     # CLI entry point
│   └── graphify.js          # #!/usr/bin/env node
│
└── test/                    # Tests (optional)
    └── basic.test.ts
```

---

## 3. Dependencies

### Runtime Dependencies
```json
{
  "dependencies": {
    "graphlib": "^2.1.8",
    "commander": "^11.1.0",
    "chokidar": "^3.5.3",
    "picomatch": "^4.0.0",
    "tree-sitter": "^0.21.0",
    "tree-sitter-javascript": "^0.21.0",
    "tree-sitter-typescript": "^0.21.0",
    "tree-sitter-python": "^0.21.0",
    "tree-sitter-java": "^0.21.0",
    "tree-sitter-c": "^0.21.0",
    "tree-sitter-cpp": "^0.21.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.0",
    "ts-node": "^10.9.2"
  }
}
```

---

## 4. Implementation Phases

### Phase 1: Core Foundation
**Priority**: HIGH | **Estimated**: 2-3 days

| Step | Module | Tasks |
|------|--------|-------|
| 1.1 | types | Define TypeScript interfaces: GraphNode, GraphEdge, FileType, Confidence, ExtractionResult, Communities |
| 1.2 | detect | Implement file discovery with .graphifyignore support |
| 1.3 | detect | Implement classifyFile() for code/doc/paper/image detection |
| 1.4 | build | Implement buildFromJson() - graph construction from JSON |
| 1.5 | build | Implement validateExtraction() - schema validation |
| 1.6 | export | Implement toJSON() - graph.json export |

**Deliverable**: Can build graph from existing JSON files

---

### Phase 2: AST Extraction
**Priority**: HIGH | **Estimated**: 3-4 days

| Step | Module | Tasks |
|------|--------|-------|
| 2.1 | extract | Integrate tree-sitter WASM runtime |
| 2.2 | extract | Create LanguageConfig interface |
| 2.3 | extract | Implement JavaScript/TypeScript parser |
| 2.4 | extract | Implement Python parser |
| 2.5 | extract | Implement import detection (JS/TS/Python) |
| 2.6 | extract | Implement makeId() - NFKC normalization |

**Deliverable**: Can extract AST nodes from source files

---

### Phase 3: Visualization
**Priority**: HIGH | **Estimated**: 2-3 days

| Step | Module | Tasks |
|------|--------|-------|
| 3.1 | export | Implement toHTML() using vis.js |
| 3.2 | export | Add community coloring |
| 3.3 | export | Add edge styling (EXTRACTED/INFERRED/AMBIGUOUS) |
| 3.4 | export | Add search functionality |
| 3.5 | export | Add node click → details panel |

**Deliverable**: Generates interactive HTML visualization

---

### Phase 4: Community Detection
**Priority**: MEDIUM | **Estimated**: 2 days

| Step | Module | Tasks |
|------|--------|-------|
| 4.1 | cluster | Implement Louvain algorithm (via graphlib) |
| 4.2 | cluster | Implement cohesionScore() |
| 4.3 | cluster | Handle oversized communities (>25%) |

**Deliverable**: Communities detected and labeled

---

### Phase 5: Graph Analysis
**Priority**: MEDIUM | **Estimated**: 2 days

| Step | Module | Tasks |
|------|--------|-------|
| 5.1 | analyze | Implement godNodes() - most connected nodes |
| 5.2 | analyze | Implement surprisingConnections() - cross-community edges |
| 5.3 | analyze | Filter file-level hub nodes |

**Deliverable**: Analysis results (god nodes, surprising connections)

---

### Phase 6: Query Engine
**Priority**: MEDIUM | **Estimated**: 2-3 days

| Step | Module | Tasks |
|------|--------|-------|
| 6.1 | query | Implement scoreNodes() - TF-IDF matching |
| 6.2 | query | Implement BFS/DFS search |
| 6.3 | query | Implement shortestPath() |
| 6.4 | query | Implement findNode() - exact/prefix match |

**Deliverable**: Query capabilities

---

### Phase 7: CLI Commands
**Priority**: MEDIUM | **Estimated**: 2 days

| Step | Module | Tasks |
|------|--------|-------|
| 7.1 | cli | Setup Commander.js |
| 7.2 | cli | Implement `build` command |
| 7.3 | cli | Implement `query` command |
| 7.4 | cli | Implement `path` command |
| 7.5 | cli | Implement `explain` command |
| 7.6 | cli | Implement `export` command |

**Deliverable**: Full CLI tool

---

### Phase 8: Documentation
**Priority**: LOW | **Estimated**: 1 day

| Step | Module | Tasks |
|------|--------|-------|
| 8.1 | docs | Write README.md (User Manual) |
| 8.2 | docs | Add code examples |
| 8.3 | docs | Document supported languages |

**Deliverable**: Complete user documentation

---

## 5. Implementation Order Summary

```
Phase 1: types → detect → build → export/json
Phase 2: extract (languages, imports, utils)
Phase 3: export/html
Phase 4: cluster
Phase 5: analyze
Phase 6: query
Phase 7: cli (all commands)
Phase 8: docs
```

---

## 6. Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Graph library | graphlib | NetworkX equivalent for JS |
| Tree-sitter | WASM packages | Cross-platform, no native deps |
| Export HTML | vis.js | Same as Python version |
| CLI framework | Commander.js | Simple, popular |
| Ignore files | picomatch | Gitignore-compatible globbing |

---

## 7. CLI Commands Reference

```bash
# Build graph from source code
node bin/graphify.js build <path> -o <output-dir>

# Query the graph
node bin/graphify.js query <graph.json> "<question>"

# Find shortest path between two nodes
node bin/graphify.js path <graph.json> "<source>" "<target>"

# Explain a node
node bin/graphify.js explain <graph.json> "<node>"

# Export formats
node bin/graphify.js export html <graph.json>
node bin/graphify.js export json <graph.json>

# Help
node bin/graphify.js --help
```

---

## 8. Programmatic API

```typescript
import { Graphify } from './dist/index.js';

const g = new Graphify();

// Build graph from source
await g.build('/path/to/repo', './graphify-out');

// Export to JSON
await g.toJSON('./graphify-out/graph.json');

// Export to HTML
await g.toHTML('./graphify-out/graph.html');

// Query the graph
const result = await g.query('./graphify-out/graph.json', 'How does auth work?');

// Find path
const path = g.path('./graphify-out/graph.json', 'UserService', 'Database');

// Explain node
const explanation = g.explain('./graphify-out/graph.json', 'AuthService');
```

---

## 9. Output Files

| File | Description |
|------|-------------|
| `graph.json` | Graph data with nodes, edges, communities |
| `graph.html` | Interactive visualization (vis.js) |

---

## 10. Supported Languages (Initial)

| Language | Extensions | Parser |
|----------|------------|--------|
| JavaScript | .js, .jsx, .mjs | tree-sitter-javascript |
| TypeScript | .ts, .tsx | tree-sitter-typescript |
| Python | .py | tree-sitter-python |
| Java | .java | tree-sitter-java |
| C | .c, .h | tree-sitter-c |
| C++ | .cpp, .cc, .hpp | tree-sitter-cpp |

---

## 11. Files to Create (Summary)

```
typescript/
├── package.json (new)
├── tsconfig.json (new)
├── .gitignore (new)
├── Plan.md (this file)
├── README.md (new)
│
├── src/
│   ├── index.ts
│   ├── types/index.ts
│   ├── detect/index.ts
│   ├── detect/file-type.ts
│   ├── detect/ignore.ts
│   ├── detect/corpus.ts
│   ├── extract/index.ts
│   ├── extract/parser.ts
│   ├── extract/languages/types.ts
│   ├── extract/languages/javascript.ts
│   ├── extract/languages/typescript.ts
│   ├── extract/languages/python.ts
│   ├── extract/languages/java.ts
│   ├── extract/utils.ts
│   ├── build/index.ts
│   ├── build/dedup.ts
│   ├── build/validate.ts
│   ├── cluster/index.ts
│   ├── cluster/cohesion.ts
│   ├── analyze/index.ts
│   ├── analyze/god-nodes.ts
│   ├── analyze/surprising.ts
│   ├── export/index.ts
│   ├── export/json.ts
│   ├── export/html.ts
│   ├── query/index.ts
│   ├── query/search.ts
│   ├── query/scoring.ts
│   └── cli/index.ts
│   └── cli/commands/build.ts
│   └── cli/commands/query.ts
│   └── cli/commands/path.ts
│   └── cli/commands/explain.ts
│
└── bin/graphify.js
```

---

## 12. Total Estimated Timeline

| Phase | Days |
|-------|------|
| Phase 1 | 2-3 |
| Phase 2 | 3-4 |
| Phase 3 | 2-3 |
| Phase 4 | 2 |
| Phase 5 | 2 |
| Phase 6 | 2-3 |
| Phase 7 | 2 |
| Phase 8 | 1 |
| **Total** | **16-20 days** |

---

## 13. Implementation Status

| Phase | Status |
|-------|--------|
| Phase 1: Core Foundation | ✅ COMPLETE |
| Phase 2: AST Extraction | ✅ COMPLETE |
| Phase 3: Visualization | ✅ COMPLETE |
| Phase 4: Community Detection | ✅ COMPLETE |
| Phase 5: Graph Analysis | ✅ COMPLETE |
| Phase 6: Query Engine | ✅ COMPLETE |
| Phase 7: CLI Commands | ✅ COMPLETE |
| Phase 8: Documentation | 🔄 IN PROGRESS |

### Implementation Date: May 17, 2026