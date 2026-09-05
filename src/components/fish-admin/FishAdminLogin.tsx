import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { authenticateAdmin } from '../../utils/fishCatalog';

interface FishAdminLoginProps {
  onSuccess: () => void;
}

export const FishAdminLogin: React.FC<FishAdminLoginProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setPinError('');
    setSubmitting(true);

    try {
      const ok = await authenticateAdmin(pin.trim());
      if (ok) {
        onSuccess();
        return;
      }
      setPinError('PIN non valido');
    } catch {
      setPinError('Errore di verifica PIN. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fish-admin-shell">
      <div className="fish-admin-login">
        <div className="fish-admin-login__mark">
          <Lock size={18} />
        </div>
        <h1>Banco</h1>
        <p>PIN gestore per prezzi e vetrina.</p>
        <form onSubmit={handleLogin}>
          <label className="fish-admin-field">
            PIN
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
              autoComplete="current-password"
              inputMode="numeric"
            />
          </label>
          {pinError ? <p className="fish-admin-status fish-admin-status--error">{pinError}</p> : null}
          <button type="submit" className="fish-admin-btn fish-admin-btn--primary" disabled={submitting}>
            {submitting ? 'Verifica…' : 'Entra'}
          </button>
        </form>
      </div>
    </div>
  );
};
