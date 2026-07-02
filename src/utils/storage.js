const STORAGE_KEY = 'pharmacy_inventory';
const USERS_KEY = 'pharmacy_users';

export const loadInventory = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading inventory:', error);
    return [];
  }
};

export const saveInventory = (inventory) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  } catch (error) {
    console.error('Error saving inventory:', error);
  }
};

export const initializeDefaultUser = () => {
  try {
    const users = localStorage.getItem(USERS_KEY);
    if (!users) {
      const defaultUsers = [
        { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
        { id: 2, username: 'staff', password: 'staff123', role: 'staff' }
      ];
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
  } catch (error) {
    console.error('Error initializing users:', error);
  }
};
