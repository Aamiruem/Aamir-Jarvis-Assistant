import 'katex/dist/katex.min.css';
import { Children, isValidElement, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { toast } from '../ui.jsx';
import { Icon } from '../icons.jsx';
import { slug, toDollarMath } from '../notes.js';

const textOf = (node) =>
  typeof node === 'string' || typeof node === 'number'
    ? String(node)
    : Array.isArray(node)
      ? node.map(textOf).join('')
      : isValidElement(node)
        ? textOf(node.props.children)
        : '';

const ICONS = {
  ai: 'brain',
  ml: 'chart',
  data: 'chart',
  python: 'flask',
  model: 'cpu',
  learning: 'sparkles',
  math: 'calculator',
  project: 'rocket',
  deploy: 'rocket',
  summary: 'check',
  workflow: 'timeline',
  interview: 'briefcase',
  nlp: 'chat',
  vision: 'camera',
  deep: 'pulse',
  default: 'book',
};

const iconNameForHeading = (text) => {
  const t = String(text).toLowerCase();
  if (/(ai|artificial intelligence|intelligent)/.test(t)) return 'brain';
  if (/(ml|model|learning|algorithm|prediction)/.test(t)) return 'chart';
  if (/(python|code|function|loop|list|string)/.test(t)) return 'flask';
  if (/(data|statistics|math|probab|variance|mean|matrix)/.test(t)) return 'timeline';
  if (/(project|deploy|production|monitor)/.test(t)) return 'rocket';
  if (/(summary|final|quick|revision)/.test(t)) return 'check';
  if (/(nlp|language|text|chatbot|transformer)/.test(t)) return 'chat';
  if (/(vision|image|cv|camera)/.test(t)) return 'camera';
  if (/(interview|career|questions)/.test(t)) return 'briefcase';
  if (/(workflow|pipeline|process|steps)/.test(t)) return 'timeline';
  return 'book';
};

function heading(Tag) {
  return function Heading({ children }) {
    const text = textOf(children);
    const icon = iconNameForHeading(text);
    return (
      <Tag id={slug(text)} className="md-heading md-heading--icon">
        <span className="md-heading__icon"><Icon name={icon} size="0.9em" /></span>
        <span>{children}</span>
      </Tag>
    );
  };
}

function Pre({ children }) {
  const code = textOf(Children.toArray(children)).replace(/\n$/, '');
  const copy = () => navigator.clipboard.writeText(code).then(() => toast('Code copied'), () => toast("Couldn't copy", 'error'));
  return (
    <div className="code-block">
      <button type="button" className="code-copy" onClick={copy} aria-label="Copy code" title="Copy code">
        <Icon name="copy" size="1em" /> Copy
      </button>
      <pre>{children}</pre>
    </div>
  );
}

const COMPONENTS = {
  h1: heading('h1'),
  h2: heading('h2'),
  h3: heading('h3'),
  pre: Pre,
  table: ({ children }) => (
    <div className="md-table">
      <table>{children}</table>
    </div>
  ),
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
};
const REMARK = [remarkGfm, [remarkMath, { singleDollarTextMath: false }]];
const REHYPE = [[rehypeKatex, { throwOnError: false, strict: false }]];

/** Notes-grade Markdown: tables, formulas (KaTeX), code with a Copy button, linkable headings. */
export default memo(function MarkdownView({ source, className = '' }) {
  return (
    <div className={`md ${className}`}>
      <ReactMarkdown remarkPlugins={REMARK} rehypePlugins={REHYPE} components={COMPONENTS}>
        {toDollarMath(source)}
      </ReactMarkdown>
    </div>
  );
});
