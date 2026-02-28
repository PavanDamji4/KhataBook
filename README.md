# KhataBook — Business Manager

> **A private, full-stack business management platform built for a real mirchi powder business.**  
> Track batches, sales, customers, udhaar, and profits — all in one place.

---

## What is KhataBook?

KhataBook is a purpose-built business tracker for a small-scale mirchi powder business. It handles the entire lifecycle — from buying raw mirchi and processing it into powder, to selling it, tracking payments, and generating profit reports.

No marketplace. No public access. Just clean, accurate hisab.

---

## Features

### Batch Management
- Create named batches for each processing cycle (Bedgi, Jawari, Guntur)
- Enter all costs — raw mirchi, drying labor, salt, oil, grinding
- Auto-calculates **cost per kg** from total batch cost and final powder output
- Real-time stock tracking per batch
- Delete batch with all associated sales and payment data

### Sales Tracking
- Sell any quantity — 0.2 kg, 0.5 kg, 1 kg, any amount
- Custom selling rate per sale (because customers bargain)
- Auto-calculates profit on each sale against batch cost/kg
- Payment status — Paid / Unpaid / Partial

### Customer Manager
- Global customer database reused across batches
- Per-customer purchase history within each batch
- Add and delete customers

### Udhaar Tracker
- See all pending payments per batch
- Record full or partial payments
- Auto-updates payment status when fully paid

### Profit & Reports
- Per-batch profit breakdown
- Global reports across all batches
- Filter by time period and mirchi type
- Monthly profit trend with visual bar charts
- **Download PDF reports** — both per-batch and global

### Dashboard
- **Batches tab** — all batch cards with stock progress bars and low stock alerts
- **Overview tab** — total profit (all time), this month's profit, total udhaar, total revenue, total kg sold

### Authentication
- Secure login page with predefined credentials
- Session-based auth guard on all pages
- No public access

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, Tailwind CSS, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | Firebase Firestore |
| PDF Export | jsPDF (browser-side) |
| Auth | Session Storage (client-side guard) |

---

## Project Structure

```
Khatabook/
│
├── backend/
│   ├── config/
│   │   └── firebase.js              # Firebase Admin SDK init
│   ├── controllers/
│   │   ├── batchController.js       # Batch CRUD + cost/kg calculation
│   │   ├── customerController.js    # Customer CRUD
│   │   ├── saleController.js        # Sales + stock reduction + profit calc
│   │   └── paymentController.js     # Payments + udhaar logic
│   ├── middleware/
│   │   └── errorHandler.js          # Global error handler
│   ├── routes/
│   │   ├── batches.js
│   │   ├── customers.js
│   │   ├── sales.js
│   │   └── payments.js
│   ├── serviceAccountKey.json       # Firebase credentials (not committed)
│   ├── .env                         # PORT config
│   └── server.js                    # Express app entry point
│
└── frontend/
    ├── css/
    │   └── style.css                # Global styles + animations
    ├── js/
    │   ├── config.js                # API base URL
    │   ├── dashboard.js             # Dashboard logic + batch cards
    │   ├── batch.js                 # Batch detail page core
    │   ├── customers.js             # Customer tab logic
    │   ├── sales.js                 # Sales tab logic
    │   ├── udhaar.js                # Udhaar tab + payment modal
    │   └── reports.js               # Reports tab + PDF download
    ├── pages/
    │   ├── batch-detail.html        # Per-batch workspace (4 tabs)
    │   └── reports.html             # Global reports page
    ├── login.html                   # Login page
    └── index.html                   # Dashboard (main home)
```

---

## Firebase Collections

```
/batches
  └── name, mirchiType, purchaseDate
      rawQty, rawRate, dryingCost, saltCost, oilCost, grindingCost
      finalPowderQty, costPerKg, stockRemaining, createdAt

/customers
  └── name, phone, address, createdAt

/sales
  └── batchId, batchName, customerId, customerName
      qtyKg, sellingRate, totalAmount, profitOnSale
      paymentStatus, amountPaid, saleDate

/payments
  └── saleId, batchId, customerId, customerName
      amountPaid, paymentDate, note
```

---

## How the Business Logic Works

```
Buy Raw Mirchi (dynamic rate)
        ↓
Create Batch → Enter all costs → costPerKg auto-calculated
        ↓
Stock added to that batch
        ↓
Customer orders → Add Sale
  → Select batch + customer
  → Enter qty (any decimal) + your selling rate
  → Profit = (sellingRate - costPerKg) × qty
  → Stock reduces automatically
        ↓
Payment status → Paid / Unpaid / Partial
        ↓
Unpaid → appears in Udhaar Tracker
        ↓
Customer pays → Mark paid → Udhaar clears
        ↓
Reports → See batch profit, customer breakdown, download PDF
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- Firebase project with Firestore enabled
- `serviceAccountKey.json` from Firebase Console

### Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```
PORT=5000
```

Place your `serviceAccountKey.json` inside the `backend/` folder.

Start the server:
```bash
npm run dev
```

Server runs at `http://localhost:5000`

### Frontend Setup

No build step needed. Just open `frontend/login.html` in your browser or serve the `frontend/` folder via any static server.

Update `frontend/js/config.js` with your backend URL:
```js
const API_BASE_URL = "http://localhost:5000/api";
```

---

## API Endpoints

### Batches
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/batches` | Get all batches |
| GET | `/api/batches/:id` | Get single batch |
| POST | `/api/batches` | Create new batch |
| PUT | `/api/batches/:id` | Update batch |
| DELETE | `/api/batches/:id` | Delete batch + all its data |

### Customers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/customers` | Get all customers |
| GET | `/api/customers/:id` | Get single customer |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |

### Sales
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/sales` | Get all sales |
| GET | `/api/sales/batch/:batchId` | Get sales by batch |
| GET | `/api/sales/customer/:customerId` | Get sales by customer |
| POST | `/api/sales` | Create sale |
| PUT | `/api/sales/:id` | Update sale |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payments` | Record payment |
| GET | `/api/payments/batch/:batchId` | Get payments by batch |
| GET | `/api/payments/udhaar/:batchId` | Get pending udhaar by batch |

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend server port | `5000` |

---

## Key Design Decisions

**Batch-centric architecture** — Every sale, customer interaction, profit, and udhaar entry is scoped to a specific batch. This mirrors how the business actually works — one processing cycle at a time.

**Customers are global, sales are per-batch** — A customer is saved once and can appear across multiple batches. Their sales are tracked per batch so you always know which batch they bought from.

**costPerKg is calculated on batch creation** — Once a batch is created, its cost per kg is locked in. Every sale from that batch uses this fixed cost for profit calculation, even if later batches have different costs.

**Decimal quantities** — Supports selling any quantity (0.2 kg, 0.5 kg, 1.5 kg etc.) with floating point handled carefully to avoid long decimal display issues.

---

## Screenshots

> Dashboard — Batches Tab

> Dashboard — Overview Tab

> Batch Detail — Sales Tab

> Udhaar Tracker

> PDF Report

---

## Built By

Developed as a real-world business tool for a mirchi powder small business.  
Built with ❤️ from scratch — system design, database, backend, and frontend.

---

## License

Private use only. Not intended for public distribution.