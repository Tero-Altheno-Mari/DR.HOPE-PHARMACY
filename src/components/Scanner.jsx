import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  ShoppingCartIcon,
  QrCodeIcon,
  TrashIcon,
  CreditCardIcon,
  BanknotesIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

function Scanner({ inventory, currentUser }) {
  const [cart, setCart] = useState([]);
  const [scannedCode, setScannedCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } }
    );

    html5QrcodeScanner.render(onScanSuccess, onScanError);
    setScanner(html5QrcodeScanner);

    return () => {
      html5QrcodeScanner.clear();
    };
  }, []);

  const onScanSuccess = (decodedText) => {
    setScannedCode(decodedText);
    setMessage({ type: 'success', text: `Scanned: ${decodedText}` });
  };

  const onScanError = (error) => {
    // Ignore scan errors
  };

  const addToCart = (e) => {
    e.preventDefault();
    
    if (!scannedCode) {
      setMessage({ type: 'error', text: 'Please scan or enter a barcode' });
      return;
    }

    const item = inventory.find(i => i.barcode === scannedCode || i.item_code === scannedCode);
    if (!item) {
      setMessage({ type: 'error', text: 'Item not found in inventory' });
      return;
    }

    if (parseInt(item.quantity_in_stock) < quantity) {
      setMessage({ type: 'error', text: 'Insufficient stock' });
      return;
    }

    const existingItem = cart.find(c => c.barcode === scannedCode || c.item_code === scannedCode);
    if (existingItem) {
      setCart(cart.map(c =>
        (c.item_code === scannedCode || c.barcode === scannedCode)
          ? { ...c, quantity: c.quantity + quantity, subtotal: (c.quantity + quantity) * c.unit_price }
          : c
      ));
    } else {
      setCart([...cart, {
        inventory_id: item.id,
        name: item.product_name,
        item_code: item.item_code,
        barcode: item.item_code,
        quantity: quantity,
        unit_price: parseFloat(item.srp),
        subtotal: quantity * parseFloat(item.srp)
      }]);
    }

    setMessage({ type: 'success', text: `Added ${quantity}x ${item.name} to cart` });
    setScannedCode('');
    setQuantity(1);
  };

  const removeFromCart = (barcode) => {
    setCart(cart.filter(item => item.barcode !== barcode));
  };

  const processCheckout = async () => {
    if (cart.length === 0) {
      setMessage({ type: 'error', text: 'Cart is empty' });
      return;
    }

    try {
      const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
      const saleData = {
        user_id: currentUser.id,
        items: cart,
        payment_method: paymentMethod,
        total_amount: total
      };

      const response = await fetch('http://localhost:3000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: `Sale completed! Total: $${total.toFixed(2)}` });
        setCart([]);
        // Reload inventory to reflect updated quantities
        window.location.reload();
      } else {
        setMessage({ type: 'error', text: 'Failed to process sale' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error processing sale' });
      console.error(error);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="card">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ShoppingCartIcon style={{ width: 24, height: 24, color: 'var(--primary)' }} />
        Point of Sale
      </h2>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="scanner">
        <div id="reader"></div>
      </div>

      <form onSubmit={addToCart}>
        <div className="form-row">
          <div className="form-group">
            <label>Barcode / Item Code</label>
            <div className="input-icon-wrap">
              <QrCodeIcon className="input-icon" style={{ width: 18, height: 18 }} />
              <input
                type="text"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                placeholder="Scan or enter item code"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
            />
          </div>
        </div>
        <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <PlusIcon style={{ width: 16, height: 16 }} />
          Add to Cart
        </button>
      </form>

      {cart.length > 0 && (
        <>
          <h3 style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCartIcon style={{ width: 18, height: 18, color: 'var(--primary)' }} />
            Shopping Cart
          </h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Code</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.barcode}</td>
                  <td>{item.quantity}</td>
                  <td>₱{item.unit_price.toFixed(2)}</td>
                  <td>₱{item.subtotal.toFixed(2)}</td>
                  <td>
                    <button
                      className="btn-danger-sm"
                      onClick={() => removeFromCart(item.barcode)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <TrashIcon style={{ width: 14, height: 14 }} />
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: 'bold', background: 'var(--bg-tertiary)' }}>
                <td colSpan="4">Total</td>
                <td>₱{cartTotal.toFixed(2)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div className="form-row" style={{ marginTop: 20 }}>
            <div className="form-group">
              <label>Payment Method</label>
              <div className="input-icon-wrap">
                <CreditCardIcon className="input-icon" style={{ width: 16, height: 16 }} />
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="insurance">Insurance</option>
                  <option value="mobile">Mobile Payment</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ alignSelf: 'flex-end' }}>
              <button
                onClick={processCheckout}
                style={{ background: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <CheckCircleIcon style={{ width: 16, height: 16 }} />
                Complete Sale — ₱{cartTotal.toFixed(2)}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Scanner;
