import { describe, it, expect } from 'vitest';
import { makeId, fileStem } from '../src/extract/utils.js';

describe('Edge Cases Tests', () => {
  describe('makeId Edge Cases', () => {
    it('should handle empty string', () => {
      expect(makeId('')).toBe('');
    });

    it('should handle whitespace only', () => {
      expect(makeId('   ')).toBe('');
    });

    it('should handle special unicode', () => {
      expect(makeId('日本')).toBe('');
    });

    it('should handle emoji', () => {
      expect(makeId('👋')).toBe('');
    });

    it('should handle long strings', () => {
      const long = 'a'.repeat(1000);
      expect(makeId(long).length).toBeLessThan(1000);
    });

    it('should handle mixed case', () => {
      expect(makeId('AbCDeF')).toBe('abcdef');
    });

    it('should handle numbers in string', () => {
      expect(makeId('test123')).toBe('test123');
    });

    it('should handle hash characters', () => {
      expect(makeId('test#tag')).toBe('test_tag');
    });

    it('should handle at sign', () => {
      expect(makeId('user@name')).toBe('user_name');
    });

    it('should handle plus sign', () => {
      expect(makeId('a+b')).toBe('a_b');
    });
  });

  describe('fileStem Edge Cases', () => {
    it('should handle empty path', () => {
      expect(fileStem('')).toBe('');
    });

    it('should handle path with only slashes', () => {
      expect(fileStem('////')).toBe('');
    });

    it('should handle hidden file', () => {
      expect(fileStem('/.hidden')).toBe('.hidden');
    });

    it('should handle very long paths', () => {
      const longPath = '/'.repeat(100) + 'file.ts';
      expect(fileStem(longPath)).toBeDefined();
    });

    it('should handle query string in path', () => {
      expect(fileStem('/path?query=1')).toBe('path');
    });

    it('should handle anchor in path', () => {
      expect(fileStem('/path#section')).toBe('path');
    });
  });
});