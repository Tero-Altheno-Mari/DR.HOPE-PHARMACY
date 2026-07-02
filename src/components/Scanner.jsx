import { useState, useEffect, useRef } from 'react';
import {
  ShoppingCartIcon, QrCodeIcon, TrashIcon, CreditCardIcon,
  CheckCircleIcon, PlusIcon, MagnifyingGlassIcon, PrinterIcon,
  ReceiptPercentIcon, TagIcon, XMarkIcon,
} from '@heroicons/react/24/outline';

const API = 'http://localhost:3000/api';

const DISCOUNT_TYPES = [
  { value: 'none',    label: 'No Discount' },
  { value: 'senior',  label: 'Senior Citizen (20%)' },
  { value: 'pwd',     label: 'PWD (20%)' },
  { value: 'custom',  label: 'Custom %' },
];

function Receipt({ sale, onClose }) {
  const printRef = useRef();
  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=380,height=600');
    w.document.write(`<html><head><title>Receipt</title><style>
      body{font-family:monospace;font-size:12px;padding:12px;width:320px}
      h2{text-align:center;font-size:14px;margin:0 0 4px}
      .sub{text-align:center;font-size:11px;color:#555;margin-bottom:12px}
      hr{border:none;border-top:1px dashed #000;margin:8px 0}
      table{width:100%;border-collapse:collapse}
      td{padding:2px 0;vertical-align:top}
      td:last-child{text-align:right}
      .total{font-weight:bold;font-size:13px}
      .footer{text-align:center;font-size:10px;margin-top:12px;color:#666}
    </style></head><body>${printRef.current.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  const discount = sale.discountAmount || 0;
  const subtotalBeforeDiscount = sale.items.reduce((s, i) => s + i.subtotal, 0);

  return (
    <div style={{
      position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,
      display:'flex',alignItems:'center',justifyContent:'center',padding:16
    }}>
      <div style={{background:'var(--bg-primary)',borderRadius:'var(--radius-lg)',padding:24,width:380,maxHeight:'90vh',overflowY:'auto',boxShadow:'var(--shadow-xl)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h3 style={{margin:0,display:'flex',alignItems:'center',gap:8}}>
            <ReceiptPercentIcon style={{width:20,height:20,color:'var(--primary)'}}/>Receipt
          </h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)'}}>
            <XMarkIcon style={{width:20,height:20}}/>
          </button>
        </div>

        <div ref={printRef}>
          <h2>Dr. Hope Pharmacy</h2>
          <div className="sub" style={{textAlign:'center',fontSize:12,color:'var(--text-secondary)',marginBottom:12}}>
            Official Receipt<br/>
            {new Date(sale.date).toLocaleString('en-PH')}<br/>
            OR#{sale.id} &nbsp;|&nbsp; Cashier: {sale.cashier}
          </div>
          <hr style={{border:'none',borderTop:'1px dashed var(--border-color)',margin:'8px 0'}}/>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i}>
                  <td style={{padding:'3px 0',verticalAlign:'top',paddingRight:8}}>
                    <div style={{fontWeight:500}}>{item.name}</div>
                    <div style={{fontSize:11,color:'var(--text-secondary)'}}>{item.quantity} × ₱{item.unit_price.toFixed(2)}</div>
                  </td>
                  <td style={{padding:'3px 0',textAlign:'right',whiteSpace:'nowrap'}}>₱{item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr style={{border:'none',borderTop:'1px dashed var(--border-color)',margin:'8px 0'}}/>
          <table style={{width:'100%',fontSize:13}}>
            <tbody>
              <tr><td>Subtotal</td><td style={{textAlign:'right'}}>₱{subtotalBeforeDiscount.toFixed(2)}</td></tr>
              {discount > 0 && <tr style={{color:'var(--success)'}}>
                <td>Discount ({sale.discountLabel})</td>
                <td style={{textAlign:'right'}}>−₱{discount.toFixed(2)}</td>
              </tr>}
              <tr style={{fontWeight:'bold',fontSize:15}}>
                <td>TOTAL</td><td style={{textAlign:'right'}}>₱{sale.total.toFixed(2)}</td>
              </tr>
              {sale.paymentMethod === 'cash' && <>
                <tr><td>Cash Tendered</td><td style={{textAlign:'right'}}>₱{parseFloat(sale.amountTendered||0).toFixed(2)}</td></tr>
                <tr style={{fontWeight:'bold',color:'var(--primary)'}}>
                  <td>Change</td><td style={{textAlign:'right'}}>₱{(parseFloat(sale.amountTendered||0)-sale.total).toFixed(2)}</td>
                </tr>
              </>}
              <tr><td style={{fontSize:12,color:'var(--text-secondary)'}}>Payment</td>
                <td style={{textAlign:'right',fontSize:12,textTransform:'capitalize'}}>{sale.paymentMethod}</td></tr>
              {sale.rxName && <tr><td style={{fontSize:12,color:'var(--text-secondary)'}}>Rx Patient</td>
                <td style={{textAlign:'right',fontSize:12}}>{sale.rxName}</td></tr>}
            </tbody>
          </table>
          <div style={{textAlign:'center',fontSize:11,color:'var(--text-secondary)',marginTop:12}}>
            Thank you for your purchase!<br/>This serves as your official receipt.
          </div>
        </div>

        <div style={{display:'flex',gap:10,marginTop:16,justifyContent:'flex-end'}}>
          <button onClick={handlePrint} style={{display:'flex',alignItems:'center',gap:6,background:'var(--primary)',color:'#fff',border:'none',borderRadius:'var(--radius-sm)',padding:'8px 16px',cursor:'pointer'}}>
            <PrinterIcon style={{width:16,height:16}}/>Print
          </button>
          <button onClick={onClose} style={{padding:'8px 16px',background:'var(--bg-tertiary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-sm)',cursor:'pointer',color:'var(--text-primary)'}}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Scanner({ inventory: initialInventory, currentUser, onInventoryChange }) {
  const [inventory, setInventory] = useState(initialInventory || []);
  const [cart, setCart]           = useState([]);
  const [search, setSearch]       = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch]       = useState(false);
  const [message, setMessage]     = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [discountType, setDiscountType]     = useState('none');
  const [customDiscount, setCustomDiscount] = useState('');
  const [rxRequired, setRxRequired]         = useState(false);
  const [rxPatient, setRxPatient]           = useState('');
  const [rxDoctor, setRxDoctor]             = useState('');
  const [completedSale, setCompletedSale]   = useState(null);
  const searchRef = useRef(null);

  // keep local inventory in sync with parent
  useEffect(() => { setInventory(initialInventory || []); }, [initialInventory]);

  const showMsg = (type, text, dur = 4000) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), dur);
  };

  // ── search ──────────────────────────────────────────────────────────────────
  const handleSearch = (val) => {
    setSearch(val);
    if (!val.trim()) { setSearchResults([]); setShowSearch(false); return; }
    const q = val.toLowerCase();
    const results = inventory.filter(i =>
      i.product_name?.toLowerCase().includes(q) ||
      i.item_code?.toLowerCase().includes(q) ||
      i.brand?.toLowerCase().includes(q)
    ).slice(0, 12);
    setSearchResults(results);
    setShowSearch(results.length > 0);
  };

  const addFromSearch = (item) => {
    addItemToCart(item, 1);
    setSearch('');
    setSearchResults([]);
    setShowSearch(false);
    searchRef.current?.focus();
  };

  // ── cart ────────────────────────────────────────────────────────────────────
  const addItemToCart = (item, qty) => {
    qty = parseInt(qty) || 1;
    const available = parseInt(item.quantity_in_stock);
    const inCart = cart.find(c => c.inventory_id === item.id);
    const alreadyInCart = inCart ? inCart.quantity : 0;
    if (alreadyInCart + qty > available) {
      showMsg('error', `Only ${available} units available (${alreadyInCart} already in cart)`);
      return;
    }
    if (inCart) {
      setCart(cart.map(c => c.inventory_id === item.id
        ? { ...c, quantity: c.quantity + qty, subtotal: (c.quantity + qty) * c.unit_price }
        : c
      ));
    } else {
      setCart([...cart, {
        inventory_id: item.id,
        name: item.product_name,
        item_code: item.item_code,
        brand: item.brand,
        quantity: qty,
        unit_price: parseFloat(item.srp),
        subtotal: qty * parseFloat(item.srp),
        requires_rx: item.requires_rx || false,
      }]);
      if (item.requires_rx) setRxRequired(true);
    }
    showMsg('success', `Added ${qty}× ${item.product_name}`);
  };

  const updateQty = (inventory_id, newQty) => {
    newQty = parseInt(newQty);
    if (isNaN(newQty) || newQty < 1) return;
    const invItem = inventory.find(i => i.id === inventory_id);
    if (invItem && newQty > parseInt(invItem.quantity_in_stock)) {
      showMsg('error', `Only ${invItem.quantity_in_stock} in stock`);
      return;
    }
    setCart(cart.map(c => c.inventory_id === inventory_id
      ? { ...c, quantity: newQty, subtotal: newQty * c.unit_price }
      : c
    ));
  };

  const removeFromCart = (inventory_id) => {
    const updated = cart.filter(c => c.inventory_id !== inventory_id);
    setCart(updated);
    const stillHasRx = updated.some(c => c.requires_rx);
    if (!stillHasRx) setRxRequired(false);
  };

  // ── discount logic ──────────────────────────────────────────────────────────
  const subtotal = cart.reduce((s, c) => s + c.subtotal, 0);
  const discountPct = discountType === 'senior' || discountType === 'pwd' ? 20
    : discountType === 'custom' ? parseFloat(customDiscount) || 0 : 0;
  const discountLabel = discountType === 'senior' ? 'SC 20%'
    : discountType === 'pwd' ? 'PWD 20%'
    : discountType === 'custom' ? `${discountPct}%` : '';
  const discountAmount = subtotal * (discountPct / 100);
  const total = subtotal - discountAmount;
  const change = paymentMethod === 'cash' ? parseFloat(amountTendered || 0) - total : 0;

  // ── checkout ────────────────────────────────────────────────────────────────
  const processCheckout = async () => {
    if (cart.length === 0) { showMsg('error', 'Cart is empty'); return; }
    if (paymentMethod === 'cash' && parseFloat(amountTendered || 0) < total) {
      showMsg('error', 'Amount tendered is less than total'); return;
    }
    if (rxRequired && !rxPatient.trim()) {
      showMsg('error', 'Rx patient name is required for prescription items'); return;
    }
    try {
      const saleData = {
        user_id: currentUser.id,
        items: cart,
        payment_method: paymentMethod,
        total_amount: total,
        discount_type: discountType,
        discount_pct: discountPct,
        discount_amount: discountAmount,
        amount_tendered: paymentMethod === 'cash' ? parseFloat(amountTendered) : null,
        rx_patient_name: rxPatient || null,
        rx_doctor: rxDoctor || null,
      };
      const res  = await fetch(`${API}/sales`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(saleData) });
      const data = await res.json();
      if (data.success) {
        setCompletedSale({
          id: data.saleId, date: new Date().toISOString(), cashier: currentUser.username,
          items: cart, total, discountAmount, discountLabel,
          paymentMethod, amountTendered, rxName: rxPatient,
        });
        setCart([]); setAmountTendered(''); setDiscountType('none');
        setCustomDiscount(''); setRxRequired(false); setRxPatient(''); setRxDoctor('');
        // refresh inventory
        const inv = await fetch(`${API}/inventory`).then(r => r.json());
        setInventory(Array.isArray(inv) ? inv : []);
        if (onInventoryChange) onInventoryChange(inv);
      } else {
        showMsg('error', data.error || 'Failed to process sale');
      }
    } catch (e) {
      showMsg('error', 'Error processing sale: ' + e.message);
    }
  };

  const S = { padding:'8px 12px', border:'1px solid var(--border-color)', borderRadius:'var(--radius-sm)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:14, width:'100%' };

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:16,alignItems:'start'}}>
      {completedSale && <Receipt sale={completedSale} onClose={() => setCompletedSale(null)} />}

      {/* LEFT: Search + Cart */}
      <div>
        {message && (
          <div style={{padding:'10px 14px',borderRadius:'var(--radius-sm)',marginBottom:12,fontSize:14,
            background: message.type==='error' ? 'var(--error-bg)' : 'var(--success-bg)',
            color: message.type==='error' ? 'var(--error)' : 'var(--success)',
            border:`1px solid ${message.type==='error' ? 'var(--error)' : 'var(--success)'}`}}>
            {message.text}
          </div>
        )}

        {/* Search bar */}
        <div style={{position:'relative',marginBottom:16}}>
          <label style={{display:'block',fontSize:12,color:'var(--text-secondary)',marginBottom:4}}>Search / Scan Item</label>
          <div style={{position:'relative'}}>
            <MagnifyingGlassIcon style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',width:16,height:16,color:'var(--text-secondary)',pointerEvents:'none'}}/>
            <input ref={searchRef} type="text" placeholder="Type product name, code, or brand…" value={search}
              onChange={e => handleSearch(e.target.value)} autoFocus
              style={{...S, paddingLeft:34}} />
          </div>
          {showSearch && (
            <div style={{position:'absolute',top:'100%',left:0,right:0,background:'var(--bg-primary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-md)',boxShadow:'var(--shadow-lg)',zIndex:100,maxHeight:300,overflowY:'auto'}}>
              {searchResults.map(item => (
                <button key={item.id} onClick={() => addFromSearch(item)}
                  style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',padding:'10px 14px',background:'none',border:'none',borderBottom:'1px solid var(--border-color)',cursor:'pointer',textAlign:'left',color:'var(--text-primary)'}}>
                  <div>
                    <div style={{fontWeight:500,fontSize:14}}>{item.product_name} {item.brand ? <span style={{fontSize:12,color:'var(--text-secondary)'}}>({item.brand})</span> : ''}</div>
                    <div style={{fontSize:12,color:'var(--text-secondary)'}}>{item.item_code || ''}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0,marginLeft:12}}>
                    <div style={{fontWeight:600,color:'var(--primary)'}}>₱{parseFloat(item.srp).toFixed(2)}</div>
                    <div style={{fontSize:11,color: item.quantity_in_stock <= (item.reorder_level||10) ? 'var(--error)' : 'var(--success)'}}>
                      Stock: {item.quantity_in_stock}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div style={{background:'var(--bg-secondary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border-color)',display:'flex',alignItems:'center',gap:8}}>
            <ShoppingCartIcon style={{width:18,height:18,color:'var(--primary)'}}/>
            <span style={{fontWeight:600}}>Cart</span>
            {cart.length > 0 && <span style={{background:'var(--primary)',color:'#fff',borderRadius:99,fontSize:11,padding:'1px 7px'}}>{cart.length}</span>}
          </div>
          {cart.length === 0 ? (
            <div style={{padding:40,textAlign:'center',color:'var(--text-secondary)',fontSize:14}}>
              <ShoppingCartIcon style={{width:36,height:36,marginBottom:8,opacity:0.3}}/>
              <div>Cart is empty. Search for items above.</div>
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
                <thead>
                  <tr style={{background:'var(--bg-tertiary)'}}>
                    {['Item','Qty','Unit Price','Subtotal',''].map(h=>(
                      <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:12,color:'var(--text-secondary)',fontWeight:600,borderBottom:'1px solid var(--border-color)'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.inventory_id} style={{borderBottom:'1px solid var(--border-color)'}}>
                      <td style={{padding:'8px 12px'}}>
                        <div style={{fontWeight:500}}>{item.name}</div>
                        {item.requires_rx && <span style={{fontSize:10,background:'var(--warning-bg)',color:'var(--warning)',padding:'1px 6px',borderRadius:99}}>Rx</span>}
                      </td>
                      <td style={{padding:'8px 12px'}}>
                        <input type="number" min="1" value={item.quantity}
                          onChange={e => updateQty(item.inventory_id, e.target.value)}
                          style={{width:60,padding:'4px 8px',border:'1px solid var(--border-color)',borderRadius:'var(--radius-sm)',background:'var(--bg-primary)',color:'var(--text-primary)',fontSize:13,textAlign:'center'}} />
                      </td>
                      <td style={{padding:'8px 12px'}}>₱{item.unit_price.toFixed(2)}</td>
                      <td style={{padding:'8px 12px',fontWeight:500}}>₱{item.subtotal.toFixed(2)}</td>
                      <td style={{padding:'8px 12px'}}>
                        <button onClick={() => removeFromCart(item.inventory_id)}
                          style={{background:'var(--error-bg)',color:'var(--error)',border:'none',borderRadius:'var(--radius-sm)',cursor:'pointer',padding:'4px 8px',display:'flex',alignItems:'center',gap:3,fontSize:12}}>
                          <TrashIcon style={{width:12,height:12}}/>
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

      {/* RIGHT: Payment panel */}
      <div style={{background:'var(--bg-secondary)',border:'1px solid var(--border-color)',borderRadius:'var(--radius-lg)',padding:20,display:'flex',flexDirection:'column',gap:14}}>
        <div style={{fontSize:15,fontWeight:600,display:'flex',alignItems:'center',gap:8}}>
          <CreditCardIcon style={{width:18,height:18,color:'var(--primary)'}}/>Payment
        </div>

        {/* Discount */}
        <div>
          <label style={{display:'block',fontSize:12,color:'var(--text-secondary)',marginBottom:4}}>
            <TagIcon style={{width:12,height:12,display:'inline',marginRight:4}}/>Discount
          </label>
          <select value={discountType} onChange={e=>setDiscountType(e.target.value)} style={S}>
            {DISCOUNT_TYPES.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          {discountType === 'custom' && (
            <input type="number" min="0" max="100" placeholder="Enter %" value={customDiscount}
              onChange={e=>setCustomDiscount(e.target.value)}
              style={{...S,marginTop:6}} />
          )}
        </div>

        {/* Rx info */}
        {rxRequired && (
          <div style={{background:'var(--warning-bg)',border:'1px solid var(--warning)',borderRadius:'var(--radius-sm)',padding:12}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--warning)',marginBottom:8}}>Prescription Required</div>
            <input type="text" placeholder="Patient name *" value={rxPatient}
              onChange={e=>setRxPatient(e.target.value)}
              style={{...S,marginBottom:6}} />
            <input type="text" placeholder="Doctor name" value={rxDoctor}
              onChange={e=>setRxDoctor(e.target.value)} style={S} />
          </div>
        )}

        {/* Totals */}
        <div style={{background:'var(--bg-tertiary)',borderRadius:'var(--radius-sm)',padding:14}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:13}}>
            <span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:13,color:'var(--success)'}}>
              <span>Discount ({discountLabel})</span><span>−₱{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:18,paddingTop:8,borderTop:'1px solid var(--border-color)'}}>
            <span>TOTAL</span><span style={{color:'var(--primary)'}}>₱{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <label style={{display:'block',fontSize:12,color:'var(--text-secondary)',marginBottom:4}}>Payment Method</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
            {['cash','card','insurance','mobile'].map(m=>(
              <button key={m} onClick={()=>setPaymentMethod(m)}
                style={{padding:'8px',border:`2px solid ${paymentMethod===m?'var(--primary)':'var(--border-color)'}`,
                  borderRadius:'var(--radius-sm)',background: paymentMethod===m?'var(--primary)':'var(--bg-primary)',
                  color: paymentMethod===m?'#fff':'var(--text-primary)',
                  cursor:'pointer',fontSize:13,textTransform:'capitalize',fontWeight: paymentMethod===m?600:400}}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Cash tendered */}
        {paymentMethod === 'cash' && (
          <div>
            <label style={{display:'block',fontSize:12,color:'var(--text-secondary)',marginBottom:4}}>Amount Tendered</label>
            <input type="number" min={total} step="0.01" placeholder={`Min ₱${total.toFixed(2)}`}
              value={amountTendered} onChange={e=>setAmountTendered(e.target.value)} style={S} />
            {parseFloat(amountTendered||0) >= total && total > 0 && (
              <div style={{marginTop:8,padding:'10px 12px',background:'var(--success-bg)',borderRadius:'var(--radius-sm)',
                display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:16,color:'var(--success)'}}>
                <span>Change</span><span>₱{change.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Quick cash buttons */}
        {paymentMethod === 'cash' && total > 0 && (
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[20,50,100,200,500,1000].filter(v=>v>=total).slice(0,4).map(v=>(
              <button key={v} onClick={()=>setAmountTendered(String(v))}
                style={{flex:1,padding:'6px 4px',fontSize:12,border:'1px solid var(--border-color)',
                  borderRadius:'var(--radius-sm)',background:'var(--bg-tertiary)',cursor:'pointer',
                  color:'var(--text-primary)',minWidth:40}}>
                ₱{v}
              </button>
            ))}
            <button onClick={()=>setAmountTendered(total.toFixed(2))}
              style={{flex:1,padding:'6px 4px',fontSize:12,border:'1px solid var(--primary)',
                borderRadius:'var(--radius-sm)',background:'var(--bg-primary)',cursor:'pointer',
                color:'var(--primary)',minWidth:40,fontWeight:600}}>
              Exact
            </button>
          </div>
        )}

        <button onClick={processCheckout} disabled={cart.length===0}
          style={{padding:'12px',background: cart.length===0 ? 'var(--bg-tertiary)' : 'var(--success)',
            color: cart.length===0 ? 'var(--text-secondary)' : '#fff',border:'none',
            borderRadius:'var(--radius-md)',cursor: cart.length===0 ? 'not-allowed' : 'pointer',
            fontSize:15,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
          <CheckCircleIcon style={{width:20,height:20}}/>
          {cart.length===0 ? 'No Items' : `Complete Sale — ₱${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}

export default Scanner;
