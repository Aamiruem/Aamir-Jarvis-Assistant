import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { api, auth, onSessionExpired } from './api.js';
import { sessionPlan } from './session.js';
import { useRoomWatch } from './useRoomWatch.js';
import SiteFooter from './components/SiteFooter.jsx';
import NotificationBell from './components/NotificationBell.jsx';
import SystemStatusPill from './components/SystemStatusPill.jsx';
import UserMenu from './components/UserMenu.jsx';
import './components/AppShell.css';
import ThemeMenu from './components/ThemeMenu.jsx';
import { Icon } from './icons.jsx';
import { useTheme } from './theme.js';
import { Brand, toast, Toaster } from './ui.jsx';
import { ACTION_EVENT, reachWhenReady } from './artActions.js';
import { share, useInstall } from './pwa.js';

// Aamir Hussain Azad's portfolio: linked from the top bar and the command palette.
import { PORTFOLIO_URL } from './siteLinks.js';

// Code splitting: Home and sign-in load first; every other tab is its own small file,
// downloaded the first time it's opened (Chat is fetched early while the browser is idle).
const loadChat = () => import('./components/Chat.jsx');
const Chat = lazy(loadChat);
// The website and the signed-in app are separate downloads: a visitor never loads the app's
// screens, a signed-in user never loads the landing page. While the session check runs, the
// screen this browser most likely needs is already downloading (hint saved at sign-in).
const loadPublic = () => import('./components/PublicSite.jsx');
const loadHome = () => import('./components/HomePanel.jsx');
const PublicSite = lazy(loadPublic);
const HomePanel = lazy(loadHome);
const CommandPalette = lazy(() => import('./components/CommandPalette.jsx'));
const WelcomePrompt = lazy(() => import('./components/WelcomePrompt.jsx'));
const InstallDialog = lazy(() => import('./components/InstallDialog.jsx'));
const SIGNED_IN_HINT = 'azarvis-signed-in';
const readHint = () => {
  try {
    return localStorage.getItem(SIGNED_IN_HINT) === '1';
  } catch {
    return false;
  }
};
const writeHint = (on) => {
  try {
    if (on) localStorage.setItem(SIGNED_IN_HINT, '1');
    else localStorage.removeItem(SIGNED_IN_HINT);
  } catch {}
};
if (typeof window !== 'undefined') (readHint() ? loadHome : loadPublic)().catch(() => {});
const Spinner = () => <div className="center-screen"><div className="orb pulse" /></div>;
const voiceSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
const VisionPanel = lazy(() => import('./components/VisionPanel.jsx'));
const KnowledgePanel = lazy(() => import('./components/KnowledgePanel.jsx')); // kept for easy restore; the 'knowledge' tab now shows the Voice Agent
const VoiceAgent = lazy(() => import('./components/VoiceAgent.jsx'));
const TasksPanel = lazy(() => import('./components/TasksPanel.jsx'));
const MemoryPanel = lazy(() => import('./components/MemoryPanel.jsx'));
const ContactsPanel = lazy(() => import('./components/ContactsPanel.jsx'));
const AccountPanel = lazy(() => import('./components/AccountPanel.jsx'));
const AdminPanel = lazy(() => import('./components/AdminPanel.jsx'));
const AutomatePanel = lazy(() => import('./components/AutomatePanel.jsx'));
const MlLabPanel = lazy(() => import('./components/MlLabPanel.jsx'));
const NotesPanel = lazy(() => import('./components/NotesPanel.jsx'));
const DevicePanel = lazy(() => import('./components/DevicePanel.jsx'));
const StudioPanel = lazy(() => import('./components/StudioPanel.jsx'));
const GamesPanel = lazy(() => import('./components/GamesPanel.jsx'));
const CommandCenter = lazy(() => import('./components/CommandCenter.jsx'));
const SecurityCenter = lazy(() => import('./components/SecurityCenter.jsx'));
const OpsCenter = lazy(() => import('./components/OpsCenter.jsx'));
const CameraLab = lazy(() => import('./components/CameraLab.jsx'));
const RobotLab = lazy(() => import('./robotLab/RobotLab.jsx'));
const AgentsPanel = lazy(() => import('./components/AgentsPanel.jsx'));

// Each tab has its own color (--hue), used for its icon in the top bar and the sidebar.
const TABS = [
  { id: 'home', label: 'Home', icon: 'home', hue: 205 },
  { id: 'chat', label: 'Chat', icon: 'chat', hue: 190 },
  { id: 'automate', label: 'Automate', icon: 'rocket', hue: 300 },
  { id: 'studio', label: 'Agent Studio', icon: 'workflow', hue: 85, isNew: true },
  { id: 'mllab', label: 'ML Lab', icon: 'flask', hue: 160 },
  { id: 'notes', label: 'Notes', icon: 'notes', hue: 45, isNew: true },
  { id: 'tasks', label: 'Tasks', icon: 'tasks', hue: 38 },
  { id: 'memory', label: 'Memory', icon: 'brain', hue: 330 },
  { id: 'knowledge', label: 'Voice Agent', icon: 'phone', hue: 205 },
  { id: 'vision', label: 'Vision', icon: 'eye', hue: 160 },
  { id: 'device', label: 'Device', icon: 'cpu', hue: 205, isNew: true },
  { id: 'security', label: 'Security Center', icon: 'key', hue: 150, isNew: true },
  { id: 'camera', label: 'Camera Lab', icon: 'camera', hue: 190, isNew: true },
  { id: 'robot', label: 'Robot Lab', icon: 'cpu', hue: 200, isNew: true },
  { id: 'agents', label: 'Agents', icon: 'target', hue: 190, isNew: true },
  { id: 'files', label: 'Files', icon: 'folder', hue: 40 },
  { id: 'games', label: 'Brain Gym', icon: 'sparkles', hue: 300, isNew: true },
  { id: 'contacts', label: 'Contacts', icon: 'contacts', hue: 280 },
  { id: 'account', label: 'Account', icon: 'user', hue: 220 },
  { id: 'admin', label: 'Admin', icon: 'shield', hue: 0, adminOnly: true },
].map((t, i) => ({ ...t, key: i + 1 })); // Alt+1 … Alt+9
// The Command Center sits right after Home on Alt+0, so the older Alt+1…9 shortcuts don't move.
TABS.splice(1, 0, { id: 'command', label: 'Command Center', icon: 'target', hue: 190, isNew: true, key: 0 });
// Cyber Ops (scans of this PC and its own network) sits next to it; no Alt shortcut, so none move.
TABS.splice(2, 0, { id: 'ops', label: 'Cyber Ops', icon: 'radar', hue: 172, isNew: true });
// The sidebar, in groups by what you do there (Account is in the menu at its bottom).
const NAV_GROUPS = [
  ['Overview', ['home', 'command', 'ops', 'chat']],
  ['Work', ['tasks', 'notes', 'memory', 'files', 'contacts']],
  ['Create & automate', ['agents', 'automate', 'studio', 'mllab']],
  ['AI tools', ['robot', 'vision', 'camera', 'knowledge', 'games']],
  ['System', ['device', 'security', 'account', 'admin']],
];
// One distinct colour per sidebar icon (hue, 0-360), so each screen is easy to spot.
const NAV_HUES = {
  home: 212, command: 190, chat: 172, tasks: 36, notes: 48, memory: 330, contacts: 282, automate: 300,
  studio: 88, mllab: 150, vision: 262, camera: 196, knowledge: 18, games: 318, device: 222, security: 142, admin: 0,
  agents: 186, files: 40, account: 228, robot: 205, ops: 168,
};
// Only the newest screens carry a "New" tag, so it still means something.
const NEWEST = new Set(['ops', 'agents', 'robot']);
// The sidebar's name for a screen when it differs from the tab's own label.
const NAV_LABELS = { account: 'Settings' };
// The sidebar is the one place to switch screens (Account is the avatar at its bottom).
const SIDEBAR_TABS = TABS.map((t) => t.id).filter((id) => id !== 'account');
const SIDEBAR_QUICK_ACTIONS = {
  home: [
    { icon: 'sun', label: 'Plan my day', hint: 'Tasks and reminders', prompt: 'Plan my day from my open tasks and reminders. Tell me what to do first, what needs follow-up, and what can wait.', send: true },
    { icon: 'plus', label: 'Create a task', hint: 'Add or schedule work', tab: 'tasks' },
    { icon: 'mic', label: 'Talk hands-free', hint: 'Start a voice session', voice: true },
  ],
  chat: [
    { icon: 'plus', label: 'New conversation', hint: 'Start fresh', fresh: true },
    { icon: 'search', label: 'Research a topic', hint: 'Search current sources', prompt: 'Research ', send: false },
    { icon: 'copy', label: 'Summarize clipboard', hint: 'Use copied text', prompt: 'Summarize what I copied in five clear points.', send: true },
  ],
  automate: [
    { icon: 'mail', label: 'Draft an email', hint: 'Review before sending', prompt: 'Write an email to ', send: false },
    { icon: 'calendar', label: 'Weekly review', hint: 'Wins and next steps', prompt: "Review my week: what I finished, what's still open, and the three things I should focus on next week.", send: true },
    { icon: 'alarm', label: 'Follow up', hint: 'Set a reminder', prompt: 'Remind me to follow up with ', send: false },
  ],
  studio: [
    { icon: 'workflow', label: 'Design an agent', hint: 'Define a useful workflow', prompt: 'Help me design an AI agent for ', send: false },
    { icon: 'zap', label: 'Plan an automation', hint: 'Turn a routine into steps', prompt: 'Design a safe automation for this routine: ', send: false },
    { icon: 'rocket', label: 'Explore automation', hint: 'Open one-click workflows', tab: 'automate' },
  ],
  mllab: [
    { icon: 'flask', label: 'Choose a model', hint: 'Match model to a problem', prompt: 'Help me choose a machine-learning model for ', send: false },
    { icon: 'chart', label: 'Explain my metrics', hint: 'Accuracy, F1, MAE and more', prompt: 'Explain these model metrics in plain language: ', send: false },
    { icon: 'file', label: 'Prepare a dataset', hint: 'Columns and target variable', prompt: 'Help me prepare a CSV dataset for machine learning. My goal is ', send: false },
  ],
  notes: [
    { icon: 'brain', label: 'Make a study quiz', hint: 'Practice a topic', prompt: 'Create a challenging quiz with answers about ', send: false },
    { icon: 'sparkles', label: 'Explain a concept', hint: 'Simple words and examples', prompt: 'Explain this concept in simple words with a practical example: ', send: false },
    { icon: 'book', label: 'Find my study notes', hint: 'Search uploaded material', prompt: 'Search my notes for ', send: false },
  ],
  tasks: [
    { icon: 'tasks', label: 'Review open tasks', hint: 'Priorities and due dates', prompt: 'List my open tasks and help me prioritize them by due date and importance.', send: true },
    { icon: 'plus', label: 'Add a task', hint: 'Describe the work to add', prompt: 'Add a task: ', send: false },
    { icon: 'alarm', label: 'Set a reminder', hint: 'Choose what and when', prompt: 'Remind me to ', send: false },
  ],
  memory: [
    { icon: 'brain', label: 'Recall my preferences', hint: 'See what Azarvis remembers', prompt: 'What do you remember about my preferences and goals?', send: true },
    { icon: 'sparkles', label: 'Remember a fact', hint: 'Save a useful detail', prompt: 'Remember that ', send: false },
    { icon: 'trash', label: 'Forget a fact', hint: 'Remove something outdated', prompt: 'Forget the memory about ', send: false },
  ],
  knowledge: [
    { icon: 'phone', label: 'How the Voice Agent helps', hint: 'Calls, qualifies, books', prompt: 'How would an AI voice agent help my study-abroad consultancy get more enrollments?', send: true },
    { icon: 'filter', label: 'Qualify a lead', hint: 'Country, budget, intake', prompt: 'Act as my study-abroad voice agent and qualify a lead who wants to study in Canada on a 25 lakh budget for Fall.', send: true },
    { icon: 'globe', label: 'Answer a visa question', hint: 'Any country, 24/7', prompt: 'As a study-abroad counsellor, what visa and documents do I need for the UK?', send: true },
  ],
  vision: [
    { icon: 'monitor', label: 'Explain my screen', hint: 'Find errors or key details', prompt: 'Look at my screen and explain what is happening. Point out any visible error and suggest a fix.', send: true },
    { icon: 'alert', label: 'Find a screen issue', hint: 'Suggest safe next steps', prompt: 'Inspect my screen for an issue. Explain the likely cause and safe steps to fix it.', send: true },
    { icon: 'eye', label: 'Review screen details', hint: 'Read visible text and context', prompt: 'Look at my screen and summarize the important details: ', send: false },
  ],
  device: [
    { icon: 'pulse', label: 'Check PC health', hint: 'CPU, memory, disk, battery', prompt: 'Check this PC’s CPU, memory, disk space and battery. Summarize anything that may need attention.', send: true },
    { icon: 'zap', label: 'Diagnose a slowdown', hint: 'Find likely causes', prompt: 'My computer feels slow. Check the available system status and give me safe steps to diagnose it.', send: true },
    { icon: 'monitor', label: 'Open an app', hint: 'Launch a desktop app', prompt: 'Open ', send: false },
  ],
  contacts: [
    { icon: 'search', label: 'Find a contact', hint: 'Search by name or company', prompt: 'Find contact ', send: false },
    { icon: 'plus', label: 'Add a contact', hint: 'Save a person’s details', prompt: 'Add a contact: ', send: false },
    { icon: 'mail', label: 'Draft a message', hint: 'Use a saved contact', prompt: 'Write an email to ', send: false },
  ],
  admin: [
    { icon: 'chart', label: 'Explain usage metrics', hint: 'Latency, tokens, and intent', prompt: 'Explain how to interpret Azarvis usage metrics such as latency, tokens, and intent counts.', send: true },
    { icon: 'shield', label: 'Role management guide', hint: 'Review access safely', prompt: 'Explain the safe process for reviewing user roles in the Azarvis admin screen.', send: true },
    { icon: 'help', label: 'Troubleshoot the service', hint: 'Describe an admin issue', prompt: 'Help me troubleshoot this Azarvis admin issue: ', send: false },
  ],
};
// Phones: the main tabs sit in a bar at the bottom around a big voice button; everything else is
// under "More" (the sidebar, which slides in).
const BOTTOM_TABS = ['home', 'chat', 'tasks'];
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
  useEffect(() => {
    if (!checking) writeHint(Boolean(user)); // next visit: download this screen while signing in
  }, [user, checking]);
  const [tab, setTab] = useState(startTab);
  const [prompt, setPrompt] = useState(null); // { id, text, send, handsFree } handed from Home to Chat
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteUsed, setPaletteUsed] = useState(false); // the palette's code loads the first time it opens
  useEffect(() => {
    if (paletteOpen) setPaletteUsed(true);
  }, [paletteOpen]);
  const [navQuery, setNavQuery] = useState(''); // the navbar search box: Enter sends it to Chat
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
   * Starts a spoken session: the first time Azarvis asks a few questions to get to know you,
   * after that it greets you, reads today's reminders and asks how it can help.
   * arrival: started by Room Watch (always-listening "Hey Azarvis" mode). interview: ask again.
   */
  const startSession = useCallback(
    async ({ arrival = false, interview = false } = {}) => {
      const plan = await sessionPlan(user, { arrival, interview });
      setActiveId(null);
      setPrompt({ id: Date.now(), handsFree: true, wake: arrival, ...plan });
      setTab('chat');
      setMenuOpen(false);
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
  // Browsers only let a page talk after a click, so starting Azarvis is one tap on this prompt.
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
    idle(() => loadChat()); // so the first "Talk to Azarvis" opens instantly
  }, [user, refreshConversations]);

  // Keyboard: Ctrl/⌘+K command palette, Alt+1…9 switch tabs.
  useEffect(() => {
    if (!user) return;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteQuery('');
        setPaletteOpen((o) => !o);
      } else if (e.altKey && /^[0-9]$/.test(e.key)) {
        const t = TABS.find((x) => x.key === Number(e.key));
        if (t && (!t.adminOnly || user.role === 'admin')) {
          e.preventDefault();
          setTab(t.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user]);

  // Spots on page pictures (artActions.js) ask the app to open a screen, ask, talk or search.
  const pictureAction = useRef(null);
  useEffect(() => {
    const onAction = (e) => pictureAction.current?.(e.detail || {});
    window.addEventListener(ACTION_EVENT, onAction);
    return () => window.removeEventListener(ACTION_EVENT, onAction);
  }, []);

  if (checking) return <Spinner />;
  // Signed out: the public website (landing page, sign in / sign up, and the demo without an account).
  if (!user) return <Suspense fallback={<Spinner />}><PublicSite theme={theme} onAuth={(u) => setUser(u)} /></Suspense>;

  const tabs = TABS.filter((t) => !t.adminOnly || user.role === 'admin');
  const currentTab = TABS.find((t) => t.id === tab);
  const sidebarActions = SIDEBAR_QUICK_ACTIONS[tab] ?? SIDEBAR_QUICK_ACTIONS.home;

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
  const quickAsk = (text, send) => {
    setMenuOpen(false);
    ask(text, send);
  };
  const runSidebarAction = (action) => {
    if (action.voice) return startSession();
    if (action.fresh) return newChat();
    if (action.tab) return go(action.tab);
    return quickAsk(action.prompt, Boolean(action.send));
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
    else if (outcome === 'installed') toast('Azarvis is installed');
  };
  const shareJarvis = async () => {
    setMenuOpen(false);
    const result = await share({ title: 'Azarvis', text: 'Azarvis, my AI assistant:', url: window.location.origin }).catch(() => 'failed');
    if (result === 'copied') toast('Link copied');
  };
  const userMenuItems = [
    { icon: 'user', label: 'Account & security', onClick: () => go('account') },
    { icon: 'briefcase', label: 'Aamir’s portfolio', onClick: () => window.open(PORTFOLIO_URL, '_blank', 'noopener,noreferrer') },
    'divider',
    ...(installer.installed ? [] : [{ icon: 'download', label: 'Install app', onClick: installApp }]),
    { icon: 'share', label: 'Share Azarvis', onClick: shareJarvis },
    { icon: 'phone', label: 'Azarvis on your phone', onClick: () => go('automate') },
    ...(isPhone() ? [{ icon: 'eye', label: roomWatchOn ? 'Turn off Room Watch' : 'Turn on Room Watch', onClick: () => setRoomWatchOn((on) => !on) }] : []),
    { icon: 'help', label: 'Help & commands', hint: 'Ctrl K', onClick: () => { setPaletteQuery(''); setPaletteOpen(true); } },
    'divider',
    { icon: 'logout', label: 'Sign out', onClick: logout, danger: true },
  ];
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
  pictureAction.current = (d) => {
    if (d.voice) return startSession();
    if (d.search !== undefined) return openSearch(d.search);
    if (d.ask !== undefined) return ask(d.ask, Boolean(d.send));
    if (d.tab && tabs.some((t) => t.id === d.tab)) {
      go(d.tab);
      if (d.anchor) reachWhenReady(d.anchor);
    }
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
      <aside className={`sidebar sb ${menuOpen ? 'open' : ''}`}>
        <div className="sb-head">
          <button type="button" className="sb-brand" onClick={() => go('home')} aria-label="Azarvis home">
            <Brand size={32} tag />
          </button>
          <button className="sb-icon" onClick={toggleMenu} title={menuOpen ? 'Close menu' : 'Collapse sidebar'} aria-label={menuOpen ? 'Close menu' : 'Collapse sidebar'}>
            <Icon name="panelClose" size="1.15em" className="sb-when-desk" />
            <Icon name="x" size="1.25em" className="sb-when-phone" />
          </button>
        </div>
        <div className="sb-start">
          <button className="sb-new" onClick={newChat}>
            <Icon name="plus" size="1.05em" /> New chat
          </button>
          <button
            className={`sb-mic ${voiceSupported ? '' : 'off'}`}
            onClick={() => startSession()}
            disabled={!voiceSupported}
            title={voiceSupported ? 'Talk to Azarvis: start a hands-free voice session' : 'Voice needs Chrome or Edge'}
            aria-label="Talk to Azarvis (hands-free voice)"
          >
            <Icon name="mic" size="1.15em" />
          </button>
        </div>
        <nav className="sb-nav" aria-label="Main">
          {NAV_GROUPS.map(([group, ids]) => {
            const items = ids.map((id) => tabs.find((t) => t.id === id)).filter(Boolean);
            if (!items.length) return null;
            return (
              <div className="sb-group" key={group}>
                <h2 className="sb-group-title">{group}</h2>
                {items.map((t) => (
                  <button key={t.id} className={`sb-link ${tab === t.id ? 'active' : ''}`} onClick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
                    <span className="sb-ico" style={{ '--h': NAV_HUES[t.id] ?? t.hue }} aria-hidden="true"><Icon name={t.icon} size="1.15em" /></span>
                    <span className="grow">{NAV_LABELS[t.id] ?? t.label}</span>
                    {NEWEST.has(t.id) && <span className="sb-new-tag">New</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
        <section className={`sb-quick ${quickActionsOpen ? 'open' : ''}`}>
          <button className="sb-quick-toggle" onClick={() => setQuickActionsOpen((open) => !open)} aria-expanded={quickActionsOpen} aria-controls="side-quick-grid" title={`Quick actions for ${currentTab?.label ?? 'this page'}`}>
            <Icon name="zap" size="1em" />
            <span className="grow">Quick actions</span>
            <Icon name="chevron" size="0.95em" className="sb-quick-chev" />
          </button>
          {quickActionsOpen && (
            <div className="sb-quick-list" id="side-quick-grid" role="group" aria-label={`${currentTab?.label ?? 'Azarvis'} quick actions`}>
              {sidebarActions.map((action) => (
                <button key={action.label} onClick={() => runSidebarAction(action)}>
                  <Icon name={action.icon} size="1em" /><span><strong>{action.label}</strong><small>{action.hint}</small></span>
                </button>
              ))}
            </div>
          )}
        </section>
        <div className="sb-foot">
          <UserMenu user={user} items={userMenuItems} />
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className={`icon-btn menu ${collapsed ? 'menu--expand' : ''}`} onClick={toggleMenu} aria-label={collapsed ? 'Show sidebar' : 'Menu'} title={collapsed ? 'Show sidebar' : 'Menu'}><Icon name="menu" className="menu-burger" /><Icon name="panelOpen" className="menu-expand" /></button>
          <button type="button" className="topbar-brand" onClick={() => go('home')} aria-label="Azarvis home"><Brand size={30} /></button>
          {/* Where you are (the sidebar is where you switch); not a second menu. */}
          {(() => {
            const current = TABS.find((t) => t.id === tab);
            return current ? (
              <div className="topbar-where">
                <nav className="topbar-crumbs" aria-label="Breadcrumb">
                  <button type="button" onClick={() => go('home')}>Azarvis</button>
                  <Icon name="chevron" size="0.85em" />
                  <span aria-current="page">{current.label}</span>
                </nav>
                <h1 className="topbar-title" style={{ '--hue': current.hue }}>
                  <span className="side-ico"><Icon name={current.icon} size="1.1em" /></span>
                  {current.label}
                </h1>
              </div>
            ) : null;
          })()}
          <form
            className="search-bar"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const text = navQuery.trim();
              if (!text) return;
              setNavQuery('');
              ask(text, true);
            }}
          >
            <Icon name="search" size="1em" />
            <input
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              placeholder="Search everything…"
              aria-label="Search everything, then press Enter to ask Azarvis"
              enterKeyHint="search"
            />
          </form>
          <button type="button" className="icon-btn topbar-search-btn" onClick={() => openSearch('')} aria-label="Search everything" title="Search everything"><Icon name="search" /></button>
          <SystemStatusPill onOpen={() => go('command')} />
          <div className="topbar-tools" role="toolbar" aria-label="Quick actions">
          <button
            className={`icon-btn room-watch ${roomWatchOn ? 'on' : ''}`}
            onClick={() => setRoomWatchOn((on) => !on)}
            aria-pressed={roomWatchOn}
            aria-label="Room Watch"
            title={
              roomWatchOn
                ? `Room Watch is on (${roomWatch.status}): Azarvis greets you when you walk in. Click to turn off.`
                : 'Room Watch: Azarvis notices when you walk into the room, greets you and starts listening'
            }
          >
            <Icon name="eye" />
          </button>
          <ThemeMenu theme={theme} />
          <NotificationBell />
          </div>
          {/* Account, portfolio and sign-out live in one menu (also at the bottom of the sidebar). */}
          <div className="topbar-right">
            <UserMenu user={user} items={userMenuItems} compact placement="down" />
          </div>
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
            {tab === 'command' && (
              <CommandCenter
                onOpenTab={(t) => { if (t === 'chat') setActiveId(null); setTab(t); }}
                onAsk={ask}
                onStartSession={() => startSession()}
                onOpenPalette={() => { setPaletteQuery(''); setPaletteOpen(true); }}
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
            {tab === 'mllab' && <MlLabPanel onAsk={(text) => ask(text, true)} />}
            {tab === 'notes' && <NotesPanel target={notesTarget} />}
            {tab === 'vision' && <VisionPanel />}
            {tab === 'device' && <DevicePanel />}
            {tab === 'security' && <SecurityCenter user={user} onOpenTab={setTab} />}
            {tab === 'ops' && <OpsCenter onAsk={(text) => ask(text, true)} />}
            {tab === 'camera' && <CameraLab />}
            {tab === 'robot' && <RobotLab signedIn />}
            {tab === 'agents' && <AgentsPanel />}
            {tab === 'files' && <KnowledgePanel />}
            {tab === 'studio' && <StudioPanel onAsk={(text) => ask(text, true)} />}
            {tab === 'games' && <GamesPanel onAsk={(text) => ask(text, true)} />}
            {tab === 'knowledge' && <VoiceAgent embedded onAsk={(text) => ask(text, true)} />}
            {tab === 'tasks' && <TasksPanel />}
            {tab === 'memory' && <MemoryPanel />}
            {tab === 'contacts' && <ContactsPanel initialQuery={contactQuery} onAsk={ask} />}
            {tab === 'account' && <AccountPanel user={user} onUserChange={setUser} onDeleted={logout} />}
            {tab === 'admin' && user.role === 'admin' && <AdminPanel currentUserId={user.id} />}
          </Suspense>
          {tab !== 'chat' && <SiteFooter compact={tab !== 'home'} onOpenTab={setTab} />}
        </section>
      </main>

      {paletteUsed && (
      <Suspense fallback={null}>
      <CommandPalette
        open={paletteOpen}
        initialQuery={paletteQuery}
        onClose={() => setPaletteOpen(false)}
        tabs={tabs}
        conversations={conversations}
        actions={{ openTab: setTab, ask, newChat, startSession, install: installApp, share: shareJarvis, openPortfolio: () => window.open(PORTFOLIO_URL, '_blank', 'noopener,noreferrer'), openNotes: (chapter, heading) => { setNotesTarget({ chapter, heading, at: Date.now() }); setTab('notes'); }, openConversation, openContacts, toggleTheme: () => theme.setChoice(theme.mode === 'dark' ? 'light' : 'dark') }}
      />
      </Suspense>
      )}
      <nav className="bottom-nav" aria-label="Main (phone)">
        {BOTTOM_TABS.map((id, i) => {
          const t = tabs.find((x) => x.id === id);
          if (!t) return null;
          const button = (
            <button key={t.id} className={tab === t.id ? 'active' : ''} style={{ '--hue': NAV_HUES[t.id] ?? t.hue }} onClick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
              <Icon name={t.icon} size="1.4em" />
              <span>{t.id === 'tasks' ? 'Tasks' : t.label}</span>
            </button>
          );
          return i === 2 ? [
            <button key="voice" className="bottom-voice" onClick={() => startSession()} disabled={!voiceSupported}
              aria-label={voiceSupported ? 'Talk to Azarvis' : 'Voice needs Chrome or Edge'} title={voiceSupported ? 'Talk to Azarvis' : 'Voice needs Chrome or Edge'}>
              <span className="bottom-voice-orb"><Icon name="mic" size="1.5em" /></span>
              <span>Talk</span>
            </button>,
            button,
          ] : button;
        })}
        <button className={menuOpen || !BOTTOM_TABS.includes(tab) ? 'active' : ''} style={{ '--hue': 220 }} onClick={() => setMenuOpen(true)} aria-label="More: every screen, settings and your account">
          <Icon name="menu" size="1.4em" />
          <span>More</span>
        </button>
      </nav>
      {installHelp && <Suspense fallback={null}><InstallDialog onClose={() => setInstallHelp(false)} /></Suspense>}
      {welcome && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}
      <Toaster />
    </div>
  );
}
