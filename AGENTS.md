## graphify

Multi-language knowledge graph project for code analysis.

### Project Structure

```
graphify/
├── python/           # Python implementation (original graphify)
│   ├── graphify/     # Python source code
│   ├── tests/        # Python tests
│   ├── docs/         # Documentation
│   └── worked/       # Sample analyzed projects
│
├── typescript/       # TypeScript implementation (coming soon)
├── go/              # Go implementation (coming soon)
├── rust/             # Rust implementation (coming soon)
└── java/             # Java implementation (coming soon)
```

### For Python (Current)

- The Python graphify code is in `python/graphify/`
- Run from `python/` directory: `cd python && pip install -e .`
- Tests: `cd python && pytest tests/`

### For TypeScript (Coming Soon)

- Coming soon - will be built by analyzing the Python code and porting to TypeScript