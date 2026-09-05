import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { authenticateAdmin } from '../../utils/fishCatalog';

interface FishAdminLoginProps {
  onSuccess: () => void;
}

export const FishAdminLogin: React.FC<FishAdminLoginProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (authenticateAdmin(pin.trim())) {
      onSuccess();
      return;
    }
    setPinError('PIN non valido');
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
          <button type="submit" className="fish-admin-btn fish-admin-btn--primary">
            Entra
          </button>
        </form>
      </div>
    </div>
  );
};
