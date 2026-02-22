import { describe, it, expect } from 'vitest';
import { sanitizeString, sanitizeUrl } from './securityUtils';

describe('sanitizeString', () => {
  it('should remove dangerous characters', () => {
    expect(sanitizeString('<script>')).toBe('script');
    expect(sanitizeString('alert("xss")')).toBe('alert(xss)');
    expect(sanitizeString('`eval`')).toBe('eval');
    expect(sanitizeString('\\escape')).toBe('escape');
  });

  it('should remove dangerous protocols', () => {
    expect(sanitizeString('javascript:alert(1)')).toBe('[blocked]alert(1)');
    expect(sanitizeString('vbscript:alert(1)')).toBe('[blocked]alert(1)');
    expect(sanitizeString('JavaScript:alert(1)')).toBe('[blocked]alert(1)');
    expect(sanitizeString('VBScript:alert(1)')).toBe('[blocked]alert(1)');
    expect(sanitizeString('javjavascript:ascript:alert(1)')).toBe('jav[blocked]ascript:alert(1)');
    // data: is allowed for compatibility with sanitizeUrl
    expect(sanitizeString('data:image/png;base64,...')).toBe('data:image/png;base64,...');
  });

  it('should remove control characters (newlines, tabs)', () => {
    expect(sanitizeString('Hello\nWorld')).toBe('HelloWorld');
    expect(sanitizeString('Hello\rWorld')).toBe('HelloWorld');
    expect(sanitizeString('Hello\tWorld')).toBe('HelloWorld');
    expect(sanitizeString('Line1\nLine2')).toBe('Line1Line2');
  });

  it('should handle undefined or non-string inputs', () => {
    expect(sanitizeString(undefined)).toBe('');
    // @ts-ignore
    expect(sanitizeString(null)).toBe('');
    // @ts-ignore
    expect(sanitizeString(123)).toBe('');
  });
});

describe('sanitizeUrl', () => {
  it('should allow safe protocols', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    // data: is now blocked to prevent XSS/Phishing
    expect(sanitizeUrl('data:image/png;base64,123')).toBe('');
  });

  it('should allow relative paths', () => {
    expect(sanitizeUrl('/assets/image.png')).toBe('/assets/image.png');
  });

  it('should reject dangerous protocols', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeUrl('vbscript:alert(1)')).toBe('');
    expect(sanitizeUrl('file:///etc/passwd')).toBe('');
    expect(sanitizeUrl('data:text/html,alert(1)')).toBe('');
  });

  it('should handle mixed case protocols', () => {
    expect(sanitizeUrl('HTTPS://EXAMPLE.COM')).toBe('HTTPS://EXAMPLE.COM');
    expect(sanitizeUrl('JavaScript:alert(1)')).toBe('');
  });
});
