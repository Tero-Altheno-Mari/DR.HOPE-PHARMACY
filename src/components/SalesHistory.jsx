import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import {
  ClockIcon, FunnelIcon, EyeIcon, ReceiptPercentIcon,
  PrinterIcon, NoSymbolIcon, XMarkIcon,
} from '@heroicons/react/24/outline';

function ReceiptModal({ sale, items, onClose }) {
  const ref = useRef();
  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=380,height=600');
    w.document.write(`<html><head><title>Receipt #${sale.id}</title><style>
      body{font-family:monospace;font-size:12px;padding:12px;width:320px}
      h2{text-align:center;margin:0 0 4px}
      .c{text-align:center;font-size:11px;color:#555;margin-bottom:12px}
      hr{border:none;border-top:1px dashed #000;margin:8px 0}
      table{width:100%;border-collapse:collapse}
      td{padding:2px 0;vertical-align:top}
      td.r{text-align:right}
      .void{color:red;text-align:center;font-size:14px;font-weight:bold;border:2px solid red;padding:4px;margin:8px 0}
    </style></head><body>${ref.current.innerHTML}</body></html>`);
    w.document.close(); w.focus(); w.print(); w.close();
  };

  const subtotal = items.reduce((s, i) => s + parseFloat(i.subtotal), 0);
  const discount = parseFloat(sale.discount_amount || 0);
  const total = parseFloat(sale.total_amount);

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'var(--bg-primary)',borderRadius:'var(--radius-lg)',padding:24,width:400,maxHeight:'90vh',overflowY:'auto',boxShadow:'var(--shadow-xl)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h3 style={{margin:0}}>Receipt #{sale.id}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)'}}><XMarkIcon style={{width:20,height:20}}/></button>
        </div>
        <div ref={ref}>
          <h2 style={{textAlign:'center',margin:'0 0 4px'}}>Dr. Hope Pharmacy</h2>
          <div className="c" style={{textAlign:'center',fontSize:12,color:'var(--text-secondary)',marginBottom:12}}>
            Official Receipt — OR#{sale.id}<br/>
            {new Date(sale.transaction_date).toLocaleString('en-PH')}<br/>
            Cashier: {sale.username}
          </div>
          {sale.voided ? <div style={{color:'var(--error)',textAlign:'center',border:'2px solid var(--error)',padding:'4px 8px',borderRadius:4,marginBottom:8,fontWeight:700}}>⚠ VOIDED{sale.void_reason ? ` — ${sale.void_reason}` : ''}</div> : null}
          <hr style={{border:'none',borderTop:'1px dashed var(--border-color)',margin:'8px 0'}}/>
          <table style={{width:'100%',fontSize:13}}>
            <tbody>
              {items.map((item,i) => (
                <tr key={i}>
                  <td style={{paddingRight:8,verticalAlign:'top'}}>
                    <div style={{fontWeight:500}}>{item.item_name}</div>
                    <div style={{fontSize:11,color:'var(--text-secondary)'}}>{item.quantity} × ₱{parseFloat(item.unit_price).toFixed(2)}</div>
                  </td>
                  <td style={{textAlign:'right',whiteSpace:'nowrap'}}>₱{parseFloat(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr style={{border:'none',borderTop:'1px dashed var(--border-color)',margin:'8px 0'}}/>
          <table style={{width:'100%',fontSize:13}}>
            <tbody>
              <tr><td>Subtotal</td><td style={{textAlign:'right'}}>₱{subtotal.toFixed(2)}</td></tr>
              {discount > 0 && <tr style={{color:'var(--success)'}}><td>Discount ({sale.discount_type?.toUpperCase()})</td><td style={{textAlign:'right'}}>−₱{discount.toFixed(2)}</td></tr>}
              <tr style={{fontWeight:'bold',fontSize:15}}><td>TOTAL</td><td style={{textAlign:'right'}}>₱{total.toFixed(2)}</td></tr>
              {sale.payment_method === 'cash' && sale.amount_tendered && <>
                <tr><td>Cash</td><td style={{textAlign:'right'}}>₱{parseFloat(sale.amount_tendered).toFixed(2)}</td></tr>
                <tr style={{fontWeight:'bold',color:'var(--primary)'}}><td>Change</td><td style={{textAlign:'right'}}>₱{(parseFloat(sale.amount_tendered)-total).toFixed(2)}</td></tr>
              </>}
              <tr><td style={{fontSize:11,color:'var(--text-secondary)'}}>Payment</td><td style={{textAlign:'right',fontSize:11,textTransform:'capitalize'}}>{sale.payment_method}</td></tr>
              {sale.rx_patient_name && <tr><td style={{fontSize:11,color:'var(--text-secondary)'}}>Rx Patient</td><td style={{textAlign:'right',fontSize:11}}>{sale.rx_patient_name}</td></tr>}
            </tbody>
          </table>
          <div style={{textAlign:'center',fontSize:11,color:'var(--text-secondary)',marginTop:12}}>Thank you for your purchase!</div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:16,justifyContent:'flex-end'}}>
          <button onClick={handlePrint} style={{display:'flex',alignItems:'center',gap:6,background:'var(--primary)',color:'#fff',border:'none',borderRadius:'var(--radius-sm)',padding:'8px 14px',cursor:'pointer',fontSize:13}}>
            <PrinterIcon style={{width:15,height:15}}/>Print
          </button>
          <button onClick={onClose} style={{padding:'8px 14px',background:'var(--bg-tertiary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-sm)',cursor:'pointer',color:'var(--text-primary)',fontSize:13}}>Close</button>
        </div>
      </div>
    </div>
  );
}

function SalesHistory({ currentUser }) {
  const [sales, setSales]           = useState([]);
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleItems, setSaleItems]   = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [voidSaleId, setVoidSaleId] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [msg, setMsg]               = useState(null);

  useEffect(() => { loadSales(); }, []);

  const showMsg = (type, text) => { setMsg({type,text}); setTimeout(()=>setMsg(null),4000); };

  const loadSales = async () => {
    try {
      const data = await api.getSales(startDate, endDate);
      setSales(data);
    } catch (e) { console.error(e); }
  };

  const viewSaleDetails = async (sale) => {
    try {
      const items = await api.getSaleItems(sale.id);
      setSaleItems(items);
      setSelectedSale(sale);
    } catch (e) { console.error(e); }
  };

  const openReceipt = async (sale) => {
    await viewSaleDetails(sale);
    setShowReceipt(true);
  };

  const handleVoid = async () => {
    if (!voidSaleId) return;
    try {
      const res = await api.voidSale(voidSaleId, voidReason);
      if (res.success) { showMsg('success','Sale voided and stock restored.'); loadSales(); }
      else showMsg('error', res.error || 'Failed to void');
    } catch(e) { showMsg('error', e.message); }
    setVoidSaleId(null); setVoidReason('');
  };

  return (
    <div>
      {showReceipt && selectedSale && (
        <ReceiptModal sale={selectedSale} items={saleItems} onClose={()=>setShowReceipt(false)} />
      )}

      {/* Void confirmation */}
      {voidSaleId && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'var(--bg-primary)',borderRadius:'var(--radius-lg)',padding:24,width:380,boxShadow:'var(--shadow-xl)'}}>
            <h3 style={{margin:'0 0 12px',color:'var(--error)'}}>Void Sale #{voidSaleId}?</h3>
            <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:12}}>This will restore stock for all items in this sale.</p>
            <label style={{display:'block',fontSize:12,color:'var(--text-secondary)',marginBottom:4}}>Reason (optional)</label>
            <input type="text" value={voidReason} onChange={e=>setVoidReason(e.target.value)}
              placeholder="e.g. Customer return, wrong item…"
              style={{width:'100%',padding:'8px 10px',border:'1px solid var(--border-color)',borderRadius:'var(--radius-sm)',background:'var(--bg-secondary)',color:'var(--text-primary)',fontSize:13,marginBottom:14}} />
            <div style={{display:'flex',gap:10}}>
              <button onClick={handleVoid} style={{flex:1,padding:'9px',background:'var(--error)',color:'#fff',border:'none',borderRadius:'var(--radius-sm)',cursor:'pointer',fontWeight:600}}>Confirm Void</button>
              <button onClick={()=>setVoidSaleId(null)} style={{flex:1,padding:'9px',background:'var(--bg-tertiary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-sm)',cursor:'pointer',color:'var(--text-primary)'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div style={{padding:'10px 14px',borderRadius:'var(--radius-sm)',marginBottom:12,fontSize:14,
          background: msg.type==='error'?'var(--error-bg)':'var(--success-bg)',
          color: msg.type==='error'?'var(--error)':'var(--success)',
          border:`1px solid ${msg.type==='error'?'var(--error)':'var(--success)'}`}}>
          {msg.text}
        </div>
      )}

      <div className="card">
        <h2 style={{display:'flex',alignItems:'center',gap:8}}>
          <ClockIcon style={{width:24,height:24,color:'var(--primary)'}}/>Sales History
        </h2>
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} />
          </div>
          <div className="form-group" style={{alignSelf:'flex-end'}}>
            <button onClick={loadSales} style={{display:'flex',alignItems:'center',gap:6}}>
              <FunnelIcon style={{width:16,height:16}}/>Filter
            </button>
          </div>
        </div>

        {sales.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>OR#</th>
                <th>Date</th>
                <th>Cashier</th>
                <th>Payment</th>
                <th>Discount</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id} style={{opacity: sale.voided ? 0.6 : 1}}>
                  <td>#{sale.id}</td>
                  <td style={{fontSize:12}}>{new Date(sale.transaction_date).toLocaleString('en-PH')}</td>
                  <td>{sale.username}</td>
                  <td style={{textTransform:'capitalize'}}>{sale.payment_method}</td>
                  <td style={{fontSize:12}}>{sale.discount_type && sale.discount_type !== 'none' ? `${sale.discount_type.toUpperCase()} −₱${parseFloat(sale.discount_amount||0).toFixed(2)}` : '—'}</td>
                  <td style={{fontWeight:600}}>₱{parseFloat(sale.total_amount).toFixed(2)}</td>
                  <td>
                    {sale.voided
                      ? <span style={{fontSize:11,background:'var(--error-bg)',color:'var(--error)',padding:'2px 8px',borderRadius:99,fontWeight:600}}>VOID</span>
                      : <span style={{fontSize:11,background:'var(--success-bg)',color:'var(--success)',padding:'2px 8px',borderRadius:99}}>Completed</span>
                    }
                  </td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={() => openReceipt(sale)}
                        style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',fontSize:12,background:'var(--bg-tertiary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-sm)',cursor:'pointer',color:'var(--text-primary)'}}>
                        <PrinterIcon style={{width:13,height:13}}/>Receipt
                      </button>
                      {!sale.voided && (currentUser?.role === 'admin') && (
                        <button onClick={()=>setVoidSaleId(sale.id)}
                          style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',fontSize:12,background:'var(--error-bg)',border:'1px solid var(--error)',borderRadius:'var(--radius-sm)',cursor:'pointer',color:'var(--error)'}}>
                          <NoSymbolIcon style={{width:13,height:13}}/>Void
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <ClockIcon style={{width:40,height:40,color:'var(--text-secondary)',marginBottom:8}}/>
            <p>No sales found for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SalesHistory;
