# graphify

Multi-language knowledge graph project for code analysis.

## Project Structure

```
graphify/
├── typescript/       TypeScript implementation (complete)
│   ├── src/          Source code
│   ├── bin/          CLI entry point
│   └── package.json
│
├── python/           Python implementation (original, forked from safishamsi/graphify)
│   ├── graphify/     Python source code
│   ├── tests/        Python tests
│   ├── docs/         Documentation
│   └── worked/       Sample analyzed projects
│
├── README.md         This file
├── AGENTS.md         This file
└── ARCHITECTURE.md   Pipeline and module architecture
```

## For TypeScript

- TypeScript port is complete
- Build: `cd typescript && npm install && npm run build`
- CLI: `node typescript/bin/graphify.js build <path> -o <output>`
- Tests: `cd typescript && npm test`

## For Python

- Python graphify code is in `python/graphify/`
- Run from `python/` directory: `cd python && pip install -e .`
- Tests: `cd python && pytest tests/`