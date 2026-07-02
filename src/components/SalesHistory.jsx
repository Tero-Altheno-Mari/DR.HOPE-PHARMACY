import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import {
  ClockIcon,
  FunnelIcon,
  EyeIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';

function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleItems, setSaleItems] = useState([]);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const data = await api.getSales(startDate, endDate);
      setSales(data);
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  const viewSaleDetails = async (saleId) => {
    try {
      const items = await api.getSaleItems(saleId);
      setSaleItems(items);
      setSelectedSale(saleId);
    } catch (error) {
      console.error('Error loading sale items:', error);
    }
  };

  return (
    <div className="card">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ClockIcon style={{ width: 24, height: 24, color: 'var(--primary)' }} />
        Sales History
      </h2>

      <div className="form-row">
        <div className="form-group">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="form-group" style={{ alignSelf: 'flex-end' }}>
          <button
            onClick={loadSales}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FunnelIcon style={{ width: 16, height: 16 }} />
            Filter
          </button>
        </div>
      </div>

      <h3 style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
        <ReceiptPercentIcon style={{ width: 18, height: 18, color: 'var(--primary)' }} />
        Transactions
      </h3>
      {sales && sales.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Cashier</th>
              <th>Payment Method</th>
              <th>Total Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id}>
                <td>#{sale.id}</td>
                <td>{new Date(sale.transaction_date).toLocaleString()}</td>
                <td>{sale.username}</td>
                <td style={{ textTransform: 'capitalize' }}>{sale.payment_method}</td>
                <td>₱{parseFloat(sale.total_amount).toFixed(2)}</td>
                <td>
                  <button
                    onClick={() => viewSaleDetails(sale.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <EyeIcon style={{ width: 14, height: 14 }} />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">
          <ClockIcon style={{ width: 40, height: 40, color: 'var(--text-secondary)', marginBottom: 8 }} />
          <p>No sales found for the selected period.</p>
        </div>
      )}

      {selectedSale && saleItems.length > 0 && (
        <>
          <h3 style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ReceiptPercentIcon style={{ width: 18, height: 18, color: 'var(--primary)' }} />
            Sale #{selectedSale} — Items
          </h3>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Item Code</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {saleItems.map(item => (
                <tr key={item.id}>
                  <td>{item.item_name}</td>
                  <td>{item.item_code || '—'}</td>
                  <td>{item.quantity}</td>
                  <td>₱{parseFloat(item.unit_price).toFixed(2)}</td>
                  <td>₱{parseFloat(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default SalesHistory;
