import {describe, expect, it} from 'vitest';
import {nextPreviewOrderReference} from './preview-order-reference';

const date = new Date('2026-11-21T23:30:00.000Z'); // 22 November in Osogbo.

describe('browser-local preview references', () => {
  it('starts with the Lagos-time-zone calendar date and sequence 001', () => {
    expect(nextPreviewOrderReference([], date)).toBe('FGD-20261122-001');
  });

  it('uses the next sequence for a later preview on the same day', () => {
    expect(nextPreviewOrderReference(['FGD-20261122-001', 'FGD-20261122-003'], date))
      .toBe('FGD-20261122-004');
  });

  it('ignores older and legacy references without changing them', () => {
    const references = ['FORGED-OLDER-123', 'FGD-20261121-008'];
    expect(nextPreviewOrderReference(references, date)).toBe('FGD-20261122-001');
    expect(references).toEqual(['FORGED-OLDER-123', 'FGD-20261121-008']);
  });

  it('continues beyond 999 without producing a duplicate', () => {
    expect(nextPreviewOrderReference(['FGD-20261122-999'], date)).toBe('FGD-20261122-1000');
  });
});
