import { describe, it, expect } from 'vitest';
import { makeId, fileStem, createFileNode, createClassNode, createFunctionNode } from '../src/extract/utils.js';
import { normalizeId } from '../src/build/index.js';
import { getLanguageFromExtension, getLanguageConfig, LANGUAGES, LanguageProfile } from '../src/extract/languages/types.js';
import { FileType } from '../src/types/index.js';

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

    it('should handle unicode characters', () => {
      expect(makeId('café')).toBe('caf');
      expect(makeId('naïve')).toBe('na_ve');
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

    it('should handle underscores in names', () => {
      expect(makeId('my_var')).toBe('my_var');
      expect(makeId('__init__')).toBe('__init__');
    });

    it('should handle numbers', () => {
      expect(makeId('test123')).toBe('test123');
      expect(makeId('file2024')).toBe('file2024');
    });
  });

  describe('fileStem', () => {
    it('should extract stem from file path', () => {
      expect(fileStem('/path/to/file.ts')).toBe('to.file');
      expect(fileStem('/path/to/document.md')).toBe('to.document');
    });

    it('should handle files without extension', () => {
      expect(fileStem('/path/to/README')).toBe('to.README');
    });

    it('should handle multiple dots in filename', () => {
      expect(fileStem('/path/to/file.test.ts')).toBe('to.file.test');
    });

    it('should handle Windows paths', () => {
      expect(fileStem('C:\\path\\to\\file.ts')).toBe('to.file');
    });

    it('should handle root paths', () => {
      expect(fileStem('/file.ts')).toBe('file');
    });

    it('should handle relative paths', () => {
      expect(fileStem('file.ts')).toBe('file');
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

    it('should convert backslashes', () => {
      const result = normalizeId('C:\\path\\to\\file.ts');
      expect(result).not.toContain('\\');
    });

    it('should handle empty paths', () => {
      expect(normalizeId('')).toBe('');
    });
  });

  describe('createFileNode', () => {
    it('should create file node', () => {
      const node = createFileNode('/src/main.ts');
      expect(node.id).toBeDefined();
      expect(node.label).toBe('main.ts');
      expect(node.file_type).toBe('code');
      expect(node.source_file).toBe('/src/main.ts');
    });

    it('should create file node with custom type', () => {
      const node = createFileNode('/docs/readme.md', 'document');
      expect(node.file_type).toBe('document');
    });
  });

  describe('createClassNode', () => {
    it('should create class node', () => {
      const node = createClassNode('MyClass', '/src/main.ts', 10);
      expect(node.label).toBe('MyClass');
      expect(node.file_type).toBe('code');
      expect(node.source_file).toBe('/src/main.ts');
      expect(node.source_location).toBe('L10');
    });
  });

  describe('createFunctionNode', () => {
    it('should create function node', () => {
      const node = createFunctionNode('myFunction', '/src/main.ts', 5);
      expect(node.label).toBe('myFunction');
      expect(node.source_location).toBe('L5');
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

    it('should have language names', () => {
      expect(LANGUAGES.javascript.name).toBe('JavaScript');
      expect(LANGUAGES.python.name).toBe('Python');
      expect(LANGUAGES.go.name).toBe('Go');
    });

    it('should have class types', () => {
      expect(LANGUAGES.javascript.classTypes).toBeDefined();
      expect(LANGUAGES.python.classTypes).toBeDefined();
    });

    it('should have function types', () => {
      expect(LANGUAGES.javascript.functionTypes).toBeDefined();
      expect(LANGUAGES.python.functionTypes).toBeDefined();
    });
  });
});
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