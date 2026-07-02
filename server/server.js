import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import multer from 'multer';
import xlsx from 'xlsx';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pharmacy_inventory',
  waitForConnections: true,
  connectionLimit: 10,
});

pool.getConnection()
  .then(conn => { console.log('✓ Connected to MySQL database'); conn.release(); })
  .catch(err => console.error('✗ Database connection failed:', err.message));

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query(
      'SELECT id, username, role FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    if (rows.length > 0) res.json({ success: true, user: rows[0] });
    else res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Users ─────────────────────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, role FROM users');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, password, role]
    );
    res.json({ id: result.insertId, username, role });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Suppliers ─────────────────────────────────────────────────────────────────
app.get('/api/suppliers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY name');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const { name, contact_person, phone, email, address } = req.body;
    const [result] = await pool.query(
      'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      [name, contact_person, phone, email, address]
    );
    res.json({ id: result.insertId, name, contact_person, phone, email, address });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Inventory ─────────────────────────────────────────────────────────────────
app.get('/api/inventory', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, s.name AS supplier_name
      FROM inventory i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      ORDER BY i.product_name ASC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/inventory/low-stock', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, s.name AS supplier_name
      FROM inventory i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.quantity_in_stock <= i.reorder_level
      ORDER BY i.quantity_in_stock ASC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/inventory/expiring-soon', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, s.name AS supplier_name,
        DATEDIFF(i.expiry_date, CURDATE()) AS days_until_expiry
      FROM inventory i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.expiry_date IS NOT NULL
        AND i.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
      ORDER BY i.expiry_date ASC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const { item_code, product_name, brand, quantity_in_stock, cost_price, srp, expiry_date, supplier_id, notes, reorder_level } = req.body;
    const [result] = await pool.query(
      `INSERT INTO inventory (item_code, product_name, brand, quantity_in_stock, cost_price, srp, expiry_date, supplier_id, notes, reorder_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_code || null, product_name, brand || null, quantity_in_stock || 0, cost_price || 0, srp || 0, expiry_date || null, supplier_id || null, notes || null, reorder_level || 10]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { item_code, product_name, brand, quantity_in_stock, cost_price, srp, expiry_date, supplier_id, notes, reorder_level } = req.body;
    await pool.query(
      `UPDATE inventory SET item_code=?, product_name=?, brand=?, quantity_in_stock=?, cost_price=?, srp=?, expiry_date=?, supplier_id=?, notes=?, reorder_level=? WHERE id=?`,
      [item_code || null, product_name, brand || null, quantity_in_stock || 0, cost_price || 0, srp || 0, expiry_date || null, supplier_id || null, notes || null, reorder_level || 10, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM inventory WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Bulk Import ───────────────────────────────────────────────────────────────
app.post('/api/inventory/bulk-import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];

    // Use raw array-of-arrays to handle merged title rows (e.g. "DR HOPE INVENTORY")
    const rawAoa = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });

    if (rawAoa.length === 0) return res.status(400).json({ error: 'File is empty or unreadable' });

    // Find the header row: the row that contains "Product Name" or "product_name"
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(rawAoa.length, 10); i++) {
      const rowStr = rawAoa[i].map(c => String(c).toLowerCase()).join('|');
      if (rowStr.includes('product name') || rowStr.includes('product_name')) {
        headerRowIdx = i;
        break;
      }
    }
    if (headerRowIdx === -1) headerRowIdx = 0; // fallback: first row is header

    const headers = rawAoa[headerRowIdx].map(h => String(h).trim());
    const dataRows = rawAoa.slice(headerRowIdx + 1);

    if (dataRows.length === 0) return res.status(400).json({ error: 'No data rows found after header' });

    // Helper: get value by possible column names
    const getCol = (rowObj, ...names) => {
      for (const n of names) {
        if (rowObj[n] !== undefined && rowObj[n] !== '') return rowObj[n];
      }
      return '';
    };

    // Convert array rows to objects using detected headers
    const raw = dataRows.map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
      return obj;
    });

    const results = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < raw.length; i++) {
      const row = raw[i];

      const item_code    = String(getCol(row, 'Item Code', 'item_code', 'ItemCode')).trim();
      const product_name = String(getCol(row, 'Product Name', 'product_name', 'Name', 'name')).trim();
      const brand        = String(getCol(row, 'Brand', 'brand')).trim();
      const qty          = parseInt(getCol(row, 'Quantity in Stock', 'quantity_in_stock', 'Quantity', 'qty') || 0) || 0;
      const cost_price   = parseFloat(getCol(row, 'Cost Price', 'cost_price', 'Cost') || 0) || 0;
      const srp          = parseFloat(getCol(row, 'SRP', 'srp', 'Selling Price', 'Price') || 0) || 0;
      const supplier_name = String(getCol(row, 'Supplier', 'supplier')).trim();
      const notes        = String(getCol(row, 'Notes', 'notes')).trim();

      // Parse expiry date — supports Date objects, ISO strings, and MM/YYYY format
      let expiry_date = null;
      const rawExpiry = getCol(row, 'Expiry Date', 'expiry_date', 'Expiry');
      if (rawExpiry) {
        if (rawExpiry instanceof Date) {
          if (!isNaN(rawExpiry.getTime())) expiry_date = rawExpiry.toISOString().split('T')[0];
        } else {
          const s = String(rawExpiry).trim();
          // Handle MM/YYYY or M/YYYY format
          const mmYyyy = s.match(/^(\d{1,2})\/(\d{4})$/);
          if (mmYyyy) {
            expiry_date = `${mmYyyy[2]}-${mmYyyy[1].padStart(2, '0')}-01`;
          } else {
            const d = new Date(s);
            if (!isNaN(d.getTime())) expiry_date = d.toISOString().split('T')[0];
          }
        }
      }

      if (!product_name) {
        // Skip completely empty rows silently
        if (!item_code && !brand && !srp && !cost_price) continue;
        results.failed++;
        results.errors.push(`Row ${headerRowIdx + i + 2}: Missing product name`);
        continue;
      }

      try {
        let supplier_id = null;
        if (supplier_name) {
          const [existing] = await pool.query('SELECT id FROM suppliers WHERE name = ?', [supplier_name]);
          if (existing.length > 0) {
            supplier_id = existing[0].id;
          } else {
            const [ins] = await pool.query('INSERT INTO suppliers (name) VALUES (?)', [supplier_name]);
            supplier_id = ins.insertId;
          }
        }

        if (item_code) {
          await pool.query(
            `INSERT INTO inventory (item_code, product_name, brand, quantity_in_stock, cost_price, srp, expiry_date, supplier_id, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               product_name=VALUES(product_name), brand=VALUES(brand),
               quantity_in_stock=VALUES(quantity_in_stock), cost_price=VALUES(cost_price),
               srp=VALUES(srp), expiry_date=VALUES(expiry_date),
               supplier_id=VALUES(supplier_id), notes=VALUES(notes)`,
            [item_code, product_name, brand, qty, cost_price, srp, expiry_date, supplier_id, notes]
          );
        } else {
          await pool.query(
            `INSERT INTO inventory (product_name, brand, quantity_in_stock, cost_price, srp, expiry_date, supplier_id, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               brand=VALUES(brand), quantity_in_stock=VALUES(quantity_in_stock),
               cost_price=VALUES(cost_price), srp=VALUES(srp),
               expiry_date=VALUES(expiry_date), supplier_id=VALUES(supplier_id), notes=VALUES(notes)`,
            [product_name, brand, qty, cost_price, srp, expiry_date, supplier_id, notes]
          );
        }
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${headerRowIdx + i + 2} (${product_name}): ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `Import done: ${results.success} added/updated, ${results.failed} failed`,
      results,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Bulk Import (JSON batches) ────────────────────────────────────────────────
// Accepts { rows: [...] } — called in batches of ~200 from the frontend.
// Uses a single multi-row INSERT per batch for speed (3000 rows ≈ 15 requests).
app.post('/api/inventory/bulk-import-json', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0)
      return res.status(400).json({ error: 'No rows provided' });

    const results = { success: 0, failed: 0, errors: [] };

    // 1. Collect unique supplier names and resolve/create them in one pass
    const supplierNames = [...new Set(rows.map(r => r.supplier_name).filter(Boolean))];
    const supplierMap = {};
    for (const name of supplierNames) {
      const [existing] = await pool.query('SELECT id FROM suppliers WHERE name = ?', [name]);
      if (existing.length > 0) {
        supplierMap[name] = existing[0].id;
      } else {
        const [ins] = await pool.query('INSERT INTO suppliers (name) VALUES (?)', [name]);
        supplierMap[name] = ins.insertId;
      }
    }

    // 2. Build a single INSERT ... ON DUPLICATE KEY UPDATE for the whole batch
    const values = [];
    const placeholders = [];

    for (const row of rows) {
      const item_code    = row.item_code || null;
      const product_name = String(row.product_name || '').trim();
      if (!product_name) { results.failed++; continue; }

      const brand        = row.brand || null;
      const qty          = parseInt(row.quantity_in_stock) || 0;
      const cost_price   = parseFloat(row.cost_price) || 0;
      const srp          = parseFloat(row.srp) || 0;
      const expiry_date  = row.expiry_date || null;
      const supplier_id  = row.supplier_name ? (supplierMap[row.supplier_name] || null) : null;
      const notes        = row.notes || null;

      placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?)');
      values.push(item_code, product_name, brand, qty, cost_price, srp, expiry_date, supplier_id, notes);
    }

    if (placeholders.length === 0) {
      return res.json({ success: true, results });
    }

    await pool.query(
      `INSERT INTO inventory
         (item_code, product_name, brand, quantity_in_stock, cost_price, srp, expiry_date, supplier_id, notes)
       VALUES ${placeholders.join(', ')}
       ON DUPLICATE KEY UPDATE
         product_name     = VALUES(product_name),
         brand            = VALUES(brand),
         quantity_in_stock= VALUES(quantity_in_stock),
         cost_price       = VALUES(cost_price),
         srp              = VALUES(srp),
         expiry_date      = VALUES(expiry_date),
         supplier_id      = VALUES(supplier_id),
         notes            = VALUES(notes)`,
      values
    );

    results.success = placeholders.length;
    res.json({ success: true, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Sales ─────────────────────────────────────────────────────────────────────
app.post('/api/sales', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { user_id, items, payment_method, total_amount } = req.body;
    const [saleResult] = await conn.query(
      'INSERT INTO sales (user_id, total_amount, payment_method) VALUES (?, ?, ?)',
      [user_id, total_amount, payment_method]
    );
    const saleId = saleResult.insertId;
    for (const item of items) {
      await conn.query(
        'INSERT INTO sales_items (sale_id, inventory_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [saleId, item.inventory_id, item.quantity, item.unit_price, item.subtotal]
      );
      await conn.query(
        'UPDATE inventory SET quantity_in_stock = quantity_in_stock - ? WHERE id = ?',
        [item.quantity, item.inventory_id]
      );
    }
    await conn.commit();
    res.json({ success: true, saleId });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

app.get('/api/sales', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `SELECT s.*, u.username FROM sales s JOIN users u ON s.user_id = u.id`;
    const params = [];
    if (start_date && end_date) {
      query += ' WHERE DATE(s.transaction_date) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    query += ' ORDER BY s.transaction_date DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sales/:id/items', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT si.*, i.product_name AS item_name, i.item_code
      FROM sales_items si
      JOIN inventory i ON si.inventory_id = i.id
      WHERE si.sale_id = ?
    `, [req.params.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Reports ───────────────────────────────────────────────────────────────────
app.get('/api/reports/sales-summary', async (req, res) => {
  try {
    const { period } = req.query;
    let fmt = '%Y-%m-%d';
    if (period === 'weekly') fmt = '%Y-%u';
    if (period === 'monthly') fmt = '%Y-%m';
    const [rows] = await pool.query(`
      SELECT DATE_FORMAT(transaction_date, ?) AS period,
        COUNT(*) AS total_transactions,
        SUM(total_amount) AS total_sales,
        AVG(total_amount) AS avg_transaction
      FROM sales
      WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      GROUP BY period ORDER BY period DESC
    `, [fmt]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/reports/best-selling', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.id, i.product_name AS name, i.item_code AS barcode,
        SUM(si.quantity) AS total_sold,
        SUM(si.subtotal) AS total_revenue,
        COUNT(DISTINCT si.sale_id) AS transaction_count
      FROM sales_items si
      JOIN inventory i ON si.inventory_id = i.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY i.id ORDER BY total_sold DESC LIMIT 10
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/reports/slow-moving', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.id, i.product_name AS name, i.item_code AS barcode, i.quantity_in_stock AS quantity,
        COALESCE(SUM(si.quantity), 0) AS total_sold,
        COALESCE(COUNT(DISTINCT si.sale_id), 0) AS transaction_count
      FROM inventory i
      LEFT JOIN sales_items si ON i.id = si.inventory_id
      LEFT JOIN sales s ON si.sale_id = s.id AND s.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY i.id HAVING total_sold < 5 ORDER BY total_sold ASC LIMIT 10
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/reports/profit-loss', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const [rows] = await pool.query(`
      SELECT DATE(s.transaction_date) AS date,
        SUM(si.subtotal) AS revenue,
        SUM(si.quantity * i.cost_price) AS cost,
        SUM(si.subtotal - (si.quantity * i.cost_price)) AS profit
      FROM sales s
      JOIN sales_items si ON s.id = si.sale_id
      JOIN inventory i ON si.inventory_id = i.id
      WHERE DATE(s.transaction_date) BETWEEN ? AND ?
      GROUP BY DATE(s.transaction_date) ORDER BY date DESC
    `, [start_date || '2024-01-01', end_date || '2099-12-31']);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✓ Server running on http://localhost:${PORT}`));
