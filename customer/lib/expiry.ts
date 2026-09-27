/**
 * Checks if a product's expiration date has passed.
 * Returns true if the product is expired, false otherwise.
 * For 'YYYY-MM-DD' strings, products expire after that calendar day concludes (23:59:59.999).
 */
export function isProductExpired(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const trimmed = dateStr.trim();
  if (!trimmed) return false;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const endOfDay = new Date(`${trimmed}T23:59:59.999`);
    return !isNaN(endOfDay.getTime()) && endOfDay.getTime() < Date.now();
  }

  const d = new Date(trimmed);
  return !isNaN(d.getTime()) && d.getTime() < Date.now();
}

/**
 * Returns today's ISO date string 'YYYY-MM-DD' for PostgREST query filters.
 */
export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
