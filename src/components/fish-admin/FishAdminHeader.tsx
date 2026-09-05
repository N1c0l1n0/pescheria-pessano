import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Plus } from 'lucide-react';

interface FishAdminHeaderProps {
  count: number;
  busy: boolean;
  onRefresh: () => void;
  onImport: () => void;
  onLogout: () => void;
  onCreate: () => void;
}

export const FishAdminHeader: React.FC<FishAdminHeaderProps> = ({
  count,
  busy,
  onRefresh,
  onImport,
  onLogout,
  onCreate,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const updatePanelPos = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPanelPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
  };

  useEffect(() => {
    if (!menuOpen) return;

    updatePanelPos();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    const onReposition = () => updatePanelPos();

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [menuOpen]);

  const panel = menuOpen
    ? createPortal(
        <div
          ref={panelRef}
          className="fish-admin-menu__panel"
          id={menuId}
          role="menu"
          style={{ top: panelPos.top, right: panelPos.right }}
        >
          <Link to="/" role="menuitem" onClick={() => setMenuOpen(false)}>
            Sito
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => {
              setMenuOpen(false);
              onRefresh();
            }}
          >
            Aggiorna
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => {
              setMenuOpen(false);
              onImport();
            }}
          >
            Importa catalogo
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
          >
            Esci
          </button>
        </div>,
        document.body
      )
    : null;

  return (
    <header className="fish-admin-header">
      <div>
        <h1>Banco</h1>
        <p>
          {count} {count === 1 ? 'pesce' : 'pesci'}
        </p>
      </div>
      <div className="fish-admin-header__actions">
        <div className="fish-admin-menu">
          <button
            ref={buttonRef}
            type="button"
            className="fish-admin-icon-btn"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label="Menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MoreHorizontal size={20} />
          </button>
          {panel}
        </div>
        <button
          type="button"
          className="fish-admin-icon-btn fish-admin-icon-btn--accent"
          aria-label="Nuovo pesce"
          onClick={onCreate}
        >
          <Plus size={20} />
        </button>
      </div>
    </header>
  );
};
