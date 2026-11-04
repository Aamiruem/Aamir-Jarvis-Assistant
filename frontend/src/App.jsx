import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { api, auth, onSessionExpired } from './api.js';
import HomePanel from './components/HomePanel.jsx';
import Login from './components/Login.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import NotificationBell from './components/NotificationBell.jsx';
import ThemeMenu from './components/ThemeMenu.jsx';
import { Icon } from './icons.jsx';
import { useTheme } from './theme.js';
import { toast, Toaster } from './ui.jsx';
import { sessionPlan } from './session.js';
import { useRoomWatch } from './useRoomWatch.js';
import WelcomePrompt from './components/WelcomePrompt.jsx';

// Code splitting: Home and sign-in load first; every other tab is its own small file,
// downloaded the first time it's opened (Chat is fetched early while the browser is idle).
const loadChat = () => import('./components/Chat.jsx');
const Chat = lazy(loadChat);
const VisionPanel = lazy(() => import('./components/VisionPanel.jsx'));
const KnowledgePanel = lazy(() => import('./components/KnowledgePanel.jsx'));
const TasksPanel = lazy(() => import('./components/TasksPanel.jsx'));
const MemoryPanel = lazy(() => import('./components/MemoryPanel.jsx'));
const ContactsPanel = lazy(() => import('./components/ContactsPanel.jsx'));
const AccountPanel = lazy(() => import('./components/AccountPanel.jsx'));
const AdminPanel = lazy(() => import('./components/AdminPanel.jsx'));

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'chat', label: 'Chat', icon: 'chat' },
  { id: 'vision', label: 'Vision', icon: 'eye' },
  { id: 'knowledge', label: 'Knowledge', icon: 'book' },
  { id: 'tasks', label: 'Tasks', icon: 'tasks' },
  { id: 'memory', label: 'Memory', icon: 'brain' },
  { id: 'contacts', label: 'Contacts', icon: 'contacts' },
  { id: 'account', label: 'Account', icon: 'user' },
  { id: 'admin', label: 'Admin', icon: 'shield', adminOnly: true },
].map((t, i) => ({ ...t, key: i + 1 })); // Alt+1 … Alt+9

// Desktop: the menu button collapses the sidebar (remembered per browser). Phone: it slides in.
const readCollapsed = () => {
  try {
    return localStorage.getItem('jarvis-sidebar') === 'collapsed';
  } catch {
    return false;
  }
};
const isPhone = () => window.matchMedia('(max-width: 760px)').matches;

const readRoomWatch = () => {
  try {
    return localStorage.getItem('jarvis-room-watch') === 'on';
  } catch {
    return false;
  }
};

const readAutoStart = () => {
  try {
    return localStorage.getItem('jarvis-autostart') !== 'off';
  } catch {
    return true;
  }
};
// The welcome prompt shows once per browser tab session, not on every reload of the same tab.
const welcomeShown = () => {
  try {
    return sessionStorage.getItem('jarvis-welcomed') === '1';
  } catch {
    return false;
  }
};

// Sidebar groups by last activity.
function groupConversations(list) {
  const day = 86_400_000;
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const groups = { Today: [], 'This week': [], Older: [] };
  for (const c of list) {
    const t = new Date(c.updatedAt || 0).getTime();
    groups[t >= startOfToday ? 'Today' : t >= startOfToday - 6 * day ? 'This week' : 'Older'].push(c);
  }
  return Object.entries(groups).filter(([, cs]) => cs.length);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState('home');
  const [prompt, setPrompt] = useState(null); // { id, text, send, handsFree } handed from Home to Chat
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [convQuery, setConvQuery] = useState('');
  const [contactQuery, setContactQuery] = useState('');
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [roomWatchOn, setRoomWatchOn] = useState(readRoomWatch);
  const [autoStart, setAutoStart] = useState(readAutoStart);
  const [welcome, setWelcome] = useState(false);
  const theme = useTheme();

  /**
   * Starts a spoken session: the first time Jarvis asks a few questions to get to know you,
   * after that it greets you, reads today's reminders and asks how it can help.
   * arrival: started by Room Watch (always-listening "Hey Jarvis" mode). interview: ask again.
   */
  const startSession = useCallback(
    async ({ arrival = false, interview = false } = {}) => {
      const plan = await sessionPlan(user, { arrival, interview });
      setActiveId(null);
      setPrompt({ id: Date.now(), handsFree: true, wake: arrival, ...plan });
      setTab('chat');
    },
    [user],
  );

  // Room Watch: when someone walks in, greet them and start always-listening voice mode.
  const roomWatch = useRoomWatch({
    enabled: Boolean(user) && roomWatchOn,
    onArrival: () => startSession({ arrival: true }),
  });
  useEffect(() => {
    try {
      localStorage.setItem('jarvis-autostart', autoStart ? 'on' : 'off');
    } catch {}
  }, [autoStart]);
  // Browsers only let a page talk after a click, so starting Jarvis is one tap on this prompt.
  useEffect(() => {
    if (user && autoStart && !welcomeShown()) setWelcome(true);
  }, [user]);
  const closeWelcome = () => {
    setWelcome(false);
    try {
      sessionStorage.setItem('jarvis-welcomed', '1');
    } catch {}
  };
  useEffect(() => {
    try {
      localStorage.setItem('jarvis-room-watch', roomWatchOn ? 'on' : 'off');
    } catch {}
  }, [roomWatchOn]);
  useEffect(() => {
    if (roomWatch.error) toast(roomWatch.error, 'error');
  }, [roomWatch.error]);

  useEffect(() => {
    try {
      localStorage.setItem('jarvis-sidebar', collapsed ? 'collapsed' : 'open');
    } catch {}
  }, [collapsed]);

  // Restore the session from the httpOnly refresh cookie (the access token isn't stored anywhere).
  useEffect(() => {
    onSessionExpired(() => setUser(null));
    auth.restore().then(setUser).finally(() => setChecking(false));
  }, []);

  const refreshConversations = useCallback(() => {
    api.conversations().then(setConversations).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshConversations();
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
    idle(() => loadChat()); // so the first "Talk to Jarvis" opens instantly
  }, [user, refreshConversations]);

  // Keyboard: Ctrl/⌘+K command palette, Alt+1…9 switch tabs.
  useEffect(() => {
    if (!user) return;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteQuery('');
        setPaletteOpen((o) => !o);
      } else if (e.altKey && /^[1-9]$/.test(e.key)) {
        const t = TABS[Number(e.key) - 1];
        if (t && (!t.adminOnly || user.role === 'admin')) {
          e.preventDefault();
          setTab(t.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user]);

  const shownConversations = useMemo(() => {
    const q = convQuery.trim().toLowerCase();
    return groupConversations(q ? conversations.filter((c) => c.title.toLowerCase().includes(q)) : conversations);
  }, [conversations, convQuery]);

  if (checking) return <div className="center-screen"><div className="orb pulse" /></div>;
  if (!user) return <Login onAuth={(u) => setUser(u)} />;

  const tabs = TABS.filter((t) => !t.adminOnly || user.role === 'admin');

  const logout = async () => {
    await auth.logout();
    setUser(null);
    setTab('home');
    setActiveId(null);
  };

  // From Home: open a fresh chat with the text typed in (send = submit it right away).
  const ask = (text, send, handsFree = false) => {
    setActiveId(null);
    setPrompt({ id: Date.now(), text, send, handsFree });
    setTab('chat');
  };
  const openConversation = (id) => {
    setActiveId(id);
    setTab('chat');
    setMenuOpen(false);
  };
  const openContacts = (q = '') => {
    setContactQuery(q);
    setTab('contacts');
  };
  const toggleMenu = () => (isPhone() ? setMenuOpen((o) => !o) : setCollapsed((c) => !c));
  const openSearch = (q = '') => {
    setPaletteQuery(q);
    setPaletteOpen(true);
  };
  const newChat = () => {
    setActiveId(null);
    setTab('chat');
    setMenuOpen(false);
  };

  const renameConversation = async (c) => {
    const title = window.prompt('Rename conversation', c.title);
    if (title?.trim()) {
      await api.renameConversation(c._id, title.trim());
      refreshConversations();
      toast('Conversation renamed');
    }
  };

  const removeConversation = async (c) => {
    if (!window.confirm(`Delete "${c.title}"?`)) return;
    await api.deleteConversation(c._id);
    if (c._id === activeId) setActiveId(null);
    refreshConversations();
    toast('Conversation deleted');
  };

  return (
    <div className={`app ${collapsed ? 'collapsed' : ''}`}>
      <div className="app-bg" aria-hidden="true" />
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="orb small" />
          <span>J.A.R.V.I.S.</span>
        </div>
        <button className="btn primary full" onClick={newChat}>
          <Icon name="plus" /> New chat
        </button>
        <label className="side-search">
          <Icon name="search" size="1em" />
          <input value={convQuery} onChange={(e) => setConvQuery(e.target.value)} placeholder="Search chats" aria-label="Search chats" />
        </label>
        <div className="conv-list">
          {shownConversations.length === 0 && (
            <p className="muted conv-empty">{convQuery ? 'No chats match.' : 'Your conversations will appear here.'}</p>
          )}
          {shownConversations.map(([group, list]) => (
            <div key={group} className="conv-group">
              <div className="conv-group-title">{group}</div>
              {list.map((c) => (
                <div key={c._id} className={`conv ${c._id === activeId && tab === 'chat' ? 'active' : ''}`}>
                  <button className="conv-title" onClick={() => openConversation(c._id)} title={c.title}>
                    <Icon name="chat" size="1em" />
                    <span>{c.title}</span>
                  </button>
                  <button className="icon-btn" title="Rename" aria-label="Rename" onClick={() => renameConversation(c)}><Icon name="edit" size="0.9em" /></button>
                  <button className="icon-btn" title="Delete" aria-label="Delete" onClick={() => removeConversation(c)}><Icon name="trash" size="0.9em" /></button>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="user-box">
          <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <span className="grow user-name">
            {user.name}
            <small>{user.role === 'admin' ? 'Administrator' : 'Operator'}</small>
          </span>
          <button className="icon-btn" onClick={logout} title="Log out" aria-label="Log out"><Icon name="logout" /></button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-btn menu" onClick={toggleMenu} aria-label={collapsed ? 'Show sidebar' : 'Menu'} title="Menu"><Icon name="menu" /></button>
          <nav className="tabs">
            {tabs.map((t) => (
              <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)} title={`${t.label} (Alt+${t.key})`} aria-label={t.label}>
                <Icon name={t.icon} size="1.05em" />
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
          <button className="search-bar" onClick={() => openSearch('')} title="Search (Ctrl+K)" aria-label="Search chats, contacts, tasks and commands">
            <Icon name="search" size="1em" />
            <span className="grow">Search chats, contacts, tasks…</span>
            <kbd>Ctrl K</kbd>
          </button>
          <button
            className={`icon-btn room-watch ${roomWatchOn ? 'on' : ''}`}
            onClick={() => setRoomWatchOn((on) => !on)}
            aria-pressed={roomWatchOn}
            aria-label="Room Watch"
            title={
              roomWatchOn
                ? `Room Watch is on (${roomWatch.status}): Jarvis greets you when you walk in. Click to turn off.`
                : 'Room Watch: Jarvis notices when you walk into the room, greets you and starts listening'
            }
          >
            <Icon name="eye" />
          </button>
          <ThemeMenu theme={theme} />
          <NotificationBell />
        </header>
        <section className="content">
          <Suspense fallback={<div className="tab-loading"><div className="orb pulse" /></div>}>
            {tab === 'home' && (
              <HomePanel
                user={user}
                conversations={conversations}
                onOpenTab={(t) => { if (t === 'chat') setActiveId(null); setTab(t); }}
                onAsk={ask}
                onOpenConversation={openConversation}
                onStartSession={startSession}
              />
            )}
            {tab === 'chat' && (
              <Chat
                userId={user.id}
                conversationId={activeId}
                prompt={prompt}
                onPromptUsed={() => setPrompt(null)}
                onConversation={(id) => { setActiveId(id); refreshConversations(); }}
              />
            )}
            {tab === 'vision' && <VisionPanel />}
            {tab === 'knowledge' && <KnowledgePanel />}
            {tab === 'tasks' && <TasksPanel />}
            {tab === 'memory' && <MemoryPanel />}
            {tab === 'contacts' && <ContactsPanel initialQuery={contactQuery} onAsk={ask} />}
            {tab === 'account' && <AccountPanel user={user} onUserChange={setUser} onDeleted={logout} />}
            {tab === 'admin' && user.role === 'admin' && <AdminPanel currentUserId={user.id} />}
          </Suspense>
        </section>
      </main>

      <CommandPalette
        open={paletteOpen}
        initialQuery={paletteQuery}
        onClose={() => setPaletteOpen(false)}
        tabs={tabs}
        conversations={conversations}
        actions={{ openTab: setTab, ask, newChat, startSession, openConversation, openContacts, toggleTheme: () => theme.setChoice(theme.mode === 'dark' ? 'light' : 'dark') }}
      />
      {welcome && (
        <WelcomePrompt
          name={user.name}
          autoStart={autoStart}
          onAutoStartChange={setAutoStart}
          onStart={() => {
            closeWelcome();
            startSession();
          }}
          onClose={closeWelcome}
        />
      )}
      <Toaster />
    </div>
  );
}
