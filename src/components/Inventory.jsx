import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

const API = 'http://localhost:3000/api';

export default function Inventory() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({
    item_code: '', product_name: '', brand: '',
    quantity_in_stock: '', cost_price: '', srp: '',
    expiry_date: '', notes: '', reorder_level: '10',
  });

  // import
  const fileRef                   = useRef(null);
  const [importStep, setStep]     = useState('idle'); // idle | preview | uploading | done
  const [previewRows, setPreview] = useState([]);
  const [progress, setProgress]   = useState(0);
  const [importResult, setResult] = useState(null);
  const [importError, setIErr]    = useState('');

  // ── load inventory ─────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/inventory`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Cannot load inventory: ' + e.message + '. Make sure the server is running (npm run server).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── add item ───────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          quantity_in_stock: parseInt(form.quantity_in_stock) || 0,
          cost_price: parseFloat(form.cost_price) || 0,
          srp: parseFloat(form.srp) || 0,
          reorder_level: parseInt(form.reorder_level) || 10,
        }),
      });
      setForm({ item_code: '', product_name: '', brand: '', quantity_in_stock: '', cost_price: '', srp: '', expiry_date: '', notes: '', reorder_level: '10' });
      setShowForm(false);
      load();
    } catch (e) {
      alert('Error adding item: ' + e.message);
    }
  };

  // ── delete item ────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    await fetch(`${API}/inventory/${id}`, { method: 'DELETE' });
    load();
  };

  // ── parse excel ────────────────────────────────────────────────────────────
  const parseFile = (file) => {
    setIErr('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb  = XLSX.read(e.target.result, { type: 'array', cellDates: true });
        const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });

        // find header row
        let hi = 0;
        for (let i = 0; i < Math.min(aoa.length, 10); i++) {
          if (aoa[i].map(c => String(c).toLowerCase()).join('|').includes('product name')) { hi = i; break; }
        }

        const headers = aoa[hi].map(h => String(h).trim());
        const get = (obj, ...keys) => { for (const k of keys) if (obj[k] !== undefined && String(obj[k]).trim() !== '') return obj[k]; return ''; };
        const expiry = (raw) => {
          if (!raw) return null;
          if (raw instanceof Date) return isNaN(raw) ? null : raw.toISOString().split('T')[0];
          const s = String(raw).trim();
          const m = s.match(/^(\d{1,2})\/(\d{4})$/);
          if (m) return `${m[2]}-${m[1].padStart(2,'0')}-01`;
          const d = new Date(s); return isNaN(d) ? null : d.toISOString().split('T')[0];
        };

        const rows = [];
        for (const row of aoa.slice(hi + 1)) {
          const obj = {}; headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
          const name = String(get(obj, 'Product Name', 'product_name', 'Name')).trim();
          if (!name) continue;
          rows.push({
            item_code:         String(get(obj, 'Item Code', 'item_code')).trim() || null,
            product_name:      name,
            brand:             String(get(obj, 'Brand', 'brand')).trim() || null,
            quantity_in_stock: parseInt(get(obj, 'Quantity in Stock', 'quantity_in_stock', 'Quantity', 'qty') || 0) || 0,
            cost_price:        parseFloat(get(obj, 'Cost Price', 'cost_price', 'Cost') || 0) || 0,
            srp:               parseFloat(get(obj, 'SRP', 'srp', 'Selling Price', 'Price') || 0) || 0,
            expiry_date:       expiry(get(obj, 'Expiry Date', 'expiry_date', 'Expiry')),
            supplier_name:     String(get(obj, 'Supplier', 'supplier')).trim() || null,
            notes:             String(get(obj, 'Notes', 'notes')).trim() || null,
          });
        }

        if (rows.length === 0) { setIErr('No valid rows found — make sure the file has a "Product Name" column.'); return; }
        setPreview(rows);
        setStep('preview');
      } catch (err) { setIErr('Could not read file: ' + err.message); }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── upload batches ─────────────────────────────────────────────────────────
  const runImport = async () => {
    setStep('uploading'); setProgress(0);
    const BATCH = 200;
    let ok = 0, fail = 0, errs = [];
    for (let i = 0; i < previewRows.length; i += BATCH) {
      const chunk = previewRows.slice(i, i + BATCH);
      try {
        const res  = await fetch(`${API}/inventory/bulk-import-json`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: chunk }),
        });
        const data = await res.json();
        if (data.success) { ok += data.results.success; fail += data.results.failed; errs = errs.concat(data.results.errors || []); }
        else { fail += chunk.length; errs.push(data.error); }
      } catch (e) { fail += chunk.length; errs.push(e.message); }
      setProgress(Math.min(100, Math.round(((i + BATCH) / previewRows.length) * 100)));
    }
    setResult({ ok, fail, errs });
    setStep('done');
    load();
  };

  const resetImport = () => { setStep('idle'); setPreview([]); setResult(null); setIErr(''); setProgress(0); if (fileRef.current) fileRef.current.value = ''; };

  // ── filter ─────────────────────────────────────────────────────────────────
  const filtered = items.filter(item =>
    item.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    item.item_code?.toLowerCase().includes(search.toLowerCase()) ||
    item.brand?.toLowerCase().includes(search.toLowerCase())
  );

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '0' }}>

      {/* hidden file input */}
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); e.target.value = ''; }} />

      {/* ── toolbar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by name, code, or brand…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14 }}
        />
        <button onClick={() => fileRef.current.click()}
          style={{ padding: '9px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          ↑ Import Excel
        </button>
        <button onClick={() => setShowForm(s => !s)}
          style={{ padding: '9px 16px', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          + Add Item
        </button>
        <button onClick={load}
          style={{ padding: '9px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}
          title="Refresh">
          ↻
        </button>
      </div>

      {/* ── server error ── */}
      {error && (
        <div style={{ background: 'var(--error-bg)', border: '1px solid var(--error)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, color: 'var(--error)', fontSize: 14 }}>
          ⚠ {error}
        </div>
      )}

      {/* ── import error ── */}
      {importError && (
        <div style={{ background: 'var(--error-bg)', border: '1px solid var(--error)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, color: 'var(--error)', fontSize: 14 }}>
          ⚠ {importError}
        </div>
      )}

      {/* ── add form ── */}
      {showForm && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Add New Item</h3>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
              {[
                { label: 'Item Code', key: 'item_code', type: 'text' },
                { label: 'Product Name *', key: 'product_name', type: 'text', required: true },
                { label: 'Brand', key: 'brand', type: 'text' },
                { label: 'Qty in Stock', key: 'quantity_in_stock', type: 'number' },
                { label: 'Cost Price', key: 'cost_price', type: 'number', step: '0.01' },
                { label: 'SRP', key: 'srp', type: 'number', step: '0.01' },
                { label: 'Expiry Date', key: 'expiry_date', type: 'date' },
                { label: 'Reorder Level', key: 'reorder_level', type: 'number' },
                { label: 'Notes', key: 'notes', type: 'text' },
              ].map(({ label, key, type, required, step }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</label>
                  <input
                    type={type} step={step} required={required}
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={{ padding: '9px 20px', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 14 }}>Save</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── import preview ── */}
      {importStep === 'preview' && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ fontSize: 15 }}>Preview — {previewRows.length.toLocaleString()} rows detected</strong>
            <button onClick={resetImport} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)' }}>✕</button>
          </div>
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 360, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', position: 'sticky', top: 0 }}>
                  {['#','Code','Product Name','Brand','Qty','Cost','SRP','Expiry','Supplier','Notes'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-secondary)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 50).map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '6px 10px', color: 'var(--text-tertiary)', fontSize: 11 }}>{i + 1}</td>
                    <td style={{ padding: '6px 10px' }}>{r.item_code || '—'}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 500 }}>{r.product_name}</td>
                    <td style={{ padding: '6px 10px' }}>{r.brand || '—'}</td>
                    <td style={{ padding: '6px 10px' }}>{r.quantity_in_stock}</td>
                    <td style={{ padding: '6px 10px' }}>{r.cost_price > 0 ? `₱${r.cost_price.toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '6px 10px' }}>{r.srp > 0 ? `₱${r.srp.toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>{r.expiry_date || '—'}</td>
                    <td style={{ padding: '6px 10px' }}>{r.supplier_name || '—'}</td>
                    <td style={{ padding: '6px 10px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewRows.length > 50 && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Showing first 50 of {previewRows.length.toLocaleString()} rows. All will be imported.</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={runImport} style={{ padding: '9px 20px', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 14 }}>
              ↑ Import {previewRows.length.toLocaleString()} rows
            </button>
            <button onClick={resetImport} style={{ padding: '9px 20px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── uploading progress ── */}
      {importStep === 'uploading' && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 32, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Importing {previewRows.length.toLocaleString()} rows…</div>
          <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 99, overflow: 'hidden', maxWidth: 400, margin: '0 auto 8px' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-primary)', borderRadius: 99, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{progress}%</div>
        </div>
      )}

      {/* ── import done ── */}
      {importStep === 'done' && importResult && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>✓ Import Complete</div>
          <div style={{ display: 'flex', gap: 32, marginBottom: 12 }}>
            <div><div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>{importResult.ok.toLocaleString()}</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Added / Updated</div></div>
            {importResult.fail > 0 && <div><div style={{ fontSize: 28, fontWeight: 700, color: 'var(--error)' }}>{importResult.fail}</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Failed</div></div>}
          </div>
          {importResult.errs.length > 0 && (
            <details style={{ marginBottom: 12 }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--error)' }}>{importResult.errs.length} error(s)</summary>
              <ul style={{ marginTop: 6, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)' }}>
                {importResult.errs.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </details>
          )}
          <button onClick={resetImport} style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>Import Another File</button>
        </div>
      )}

      {/* ── inventory table ── */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', fontSize: 13, color: 'var(--text-secondary)' }}>
          {loading ? 'Loading…' : `${filtered.length.toLocaleString()} item${filtered.length !== 1 ? 's' : ''}`}
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading inventory…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            {error ? 'Could not load data.' : search ? 'No items match your search.' : 'No inventory yet. Add items manually or import an Excel file.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  {['Item Code','Product Name','Brand','Qty','Cost Price','SRP','Total Value','Expiry','Supplier','Notes',''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', background: item.quantity_in_stock <= item.reorder_level ? 'var(--warning-bg)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{item.item_code || '—'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.product_name}</td>
                    <td style={{ padding: '10px 14px' }}>{item.brand || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: item.quantity_in_stock <= item.reorder_level ? 'var(--error-bg)' : 'var(--success-bg)', color: item.quantity_in_stock <= item.reorder_level ? 'var(--error)' : 'var(--success)' }}>
                        {item.quantity_in_stock}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>₱{parseFloat(item.cost_price || 0).toFixed(2)}</td>
                    <td style={{ padding: '10px 14px' }}>₱{parseFloat(item.srp || 0).toFixed(2)}</td>
                    <td style={{ padding: '10px 14px' }}>₱{(parseFloat(item.quantity_in_stock || 0) * parseFloat(item.srp || 0)).toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>
                      {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-PH', { month: '2-digit', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>{item.supplier_name || '—'}</td>
                    <td style={{ padding: '10px 14px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{item.notes || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => handleDelete(item.id)}
                        style={{ padding: '4px 10px', background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 12 }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
