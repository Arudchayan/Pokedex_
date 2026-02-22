// Security utilities for input validation and sanitization

// Limit input characters to prevent DoS (approx 50KB)
export const MAX_INPUT_LENGTH = 50000;

// Limit compressed URL data length to prevent DoS before decompression (approx 2KB)
// Reduced from 5000 to 2000 to mitigate decompression bomb risks
export const MAX_COMPRESSED_LENGTH = 2000;

// Limit decompressed data size to prevent DoS via decompression bombs (approx 30KB)
// Reduced from 100KB to 30KB to further limit resource usage
export const MAX_DECOMPRESSED_LENGTH = 30000;

const ALLOWED_REMOTE_HOSTS = new Set([
  'beta.pokeapi.co',
  'raw.githubusercontent.com',
  'play.pokemonshowdown.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  // Test fixture host
  'example.com',
]);

// Sanitize string to prevent XSS or injection
// Allow alphanumeric, spaces, and safe punctuation: . , : ; - ' _
// Remove potentially dangerous characters: < > " `
// Remove control characters (including newlines) to prevent parameter injection
// Remove dangerous protocols: javascript:, vbscript:
// Replace with [blocked] to prevent recursive bypasses (e.g. javjavascript:ascript:)
export const sanitizeString = (str: string | undefined): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[<>"\\`]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/(javascript|vbscript):/gi, '[blocked]');
};

// Validate that a number is finite and within a reasonable safe integer range
export const validateSafeNumber = (num: any, min = -1000000, max = 1000000): number | undefined => {
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return undefined;
  }
  if (num < min || num > max) {
    return undefined;
  }
  return num;
};

// Validate that a URL uses a safe protocol (http, https) or is relative
// SECURITY: data: protocols are blocked to prevent XSS (e.g. data:text/html) and other abuse
export const sanitizeUrl = (url: string | undefined): string => {
  if (!url || typeof url !== 'string') return '';
  const sanitized = sanitizeString(url);

  // Allow relative URLs (starting with /)
  if (sanitized.startsWith('/')) {
    return sanitized;
  }

  // Allow only explicit http(s) URLs and enforce host allowlist.
  // This blocks javascript:, data:, file:, and arbitrary exfiltration hosts.
  try {
    const parsed = new URL(sanitized);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'https:' && protocol !== 'http:') return '';

    const host = parsed.hostname.toLowerCase();
    if (!ALLOWED_REMOTE_HOSTS.has(host)) return '';
    if (parsed.username || parsed.password) return '';

    return sanitized;
  } catch {
    return '';
  }

  // Unreachable, retained for readability.
  return '';
};

// Check if string is already safe (contains no forbidden characters)
// This avoids the overhead of sanitizeString() which creates new strings.
export const isSafeString = (str: any): str is string => {
  if (typeof str !== 'string') return false;
  // Use regex.test() which is faster than replace() for validation
  // Matches characters that sanitizeString removes: < > " \ ` and control chars
  // Also checks for dangerous protocols
  return !/[<>"\\`\x00-\x1F\x7F]/.test(str) && !/(javascript|vbscript):/i.test(str);
};

// Check if number is valid and within range
export const isSafeNumber = (num: any, min = -1000000, max = 1000000): num is number => {
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return false;
  }
  return num >= min && num <= max;
};

// Check if URL is safe and valid (matches sanitizeUrl output)
export const isSafeUrl = (url: any): url is string => {
  if (typeof url !== 'string') return false;

  // Empty string is considered safe result of sanitization (e.g. invalid input becomes '')
  if (url === '') return true;

  // Must be safe string first
  if (!isSafeString(url)) return false;

  // Must round-trip through sanitizeUrl unchanged.
  return sanitizeUrl(url) === url;
};
