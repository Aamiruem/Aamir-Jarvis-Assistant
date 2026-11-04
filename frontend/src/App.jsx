import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
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
import InstallDialog from './components/InstallDialog.jsx';
import { share, useInstall } from './pwa.js';

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
const AutomatePanel = lazy(() => import('./components/AutomatePanel.jsx'));
const MlLabPanel = lazy(() => import('./components/MlLabPanel.jsx'));
const NotesPanel = lazy(() => import('./components/NotesPanel.jsx'));

// Each tab has its own color (--hue), used for its icon in the top bar and the sidebar.
const TABS = [
  { id: 'home', label: 'Home', icon: 'home', hue: 205 },
  { id: 'chat', label: 'Chat', icon: 'chat', hue: 190 },
  { id: 'automate', label: 'Automate', icon: 'rocket', hue: 300 },
  { id: 'mllab', label: 'ML Lab', icon: 'flask', hue: 160 },
  { id: 'notes', label: 'Notes', icon: 'notes', hue: 45, isNew: true },
  { id: 'tasks', label: 'Tasks', icon: 'tasks', hue: 38 },
  { id: 'memory', label: 'Memory', icon: 'brain', hue: 330 },
  { id: 'knowledge', label: 'Knowledge', icon: 'book', hue: 265 },
  { id: 'vision', label: 'Vision', icon: 'eye', hue: 160 },
  { id: 'contacts', label: 'Contacts', icon: 'contacts', hue: 280 },
  { id: 'account', label: 'Account', icon: 'user', hue: 220 },
  { id: 'admin', label: 'Admin', icon: 'shield', hue: 0, adminOnly: true },
].map((t, i) => ({ ...t, key: i + 1 })); // Alt+1 … Alt+9
const SIDEBAR_TABS = ['home', 'chat', 'automate', 'mllab', 'notes', 'tasks', 'memory', 'knowledge'];
// Phones: the main tabs sit in a bar at the bottom, everything else is under "More" (the sidebar).
const BOTTOM_TABS = ['home', 'chat', 'notes', 'mllab'];
// A link like /?tab=mllab (the installed app's shortcuts) opens that tab.
const startTab = () => {
  const wanted = new URLSearchParams(window.location.search).get('tab');
  return TABS.some((t) => t.id === wanted && !t.adminOnly) ? wanted : 'home';
};

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

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState(startTab);
  const [prompt, setPrompt] = useState(null); // { id, text, send, handsFree } handed from Home to Chat
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [installHelp, setInstallHelp] = useState(false);
  const [notesTarget, setNotesTarget] = useState(null); // { chapter, heading } from search
  const [contactQuery, setContactQuery] = useState('');
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [roomWatchOn, setRoomWatchOn] = useState(readRoomWatch);
  const [autoStart, setAutoStart] = useState(readAutoStart);
  const [welcome, setWelcome] = useState(false);
  const theme = useTheme();
  const installer = useInstall();

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
  // The browser's own install prompt when it offers one, otherwise the steps to tap.
  const installApp = async () => {
    setMenuOpen(false);
    const outcome = await installer.install();
    if (outcome === 'manual') setInstallHelp(true);
    else if (outcome === 'installed') toast('Jarvis is installed');
  };
  const shareJarvis = async () => {
    setMenuOpen(false);
    const result = await share({ title: 'Jarvis', text: 'Jarvis, my AI assistant:', url: window.location.origin }).catch(() => 'failed');
    if (result === 'copied') toast('Link copied');
  };
  const go = (id) => {
    setTab(id);
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
        <div className="side-head">
          <div className="brand">
            <div className="orb small" />
            <span>Jarvis</span>
          </div>
          <button className="icon-btn side-collapse" onClick={toggleMenu} title="Hide the sidebar" aria-label="Hide the sidebar">
            <Icon name="collapse" size="1.15em" />
          </button>
        </div>
        <button className="side-new" onClick={newChat}>
          <Icon name="plus" size="1.15em" /> New chat
        </button>
        <nav className="side-nav" aria-label="Main">
          {tabs
            .filter((t) => SIDEBAR_TABS.includes(t.id))
            .map((t) => (
              <button key={t.id} className={`side-link ${tab === t.id ? 'active' : ''}`} style={{ '--hue': t.hue }} onClick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
                <Icon name={t.icon} size="1.45em" />
                <span className="grow">{t.label}</span>
                {t.isNew && <span className="new-pill">New</span>}
              </button>
            ))}
        </nav>
        <div className="promo">
          <strong>Unlock Jarvis everywhere</strong>
          <p>Ask from your phone, automate emails and posts, plan your day, all from one place.</p>
          <button className="promo-btn" onClick={() => go('automate')}>
            <Icon name="rocket" size="1.1em" /> Explore Automate
          </button>
        </div>
        <div className="side-links">
          {!installer.installed && (
            <button onClick={installApp}>
              <Icon name="download" size="1.25em" /> Install app
            </button>
          )}
          <button onClick={shareJarvis}>
            <Icon name="share" size="1.25em" /> Share Jarvis
          </button>
          <button onClick={() => go('automate')}>
            <Icon name="phone" size="1.25em" /> Jarvis on your phone
          </button>
        </div>
        <div className="side-foot">
          <button className="side-avatar" onClick={() => go('account')} title={`${user.name}: account and security`} aria-label="Account">
            {user.name.slice(0, 1).toUpperCase()}
          </button>
          <button className="icon-btn" onClick={() => go('contacts')} title="Contacts" aria-label="Contacts"><Icon name="mail" size="1.25em" /></button>
          <button className="icon-btn" onClick={() => { setPaletteQuery(''); setPaletteOpen(true); }} title="Help and commands (Ctrl+K)" aria-label="Help"><Icon name="help" size="1.25em" /></button>
          <button className="icon-btn" onClick={logout} title="Log out" aria-label="Log out"><Icon name="logout" size="1.25em" /></button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-btn menu" onClick={toggleMenu} aria-label={collapsed ? 'Show sidebar' : 'Menu'} title="Menu"><Icon name="menu" /></button>
          <span className="topbar-brand" aria-hidden="true"><span className="orb small" />Jarvis</span>
          <nav className="tabs">
            {tabs.map((t) => (
              <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} style={{ '--hue': t.hue }} onClick={() => setTab(t.id)} title={`${t.label} (Alt+${t.key})`} aria-label={t.label}>
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
                history={{
                  conversations,
                  activeId,
                  onOpen: openConversation,
                  onRename: renameConversation,
                  onDelete: removeConversation,
                  onNew: newChat,
                }}
                conversationId={activeId}
                prompt={prompt}
                onPromptUsed={() => setPrompt(null)}
                onConversation={(id) => { setActiveId(id); refreshConversations(); }}
              />
            )}
            {tab === 'automate' && <AutomatePanel onAsk={ask} onOpenTab={setTab} />}
            {tab === 'mllab' && <MlLabPanel />}
            {tab === 'notes' && <NotesPanel target={notesTarget} />}
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
        actions={{ openTab: setTab, ask, newChat, startSession, openNotes: (chapter, heading) => { setNotesTarget({ chapter, heading, at: Date.now() }); setTab('notes'); }, openConversation, openContacts, toggleTheme: () => theme.setChoice(theme.mode === 'dark' ? 'light' : 'dark') }}
      />
      <nav className="bottom-nav" aria-label="Main (phone)">
        {tabs.filter((t) => BOTTOM_TABS.includes(t.id)).map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} style={{ '--hue': t.hue }} onClick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
            <Icon name={t.icon} size="1.4em" />
            <span>{t.label}</span>
          </button>
        ))}
        <button className={menuOpen || !BOTTOM_TABS.includes(tab) ? 'active' : ''} onClick={() => setMenuOpen(true)} aria-label="More: tasks, memory, settings">
          <Icon name="menu" size="1.4em" />
          <span>More</span>
        </button>
      </nav>
      {installHelp && <InstallDialog onClose={() => setInstallHelp(false)} />}
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
