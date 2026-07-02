# MySQL Database Setup Instructions

## Prerequisites
- MySQL Server installed
- MySQL Workbench installed
- Node.js installed

## Step 1: Setup MySQL Database

### Option A: Using MySQL Workbench (GUI)
1. Open MySQL Workbench
2. Connect to your MySQL server (usually localhost)
3. Click "File" → "Open SQL Script"
4. Navigate to and open `server/database.sql`
5. Click the lightning bolt icon (⚡) to execute the script
6. The database and tables will be created automatically

### Option B: Using Command Line
```bash
mysql -u root -p < server/database.sql
```

## Step 2: Configure Database Connection

1. Open the `.env` file in the root directory
2. Update the database credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=pharmacy_inventory
PORT=3000
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Start the Application

You need to run TWO terminals:

### Terminal 1 - Backend Server:
```bash
npm run server
```
You should see:
- ✓ Connected to MySQL database
- ✓ Server running on http://localhost:3000

### Terminal 2 - Frontend:
```bash
npm run dev
```
You should see the Vite dev server URL (usually http://localhost:5173)

## Step 5: Access the Application

1. Open your browser to http://localhost:5173
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`

## Viewing Database in MySQL Workbench

1. Open MySQL Workbench
2. Connect to your server
3. In the left sidebar, expand "Schemas"
4. Find and expand "pharmacy_inventory"
5. Expand "Tables" to see:
   - `users` - User accounts
   - `inventory` - Medicine inventory
6. Right-click any table → "Select Rows" to view data

## Troubleshooting

### "Connection error" when logging in:
- Make sure the backend server is running (`npm run server`)
- Check that MySQL is running
- Verify database credentials in `.env`

### "Access denied" error:
- Update DB_PASSWORD in `.env` with your MySQL root password
- Or create a new MySQL user with appropriate permissions

### Port already in use:
- Change PORT in `.env` to a different number (e.g., 3001)
- Update API_URL in `src/utils/api.js` to match
