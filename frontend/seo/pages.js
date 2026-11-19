// The public content pages of the Azarvis website (azarvis-app), rendered to static HTML at build
// time by the seo plugin in vite.config.js: /features, /voice-assistant, /ai-agents ... /privacy.
// Static HTML means search engines and link previews get the full text at once, with no JavaScript.
//
// Write only what Azarvis really does today. Each page: path, title (≤ 60 chars), description
// (≤ 160), h1, intro, sections [{ h2, p?, list? }], and optional schema type (AboutPage, ...).
export const UPDATED = '2026-11-19';

export const PAGES = [
  {
    path: '/features',
    nav: 'Features',
    title: 'Azarvis Features – AI Personal Assistant by Aamir Hussain Azad',
    description: 'What Azarvis can do: hands-free voice, tasks and reminders, memory, chat with your documents, PC control, email drafts, ML Lab and a live Command Center.',
    h1: 'Everything Azarvis can do',
    intro: 'Azarvis is a personal AI assistant that you talk to like a person. It answers with Claude, keeps your tasks and reminders, remembers what matters to you, reads your documents and, when it runs on your own computer, controls that computer for you.',
    sections: [
      { h2: 'Talk to it, hands-free', p: 'Say “Hey Azarvis” and ask. It answers aloud, sentence by sentence, and stops the moment you start talking. It understands and replies in 39 languages, including Hindi, Urdu and Hinglish. <a href="/voice-assistant">More about the voice assistant</a>.' },
      { h2: 'Tasks, reminders and your day', list: ['“Remind me to call mom at 6”: a task with a timed reminder that pops up and is read aloud', 'Several requests in one sentence, each confirmed in order', '“Plan my day” from your open tasks and reminders'] },
      { h2: 'Memory you control', p: 'Tell it a lasting fact (“I prefer metric units”) and it remembers. You can see, add and delete every memory on the Memory screen. Passwords, PINs, card numbers and API keys are refused and never stored as memories.' },
      { h2: 'Chat with your documents', p: 'Upload PDFs, notes or web pages and ask questions about them. Answers name the documents they came from. <a href="/knowledge-base">How the knowledge base works</a>.' },
      { h2: 'Your computer, by voice', p: 'Open apps, websites, files and folders, change the volume, control media, read or fill the clipboard, look at your screen to explain an error, check CPU, memory, disk and battery. Only a fixed list of safe actions is allowed. <a href="/automation">Automation and PC control</a>.' },
      { h2: 'Agents, ML and more', list: ['A tool-using AI agent with research, task, memory, system, communication and data specialists (<a href="/ai-agents">AI agents</a>)', 'ML Lab: train and compare machine-learning models on your own CSV (<a href="/ai-ml">AI and ML</a>)', 'Command Center: one live screen for the AI core, agents, schedule, PC health and AI providers', 'Email drafts that open ready to send, contacts, study notes, Agent Studio and Brain Gym games'] },
      { h2: 'Try it', p: 'The <a href="/?page=demo">live demo</a> runs in your browser with no sign-up. Full AI answers need Azarvis running with an Anthropic API key (see <a href="/docs">getting started</a>).' },
    ],
  },
  {
    path: '/voice-assistant',
    nav: 'Voice',
    title: 'AI Voice Assistant in 39 Languages – Azarvis',
    description: 'A hands-free AI voice assistant: “Hey Azarvis” wake word, natural interruptions and native voices for Hindi, Urdu, Hinglish, English and 35 more languages.',
    h1: 'A voice assistant that talks like a person',
    intro: 'Azarvis is built to be spoken to. You talk, it listens until you pause, answers aloud and lets you interrupt, the way a conversation between people works.',
    sections: [
      { h2: 'Natural turn-taking', list: ['Wake word: “Hey Azarvis” (or “Jarvis”), with hands-free mode that keeps listening', 'Starts speaking after the first sentence of the answer instead of waiting for the whole reply', 'Stops talking when you talk over it (barge-in)', 'Ignores its own voice coming back through the speakers, so it never answers itself'] },
      { h2: '39 languages, native voices', p: 'Pick the language you speak, or just say “speak in Hindi” or “Urdu mein baat karo”. Azarvis replies in the language and script you use, and each sentence is read by a native neural voice of its language: Hindi in a Hindi voice, Urdu in an Urdu voice, Tamil in a Tamil voice, English in your chosen voice. Hinglish is read in an Indian English voice.' },
      { h2: 'Louder and clearer than the browser', p: 'When Azarvis runs on your PC it uses Microsoft neural voices, boosted above 100% loudness with a limiter so it never distorts, plus optional clarity and depth settings. Without it, your browser’s own voice is used.' },
      { h2: 'What it needs', p: 'Voice input uses your browser’s speech recognition: Google Chrome or Microsoft Edge work best. The microphone is only used after you allow it.' },
    ],
  },
  {
    path: '/ai-agents',
    nav: 'Agents',
    title: 'AI Agents with Tools and Safety Checks – Azarvis',
    description: 'How the Azarvis AI agent plans, calls tools, runs several requests at once and stays safe: allowlisted actions, prompt-injection checks and no secret storage.',
    h1: 'An AI agent that uses real tools',
    intro: 'Azarvis is a tool-using agent: Claude decides which tools a request needs, Azarvis runs them and Claude answers from the results. Every step is visible in the chat.',
    sections: [
      { h2: 'Specialists by tool group', list: ['Research: web search, reading pages, Wikipedia, your documents, weather', 'Tasks: create, list and complete tasks and reminders', 'Memory: remember and forget facts about you', 'System: apps, files, clipboard, screen, PC health', 'Communication: email drafts and contacts', 'Data and ML: exact maths and your trained models'] },
      { h2: 'Several things at once', p: '“Remind me at 6, add milk to my list and what’s the weather in Pune?” runs every tool it needs, confirms each result in order, and says which part failed if one does.' },
      { h2: 'Safety by design', list: ['Only a fixed list of computer actions: no arbitrary commands', 'Web pages, documents, the clipboard and the screen are treated as data, never as instructions; if they try to give orders, actions that act for you are paused until you ask again', 'Shutdown and restart wait and can be cancelled', 'Never retrieves saved passwords, never pays, never claims a booking it did not make'] },
    ],
  },
  {
    path: '/ai-ml',
    nav: 'AI & ML',
    title: 'Machine Learning Lab and AI Models – Azarvis',
    description: 'Azarvis ML Lab: upload a CSV, explore it, then train, compare and tune seven machine-learning algorithms with cross-validation. Plus NLP and vision models.',
    h1: 'AI and machine learning inside Azarvis',
    intro: 'Besides the language model, Azarvis includes classic machine learning you can use and learn from, with real metrics on held-out data.',
    sections: [
      { h2: 'ML Lab', list: ['Upload a CSV and pick the column to predict', 'Automatic exploration: types, missing values, distributions', 'Seven algorithms compared with cross-validation, then tuned and tested on held-out data', 'Feature importance, PCA and K-means clustering', 'A model registry and experiment log; predict with any saved model, also by asking the assistant'] },
      { h2: 'Ready-made models', p: 'A house-price model (XGBoost, test R² 0.86) and a crop-yield model you can query in plain language.' },
      { h2: 'Language and vision', list: ['An intent classifier and an emotion model for how messages are understood and answered', 'Computer vision: face detection, image statistics and descriptions of photos and screenshots', 'A cheat-sheet of 20 neural-network architectures with diagrams and code'] },
    ],
  },
  {
    path: '/knowledge-base',
    nav: 'Knowledge base',
    title: 'Chat With Your Documents (RAG) – Azarvis',
    description: 'Upload PDFs, notes and web pages and ask Azarvis about them. Retrieval-augmented answers name their source documents, and each user has a private index.',
    h1: 'Ask questions about your own documents',
    intro: 'Azarvis uses retrieval-augmented generation (RAG): it finds the passages of your documents that match your question and answers from them, naming the sources it used.',
    sections: [
      { h2: 'What you can add', list: ['PDF, text and Markdown files (up to 20 MB each)', 'Pasted notes', 'Public web pages by link (local and private network addresses are refused)'] },
      { h2: 'How answers are grounded', p: 'Your question is matched against your documents, the best passages are given to the model and the answer lists the documents it came from. If nothing relevant is found, Azarvis says so instead of guessing.' },
      { h2: 'Private by design', p: 'Each account has its own index: one user’s documents are never searched for another. Text inside documents is treated as data, so a document cannot instruct the assistant. Delete a document at any time; deleting your account removes them all.' },
    ],
  },
  {
    path: '/automation',
    nav: 'Automation',
    title: 'PC Automation and Workflows by Voice – Azarvis',
    description: 'Control your Windows, macOS or Linux PC by voice: apps, files, volume, media, screen and PC health, with one-click workflows and only safe, allowlisted actions.',
    h1: 'Automate your computer and your routine',
    intro: 'When Azarvis runs on your own computer it can act on it, safely. When it runs in the cloud it cannot, by design.',
    sections: [
      { h2: 'On your PC', list: ['Open and close apps, websites, files and folders', 'Volume, mute and media keys; lock, sleep, delayed shutdown that can be cancelled', 'Find files by name and open them', 'Read and fill the clipboard; look at the screen to explain an error', 'PC watcher: alerts when CPU, memory, disk or battery need attention'] },
      { h2: 'Workflows', p: 'One-click workflows for routines like planning the day, a weekly review or following up, which run through the same agent and tools.' },
      { h2: 'WhatsApp', p: 'Optionally, the owner can message Azarvis on WhatsApp through the official WhatsApp Cloud API. Only the owner’s number can give commands.' },
    ],
  },
  {
    path: '/technology',
    nav: 'Technology',
    title: 'Technology Stack: React, FastAPI, Claude – Azarvis',
    description: 'How Azarvis is built: React and Vite, Next.js with TypeScript, Express and MongoDB, Python FastAPI and SQLAlchemy, the Claude API, scikit-learn and Docker.',
    h1: 'How Azarvis is built',
    intro: 'Azarvis is one project that touches the whole modern stack, written to be read and learned from.',
    sections: [
      { h2: 'Frontend', list: ['React 18 and Vite web app with voice in and out (Web Speech API, Web Audio)', 'Next.js 16 and TypeScript dashboard with charts and maps', 'Installable as an app (PWA)'] },
      { h2: 'Backend', list: ['Node.js and Express 5 gateway with MongoDB: accounts, sign-in codes, passkeys, sessions, conversation history', 'Python FastAPI AI service with SQLAlchemy (SQLite or PostgreSQL): the agent, tasks, memory, RAG, ML Lab, vision, PC control', 'Server-sent events for streaming answers'] },
      { h2: 'AI and ML', list: ['Anthropic Claude for the agent, with tool use and web search', 'scikit-learn, XGBoost and optional PyTorch for the ML Lab and the NLP models', 'OpenCV for vision; Microsoft neural voices for speech'] },
      { h2: 'Engineering', list: ['Automated tests for the Python, Node and React code, run on every push with GitHub Actions', 'Docker Compose for the whole stack', 'Deployed on Vercel; a Google Cloud Run guide is in the repository'] },
    ],
  },
  {
    path: '/docs',
    nav: 'Docs',
    title: 'Getting Started and Documentation – Azarvis',
    description: 'Run Azarvis on your Windows, macOS or Linux PC: requirements, the one-command start, API keys, voice setup and where to find the full documentation.',
    h1: 'Getting started with Azarvis',
    intro: 'Azarvis is open source. Running it on your own PC gives you the full assistant, including voice in 39 languages and control of that computer.',
    sections: [
      { h2: 'You need', list: ['Node.js 20 or newer and Python 3.11 or newer', 'MongoDB (local or a free Atlas cluster)', 'An Anthropic API key for AI answers'] },
      { h2: 'Start', p: 'Clone the repository, copy <code>.env.example</code> to <code>.env</code>, add your keys, then run <code>npm run dev</code> and open the address it prints. <code>npm run doctor</code> checks your setup.' },
      { h2: 'Full documentation', list: ['<a href="https://github.com/Aamiruem" rel="noopener">Source code and README on GitHub</a>', 'API reference, voice and PC control, ML Lab and deployment guides are in the <code>docs</code> folder of the repository'] },
    ],
  },
  {
    path: '/about',
    nav: 'About',
    schema: 'AboutPage',
    title: 'About Azarvis and Aamir Hussain Azad',
    description: 'Azarvis is a personal AI assistant designed and built by Aamir Hussain Azad, an AI/ML engineer and full-stack developer.',
    h1: 'About Azarvis',
    intro: 'Azarvis (Azad + Jarvis) is a personal AI assistant designed and built by Aamir Hussain Azad, an AI/ML engineer and full-stack developer.',
    sections: [
      { h2: 'Why it exists', p: 'To be a genuinely useful assistant you can talk to, and a complete, readable example of how a modern AI product is built end to end: voice, agents, retrieval, machine learning, security and deployment.' },
      { h2: 'The builder', p: 'Aamir Hussain Azad builds AI/ML and full-stack applications. See his <a href="https://aamir-hussain-azad.vercel.app/" rel="noopener">portfolio</a>, <a href="https://github.com/Aamiruem" rel="noopener">GitHub</a> and <a href="https://www.linkedin.com/in/aamir-hussain-azad-62623924b" rel="noopener">LinkedIn</a>.' },
    ],
  },
  {
    path: '/contact',
    nav: 'Contact',
    schema: 'ContactPage',
    title: 'Contact – Azarvis',
    description: 'Send feedback, report a problem or get in touch with Aamir Hussain Azad, the builder of Azarvis.',
    h1: 'Contact',
    intro: 'Questions, ideas or a problem to report: the quickest way is the feedback form on the home page. It needs no account.',
    sections: [
      { h2: 'Ways to reach us', list: ['<a href="/#feedback">Feedback form</a> (no account needed)', 'Email: <a href="mailto:aamirhussainazad786@gmail.com">aamirhussainazad786@gmail.com</a>', '<a href="https://www.linkedin.com/in/aamir-hussain-azad-62623924b" rel="noopener">LinkedIn: Aamir Hussain Azad</a>', '<a href="https://github.com/Aamiruem" rel="noopener">GitHub: Aamiruem</a> for bugs and code'] },
    ],
  },
  {
    path: '/privacy',
    nav: 'Privacy',
    title: 'Privacy Policy – Azarvis',
    description: 'What Azarvis stores, which services process your data, how analytics consent works and how to delete everything.',
    h1: 'Privacy policy',
    intro: `Last updated ${UPDATED}. This explains what the Azarvis website and app store about you, which other services process it, and how to remove it.`,
    sections: [
      { h2: 'What is stored', list: ['Your account: name, email, password (stored only as a secure hash), optional phone number, passkeys and active sessions', 'Security activity such as sign-ins, kept for up to one year', 'What you create: conversations, tasks and reminders, memories, contacts, notes, uploaded documents and ML models', 'Feedback you send through the form'] },
      { h2: 'Services that process your data', list: ['Anthropic (Claude) receives your messages to produce answers; web search runs through Anthropic', 'Your browser’s speech recognition (Google in Chrome, Microsoft in Edge) turns your voice into text', 'When Azarvis runs on your PC, replies spoken with neural voices are sent as text to Microsoft’s speech service', 'Open-Meteo for weather and Wikipedia for encyclopedia lookups, when you ask for them', 'Email or SMS providers deliver sign-in codes', 'Hosting providers store the data above'] },
      { h2: 'Analytics', p: 'Google Analytics runs only if you choose “Accept” in the analytics notice, and you can change your mind with “Analytics settings” at the bottom of any page. It counts visits and a few button clicks. Your messages, voice, documents and personal details are never sent to analytics.' },
      { h2: 'What is never stored', p: 'Azarvis refuses to save passwords, PINs, one-time codes, card numbers or API keys as memories, and never retrieves saved passwords from your computer.' },
      { h2: 'Your choices', list: ['See and delete memories, documents, tasks and conversations at any time', 'Delete your account in Account settings: this erases your data across every database and file store', 'Questions: use the <a href="/contact">contact page</a>'] },
    ],
  },
  {
    path: '/terms',
    nav: 'Terms',
    title: 'Terms of Use – Azarvis',
    description: 'The terms for using the Azarvis website, demo and app.',
    h1: 'Terms of use',
    intro: `Last updated ${UPDATED}. By using Azarvis you agree to these terms.`,
    sections: [
      { h2: 'The service', p: 'Azarvis is provided as is, as a personal assistant and a learning project. Features may change. AI answers can be wrong: check anything important, especially medical, legal or financial information.' },
      { h2: 'Your account', list: ['Keep your password and devices secure; you are responsible for activity on your account', 'Do not use Azarvis to break the law, harm others, or attack this or any other service'] },
      { h2: 'Actions on your behalf', p: 'Azarvis never sends emails, makes purchases or books anything for you: it prepares drafts and opens pages, and you finish the action yourself.' },
      { h2: 'Contact', p: 'See the <a href="/contact">contact page</a>.' },
    ],
  },
];
