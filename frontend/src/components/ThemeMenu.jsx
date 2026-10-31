import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons.jsx';

const OPTIONS = [
  ['light', 'Light', 'sun'],
  ['dark', 'Dark', 'moon'],
  ['system', 'System (follow Windows)', 'monitor'],
];

/** Top-bar button that opens a small Light / Dark / System menu. */
export default function ThemeMenu({ theme }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="theme-menu" ref={ref}>
      <button
        className="icon-btn theme-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Color theme"
        title="Color theme"
      >
        <Icon name={theme.mode === 'light' ? 'sun' : 'moon'} />
      </button>
      {open && (
        <div className="menu-pop" role="menu">
          {OPTIONS.map(([id, label, icon]) => (
            <button
              key={id}
              role="menuitemradio"
              aria-checked={theme.choice === id}
              className={theme.choice === id ? 'active' : ''}
              onClick={() => {
                theme.setChoice(id);
                setOpen(false);
              }}
            >
              <Icon name={icon} size="1.1em" />
              <span className="grow">{label}</span>
              {theme.choice === id && <Icon name="check" size="1em" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
