// Agents page against a fake API: runs and their agents show, and Approve / Reject call the backend.
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const run = {
  id: 'r1', instruction: 'Prepare my job application', status: 'needs_approval', paused: false, summary: 'Two agents', error: '', created_at: Date.now() / 1000, finished_at: null,
  report: 'All checked.',
  subtasks: [
    { id: 't1', agent: 'research', agent_name: 'Research Agent', title: 'Find vacancies', instruction: '', depends_on: [], status: 'done', output: 'six roles', error: '', tools: [], attempts: 1, seconds: 3 },
    { id: 't2', agent: 'email', agent_name: 'Email Agent', title: 'Draft email', instruction: '', depends_on: ['t1'], status: 'done', output: 'draft', error: '', tools: [], attempts: 1, seconds: 2 },
  ],
  approvals: [{ id: 'a1', subtask_id: 't2', tool: 'compose_email', status: 'pending', result: '', input: { to: 'hr@example.com', subject: 'Application', body: 'Hello' } }],
};
const api = {
  orchestratorRuns: vi.fn(async () => [run]),
  orchestratorRun: vi.fn(async () => run),
  startRun: vi.fn(),
  runAction: vi.fn(),
  retrySubtask: vi.fn(),
  decideApproval: vi.fn(async () => ({ ...run, status: 'done', approvals: [{ ...run.approvals[0], status: 'approved' }] })),
};
vi.mock('../api.js', () => ({ api }));
vi.mock('./MarkdownView.jsx', () => ({ default: ({ source }) => createElement('div', null, source) }));
const { default: AgentsPanel } = await import('./AgentsPanel.jsx');

let root;
let host;
beforeEach(async () => {
  Object.values(api).forEach((f) => f.mockClear());
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(createElement(AgentsPanel)));
  await act(async () => {});
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.includes(text));

describe('AgentsPanel', () => {
  it('shows the run, each agent and what waits for approval', () => {
    const text = host.textContent;
    expect(text).toContain('Research Agent');
    expect(text).toContain('Email Agent');
    expect(text).toContain('Needs your approval');
    expect(text).toContain('hr@example.com');
    expect(text).toContain('After Find vacancies'); // the email waited for the research
  });

  it('Approve sends the decision for that action', async () => {
    await act(async () => button('Approve').click());
    expect(api.decideApproval).toHaveBeenCalledWith('r1', 'a1', true);
    expect(host.textContent).toContain('Approved');
  });

  it('Reject sends a rejection', async () => {
    await act(async () => button('Reject').click());
    expect(api.decideApproval).toHaveBeenCalledWith('r1', 'a1', false);
  });
});
