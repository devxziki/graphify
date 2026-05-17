// .graphifyignore handling - Gitignore-compatible pattern matching
import { readFileSync, existsSync } from 'fs';
import { resolve, relative, sep } from 'path';
import { picomatch } from 'picomatch';

// Parse a single gitignore line
export function parseIgnoreLine(raw: string): string {
  let line = raw.trimEnd();
  line = line.trimStart();

  // Skip empty lines and comments
  if (!line || line.startsWith('#')) {
    return '';
  }

  // Strip inline comments (whitespace + # suffix)
  line = line.replace(/\s+#+[^\\].*$/, '');

  // Unescape \# → literal #
  line = line.replace(/\\#/g, '#');

  // Remove trailing spaces (unescaped)
  line = line.replace(/(?<!\\)\s+$/, '');

  return line;
}

// Find VCS root (git/hg/svn)
const VCS_MARKERS = ['.git', '.hg', '.svn', '_darcs', '.fossil'];

export function findVcsRoot(start: string): string | null {
  let current = resolve(start);
  const home = process.env.HOME || process.env.USERPROFILE || '';

  while (true) {
    for (const marker of VCS_MARKERS) {
      if (existsSync(current + sep + marker)) {
        return current;
      }
    }

    const parent = resolve(current, '..');
    if (parent === current || current === home) {
      return null;
    }
    current = parent;
  }
}

// Load ignore patterns from .graphifyignore files
export interface IgnorePattern {
  anchor: string;
  pattern: string;
  negated: boolean;
}

export function loadIgnorePatterns(root: string): IgnorePattern[] {
  const resolvedRoot = resolve(root);
  const ceiling = findVcsRoot(resolvedRoot) || resolvedRoot;

  // Collect directories from ceiling to root (outer → inner)
  const dirs: string[] = [];
  let current = resolvedRoot;

  while (true) {
    dirs.push(current);
    if (current === ceiling) break;
    current = resolve(current, '..');
  }
  dirs.reverse(); // ceiling first, root last

  const patterns: IgnorePattern[] = [];

  for (const dir of dirs) {
    const ignoreFile = dir + sep + '.graphifyignore';
    if (existsSync(ignoreFile)) {
      try {
        const content = readFileSync(ignoreFile, 'utf-8');
        const lines = content.split('\n');
        for (const raw of lines) {
          const line = parseIgnoreLine(raw);
          if (!line) continue;

          const negated = line.startsWith('!');
          const rawPattern = negated ? line.slice(1) : line;
          patterns.push({
            anchor: dir,
            pattern: rawPattern,
            negated
          });
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  return patterns;
}

// Check if path is ignored
export function isIgnored(
  path: string,
  root: string,
  patterns: IgnorePattern[]
): boolean {
  if (!patterns.length) {
    return false;
  }

  const resolvedRoot = resolve(root);
  const resolvedPath = resolve(path);

  function matches(relPath: string, pattern: string): boolean {
    const matcher = picomatch(pattern, { dot: true });
    return matcher(relPath) || matcher(path.split(sep).pop() || '');
  }

  let result = false;

  for (const { anchor, pattern, negated } of patterns) {
    let relPath: string;

    try {
      // Try relative to anchor first
      if (anchor !== resolvedRoot) {
        relPath = relative(anchor, resolvedPath).replace(/\\/g, '/');
        if (matches(relPath, pattern)) {
          result = !negated;
        }
      }

      // Then try relative to root
      relPath = relative(resolvedRoot, resolvedPath).replace(/\\/g, '/');
      if (matches(relPath, pattern)) {
        result = !negated;
      }
    } catch {
      // Skip if relative() fails
    }
  }

  // Check ancestor directories (gitignore parent-exclusion rule)
  const relParts = relative(resolvedRoot, resolvedPath).split(sep);
  let ancestor = resolvedRoot;

  for (let i = 0; i < relParts.length - 1; i++) {
    ancestor = resolve(ancestor, relParts[i]);

    // Check if ancestor is ignored
    let ancestorIgnored = false;
    for (const { anchor, pattern, negated } of patterns) {
      try {
        const relAnc = relative(anchor, ancestor).replace(/\\/g, '/');
        if (matches(relAnc, pattern)) {
          ancestorIgnored = !negated;
          if (ancestorIgnored) break;
        }
      } catch {
        // Skip
      }
    }

    if (ancestorIgnored) {
      return true;
    }
  }

  return result;
}