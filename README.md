# Pharmacy Inventory Management System

A web-based inventory platform for pharmacies with MySQL database, barcode scanning, and automated reporting.

## Features

- User authentication with role-based access (Admin/Staff)
- MySQL database for persistent storage
- Add/manage inventory items with barcode support
- Scan barcodes to process sales and auto-deduct from inventory
- Generate monthly inventory reports
- Low stock alerts
- Export reports as JSON
- User management (Admin only)

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL
- Barcode Scanner: html5-qrcode

## Quick Setup

See [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) for detailed setup guide.

### Quick Start:

1. Setup MySQL database using `server/database.sql`
2. Configure `.env` with your MySQL credentials
3. Install dependencies: `npm install`
4. Start backend: `npm run server`
5. Start frontend: `npm run dev` (in a new terminal)
6. Login with: username `admin`, password `admin123`

## Usage

- **Inventory Tab**: Add new medicines with barcode, quantity, price, and expiry date
- **Scanner Tab**: Use camera to scan barcodes or enter manually to process sales
- **Reports Tab**: View statistics and export monthly reports
- **Users Tab** (Admin only): Manage user accounts

## Database

All data is stored in MySQL database. View/edit data using MySQL Workbench:
- Database: `pharmacy_inventory`
- Tables: `users`, `inventory`
