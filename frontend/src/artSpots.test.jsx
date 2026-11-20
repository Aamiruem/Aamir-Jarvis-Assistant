// Page pictures: their spots run the feature they sit on, the phone list does the same, the
// full-screen view keeps them, and the app-level actions reach App.jsx as events.
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACTION_EVENT, askAzarvis, openTab, reach, startVoice } from './artActions.js';
import { PageHeader } from './ui.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
let root;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const render = (el) => act(() => root.render(el));
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

describe('picture spots', () => {
  it('run their feature from the picture, the phone list and the full-screen view', () => {
    const run = vi.fn();
    render(createElement(PageHeader, { icon: 'tasks', title: 'Tasks', art: '/art/tasks.webp', artAlt: 'A calendar', spots: [{ x: 38, y: 40, label: 'Due today', run }] }));
    const spot = host.querySelector('.page-art-wrap .art-spot');
    expect(spot.style.left).toBe('38%');
    expect(spot.textContent).toContain('Due today');
    click(spot);
    click(host.querySelector('.art-spot-list.for-phone button'));
    expect(run).toHaveBeenCalledTimes(2);

    click(host.querySelector('.page-art-zoom'));
    const viewer = document.querySelector('.img-viewer');
    expect(viewer).not.toBeNull();
    click(viewer.querySelector('.art-spot'));
    expect(run).toHaveBeenCalledTimes(3);
    expect(document.querySelector('.img-viewer')).toBeNull(); // picking a spot closes the view
  });

  it('a header without a picture has no spots', () => {
    render(createElement(PageHeader, { icon: 'tasks', title: 'Tasks' }));
    expect(host.querySelector('.art-spot, .page-art')).toBeNull();
  });
});

describe('artActions', () => {
  it('send app-level actions as events', () => {
    const seen = [];
    const on = (e) => seen.push(e.detail);
    window.addEventListener(ACTION_EVENT, on);
    openTab('tasks', '#x');
    askAzarvis('Plan my day', true);
    startVoice();
    window.removeEventListener(ACTION_EVENT, on);
    expect(seen).toEqual([{ tab: 'tasks', anchor: '#x' }, { ask: 'Plan my day', send: true }, { voice: true }]);
  });

  it('reach focuses or clicks the matching element, and skips missing or disabled ones', () => {
    host.innerHTML = '<input aria-label="New task"><button role="tab">All</button><button role="tab">Today 2</button><button id="off" disabled>Off</button>';
    const today = host.querySelectorAll('[role=tab]')[1];
    const clicked = vi.fn();
    today.addEventListener('click', clicked);
    expect(reach('input[aria-label="New task"]')).toBe(true);
    expect(document.activeElement).toBe(host.querySelector('input'));
    expect(reach('[role=tab]', { click: true, text: 'Today' })).toBe(true);
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(reach('#nothing')).toBe(false);
    expect(reach('#off', { click: true })).toBe(false);
  });
});
