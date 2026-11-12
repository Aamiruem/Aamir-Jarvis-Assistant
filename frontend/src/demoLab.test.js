import { describe, expect, it } from 'vitest';
import { analyzePixels, bestSentences, chunk, colorName, describeColumns, describeImage, parseCsv, predictOne, SAMPLE_DOCS, sampleDataset, searchDocs, toCsv, train } from './demoLab.js';

describe('parseCsv', () => {
  it('reads quotes, escaped quotes, CRLF and blank lines', () => {
    const { columns, rows } = parseCsv('name,"note, long",n\r\n"Riya","said ""hi""",3\r\n\r\nAmit,ok,4\n');
    expect(columns).toEqual(['name', 'note, long', 'n']);
    expect(rows).toEqual([
      ['Riya', 'said "hi"', '3'],
      ['Amit', 'ok', '4'],
    ]);
  });
  it('needs a header and a data row', () => {
    expect(() => parseCsv('a,b\n')).toThrow(/header row/);
  });
  it('round-trips through toCsv', () => {
    const data = { columns: ['a', 'b'], rows: [['1', 'x, "y"']] };
    expect(parseCsv(toCsv(data))).toEqual(data);
  });
});

describe('describeColumns', () => {
  it('tells number columns from text columns', () => {
    const info = describeColumns(parseCsv('x,y\n1,a\n2,b\n,a'));
    expect(info.map((c) => [c.numeric, c.unique, c.missing])).toEqual([[true, 2, 1], [false, 2, 0]]);
  });
});

describe('train', () => {
  it('learns house prices well (linear regression)', () => {
    const m = train(sampleDataset('houses'), 'price_lakh');
    expect(m.kind).toBe('regression');
    expect(m.score.r2).toBeGreaterThan(0.8);
    expect(m.score.mae).toBeLessThan(m.score.baseMae);
    expect(m.importance[0].name).toBe('area_sqft');
    expect(m.trainRows + m.testRows).toBe(240);
    // A bigger flat costs more.
    const small = predictOne(m, [800, 1, 5, 2]);
    const big = predictOne(m, [2800, 4, 5, 2]);
    expect(big).toBeGreaterThan(small + 50);
  });
  it('predicts pass / fail better than guessing (k-nearest neighbours)', () => {
    const m = train(sampleDataset('students'), 'result');
    expect(m.kind).toBe('classification');
    expect(m.classes.sort()).toEqual(['fail', 'pass']);
    expect(m.score.accuracy).toBeGreaterThan(m.score.baseline);
    expect(['pass', 'fail']).toContain(predictOne(m, [9, 95, 8]));
    expect(predictOne(m, [9.5, 98, 8.5])).toBe('pass');
    expect(predictOne(m, [0.5, 52, 4.5])).toBe('fail');
  });
  it('is the same every time (seeded)', () => {
    expect(train(sampleDataset('houses'), 'price_lakh').score).toEqual(train(sampleDataset('houses'), 'price_lakh').score);
  });
  it('explains what is wrong with unusable data', () => {
    expect(() => train(parseCsv('name,city\nA,B\nC,D'), 'city')).toThrow(/number column/);
    expect(() => train(parseCsv('x,y\n1,2\n3,4'), 'y')).toThrow(/Too few/);
  });
  it('skips text columns and reports them', () => {
    const data = sampleDataset('houses');
    data.columns.push('city');
    data.rows.forEach((r) => r.push('Gurgaon'));
    expect(train(data, 'price_lakh').skipped).toEqual(['city']);
  });
});

describe('Knowledge search', () => {
  it('finds the passage that answers the question', () => {
    const [best] = searchDocs(SAMPLE_DOCS, 'How do I set a reminder?');
    expect(best.title).toBe('Azarvis quick guide');
    expect(bestSentences(best.text, 'set a reminder')).toMatch(/remind me/i);
    expect(searchDocs(SAMPLE_DOCS, 'What is overfitting?')[0].title).toBe('Machine learning cheat sheet');
    expect(searchDocs(SAMPLE_DOCS, 'STAR method')[0].title).toBe('Interview preparation checklist');
  });
  it('returns nothing for unrelated or empty questions', () => {
    expect(searchDocs(SAMPLE_DOCS, 'zebra quokka')).toEqual([]);
    expect(searchDocs(SAMPLE_DOCS, 'the of and')).toEqual([]);
  });
  it('splits long text into passages', () => {
    const long = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} is here.`).join(' ');
    const parts = chunk(long);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.join(' ').replace(/\s+/g, ' ')).toBe(long);
  });
});

describe('Vision', () => {
  const image = (w, h, fill) => {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) data.set([...fill(i % w, Math.floor(i / w)), 255], i * 4);
    return data;
  };
  it('names colours', () => {
    expect(colorName(250, 250, 250)).toBe('white');
    expect(colorName(5, 5, 5)).toBe('black');
    expect(colorName(30, 90, 220)).toBe('blue');
    expect(colorName(40, 180, 60)).toBe('green');
    expect(colorName(230, 40, 40)).toBe('red');
  });
  it('describes a flat graphic and a noisy photo', () => {
    const flat = analyzePixels(image(40, 30, (x) => (x < 20 ? [20, 60, 200] : [250, 250, 250])), 40, 30);
    expect(flat.flat).toBe(true);
    expect(flat.colors.map((c) => c.name).sort()).toEqual(['blue', 'white']);
    expect(describeImage(flat, 1200, 900)).toMatch(/wide.*Mostly (blue and white|white and blue).*screenshot/);

    let seed = 1;
    const noise = () => (seed = (seed * 16807) % 2147483647) % 256;
    const photo = analyzePixels(image(40, 40, () => [noise(), noise(), noise()]), 40, 40);
    expect(photo.flat).toBe(false);
    expect(photo.detail).toBeGreaterThan(0.09);
    expect(describeImage(photo, 500, 500)).toMatch(/square.*fine detail.*photo/);
  });
});
