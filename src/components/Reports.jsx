import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  FireIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

function Reports({ inventory }) {
  const [period, setPeriod] = useState('daily');
  const [salesSummary, setSalesSummary] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [slowMoving, setSlowMoving] = useState([]);
  const [profitLoss, setProfitLoss] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportStart, setExportStart] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [exportEnd, setExportEnd] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReports(); }, [period]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [summary, best, slow, low, expiring] = await Promise.all([
        api.getSalesSummary(period).catch(() => []),
        api.getBestSelling().catch(() => []),
        api.getSlowMoving().catch(() => []),
        api.getLowStock().catch(() => []),
        api.getExpiringSoon().catch(() => []),
      ]);
      setSalesSummary(Array.isArray(summary) ? summary : []);
      setBestSelling(Array.isArray(best) ? best : []);
      setSlowMoving(Array.isArray(slow) ? slow : []);
      setLowStock(Array.isArray(low) ? low : []);
      setExpiringSoon(Array.isArray(expiring) ? expiring : []);
    } catch (e) {
      console.error('Error loading reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadProfitLoss = async () => {
    if (!startDate || !endDate) return;
    try {
      const data = await api.getProfitLoss(startDate, endDate);
      setProfitLoss(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const exportToExcel = async () => {
    try {
      const [sales, inv, profitData, low, expiring] = await Promise.all([
        api.getSales(exportStart, exportEnd).catch(() => []),
        api.getInventory().catch(() => []),
        api.getProfitLoss(exportStart, exportEnd).catch(() => []),
        api.getLowStock().catch(() => []),
        api.getExpiringSoon().catch(() => []),
      ]);

      const wb = window.XLSX.utils.book_new();
      const totalRevenue = (sales || []).reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
      const totalProfit = (profitData || []).reduce((s, r) => s + parseFloat(r.profit || 0), 0);

      const summaryData = [
        ['DR HOPE PHARMACY — INVENTORY REPORT'],
        ['Period:', `${exportStart} to ${exportEnd}`],
        ['Generated:', new Date().toLocaleString()],
        [],
        ['Total Products:', (inv || []).length],
        ['Total Inventory Value:', `₱${(inv || []).reduce((s, i) => s + (i.quantity_in_stock * i.srp), 0).toFixed(2)}`],
        ['Total Transactions:', (sales || []).length],
        ['Total Revenue:', `₱${totalRevenue.toFixed(2)}`],
        ['Total Profit:', `₱${totalProfit.toFixed(2)}`],
        ['Low Stock Items:', (low || []).length],
        ['Expiring Soon:', (expiring || []).length],
      ];
      window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

      if ((inv || []).length > 0) {
        const invData = inv.map(i => ({
          'Item Code': i.item_code || '', 'Product Name': i.product_name, 'Brand': i.brand || '',
          'Qty in Stock': i.quantity_in_stock, 'Cost Price': parseFloat(i.cost_price || 0).toFixed(2),
          'SRP': parseFloat(i.srp || 0).toFixed(2),
          'Total Price': (i.quantity_in_stock * parseFloat(i.srp || 0)).toFixed(2),
          'Expiry Date': i.expiry_date ? new Date(i.expiry_date).toLocaleDateString() : '',
          'Supplier': i.supplier_name || '', 'Notes': i.notes || '',
          'Status': i.quantity_in_stock <= i.reorder_level ? 'LOW STOCK' : 'OK',
        }));
        window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(invData), 'Inventory');
      }

      if ((sales || []).length > 0) {
        const salesData = sales.map(s => ({
          'ID': s.id, 'Date': new Date(s.transaction_date).toLocaleString(),
          'Cashier': s.username, 'Payment': s.payment_method,
          'Total': parseFloat(s.total_amount).toFixed(2),
        }));
        window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(salesData), 'Sales');
      }

      if ((profitData || []).length > 0) {
        const plData = profitData.map(r => ({
          'Date': new Date(r.date).toLocaleDateString(),
          'Revenue': parseFloat(r.revenue).toFixed(2),
          'Cost': parseFloat(r.cost).toFixed(2),
          'Profit': parseFloat(r.profit).toFixed(2),
          'Margin %': ((r.profit / r.revenue) * 100).toFixed(1),
        }));
        window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(plData), 'Profit & Loss');
      }

      if ((low || []).length > 0) {
        const lowData = low.map(i => ({
          'Item Code': i.item_code || '', 'Product Name': i.product_name,
          'Brand': i.brand || '', 'Qty': i.quantity_in_stock,
          'Reorder Level': i.reorder_level, 'Supplier': i.supplier_name || '',
        }));
        window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(lowData), 'Low Stock');
      }

      if ((expiring || []).length > 0) {
        const expData = expiring.map(i => ({
          'Item Code': i.item_code || '', 'Product Name': i.product_name,
          'Qty': i.quantity_in_stock,
          'Expiry Date': new Date(i.expiry_date).toLocaleDateString(),
          'Days Until Expiry': i.days_until_expiry,
        }));
        window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(expData), 'Expiring Soon');
      }

      window.XLSX.writeFile(wb, `DrHopePharmacy_Report_${exportStart}_to_${exportEnd}.xlsx`);
    } catch (e) {
      console.error('Export error:', e);
      alert('Error generating report. Please try again.');
    }
  };

  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const totalValue = safeInventory.reduce((s, i) => s + (parseFloat(i.quantity_in_stock || 0) * parseFloat(i.srp || 0)), 0);

  if (loading) return <div className="loading-state">Loading reports...</div>;

  return (
    <div>
      {/* Export Section */}
      <div className="panel export-panel">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowDownTrayIcon style={{ width: 20, height: 20, color: 'var(--success)' }} />
          Export Report to Excel
        </h3>
        <p className="panel-desc">Select a date range to generate a comprehensive Excel report with multiple sheets.</p>
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" value={exportStart} onChange={e => setExportStart(e.target.value)} />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)} />
          </div>
          <div className="form-group" style={{ alignSelf: 'flex-end' }}>
            <button
              onClick={exportToExcel}
              style={{ background: 'var(--success)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card stat-success">
          <div className="stat-icon"><ArchiveBoxIcon style={{ width: 28, height: 28 }} /></div>
          <div className="stat-content">
            <div className="stat-value">{safeInventory.length}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>
        <div className="stat-card stat-primary">
          <div className="stat-icon"><CurrencyDollarIcon style={{ width: 28, height: 28 }} /></div>
          <div className="stat-content">
            <div className="stat-value">₱{totalValue.toFixed(2)}</div>
            <div className="stat-label">Inventory Value</div>
          </div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-icon"><ExclamationTriangleIcon style={{ width: 28, height: 28 }} /></div>
          <div className="stat-content">
            <div className="stat-value">{lowStock.length}</div>
            <div className="stat-label">Low Stock Items</div>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon"><ClockIcon style={{ width: 28, height: 28 }} /></div>
          <div className="stat-content">
            <div className="stat-value">{expiringSoon.length}</div>
            <div className="stat-label">Expiring Soon</div>
          </div>
        </div>
      </div>

      {/* Sales Summary */}
      <div className="card">
        <div className="card-header-row">
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ChartBarIcon style={{ width: 20, height: 20, color: 'var(--primary)' }} />
            Sales Summary
          </h3>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={{ width: 'auto' }}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        {salesSummary.length > 0 ? (
          <table>
            <thead><tr><th>Period</th><th>Transactions</th><th>Total Sales</th><th>Avg Transaction</th></tr></thead>
            <tbody>
              {salesSummary.map((r, i) => (
                <tr key={i}>
                  <td>{r.period}</td><td>{r.total_transactions}</td>
                  <td>₱{parseFloat(r.total_sales).toFixed(2)}</td>
                  <td>₱{parseFloat(r.avg_transaction).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty-state">No sales data yet.</div>}
      </div>

      {/* Best Selling */}
      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FireIcon style={{ width: 20, height: 20, color: 'var(--warning)' }} />
          Best Selling Items (Last 30 Days)
        </h3>
        {bestSelling.length > 0 ? (
          <table>
            <thead><tr><th>Product Name</th><th>Units Sold</th><th>Revenue</th><th>Transactions</th></tr></thead>
            <tbody>
              {bestSelling.map(i => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{i.name}</td>
                  <td>{i.total_sold}</td>
                  <td>₱{parseFloat(i.total_revenue).toFixed(2)}</td>
                  <td>{i.transaction_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty-state">No sales data yet.</div>}
      </div>

      {/* Low Stock */}
      {lowStock.length > 0 && (
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExclamationTriangleIcon style={{ width: 20, height: 20, color: 'var(--error)' }} />
            Low Stock Alert
          </h3>
          <table>
            <thead><tr><th>Item Code</th><th>Product Name</th><th>Qty</th><th>Reorder Level</th><th>Supplier</th></tr></thead>
            <tbody>
              {lowStock.map(i => (
                <tr key={i.id}>
                  <td>{i.item_code || '—'}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{i.product_name}</td>
                  <td><span className="badge badge-danger">{i.quantity_in_stock}</span></td>
                  <td>{i.reorder_level}</td>
                  <td>{i.supplier_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expiring Soon */}
      {expiringSoon.length > 0 && (
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockIcon style={{ width: 20, height: 20, color: 'var(--warning)' }} />
            Expiring Soon (Next 90 Days)
          </h3>
          <table>
            <thead><tr><th>Item Code</th><th>Product Name</th><th>Qty</th><th>Expiry Date</th><th>Days Left</th></tr></thead>
            <tbody>
              {expiringSoon.map(i => (
                <tr key={i.id}>
                  <td>{i.item_code || '—'}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{i.product_name}</td>
                  <td>{i.quantity_in_stock}</td>
                  <td>{new Date(i.expiry_date).toLocaleDateString()}</td>
                  <td><span className={`badge ${i.days_until_expiry < 30 ? 'badge-danger' : 'badge-warning'}`}>{i.days_until_expiry}d</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Profit & Loss */}
      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowTrendingDownIcon style={{ width: 20, height: 20, color: 'var(--primary)' }} />
          Profit / Loss Analysis
        </h3>
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ alignSelf: 'flex-end' }}>
            <button onClick={loadProfitLoss}>Generate</button>
          </div>
        </div>
        {profitLoss.length > 0 && (
          <table>
            <thead><tr><th>Date</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Margin</th></tr></thead>
            <tbody>
              {profitLoss.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td>₱{parseFloat(r.revenue).toFixed(2)}</td>
                  <td>₱{parseFloat(r.cost).toFixed(2)}</td>
                  <td style={{ color: r.profit >= 0 ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                    ₱{parseFloat(r.profit).toFixed(2)}
                  </td>
                  <td>{((r.profit / r.revenue) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Reports;
