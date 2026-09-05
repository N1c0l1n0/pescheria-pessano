import React, { useEffect, useId, useRef, useState } from 'react';
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
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  return (
    <header className="fish-admin-header">
      <div>
        <h1>Banco</h1>
        <p>{count} {count === 1 ? 'pesce' : 'pesci'}</p>
      </div>
      <div className="fish-admin-header__actions">
        <div className="fish-admin-menu" ref={menuRef}>
          <button
            type="button"
            className="fish-admin-icon-btn"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label="Menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MoreHorizontal size={20} />
          </button>
          {menuOpen ? (
            <div className="fish-admin-menu__panel" id={menuId} role="menu">
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
            </div>
          ) : null}
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
