/**
 * Sanitize a platform/file ID to prevent path traversal and invalid characters.
 * Allows unicode letters/digits, replaces dangerous chars with underscore.
 */
export function sanitizeId(id: string): string {
  if (!id) return 'default';
  const sanitized = id.replace(/[\/\\:*?"<>|.\s]/g, '_').slice(0, 100);
  return sanitized || 'default';
}