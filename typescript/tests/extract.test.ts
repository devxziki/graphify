import { describe, it, expect } from 'vitest';
import { makeId, fileStem, normalizeId } from '../src/extract/utils.js';
import { getLanguageFromExtension, getLanguageConfig, LANGUAGES } from '../src/extract/languages/types.js';

describe('Extract Module', () => {
  describe('makeId', () => {
    it('should create ID from single part', () => {
      expect(makeId('MyClass')).toBe('myclass');
    });

    it('should create ID from multiple parts', () => {
      expect(makeId('src', 'utils', 'helper')).toBe('src_utils_helper');
    });

    it('should handle special characters', () => {
      expect(makeId('My-Class')).toBe('my_class');
      expect(makeId('my.class.name')).toBe('my_class_name');
    });

    it('should handle leading/trailing dots', () => {
      expect(makeId('.hidden')).toBe('hidden');
      expect(makeId('trailing.')).toBe('trailing');
    });

    it('should normalize unicode characters', () => {
      expect(makeId('café')).toBe('cafe');
      expect(makeId('naïve')).toBe('naive');
    });

    it('should collapse multiple underscores', () => {
      expect(makeId('a__b')).toBe('a_b');
      expect(makeId('a___b___c')).toBe('a_b_c');
    });

    it('should handle empty parts', () => {
      expect(makeId('a', '', 'b')).toBe('a_b');
    });

    it('should filter empty parts', () => {
      expect(makeId()).toBe('');
    });
  });

  describe('fileStem', () => {
    it('should extract stem from file path', () => {
      expect(fileStem('/path/to/file.ts')).toBe('file');
      expect(fileStem('/path/to/document.md')).toBe('document');
    });

    it('should handle files without extension', () => {
      expect(fileStem('/path/to/README')).toBe('README');
    });

    it('should handle multiple dots in filename', () => {
      expect(fileStem('/path/to/file.test.ts')).toBe('file.test');
    });

    it('should handle Windows paths', () => {
      expect(fileStem('C:\\path\\to\\file.ts')).toBe('file');
    });
  });

  describe('normalizeId', () => {
    it('should normalize file paths', () => {
      const result = normalizeId('/home/user/project/src/index.ts');
      expect(result).toContain('index');
    });

    it('should handle special characters', () => {
      expect(normalizeId('my-file.js')).toBe('my_file_js');
      expect(normalizeId('my.file.js')).toBe('my_file_js');
    });
  });

  describe('Language Configuration', () => {
    it('should have JavaScript language config', () => {
      const config = getLanguageConfig('javascript');
      expect(config).not.toBeNull();
      expect(config?.extensions).toContain('.js');
    });

    it('should have TypeScript language config', () => {
      const config = getLanguageConfig('typescript');
      expect(config).not.toBeNull();
      expect(config?.extensions).toContain('.ts');
    });

    it('should have Python language config', () => {
      const config = getLanguageConfig('python');
      expect(config).not.toBeNull();
      expect(config?.extensions).toContain('.py');
    });

    it('should return null for unknown language', () => {
      const config = getLanguageConfig('unknown_language');
      expect(config).toBeNull();
    });

    it('should get language from extension', () => {
      expect(getLanguageFromExtension('.js')).toBe('javascript');
      expect(getLanguageFromExtension('.ts')).toBe('typescript');
      expect(getLanguageFromExtension('.py')).toBe('python');
      expect(getLanguageFromExtension('.java')).toBe('java');
      expect(getLanguageFromExtension('.go')).toBe('go');
    });

    it('should return null for unknown extension', () => {
      expect(getLanguageFromExtension('.xyz')).toBeNull();
    });

    it('should have all expected languages', () => {
      expect(LANGUAGES).toHaveProperty('javascript');
      expect(LANGUAGES).toHaveProperty('typescript');
      expect(LANGUAGES).toHaveProperty('python');
      expect(LANGUAGES).toHaveProperty('java');
      expect(LANGUAGES).toHaveProperty('c');
      expect(LANGUAGES).toHaveProperty('cpp');
      expect(LANGUAGES).toHaveProperty('go');
      expect(LANGUAGES).toHaveProperty('rust');
    });
  });
});