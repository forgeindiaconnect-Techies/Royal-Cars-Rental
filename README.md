# 🚗 RentOS AI

**RentOS AI** is an AI-powered rental business operating system built with the MERN stack (MongoDB, Express, React, Node.js) and custom Vanilla CSS.

---

## 🛠️ Project Tech Stack
* **Frontend**: React.js (via Vite), React Router v6, Context API, Vanilla CSS.
* **Backend**: Node.js, Express.js, JWT Authentication, Role Guards.
* **Database**: MongoDB & Mongoose.
* **Concurrency**: Managed through root package-level concurrently configurations.

---

## 🚀 How to Run the Project Locally

### 1. Prerequisites
Make sure you have the following installed on your machine:
* **Node.js** (v18 or higher)
* **npm** (v9 or higher)

---

### 2. Quick Installation
Open your terminal at the project root directory (`RentOS-car-Project`) and run the following command to install dependencies for the root, backend, and frontend directories:

```bash
npm run install-all
```

---

### 3. Seed the Database
Pre-populate your MongoDB Atlas Cloud database with sample data (Super Admin, Rental Companies, Vehicles, Employees, Customers, and History Bookings) by running:

```bash
npm run seed
```

This clears the database and sets up a robust test environment.

---

### 4. Run in Development Mode
To start both the Express backend API (Port `5000`) and the Vite React frontend (Port `3000`) concurrently, run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔑 Test Credentials for All Roles

You can log in with any of these pre-seeded accounts to experience their distinct dashboard flows:

### 1. 🏢 Platform Owner (Super Admin / Forge India Connect)
* **Email**: `admin@forgeindia.com`
* **Password**: `password123`
* **Flow**: Onboard new rental companies, toggle suspension status, audit gross platform transactions, subscription fees, and commission statistics.

### 2. 🚘 Rental Company (Company Admin / Tenant Manager)
* **Email**: `owner@indidrive.com`
* **Password**: `password123`
* **Flow**: Add/Edit/Delete vehicles from inventory, review net earnings and occupancy metrics, and register staff accounts.

### 3. 👨‍💼 Company Staff (Desk Employee / Clerk)
* **Email**: `amit@indidrive.com`
* **Password**: `password123`
* **Flow**: Access customer license documents for verification approval, record vehicle condition check-out notes, and check in returns.

### 4. 👤 End Customer (Renter)
* **Email**: `rahul@gmail.com`
* **Password**: `password123`
* **Flow**: Search fleet database, consult the **AI Fleet Advisor** to generate match scores, book vehicles, upload test licenses, and review split statement invoices.
