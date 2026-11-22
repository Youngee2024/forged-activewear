/** Browser-local preview references; not a server-side order-number allocator. */
export function nextPreviewOrderReference(existing: readonly string[], now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
  const prefix = `FGD-${part('year')}${part('month')}${part('day')}-`;
  const highest = existing.reduce((max, reference) => {
    if (!reference.startsWith(prefix)) return max;
    const suffix = reference.slice(prefix.length);
    if (!/^\d{3,}$/.test(suffix)) return max;
    const value = Number(suffix);
    return Number.isSafeInteger(value) ? Math.max(max, value) : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(3, '0')}`;
}
