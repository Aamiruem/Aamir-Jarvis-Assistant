import { describe, expect, it } from 'vitest';
import { practiceCards, searchText, sections, slug, toDollarMath } from './notes.js';

const BS = '\\';
const NOTE = [
  '# 4. Arithmetic Mean',
  '',
  'Mean is the average of all values, a measure of central tendency used everywhere in statistics and ML.',
  '',
  `${BS}[`,
  `${BS}mu = ${BS}frac{${BS}sum x_i}{N}`,
  `${BS}]`,
  '',
  `| ${BS}(${BS}mu${BS}) | Population mean |`,
  '',
  '```python',
  `pattern = r"${BS}(${BS}d+${BS})"  # not math`,
  '# not a heading inside code',
  '```',
  '',
  '# Code',
  '',
  'print(1)',
  '',
  '# 5. Median',
  '',
  'The median is the middle value after sorting; unlike the mean it is not pulled by outliers.',
].join('\n');

describe('toDollarMath', () => {
  const out = toDollarMath(NOTE);
  it('turns \\[ \\] blocks and \\( \\) inline formulas into $$ math', () => {
    expect(out).toContain(`$$\n${BS}mu = ${BS}frac{${BS}sum x_i}{N}\n$$`);
    expect(out).toContain(`| $$${BS}mu$$ | Population mean |`);
  });
  it('leaves code blocks exactly as written', () => {
    expect(out).toContain(`pattern = r"${BS}(${BS}d+${BS})"  # not math`);
  });
  it('changes nothing but the math markers', () => {
    let fence = false;
    const expected = NOTE.split('\n')
      .map((line) => {
        if (line.startsWith('```')) fence = !fence;
        return fence || line.startsWith('```') ? line : line.replace(/\\[[\]()]/g, '');
      })
      .join('\n');
    expect(out.replace(/\$\$/g, '')).toBe(expected);
  });
});

describe('practice cards', () => {
  it('splits on top-level headings outside code and skips generic ones', () => {
    expect(sections(NOTE).map((s) => s.title)).toEqual(['4. Arithmetic Mean', 'Code', '5. Median']);
    expect(practiceCards(NOTE).map((c) => c.title)).toEqual(['4. Arithmetic Mean', '5. Median']);
  });
});

describe('search', () => {
  it('finds lines containing every word, with the heading they are under', () => {
    const [hit] = searchText([{ title: 'Statistics' }], [NOTE], 'middle sorting');
    expect(hit.heading).toBe('5. Median');
    expect(hit.snippet).toMatch(/middle value/);
    expect(searchText([{ title: 'S' }], [NOTE], 'nothing-like-this')).toEqual([]);
  });
  it('makes stable heading anchors', () => {
    expect(slug('4. Arithmetic Mean')).toBe('4-arithmetic-mean');
  });
});
