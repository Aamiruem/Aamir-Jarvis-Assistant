import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons.jsx';

/**
 * The account menu: one place for account, portfolio, install/share, help and sign out.
 * compact: just the avatar (top bar); otherwise avatar + name + email (sidebar footer).
 * items: [{ icon, label, onClick, hint?, danger? } | 'divider']
 */
export default function UserMenu({ user, items, compact = false, placement = 'up' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const outside = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  const initial = (user.name || user.email || '?').slice(0, 1).toUpperCase();
  return (
    <div className={`umenu ${compact ? 'umenu--compact' : ''}`} ref={ref}>
      <button type="button" className="umenu-trigger" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu for ${user.name}`} title={compact ? `${user.name}: account menu` : undefined}>
        <span className="umenu-avatar" aria-hidden="true">{initial}</span>
        {!compact && (
          <>
            <span className="umenu-who"><strong>{user.name}</strong><small>{user.email}</small></span>
            <Icon name="chevron" size="1em" className="umenu-chev" />
          </>
        )}
      </button>
      {open && (
        <div className={`umenu-pop umenu-pop--${placement}`} role="menu">
          <div className="umenu-head"><strong>{user.name}</strong><small>{user.email}</small></div>
          {items.map((item, i) =>
            item === 'divider' ? (
              <hr key={`d${i}`} />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={item.danger ? 'danger' : ''}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                <Icon name={item.icon} size="1.05em" />
                <span className="grow">{item.label}</span>
                {item.hint && <kbd>{item.hint}</kbd>}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
