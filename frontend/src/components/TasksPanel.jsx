import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { EmptyState, PageHeader, toast } from '../ui.jsx';

const FILTERS = [
  ['all', 'All'],
  ['today', 'Today'],
  ['overdue', 'Overdue'],
  ['done', 'Done'],
];

const isToday = (d) => d.toDateString() === new Date().toDateString();
const isOverdue = (t) => !t.done && t.remind_at && new Date(t.remind_at) < new Date();

/** "in 2h", "5 min ago", "tomorrow 10:00", "12 Nov 09:30" */
function relative(iso) {
  const d = new Date(iso);
  const mins = Math.round((d - Date.now()) / 60000);
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (Math.abs(mins) < 60) return mins >= 0 ? `in ${mins} min` : `${-mins} min ago`;
  if (isToday(d)) return mins > 0 ? `in ${Math.round(mins / 60)}h · ${time}` : `today ${time}`;
  const tomorrow = new Date(Date.now() + 86_400_000);
  if (d.toDateString() === tomorrow.toDateString()) return `tomorrow ${time}`;
  return `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} ${time}`;
}

export default function TasksPanel() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = () =>
    api.tasks(true)
      .then(setTasks)
      .catch((e) => setError(e.message))
      .finally(() => setLoaded(true));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    // datetime-local has no timezone; toISOString() converts the browser's local time to UTC.
    const remind = remindAt ? new Date(remindAt).toISOString() : null;
    try {
      await api.addTask(title.trim(), due, remind);
      toast(remind ? 'Task added with a reminder' : 'Task added');
      setTitle('');
      setDue('');
      setRemindAt('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = (t) =>
    api.toggleTask(t.id, !t.done).then(() => {
      if (!t.done) toast(`Done: ${t.title}`);
      load();
    });
  const remove = (t) => api.deleteTask(t.id).then(() => { toast('Task deleted'); load(); });
  const clearDone = async () => {
    const done = tasks.filter((t) => t.done);
    if (!done.length || !window.confirm(`Delete ${done.length} completed task(s)?`)) return;
    await Promise.all(done.map((t) => api.deleteTask(t.id)));
    toast(`Cleared ${done.length} completed task(s)`);
    load();
  };

  const counts = useMemo(() => ({
    all: tasks.filter((t) => !t.done).length,
    today: tasks.filter((t) => !t.done && t.remind_at && isToday(new Date(t.remind_at))).length,
    overdue: tasks.filter(isOverdue).length,
    done: tasks.filter((t) => t.done).length,
  }), [tasks]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) =>
        filter === 'done' ? t.done
          : filter === 'overdue' ? isOverdue(t)
            : filter === 'today' ? !t.done && t.remind_at && isToday(new Date(t.remind_at))
              : !t.done)
      .filter((t) => !q || t.title.toLowerCase().includes(q))
      .sort((a, b) => (a.remind_at && b.remind_at ? new Date(a.remind_at) - new Date(b.remind_at) : a.remind_at ? -1 : b.remind_at ? 1 : b.id - a.id));
  }, [tasks, filter, query]);

  const pct = tasks.length ? Math.round((counts.done / tasks.length) * 100) : 0;

  return (
    <div className="panel">
      <PageHeader icon="tasks" hue={265} title="Tasks & reminders" subtitle="Jarvis can add and complete these for you from chat or voice.">
        {counts.done > 0 && <button className="btn ghost" onClick={clearDone}><Icon name="trash" /> Clear completed</button>}
      </PageHeader>

      <div className="progress-card">
        <div className="row">
          <strong>{counts.done} of {tasks.length} done</strong>
          <span className="muted grow">{counts.overdue > 0 ? `${counts.overdue} overdue` : 'Nothing overdue'}</span>
          <span className="progress-pct">{pct}%</span>
        </div>
        <div className="progress"><i style={{ width: `${pct}%` }} /></div>
      </div>

      <form className="composer-card" onSubmit={add}>
        <Icon name="plus" className="accent-icon" />
        <input className="grow" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task… e.g. Submit the report" aria-label="New task" />
        <input className="narrow" value={due} onChange={(e) => setDue(e.target.value)} placeholder="Due (optional)" aria-label="Due" />
        <input type="datetime-local" value={remindAt} onChange={(e) => setRemindAt(e.target.value)} title="Remind me at" aria-label="Remind me at" />
        <button className="btn primary" disabled={!title.trim()}>Add</button>
      </form>
      {error && <div className="error">{error}</div>}

      <div className="toolbar">
        <div className="segmented" role="tablist">
          {FILTERS.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={filter === id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>
              {label} <span className={`count ${id === 'overdue' && counts.overdue ? 'warn' : ''}`}>{counts[id]}</span>
            </button>
          ))}
        </div>
        <label className="search-box">
          <Icon name="search" size="1em" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks" aria-label="Search tasks" />
        </label>
      </div>

      {loaded && shown.length === 0 ? (
        <EmptyState icon={filter === 'done' ? 'tasks' : 'check'} title={query ? 'No tasks match your search' : filter === 'done' ? 'Nothing completed yet' : 'All clear'}>
          {filter === 'all' && !query ? 'Add a task above, or say “Remind me to call mom at 6pm”.' : null}
        </EmptyState>
      ) : (
        <ul className="item-list">
          {shown.map((t) => (
            <li key={t.id} className={`item ${t.done ? 'done' : ''} ${isOverdue(t) ? 'overdue' : ''}`}>
              <button className={`check ${t.done ? 'on' : ''}`} onClick={() => toggle(t)} aria-label={t.done ? 'Mark not done' : 'Mark done'}>
                {t.done && <Icon name="check" size="0.9em" />}
              </button>
              <div className="grow item-body">
                <span className="item-title">{t.title}</span>
                <span className="item-meta">
                  {t.remind_at && <span className="tag"><Icon name="alarm" size="1em" /> {relative(t.remind_at)}</span>}
                  {t.due && <span className="tag"><Icon name="calendar" size="1em" /> {t.due}</span>}
                  {isOverdue(t) && <span className="tag warn">Overdue</span>}
                </span>
              </div>
              <button className="icon-btn" onClick={() => remove(t)} title="Delete" aria-label="Delete"><Icon name="trash" size="1em" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
