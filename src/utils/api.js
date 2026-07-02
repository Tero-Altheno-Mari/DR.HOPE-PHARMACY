const API_URL = 'http://localhost:3000/api';

export const api = {
  // Auth
  login: async (username, password) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  // Users
  getUsers: async () => {
    const res = await fetch(`${API_URL}/users`);
    return res.json();
  },

  addUser: async (user) => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    return res.json();
  },

  deleteUser: async (id) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Categories
  getCategories: async () => {
    const res = await fetch(`${API_URL}/categories`);
    return res.json();
  },

  addCategory: async (category) => {
    const res = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    return res.json();
  },

  // Suppliers
  getSuppliers: async () => {
    const res = await fetch(`${API_URL}/suppliers`);
    return res.json();
  },

  addSupplier: async (supplier) => {
    const res = await fetch(`${API_URL}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplier)
    });
    return res.json();
  },

  deleteSupplier: async (id) => {
    const res = await fetch(`${API_URL}/suppliers/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Inventory
  getInventory: async () => {
    const res = await fetch(`${API_URL}/inventory`);
    return res.json();
  },

  getLowStock: async () => {
    const res = await fetch(`${API_URL}/inventory/low-stock`);
    return res.json();
  },

  getExpiringSoon: async () => {
    const res = await fetch(`${API_URL}/inventory/expiring-soon`);
    return res.json();
  },

  addInventoryItem: async (item) => {
    const res = await fetch(`${API_URL}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return res.json();
  },

  updateInventoryItem: async (id, updates) => {
    const res = await fetch(`${API_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  deleteInventoryItem: async (id) => {
    const res = await fetch(`${API_URL}/inventory/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Sales
  createSale: async (saleData) => {
    const res = await fetch(`${API_URL}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });
    return res.json();
  },

  getSales: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const res = await fetch(`${API_URL}/sales?${params}`);
    return res.json();
  },

  getSaleItems: async (saleId) => {
    const res = await fetch(`${API_URL}/sales/${saleId}/items`);
    return res.json();
  },

  // Reports
  getSalesSummary: async (period) => {
    const res = await fetch(`${API_URL}/reports/sales-summary?period=${period}`);
    return res.json();
  },

  getBestSelling: async () => {
    const res = await fetch(`${API_URL}/reports/best-selling`);
    return res.json();
  },

  getSlowMoving: async () => {
    const res = await fetch(`${API_URL}/reports/slow-moving`);
    return res.json();
  },

  getProfitLoss: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const res = await fetch(`${API_URL}/reports/profit-loss?${params}`);
    return res.json();
  }
};
