import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Scanner from './components/Scanner';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
import Suppliers from './components/Suppliers';
import SalesHistory from './components/SalesHistory';
import { api } from './utils/api';
import {
  Squares2X2Icon,
  ArchiveBoxIcon,
  ShoppingCartIcon,
  ClockIcon,
  ChartBarIcon,
  TruckIcon,
  UsersIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventory, setInventory] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (currentUser) {
      loadInventory();
    }
  }, [currentUser]);

  const loadInventory = async () => {
    try {
      const data = await api.getInventory();
      setInventory(data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const addItem = async (item) => {
    try {
      await api.addInventoryItem(item);
      await loadInventory();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const updateItem = async (id, updates) => {
    try {
      await api.updateInventoryItem(id, updates);
      await loadInventory();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const deleteItem = async (id) => {
    try {
      await api.deleteInventoryItem(id);
      await loadInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Squares2X2Icon },
    { key: 'inventory', label: 'Inventory', icon: ArchiveBoxIcon },
    { key: 'scanner', label: 'Point of Sale', icon: ShoppingCartIcon },
    { key: 'sales', label: 'Sales History', icon: ClockIcon },
    { key: 'reports', label: 'Reports', icon: ChartBarIcon },
    { key: 'suppliers', label: 'Suppliers', icon: TruckIcon },
    ...(currentUser.role === 'admin' ? [{ key: 'users', label: 'Users', icon: UsersIcon }] : []),
  ];

  const pageTitles = {
    dashboard: 'Dashboard',
    inventory: 'Inventory Management',
    scanner: 'Point of Sale',
    sales: 'Sales History',
    reports: 'Reports & Analytics',
    suppliers: 'Supplier Management',
    users: 'User Management',
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-main">Dr. Hope Pharmacy</div>
            <div className="logo-sub">Inventory System</div>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Show Menu' : 'Hide Menu'}
          >
            {sidebarCollapsed
              ? <ChevronRightIcon style={{ width: 18, height: 18 }} />
              : <ChevronLeftIcon style={{ width: 18, height: 18 }} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`nav-item ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
              title={sidebarCollapsed ? label : ''}
            >
              <Icon className="nav-icon" style={{ width: 20, height: 20, flexShrink: 0 }} />
              {!sidebarCollapsed && <span className="nav-text">{label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={toggleTheme} title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}>
            {theme === 'light'
              ? <MoonIcon style={{ width: 20, height: 20, flexShrink: 0 }} />
              : <SunIcon style={{ width: 20, height: 20, flexShrink: 0 }} />}
            {!sidebarCollapsed && (
              <span className="nav-text">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="top-header">
          <h1 className="page-title">{pageTitles[activeTab]}</h1>
          <div className="header-actions">
            <div className="user-info">
              <UserCircleIcon style={{ width: 36, height: 36, color: 'var(--primary)' }} />
              <div className="user-details">
                <span className="user-name">{currentUser.username}</span>
                <span className="user-role">{currentUser.role}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn" title="Logout">
              <ArrowRightOnRectangleIcon style={{ width: 18, height: 18 }} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="content-area">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'inventory' && <Inventory />}
          {activeTab === 'scanner' && (
            <Scanner inventory={inventory} currentUser={currentUser} />
          )}
          {activeTab === 'sales' && <SalesHistory />}
          {activeTab === 'reports' && <Reports inventory={inventory} />}
          {activeTab === 'suppliers' && <Suppliers />}
          {activeTab === 'users' && currentUser.role === 'admin' && <UserManagement />}
        </main>
      </div>
    </div>
  );
}

export default App;
