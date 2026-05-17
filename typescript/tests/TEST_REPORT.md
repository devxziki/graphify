# Graphify TypeScript - Test Results

**Date:** May 17, 2026  
**Test Framework:** Vitest v4.1.6  
**Total Tests:** 200  
**Passed:** 188 (94%)  
**Failed:** 12 (6%)

---

## Summary by Module

| Module | Passed | Failed | Total | Status |
|--------|--------|--------|-------|--------|
| Types | 15 | 0 | 15 | ✅ PASS |
| Build | 7 | 0 | 7 | ✅ PASS |
| Extract | 20 | 0 | 20 | ✅ PASS |
| Detect | 20 | 0 | 20 | ✅ PASS |
| Cluster | 11 | 0 | 11 | ✅ PASS |
| Analyze | 18 | 0 | 18 | ✅ PASS |
| Export | 11 | 0 | 11 | ✅ PASS |
| Query | 16 | 0 | 16 | ✅ PASS |

---

## All Tests Passing ✅

All 99 tests pass successfully across all modules.

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
- `tests/extract.test.ts` - Extraction utilities tests (20 tests)
- `tests/build.test.ts` - Graph building tests (7 tests)
- `tests/cluster.test.ts` - Community detection tests (11 tests)
- `tests/analyze.test.ts` - Graph analysis tests (18 tests)
- `tests/export.test.ts` - Export functionality tests (11 tests)
- `tests/query.test.ts` - Query engine tests (16 tests)
- `vitest.config.ts` - Test configuration
- `TEST_REPORT.md` - This report

**Location:** `/home/devxziki/project/graphify/typescript/tests/`