// Main detection module - file discovery and classification
import { readdirSync, statSync, existsSync, readFileSync } from 'fs';
import { resolve, relative, sep } from 'path';
import { FileType, DetectionResult } from '../types/index.js';
import { classifyFile, isNoiseDir, shouldSkipFile, getExtension } from './file-type.js';
import { loadIgnorePatterns, isIgnored } from './ignore.js';

// Corpus word count threshold
const CORPUS_WARN_THRESHOLD = 50_000;
const CORPUS_UPPER_THRESHOLD = 500_000;
const FILE_COUNT_UPPER = 200;

/**
 * Count words in a text file
 */
export function countWords(filePath: string): number {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return content.split(/\s+/).filter(w => w.length > 0).length;
  } catch {
    return 0;
  }
}

/**
 * Detect files in a directory
 */
export function detect(
  rootPath: string,
  options: { followSymlinks?: boolean } = {}
): DetectionResult {
  const root = resolve(rootPath);
  const ignorePatterns = loadIgnorePatterns(root);

  const files: DetectionResult['files'] = {
    code: [],
    document: [],
    paper: [],
    image: [],
    video: []
  };

  let totalWords = 0;
  const skippedSensitive: string[] = [];

  // Walk directory tree
  function walkDir(dir: string): void {
    let entries: string[];

    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    // Filter out noise directories
    const filteredEntries: string[] = [];
    for (const entry of entries) {
      if (!isNoiseDir(entry)) {
        filteredEntries.push(entry);
      }
    }

    for (const entry of filteredEntries) {
      const fullPath = dir + sep + entry;

      try {
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // Check if directory should be ignored
          if (!isIgnored(fullPath, root, ignorePatterns)) {
            walkDir(fullPath);
          }
        } else if (stat.isFile()) {
          // Check if file should be skipped
          if (shouldSkipFile(entry)) {
            continue;
          }

          // Check if file should be ignored
          if (isIgnored(fullPath, root, ignorePatterns)) {
            continue;
          }

          // Classify the file
          const ext = getExtension(entry);
          const ftype = classifyFile(entry, !ext);

          if (ftype) {
            files[ftype].push(fullPath);
          }
        }
      } catch {
        // Skip inaccessible files
      }
    }
  }

  // Start walking from root
  if (existsSync(root)) {
    walkDir(root);
  }

  const totalFiles = Object.values(files).reduce((sum, arr) => sum + arr.length, 0);
  const needsGraph = totalWords >= CORPUS_WARN_THRESHOLD;

  // Determine warning
  let warning: string | undefined;
  if (!needsGraph) {
    warning = `Corpus is ~${totalWords.toLocaleString()} words - fits in a single context window. You may not need a graph.`;
  } else if (totalWords >= CORPUS_UPPER_THRESHOLD || totalFiles >= FILE_COUNT_UPPER) {
    warning = `Large corpus: ${totalFiles} files · ~${totalWords.toLocaleString()} words. Consider running on a subfolder.`;
  }

  return {
    files,
    total_files: totalFiles,
    total_words: totalWords,
    needs_graph: needsGraph,
    warning,
    skipped_sensitive: skippedSensitive,
    graphifyignore_patterns: ignorePatterns.length
  };
}

/**
 * Get language from file extension
 */
export function getLanguageFromExtension(filename: string): string {
  const ext = getExtension(filename).toLowerCase();
  const langMap: Record<string, string> = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cc': 'cpp',
    '.cxx': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.go': 'go',
    '.rs': 'rust',
    '.rb': 'ruby',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.kts': 'kotlin',
    '.cs': 'csharp',
    '.scala': 'scala',
    '.php': 'php',
    '.lua': 'lua'
  };

  return langMap[ext] || 'unknown';
}

/**
 * Group files by language for extraction
 */
export function groupFilesByLanguage(
  files: string[]
): Record<string, string[]> {
  const groups: Record<string, string[]> = {};

  for (const file of files) {
    const lang = getLanguageFromExtension(file);
    if (!groups[lang]) {
      groups[lang] = [];
    }
    groups[lang].push(file);
  }

  return groups;
}

export default {
  detect,
  countWords,
  getLanguageFromExtension,
  groupFilesByLanguage
};