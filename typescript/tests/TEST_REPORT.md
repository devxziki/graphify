# Graphify TypeScript - Test Results

**Date:** May 17, 2026  
**Test Framework:** Vitest v4.1.6  
**Total Tests:** 127  
**Passed:** 92 (72.4%)  
**Failed:** 35 (27.6%)

---

## Summary by Module

| Module | Passed | Failed | Total | Status |
|--------|--------|--------|-------|--------|
| Types | 15 | 0 | 15 | ✅ PASS |
| Build | 7 | 0 | 7 | ✅ PASS |
| Extract | 14 | 7 | 21 | ⚠️ PARTIAL |
| Detect | 11 | 9 | 20 | ⚠️ PARTIAL |
| Cluster | 9 | 2 | 11 | ⚠️ PARTIAL |
| Analyze | 16 | 2 | 18 | ⚠️ PARTIAL |
| Export | 9 | 2 | 11 | ⚠️ PARTIAL |
| Query | 16 | 13 | 29 | ⚠️ PARTIAL |

---

## Failed Tests - Details

### 1. Extract Module (7 failures)

**Issue:** Test expectations don't match current implementation behavior

| Test | Expected | Actual | Fix Needed |
|------|----------|--------|------------|
| should normalize unicode characters | `cafe` | `caf` | Unicode normalization different |
| should extract stem from file path | `file` | `to.file` | fileStem logic issue |
| should handle files without extension | `README` | `to.README` | fileStem logic issue |
| should handle multiple dots in filename | `file.test` | `to.file.test` | fileStem logic issue |
| should handle Windows paths | `file` | `to.file` | fileStem logic issue |
| should normalize file paths | - | `normalizeId` not exported | Export needed |
| should handle special characters | - | `normalizeId` not exported | Export needed |

**Root Cause:** The `fileStem()` function has a bug - it returns more than just the filename stem.

---

### 2. Detect Module (9 failures)

**Issue:** Test expectations differ from implementation

| Test | Expected | Actual | Fix Needed |
|------|----------|--------|------------|
| should classify JSON files | `document` | `code` | Classification logic |
| should classify files without extension | `document` | `null` | Extension handling |
| should return null for ignored patterns | `null` | `code` | Ignore integration |
| should ignore node_modules | - | Function not exported | Export `shouldIgnore` |
| should ignore .git directory | - | Function not exported | Export `shouldIgnore` |
| should ignore __pycache__ | - | Function not exported | Export `shouldIgnore` |
| should ignore .next directory | - | Function not exported | Export `shouldIgnore` |
| should not ignore normal files | - | Function not exported | Export `shouldIgnore` |
| should handle custom patterns | - | Function not exported | Export `shouldIgnore` |

**Root Cause:** The `shouldIgnore` function is not exported from `detect/ignore.ts`

---

### 3. Query Module (13 failures)

**Issue:** Export differences and search function implementation

| Test | Expected | Actual | Fix Needed |
|------|----------|--------|------------|
| should find node by exact label | node `a` | undefined | findNode export |
| should return null for no match | null | [] | Return type |
| should traverse in breadth-first order | BFS order | Function not exported | Export `bfs` |
| should visit all reachable nodes | 5 nodes | Function not exported | Export `bfs` |
| should handle start node not in graph | 0 | Function not exported | Export `bfs` |
| should traverse in depth-first order | DFS order | Function not exported | Export `dfs` |
| should visit all reachable nodes | 5 nodes | Function not exported | Export `dfs` |
| should return matching nodes | >0 matches | undefined | Export check |
| should return empty for no matches | 0 | Error | Null check |
| should include graph metadata | 5 nodes | undefined | Export check |
| should explain existing node | node data | Function conflict | Export check |
| should include node connections | connections | Function conflict | Export check |
| should return null for nonexistent node | null | Function conflict | Export check |

**Root Cause:** Several search functions (`bfs`, `dfs`) are not exported from query/search.ts

---

### 4. Analyze Module (2 failures)

| Test | Expected | Actual | Fix Needed |
|------|----------|--------|------------|
| should find most connected nodes | `center` first | `leaf0` first | Degree calculation |
| should run full analysis | analyze works | Edge data undefined | Edge data handling |

**Root Cause:** 
1. Degree calculation differs - all leaves have degree 1
2. Edge data is undefined when not explicitly set

---

### 5. Cluster Module (2 failures)

| Test | Expected | Actual | Fix Needed |
|------|----------|--------|------------|
| should put isolated nodes in separate communities | isolated in own community | Different grouping | Community logic |
| should handle nodes not in graph | 0.0 | 1.0 | Cohesion edge case |

**Root Cause:** 
1. Isolated nodes may be grouped with connected component
2. Single node community returns 1.0 not 0.0

---

### 6. Export Module (2 failures)

| Test | Expected | Actual | Fix Needed |
|------|----------|--------|------------|
| should include vis.js dependencies | vis-data | vis-network only | Library check |
| should handle graphs with many nodes | JSON export | Edge data undefined | Edge data handling |

**Root Cause:** 
1. Using standalone vis.js bundle (includes all)
2. Edge data not set in test graph

---

## Recommendations

### High Priority (Core Functionality)
1. **Export search functions** - `bfs`, `dfs`, `shouldIgnore` need exports
2. **Fix fileStem** - Has incorrect logic returning too much of path

### Medium Priority (Test Fixes)
3. Update test expectations for:
   - JSON file classification (document vs code)
   - Files without extension handling
   - God nodes degree sorting

### Low Priority (Nice to Have)
4. Add proper null handling for edge data
5. Add cohesion edge cases for non-existent nodes

---

## Test Execution Command

```bash
cd /home/devxziki/project/graphify/typescript
npx vitest run
```

## Individual Module Tests

```bash
npx vitest run tests/types.test.ts
npx vitest run tests/detect.test.ts
npx vitest run tests/extract.test.ts
npx vitest run tests/build.test.ts
npx vitest run tests/cluster.test.ts
npx vitest run tests/analyze.test.ts
npx vitest run tests/export.test.ts
npx vitest run tests/query.test.ts
```

---

## Files Created

- `tests/types.test.ts` - Type definitions tests (15 tests)
- `tests/detect.test.ts` - File detection tests (20 tests)
- `tests/extract.test.ts` - Extraction utilities tests (21 tests)
- `tests/build.test.ts` - Graph building tests (7 tests)
- `tests/cluster.test.ts` - Community detection tests (11 tests)
- `tests/analyze.test.ts` - Graph analysis tests (18 tests)
- `tests/export.test.ts` - Export functionality tests (11 tests)
- `tests/query.test.ts` - Query engine tests (29 tests)
- `vitest.config.ts` - Test configuration
- `TEST_REPORT.md` - This report

**Location:** `/home/devxziki/project/graphify/typescript/tests/`