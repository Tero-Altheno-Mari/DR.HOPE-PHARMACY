import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import {
  UsersIcon,
  UserPlusIcon,
  TrashIcon,
  UserIcon,
  UserCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'staff' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (form.username && form.password) {
      try {
        await api.addUser(form);
        await loadUsers();
        setForm({ username: '', password: '', role: 'staff' });
        setShowForm(false);
      } catch (error) {
        console.error('Error adding user:', error);
      }
    }
  };

  const handleDeleteUser = async (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.deleteUser(id);
        await loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <div>
      <div className="toolbar">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
          <UsersIcon style={{ width: 18, height: 18 }} />
          {users.length} user{users.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <UserPlusIcon style={{ width: 16, height: 16 }} />
          Add User
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlusIcon style={{ width: 20, height: 20, color: 'var(--primary)' }} />
            New User
          </h3>
          <form onSubmit={handleAddUser}>
            <div className="form-group">
              <label>Username</label>
              <div className="input-icon-wrap">
                <UserIcon className="input-icon" style={{ width: 16, height: 16 }} />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-icon-wrap">
                <LockClosedIcon className="input-icon" style={{ width: 16, height: 16 }} />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Role</label>
              <div className="input-icon-wrap">
                <ShieldCheckIcon className="input-icon" style={{ width: 16, height: 16 }} />
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserPlusIcon style={{ width: 16, height: 16 }} /> Save User
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ marginTop: 0 }}>
        {users.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserCircleIcon style={{ width: 20, height: 20, color: 'var(--primary)' }} />
                    {user.username}
                  </td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-success'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-danger-sm"
                      onClick={() => handleDeleteUser(user.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <TrashIcon style={{ width: 14, height: 14 }} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <UsersIcon style={{ width: 48, height: 48, color: 'var(--text-secondary)', marginBottom: 12 }} />
            <p>No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;
