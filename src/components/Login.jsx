import { useState } from 'react';
import { api } from '../utils/api';
import {
  BuildingStorefrontIcon,
  UserIcon,
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.login(credentials.username, credentials.password);
      if (result.success) {
        onLogin(result.user);
      } else {
        setError(result.message || 'Invalid username or password');
      }
    } catch {
      setError('Connection error. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <BuildingStorefrontIcon style={{ width: 48, height: 48, color: 'var(--primary)' }} />
        </div>
        <h1>Dr. Hope Pharmacy</h1>
        <h2>Inventory Management System</h2>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExclamationCircleIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <div className="input-icon-wrap">
              <UserIcon className="input-icon" style={{ width: 18, height: 18 }} />
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
                autoFocus
                placeholder="Enter username"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-icon-wrap">
              <LockClosedIcon className="input-icon" style={{ width: 18, height: 18 }} />
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                placeholder="Enter password"
              />
            </div>
          </div>
          <button type="submit" className="login-btn" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ArrowRightOnRectangleIcon style={{ width: 18, height: 18 }} />
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-info">
          <p>Default credentials:</p>
          <p><strong>Username:</strong> admin | <strong>Password:</strong> admin123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
