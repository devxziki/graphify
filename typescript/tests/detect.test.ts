import { describe, it, expect, beforeEach } from 'vitest';
import { Graph } from 'graphlib';
import { classifyFile, getExtension, FileTypeResult } from '../src/detect/file-type.js';
import { shouldIgnore, parseIgnoreFile, IgnoreOptions } from '../src/detect/ignore.js';

describe('Detect Module', () => {
  describe('File Type Detection', () => {
    it('should classify JavaScript files', () => {
      const result = classifyFile('/path/to/file.js');
      expect(result).toBe('code');
    });

    it('should classify TypeScript files', () => {
      expect(classifyFile('/path/to/file.ts')).toBe('code');
      expect(classifyFile('/path/to/file.tsx')).toBe('code');
    });

    it('should classify Python files', () => {
      expect(classifyFile('/path/to/file.py')).toBe('code');
    });

it('should classify JSON files', () => {
      const result = classifyFile('/path/to/file.json');
      expect(result).toBe('code');
    });

    it('should classify files without extension as null', () => {
      const result = classifyFile('/path/to/README');
      expect(result).toBeNull();
    });

    it('should return null for ignored patterns', () => {
      const result = classifyFile('/path/to/node_modules/package.json');
      expect(result).toBe('code');
    });

    it('should classify Markdown files', () => {
      const result = classifyFile('/path/to/file.md');
      expect(result).toBe('document');
    });

    it('should classify image files', () => {
      expect(classifyFile('/path/to/file.png')).toBe('image');
      expect(classifyFile('/path/to/file.jpg')).toBe('image');
      expect(classifyFile('/path/to/file.svg')).toBe('image');
    });

    it('should classify files without extension as code', () => {
      const result = classifyFile('/path/to/README');
      expect(result).toBeNull();
    });

    it('should classify Go files', () => {
      expect(classifyFile('/path/to/file.go')).toBe('code');
    });

    it('should classify Rust files', () => {
      expect(classifyFile('/path/to/file.rs')).toBe('code');
    });

    it('should classify Java files', () => {
      expect(classifyFile('/path/to/file.java')).toBe('code');
    });

    it('should classify C/C++ files', () => {
      expect(classifyFile('/path/to/file.c')).toBe('code');
      expect(classifyFile('/path/to/file.cpp')).toBe('code');
      expect(classifyFile('/path/to/file.h')).toBe('code');
      expect(classifyFile('/path/to/file.hpp')).toBe('code');
    });
  });

  describe('getExtension', () => {
    it('should extract extension correctly', () => {
      expect(getExtension('/path/to/file.ts')).toBe('.ts');
      expect(getExtension('/path/to/file.tsx')).toBe('.tsx');
      expect(getExtension('/path/to/file.')).toBe('.');
      expect(getExtension('/path/to/file')).toBe('');
    });

    it('should handle special characters in path', () => {
      expect(getExtension('/path/to/file.test.ts')).toBe('.ts');
      expect(getExtension('C:\\path\\to\\file.ts')).toBe('.ts');
    });
  });

  describe('Ignore Pattern Matching', () => {
    it('should ignore node_modules', () => {
      expect(shouldIgnore('node_modules/package.json')).toBe(true);
      expect(shouldIgnore('/path/node_modules/package.json')).toBe(true);
    });

    it('should ignore .git directory', () => {
      expect(shouldIgnore('.git/config')).toBe(true);
      expect(shouldIgnore('/repo/.git/index')).toBe(true);
    });

    it('should ignore __pycache__', () => {
      expect(shouldIgnore('__pycache__/module.pyc')).toBe(true);
    });

    it('should ignore .next directory', () => {
      expect(shouldIgnore('.next/build/index.js')).toBe(true);
    });

    it('should not ignore normal files', () => {
      expect(shouldIgnore('src/index.ts')).toBe(false);
      expect(shouldIgnore('/project/src/App.tsx')).toBe(false);
    });

    it('should handle custom patterns', () => {
      const options: IgnoreOptions = { patterns: ['dist', 'build'] };
      expect(shouldIgnore('dist/index.js', options)).toBe(true);
      expect(shouldIgnore('build/output.js', options)).toBe(true);
      expect(shouldIgnore('src/index.ts', options)).toBe(false);
    });
  });
});