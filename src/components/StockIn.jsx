import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import {
  ArrowDownTrayIcon, PlusCircleIcon, MagnifyingGlassIcon, ClockIcon,
} from '@heroicons/react/24/outline';

const API = 'http://localhost:3000/api';

export default function StockIn({ currentUser }) {
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [records, setRecords]     = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [search, setSearch]       = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItem, setSelectedItem]   = useState(null);
  const [msg, setMsg]             = useState(null);
  const [form, setForm] = useState({
    supplier_id: '', quantity: '', cost_price: '',
    expiry_date: '', reference_no: '', notes: '',
  });

  useEffect(() => {
    Promise.all([
      fetch(`${API}/inventory`).then(r=>r.json()),
      api.getSuppliers(),
      api.getStockIn(),
    ]).then(([inv, sup, rec]) => {
      setInventory(Array.isArray(inv) ? inv : []);
      setSuppliers(Array.isArray(sup) ? sup : []);
      setRecords(Array.isArray(rec) ? rec : []);
    });
  }, []);

  const reload = async () => {
    const [inv, rec] = await Promise.all([
      fetch(`${API}/inventory`).then(r=>r.json()),
      api.getStockIn(),
    ]);
    setInventory(Array.isArray(inv) ? inv : []);
    setRecords(Array.isArray(rec) ? rec : []);
  };

  const showMsg = (type, text) => { setMsg({type,text}); setTimeout(()=>setMsg(null),4000); };

  const handleSearch = (val) => {
    setSearch(val);
    if (!val.trim()) { setSearchResults([]); return; }
    const q = val.toLowerCase();
    setSearchResults(inventory.filter(i =>
      i.product_name?.toLowerCase().includes(q) || i.item_code?.toLowerCase().includes(q)
    ).slice(0, 10));
  };

  const selectItem = (item) => {
    setSelectedItem(item);
    setSearch(item.product_name);
    setSearchResults([]);
    setForm(f => ({ ...f, cost_price: item.cost_price || '', supplier_id: item.supplier_id || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) { showMsg('error', 'Select an item first'); return; }
    if (!form.quantity || parseInt(form.quantity) < 1) { showMsg('error', 'Enter valid quantity'); return; }
    try {
      const res = await api.addStockIn({
        ...form,
        inventory_id: selectedItem.id,
        quantity: parseInt(form.quantity),
        cost_price: parseFloat(form.cost_price) || 0,
        received_by: currentUser.id,
      });
      if (res.success) {
        showMsg('success', `Stock-in recorded: +${form.quantity} × ${selectedItem.product_name}`);
        setSelectedItem(null); setSearch('');
        setForm({ supplier_id:'', quantity:'', cost_price:'', expiry_date:'', reference_no:'', notes:'' });
        setShowForm(false);
        reload();
      } else showMsg('error', res.error || 'Failed');
    } catch(e) { showMsg('error', e.message); }
  };

  const S = { padding:'8px 10px', border:'1px solid var(--border-color)', borderRadius:'var(--radius-sm)', background:'var(--bg-primary)', color:'var(--text-primary)', fontSize:14, width:'100%' };

  return (
    <div>
      {msg && (
        <div style={{padding:'10px 14px',borderRadius:'var(--radius-sm)',marginBottom:12,fontSize:14,
          background: msg.type==='error'?'var(--error-bg)':'var(--success-bg)',
          color: msg.type==='error'?'var(--error)':'var(--success)',
          border:`1px solid ${msg.type==='error'?'var(--error)':'var(--success)'}`}}>
          {msg.text}
        </div>
      )}

      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}>
        <span style={{flex:1,fontSize:14,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:6}}>
          <ArrowDownTrayIcon style={{width:16,height:16}}/>{records.length} stock-in record{records.length!==1?'s':''}
        </span>
        <button onClick={()=>setShowForm(s=>!s)}
          style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'var(--primary)',color:'#fff',border:'none',borderRadius:'var(--radius-sm)',cursor:'pointer',fontSize:13}}>
          <PlusCircleIcon style={{width:16,height:16}}/>Receive Stock
        </button>
      </div>

      {showForm && (
        <div style={{background:'var(--bg-secondary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-lg)',padding:20,marginBottom:16}}>
          <h3 style={{margin:'0 0 14px',fontSize:15,display:'flex',alignItems:'center',gap:8}}>
            <ArrowDownTrayIcon style={{width:18,height:18,color:'var(--primary)'}}/>Receive New Stock
          </h3>
          <form onSubmit={handleSubmit}>
            {/* Item search */}
            <div style={{marginBottom:12,position:'relative'}}>
              <label style={{display:'block',fontSize:12,color:'var(--text-secondary)',marginBottom:4}}>Product *</label>
              <div style={{position:'relative'}}>
                <MagnifyingGlassIcon style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',width:15,height:15,color:'var(--text-secondary)',pointerEvents:'none'}}/>
                <input type="text" placeholder="Search product…" value={search} onChange={e=>handleSearch(e.target.value)} style={{...S,paddingLeft:30}} />
              </div>
              {searchResults.length > 0 && (
                <div style={{position:'absolute',top:'100%',left:0,right:0,background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-md)',boxShadow:'var(--shadow-lg)',zIndex:100,maxHeight:220,overflowY:'auto'}}>
                  {searchResults.map(item=>(
                    <button key={item.id} type="button" onClick={()=>selectItem(item)}
                      style={{display:'flex',justifyContent:'space-between',width:'100%',padding:'9px 12px',background:'none',border:'none',borderBottom:'1px solid var(--border-color)',cursor:'pointer',textAlign:'left',color:'var(--text-primary)',fontSize:13}}>
                      <span>{item.product_name} {item.brand?<span style={{color:'var(--text-secondary)'}}>({item.brand})</span>:''}</span>
                      <span style={{color:'var(--text-secondary)',fontSize:11}}>Stock: {item.quantity_in_stock}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedItem && (
              <div style={{padding:'8px 12px',background:'var(--success-bg)',border:'1px solid var(--success)',borderRadius:'var(--radius-sm)',marginBottom:12,fontSize:13,color:'var(--success)'}}>
                Selected: <strong>{selectedItem.product_name}</strong> — Current stock: {selectedItem.quantity_in_stock}
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12,marginBottom:14}}>
              {[
                {label:'Quantity *', key:'quantity', type:'number', min:1},
                {label:'Cost Price', key:'cost_price', type:'number', step:'0.01'},
                {label:'New Expiry Date', key:'expiry_date', type:'date'},
                {label:'Reference / DR No.', key:'reference_no', type:'text'},
              ].map(({label,key,type,min,step})=>(
                <div key={key}>
                  <label style={{display:'block',fontSize:12,color:'var(--text-secondary)',marginBottom:4}}>{label}</label>
                  <input type={type} min={min} step={step} value={form[key]}
                    onChange={e=>setForm({...form,[key]:e.target.value})} style={S} required={key==='quantity'} />
                </div>
              ))}
              <div>
                <label style={{display:'block',fontSize:12,color:'var(--text-secondary)',marginBottom:4}}>Supplier</label>
                <select value={form.supplier_id} onChange={e=>setForm({...form,supplier_id:e.target.value})} style={S}>
                  <option value="">— Select —</option>
                  {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,color:'var(--text-secondary)',marginBottom:4}}>Notes</label>
                <input type="text" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={S} />
              </div>
            </div>

            <div style={{display:'flex',gap:10}}>
              <button type="submit" style={{padding:'9px 20px',background:'var(--primary)',color:'#fff',border:'none',borderRadius:'var(--radius-sm)',cursor:'pointer',fontSize:14,fontWeight:600}}>
                Save Stock-In
              </button>
              <button type="button" onClick={()=>{setShowForm(false);setSelectedItem(null);setSearch('');}}
                style={{padding:'9px 20px',background:'var(--bg-tertiary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-sm)',cursor:'pointer',color:'var(--text-primary)',fontSize:14}}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records table */}
      <div style={{background:'var(--bg-secondary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
        <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border-color)',fontSize:13,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:8}}>
          <ClockIcon style={{width:15,height:15}}/>Stock-In History
        </div>
        {records.length === 0 ? (
          <div style={{padding:48,textAlign:'center',color:'var(--text-secondary)',fontSize:14}}>
            No stock-in records yet.
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
              <thead>
                <tr style={{background:'var(--bg-tertiary)'}}>
                  {['Date','Product','Qty Added','Cost Price','Expiry','Supplier','Reference','Received By'].map(h=>(
                    <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:12,color:'var(--text-secondary)',fontWeight:600,borderBottom:'1px solid var(--border-color)',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map(r=>(
                  <tr key={r.id} style={{borderBottom:'1px solid var(--border-color)'}}>
                    <td style={{padding:'9px 12px',fontSize:12}}>{new Date(r.received_at).toLocaleString('en-PH')}</td>
                    <td style={{padding:'9px 12px',fontWeight:500}}>{r.product_name}</td>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{background:'var(--success-bg)',color:'var(--success)',padding:'2px 8px',borderRadius:99,fontSize:12,fontWeight:600}}>+{r.quantity}</span>
                    </td>
                    <td style={{padding:'9px 12px'}}>{r.cost_price > 0 ? `₱${parseFloat(r.cost_price).toFixed(2)}` : '—'}</td>
                    <td style={{padding:'9px 12px',fontSize:12}}>{r.expiry_date ? new Date(r.expiry_date).toLocaleDateString('en-PH') : '—'}</td>
                    <td style={{padding:'9px 12px'}}>{r.supplier_name || '—'}</td>
                    <td style={{padding:'9px 12px',fontSize:12}}>{r.reference_no || '—'}</td>
                    <td style={{padding:'9px 12px',fontSize:12}}>{r.received_by_name}</td>
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
