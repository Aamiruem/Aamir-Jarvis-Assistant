// One small inline-SVG icon set for the whole app: no icon font or package to download,
// every icon inherits the text color (currentColor) and scales with font size.
const PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5',
  chat: 'M4 5h16v11H8l-4 4V5Z M8 9.5h8 M8 12.5h5',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  book: 'M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5v-15Z M4 19.5A1.5 1.5 0 0 0 5.5 21H20 M8 7h8',
  tasks: 'M4 4h16v16H4z M8 12l3 3 5-6',
  brain: 'M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4H9Z M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4h1Z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5',
  shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z M9 12l2 2 4-4',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z M5 11a7 7 0 0 0 14 0 M12 18v3',
  plus: 'M12 5v14 M5 12h14',
  alarm: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M12 9v4l2.5 2 M3 5l3-2.5 M21 5l-3-2.5',
  weather: 'M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7Z M15 3v1.5 M20.5 5.5l-1 1 M22 10h-1.5',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M20 20l-4-4',
  camera: 'M4 7h3l2-3h6l2 3h3v13H4V7Z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  folder: 'M3 6a1 1 0 0 1 1-1h5l2 2.5h9a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Z',
  screenshot: 'M4 8V4h4 M16 4h4v4 M20 16v4h-4 M8 20H4v-4 M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z',
  cpu: 'M7 7h10v10H7z M10 10h4v4h-4z M9 3v4 M15 3v4 M9 17v4 M15 17v4 M3 9h4 M3 15h4 M17 9h4 M17 15h4',
  pulse: 'M3 12h4l2-6 4 12 2-6h6',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2Z M10 20a2 2 0 0 0 4 0',
  sparkles: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z',
  send: 'M4 12 20 4l-6 16-3-7-7-1Z M11 13l9-9',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2',
  zap: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  timeline: 'M6 4v16 M6 7h0 M6 12h0 M6 17h0 M10 7h10 M10 12h7 M10 17h9',
  chevron: 'M9 6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7',
  alert: 'M12 3 2 20h20L12 3Z M12 10v4 M12 17h0',
  copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
  volume: 'M4 9h4l5-4v14l-5-4H4V9Z M17 9a4 4 0 0 1 0 6 M19.5 6.5a8 8 0 0 1 0 11',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6',
  upload: 'M12 16V4 M7 9l5-5 5 5 M4 16v4h16v-4',
  file: 'M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 12h6 M9 16h6',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Z M13.5 6.5l4 4',
  x: 'M6 6l12 12 M18 6 6 18',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  keyboard: 'M3 6h18v12H3z M7 10h0 M11 10h0 M15 10h0 M8 14h8',
  logout: 'M15 4h4v16h-4 M10 8l-4 4 4 4 M6 12h10',
  filter: 'M4 5h16l-6 8v6l-4-2v-4L4 5Z',
  calendar: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  key: 'M14 10a4 4 0 1 0-4 4 M10 14l-6 6 M6 18l2 2 M8 16l2 2',
  stop: 'M7 7h10v10H7z',
  contacts: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6 M16 4.5a3.5 3.5 0 0 1 0 6.5 M18 14c2 .7 3.5 2.6 3.5 6',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z',
  mail: 'M3 6h18v12H3z M3 7l9 6 9-6',
  whatsapp: 'M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20Z M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a3 3 0 0 1-2-2l1-1-1-2L9 9.5Z',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9L12 3.5Z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z M12 1.5v2 M12 20.5v2 M4.6 4.6l1.4 1.4 M18 18l1.4 1.4 M1.5 12h2 M20.5 12h2 M4.6 19.4 6 18 M18 6l1.4-1.4',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z',
  monitor: 'M3 4h18v12H3z M8 20h8 M12 16v4',
  sidebar: 'M3 4h18v16H3z M9 4v16',
};

export function Icon({ name, size = '1.25em', className = '', title, filled = false }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <path d={PATHS[name] || PATHS.sparkles} />
    </svg>
  );
}
