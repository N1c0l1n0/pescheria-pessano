import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { digitsOnly } from '../../utils/fishCatalog';
import { authenticateKds } from '../../utils/kdsAdmin';

interface KdsAdminLoginProps {
  onSuccess: () => void;
}

export const KdsAdminLogin: React.FC<KdsAdminLoginProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (authenticateKds(pin.trim())) {
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
        <h1>KDS</h1>
        <p>PIN gestore per la cucina.</p>
        <form onSubmit={handleLogin}>
          <label className="fish-admin-field">
            PIN
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(digitsOnly(e.target.value))}
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
