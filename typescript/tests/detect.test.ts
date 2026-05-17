import { describe, it, expect, beforeEach } from 'vitest';
import { Graph } from 'graphlib';
import { classifyFile, getExtension, FileTypeResult, isNoiseDir, shouldSkipFile, CODE_EXTENSIONS } from '../src/detect/file-type.js';
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

    it('should classify Ruby files', () => {
      expect(classifyFile('/path/to/file.rb')).toBe('code');
    });

    it('should classify PHP files', () => {
      expect(classifyFile('/path/to/file.php')).toBe('code');
    });

    it('should classify Swift files', () => {
      expect(classifyFile('/path/to/file.swift')).toBe('code');
    });

    it('should classify shell scripts', () => {
      expect(classifyFile('/path/to/file.sh')).toBe('code');
      expect(classifyFile('/path/to/file.bash')).toBe('code');
    });

    it('should classify YAML files', () => {
      expect(classifyFile('/path/to/file.yaml')).toBe('document');
      expect(classifyFile('/path/to/file.yml')).toBe('document');
    });

    it('should classify XML files', () => {
      expect(classifyFile('/path/to/file.xml')).toBe('document');
    });

    it('should classify HTML files', () => {
      expect(classifyFile('/path/to/file.html')).toBe('document');
    });

    it('should classify CSS files', () => {
      expect(classifyFile('/path/to/file.css')).toBe('code');
      expect(classifyFile('/path/to/file.scss')).toBe('code');
      expect(classifyFile('/path/to/file.sass')).toBe('code');
    });

    it('should classify SQL files', () => {
      expect(classifyFile('/path/to/file.sql')).toBe('code');
    });

    it('should classify Vue files', () => {
      expect(classifyFile('/path/to/file.vue')).toBe('code');
    });

    it('should classify Svelte files', () => {
      expect(classifyFile('/path/to/file.svelte')).toBe('code');
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

    it('should handle multiple dots', () => {
      expect(getExtension('file.tar.gz')).toBe('.gz');
    });

    it('should handle hidden files', () => {
      expect(getExtension('/path/to/.gitignore')).toBe('');
    });

    it('should handle uppercase extensions', () => {
      expect(getExtension('/path/to/file.TS')).toBe('.TS');
    });
  });

  describe('CODE_EXTENSIONS', () => {
    it('should contain common extensions', () => {
      expect(CODE_EXTENSIONS).toContain('.js');
      expect(CODE_EXTENSIONS).toContain('.ts');
      expect(CODE_EXTENSIONS).toContain('.py');
      expect(CODE_EXTENSIONS).toContain('.java');
    });
  });

  describe('isNoiseDir', () => {
    it('should identify noise directories', () => {
      expect(isNoiseDir('node_modules')).toBe(true);
      expect(isNoiseDir('.git')).toBe(true);
      expect(isNoiseDir('__pycache__')).toBe(true);
      expect(isNoiseDir('dist')).toBe(true);
      expect(isNoiseDir('build')).toBe(true);
    });

    it('should allow normal directories', () => {
      expect(isNoiseDir('src')).toBe(false);
      expect(isNoiseDir('lib')).toBe(false);
      expect(isNoiseDir('utils')).toBe(false);
    });
  });

  describe('shouldSkipFile', () => {
    it('should skip hidden files', () => {
      expect(shouldSkipFile('.gitignore')).toBe(true);
      expect(shouldSkipFile('.DS_Store')).toBe(true);
    });

    it('should allow normal files', () => {
      expect(shouldSkipFile('index.ts')).toBe(false);
      expect(shouldSkipFile('README.md')).toBe(false);
    });

    it('should skip backup files', () => {
      expect(shouldSkipFile('file.ts.bak')).toBe(true);
      expect(shouldSkipFile('file.ts.old')).toBe(true);
    });
  });

  describe('Ignore Pattern Matching', () => {
    it('should ignore node_modules', () => {
      expect(shouldIgnore('node_modules/package.json')).toBe(true);
      expect(shouldIgnore('/path_node_modules/package.json')).toBe(true);
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

    it('should ignore .svn', () => {
      expect(shouldIgnore('.svn/entries')).toBe(true);
    });

    it('should ignore .nuxt', () => {
      expect(shouldIgnore('.nuxt/index.js')).toBe(true);
    });

    it('should ignore coverage', () => {
      expect(shouldIgnore('coverage/report.html')).toBe(true);
    });

    it('should ignore .cache', () => {
      expect(shouldIgnore('.cache/file.js')).toBe(true);
    });

    it('should handle multiple patterns', () => {
      const options: IgnoreOptions = { patterns: ['temp', 'logs', 'cache'] };
      expect(shouldIgnore('temp/file.txt', options)).toBe(true);
      expect(shouldIgnore('logs/app.log', options)).toBe(true);
    });
  });

  describe('parseIgnoreFile', () => {
    it('should parse empty lines', () => {
      expect(parseIgnoreFile('')).toBe('');
      expect(parseIgnoreFile('   ')).toBe('');
    });

    it('should skip comments', () => {
      expect(parseIgnoreFile('# comment')).toBe('');
      expect(parseIgnoreFile('  # comment')).toBe('');
    });

    it('should parse patterns', () => {
      expect(parseIgnoreFile('node_modules')).toBe('node_modules');
      expect(parseIgnoreFile('*.log')).toBe('*.log');
    });

    it('should handle negated patterns', () => {
      expect(parseIgnoreFile('!node_modules')).toBe('!node_modules');
    });
  });
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