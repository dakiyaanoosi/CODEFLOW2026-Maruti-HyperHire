/**
 * Deterministic unique ID generation utility.
 * Uses crypto.randomUUID() when available (browsers + Node 19+),
 * falling back to a timestamp + counter approach.
 * 
 * This replaces all Math.random()-based ID generation in the codebase.
 */

let _counter = 0;

/**
 * Generate a unique ID with an optional prefix.
 * Uses the Web Crypto API for true randomness when available.
 */
export function generateId(prefix?: string): string {
  const base = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    : `${Date.now().toString(36)}_${(++_counter).toString(36)}`;

  return prefix ? `${prefix}_${base}` : base;
}
