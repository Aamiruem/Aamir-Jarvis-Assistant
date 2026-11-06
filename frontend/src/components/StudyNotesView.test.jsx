// @vitest-environment jsdom
// The master-prompt notes view: a menu of the numbered sections (not the "#" lines inside code
// blocks), and the Answers section hidden until asked for.
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import StudyNotesView from './StudyNotesView.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const NOTES = `# 1. Definitions and Basic Understanding
A list stores items in order.

# 2. Difficult Words and Terminology
| Word | Easy Meaning | Example |
|---|---|---|
| index | position | \`a[0]\` |

# 5. Practical Coding (Basic to Advanced)
\`\`\`python
# not a section: a Python comment
nums = [1, 2, 3]
\`\`\`

\`\`\`text
# not a section either
[ input ] --> [ model ]
\`\`\`

# 13. Final Knowledge Test
1. What does \`len([])\` return?

# Answers
1. It returns 0.`;

let host, root;
beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const render = (markdown) => act(() => root.render(createElement(StudyNotesView, { markdown })));
const button = (label) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim().endsWith(label));

describe('StudyNotesView', () => {
  it('lists only the real sections, plus Answers', () => {
    render(NOTES);
    const chips = [...host.querySelectorAll('.study-notes-menu .chip')].map((b) => b.textContent);
    expect(chips).toEqual([
      '1. Definitions and Basic Understanding',
      '2. Difficult Words and Terminology',
      '5. Practical Coding (Basic to Advanced)',
      '13. Final Knowledge Test',
      'Answers',
    ]);
  });

  it('menu entries point at real heading ids', () => {
    render(NOTES);
    expect(host.querySelector('#\\31 -definitions-and-basic-understanding')).not.toBeNull();
    expect(host.querySelector('#\\31 3-final-knowledge-test')).not.toBeNull();
  });

  it('hides the answers until asked, and can hide them again', () => {
    render(NOTES);
    expect(host.textContent).toContain('What does');
    expect(host.textContent).not.toContain('It returns 0.');
    act(() => button('Show answers').click());
    expect(host.textContent).toContain('It returns 0.');
    act(() => button('Hide answers').click());
    expect(host.textContent).not.toContain('It returns 0.');
  });

  it('shows older notes without an Answers section unchanged', () => {
    render('# Intro\nJust text.\n\n# Summary\nDone.');
    expect(host.querySelector('.study-notes-answers')).toBeNull();
    expect(host.textContent).toContain('Done.');
  });
});
