import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import {
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  ShoppingCartIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  FireIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    expiringSoonCount: 0,
  });
  const [todaySales, setTodaySales] = useState({ count: 0, total: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [inventory, sales, best, low, summary] = await Promise.all([
        api.getInventory(),
        api.getSales(),
        api.getBestSelling(),
        api.getLowStock(),
        api.getSalesSummary('daily'),
      ]);

      const totalValue = inventory.reduce(
        (sum, item) => sum + (item.quantity_in_stock * parseFloat(item.srp || 0)),
        0
      );
      const lowStockCount = inventory.filter(
        (item) => item.quantity_in_stock <= item.reorder_level
      ).length;

      const expiring = await api.getExpiringSoon();

      setStats({
        totalProducts: inventory.length,
        totalValue,
        lowStockCount,
        expiringSoonCount: expiring.length,
      });

      const today = new Date().toISOString().split('T')[0];
      const todaySalesData = sales.filter((s) => s.transaction_date?.startsWith(today));
      const todayTotal = todaySalesData.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);

      setTodaySales({ count: todaySalesData.length, total: todayTotal });
      setRecentSales(sales.slice(0, 5));
      setBestSelling(best.slice(0, 5));
      setLowStock(low.slice(0, 5));
      setSalesTrend(summary.slice(0, 7));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Squares2X2Icon style={{ width: 24, height: 24, color: 'var(--primary)' }} />
        <h2 style={{ margin: 0 }}>Dashboard</h2>
      </div>
      <p className="dashboard-subtitle">Welcome back! Here's what's happening today.</p>

      {/* Key Metrics */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">
            <CurrencyDollarIcon style={{ width: 28, height: 28 }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">₱{stats.totalValue.toFixed(2)}</div>
            <div className="stat-label">Total Inventory Value</div>
          </div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon">
            <ArchiveBoxIcon style={{ width: 28, height: 28 }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalProducts}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon">
            <ShoppingCartIcon style={{ width: 28, height: 28 }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{todaySales.count}</div>
            <div className="stat-label">Today's Transactions</div>
          </div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-icon">
            <BanknotesIcon style={{ width: 28, height: 28 }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">₱{todaySales.total.toFixed(2)}</div>
            <div className="stat-label">Today's Revenue</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(stats.lowStockCount > 0 || stats.expiringSoonCount > 0) && (
        <div className="alerts-section">
          {stats.lowStockCount > 0 && (
            <div className="alert-card alert-danger">
              <div className="alert-icon">
                <ExclamationTriangleIcon style={{ width: 22, height: 22 }} />
              </div>
              <div className="alert-content">
                <div className="alert-title">Low Stock Alert</div>
                <div className="alert-text">{stats.lowStockCount} items need reordering</div>
              </div>
            </div>
          )}
          {stats.expiringSoonCount > 0 && (
            <div className="alert-card alert-warning">
              <div className="alert-icon">
                <ClockIcon style={{ width: 22, height: 22 }} />
              </div>
              <div className="alert-content">
                <div className="alert-title">Expiry Warning</div>
                <div className="alert-text">{stats.expiringSoonCount} items expiring soon</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts and Tables */}
      <div className="dashboard-grid">
        {/* Sales Trend */}
        <div className="dashboard-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowTrendingUpIcon style={{ width: 20, height: 20, color: 'var(--primary)' }} />
            Sales Trend (Last 7 Days)
          </h3>
          {salesTrend.length > 0 ? (
            <div className="chart-container">
              {salesTrend.map((day, idx) => (
                <div key={idx} className="chart-bar-wrapper">
                  <div className="chart-bar-label">{day.period}</div>
                  <div className="chart-bar-container">
                    <div
                      className="chart-bar"
                      style={{
                        width: `${(day.total_sales / Math.max(...salesTrend.map((d) => d.total_sales))) * 100}%`,
                      }}
                    >
                      <span className="chart-bar-value">₱{parseFloat(day.total_sales).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No sales data available</p>
          )}
        </div>

        {/* Best Selling Items */}
        <div className="dashboard-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FireIcon style={{ width: 20, height: 20, color: 'var(--warning)' }} />
            Top Selling Items
          </h3>
          {bestSelling.length > 0 ? (
            <table className="compact-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {bestSelling.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.total_sold}</td>
                    <td>₱{parseFloat(item.total_revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No sales data yet</p>
          )}
        </div>

        {/* Recent Sales */}
        <div className="dashboard-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockIcon style={{ width: 20, height: 20, color: 'var(--primary)' }} />
            Recent Transactions
          </h3>
          {recentSales.length > 0 ? (
            <table className="compact-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Time</th>
                  <th>Amount</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>#{sale.id}</td>
                    <td>{new Date(sale.transaction_date).toLocaleTimeString()}</td>
                    <td>₱{parseFloat(sale.total_amount).toFixed(2)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{sale.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No recent transactions</p>
          )}
        </div>

        {/* Low Stock Items */}
        <div className="dashboard-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExclamationTriangleIcon style={{ width: 20, height: 20, color: 'var(--error)' }} />
            Low Stock Items
          </h3>
          {lowStock.length > 0 ? (
            <table className="compact-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Stock</th>
                  <th>Reorder</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name || item.name}</td>
                    <td style={{ color: 'var(--error)' }}>{item.quantity_in_stock ?? item.quantity}</td>
                    <td>{item.reorder_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">All items well stocked</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
