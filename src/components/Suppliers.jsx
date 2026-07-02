import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import {
  TruckIcon,
  PlusCircleIcon,
  TrashIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    try {
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.name) {
      try {
        await api.addSupplier(form);
        await loadSuppliers();
        setForm({ name: '', contact_person: '', phone: '', email: '', address: '' });
        setShowForm(false);
      } catch (error) {
        console.error('Error adding supplier:', error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        await api.deleteSupplier(id);
        await loadSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  return (
    <div>
      <div className="toolbar">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
          <TruckIcon style={{ width: 18, height: 18 }} />
          {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <PlusCircleIcon style={{ width: 16, height: 16 }} />
          Add Supplier
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TruckIcon style={{ width: 20, height: 20, color: 'var(--primary)' }} />
            New Supplier
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Supplier Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Contact Person</label>
                <div className="input-icon-wrap">
                  <UserIcon className="input-icon" style={{ width: 16, height: 16 }} />
                  <input type="text" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <div className="input-icon-wrap">
                  <PhoneIcon className="input-icon" style={{ width: 16, height: 16 }} />
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <div className="input-icon-wrap">
                  <EnvelopeIcon className="input-icon" style={{ width: 16, height: 16 }} />
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Address</label>
              <div className="input-icon-wrap" style={{ alignItems: 'flex-start' }}>
                <MapPinIcon className="input-icon" style={{ width: 16, height: 16, marginTop: 10 }} />
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows="2" style={{ paddingLeft: 36 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <PlusCircleIcon style={{ width: 16, height: 16 }} /> Save Supplier
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ marginTop: 0 }}>
        {suppliers.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{supplier.name}</td>
                  <td>{supplier.contact_person || '—'}</td>
                  <td>{supplier.phone || '—'}</td>
                  <td>{supplier.email || '—'}</td>
                  <td>
                    <button
                      className="btn-danger-sm"
                      onClick={() => handleDelete(supplier.id)}
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
            <TruckIcon style={{ width: 48, height: 48, color: 'var(--text-secondary)', marginBottom: 12 }} />
            <p>No suppliers yet. Add your first supplier above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Suppliers;
