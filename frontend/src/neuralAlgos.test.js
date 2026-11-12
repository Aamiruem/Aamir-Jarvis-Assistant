import { describe, expect, it } from 'vitest';
import { ALGOS, CATEGORIES, categoryCounts, filterAlgos, getAlgo } from './neuralAlgos.js';

describe('neural algos data', () => {
  it('has all 20, numbered 1..20, each complete', () => {
    expect(ALGOS).toHaveLength(20);
    expect(ALGOS.map((a) => a.n)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    for (const a of ALGOS) {
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.tagline.length).toBeGreaterThan(5);
      expect(a.use).toBeTruthy();
      expect(a.motif).toBeTruthy();
      expect(CATEGORIES).toContain(a.cat);
      expect(a.points.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('ids are unique', () => {
    expect(new Set(ALGOS.map((a) => a.id)).size).toBe(20);
  });

  it('category counts sum to the total', () => {
    const counts = categoryCounts();
    expect(counts.All).toBe(20);
    const sum = CATEGORIES.filter((c) => c !== 'All').reduce((s, c) => s + counts[c], 0);
    expect(sum).toBe(20);
  });

  it('filters by category', () => {
    const vision = filterAlgos('Vision');
    expect(vision.length).toBeGreaterThan(0);
    expect(vision.every((a) => a.cat === 'Vision')).toBe(true);
    expect(filterAlgos('All')).toHaveLength(20);
  });

  it('searches name, use case and points', () => {
    expect(filterAlgos('All', 'lstm').map((a) => a.id)).toContain('lstm');
    expect(filterAlgos('All', 'image').length).toBeGreaterThan(1);
    expect(filterAlgos('All', 'self-driving').map((a) => a.id)).toContain('yolo');
    expect(filterAlgos('All', 'experience replay').map((a) => a.id)).toContain('dqn');
    expect(filterAlgos('All', 'zzzznomatch')).toHaveLength(0);
  });

  it('category + query combine', () => {
    const r = filterAlgos('Transformers', 'bert');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('bert');
    expect(filterAlgos('Vision', 'bert')).toHaveLength(0);
  });

  it('getAlgo resolves by id', () => {
    expect(getAlgo('gan').name).toBe('GAN');
    expect(getAlgo('nope')).toBeNull();
  });
});
