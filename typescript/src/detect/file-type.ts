// File type classification
type FileTypeString = 'code' | 'document' | 'paper' | 'image' | 'video';

// File extension constants
export const CODE_EXTENSIONS = new Set([
  '.py', '.ts', '.js', '.jsx', '.tsx', '.mjs', '.ejs', '.go', '.rs',
  '.java', '.groovy', '.gradle', '.cpp', '.cc', '.cxx', '.c', '.h', '.hpp',
  '.rb', '.swift', '.kt', '.kts', '.cs', '.scala', '.php', '.lua', '.luau',
  '.toc', '.zig', '.ps1', '.ex', '.exs', '.m', '.mm', '.jl', '.vue',
  '.svelte', '.astro', '.dart', '.v', '.sv', '.sql', '.r', '.f', '.F',
  '.f90', '.F90', '.f95', '.F95', '.f03', '.F03', '.f08', '.F08',
  '.pas', '.pp', '.dpr', '.dpk', '.lpr', '.inc', '.dfm', '.lfm', '.lpk',
  '.sh', '.bash', '.json'
]);

export const DOC_EXTENSIONS = new Set([
  '.md', '.mdx', '.qmd', '.txt', '.rst', '.html', '.yaml', '.yml'
]);

export const PAPER_EXTENSIONS = new Set([
  '.pdf'
]);

export const IMAGE_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'
]);

export const OFFICE_EXTENSIONS = new Set([
  '.docx', '.xlsx'
]);

export const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.mov', '.webm', '.mkv', '.avi', '.m4v', '.mp3', '.wav', '.m4a', '.ogg'
]);

// Corpus health thresholds
export const CORPUS_WARN_THRESHOLD = 50_000;
export const CORPUS_UPPER_THRESHOLD = 500_000;
export const FILE_COUNT_UPPER = 200;

// Directories to skip
export const SKIP_DIRS = new Set([
  'venv', '.venv', 'env', '.env',
  'node_modules', '__pycache__', '.git',
  'dist', 'build', 'target', 'out',
  'site-packages', 'lib64',
  '.pytest_cache', '.mypy_cache', '.ruff_cache',
  '.tox', '.eggs',
  'graphify-out',
  'coverage', 'lcov-report',
  'visual-tests', 'visual-test',
  '__snapshots__', 'snapshots',
  'storybook-static', 'dist-protected',
  '.next', '.nuxt', '.turbo', '.angular',
  '.idea', '.cache', '.parcel-cache', '.svelte-kit', '.terraform', '.serverless',
  '.graphify'
]);

// Large generated files to skip
export const SKIP_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'cargo.lock', 'poetry.lock', 'gemfile.lock',
  'composer.lock', 'go.sum', 'go.work.sum'
]);

/**
 * Classify a file by its extension
 */
export function classifyFile(filename: string, isExtensionless = false): FileTypeString | null {
  const name = filename.toLowerCase();

  if (name.endsWith('.blade.php')) {
    return 'code';
  }

  const lastDot = name.lastIndexOf('.');
  const ext = lastDot >= 0 ? name.slice(lastDot) : '';

  if (!ext) {
    return isExtensionless ? 'code' : null;
  }

  if (CODE_EXTENSIONS.has(ext)) return 'code';
  if (PAPER_EXTENSIONS.has(ext)) return 'paper';
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (DOC_EXTENSIONS.has(ext)) return 'document';
  if (OFFICE_EXTENSIONS.has(ext)) return 'document';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';

  return null;
}

/**
 * Check if a directory name should be skipped
 */
export function isNoiseDir(dirName: string): boolean {
  if (SKIP_DIRS.has(dirName)) return true;
  if (dirName.endsWith('_venv') || dirName.endsWith('_env')) return true;
  if (dirName.endsWith('.egg-info')) return true;
  return false;
}

/**
 * Check if a file should be skipped
 */
export function shouldSkipFile(filename: string): boolean {
  return SKIP_FILES.has(filename);
}

/**
 * Get file extension from filename
 */
export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.slice(lastDot) : '';
}

/**
 * Get file stem (filename without extension)
 */
export function getFileStem(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.slice(0, lastDot) : filename;
}