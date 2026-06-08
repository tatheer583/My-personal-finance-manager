# 💰 Personal Finance Manager

A modern, responsive web application for tracking personal income and expenses. Manage your finances with ease using an intuitive interface, real-time analytics, and persistent data storage.

![React](https://img.shields.io/badge/React-19.2-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.2-purple?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green

## 🎯 Features

### Core Functionality
- ✅ **Track Income** - Record money received from family members or custom sources
- ✅ **Track Expenses** - Log expenses by category with descriptions
- ✅ **Financial Dashboard** - View total income, expenses, balance, and trends at a glance
- ✅ **Transaction History** - Complete view of all transactions with advanced filtering
- ✅ **Data Persistence** - Automatic save to browser's localStorage
- ✅ **CSV Export** - Export transaction data for external analysis

### Advanced Features
- 📊 **Visual Analytics** - Bar charts comparing income vs. expenses
- 🔍 **Smart Filtering** - Filter by transaction type, date range, and keyword search
- 👥 **Sender Management** - Add custom income sources beyond predefined family members
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 🎨 **Modern UI** - Clean, intuitive interface with smooth animations.



## 🏗️ Project Structure


personal-finance-manager/
├── src/
│   ├── App.tsx                 # Root component & state management
│   ├── types.ts                # TypeScript type definitions
│   ├── constants.ts            # App constants (senders, currency)
│   ├── index.tsx               # React entry point
│   ├── index.css               # Global styles & Tailwind
│   └── components/
│       ├── Dashboard.tsx       # Landing view with summary & charts
│       ├── IncomeForm.tsx      # Form for recording income
│       ├── ExpenseForm.tsx     # Form for recording expenses
│       ├── TransactionsList.tsx # Transaction history & filtering
│       ├── ManageSenders.tsx   # Manage income sources
│       └── Sidebar.tsx         # Navigation menu
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5.8.2 | Type safety |
| **Vite** | 6.2.0 | Build tool & dev server |
| **Tailwind CSS** | Latest | Utility-first styling |
| **Recharts** | 3.5.1 | Data visualization |
| **Lucide React** | 0.561.0 | Icon components |



##  Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd personal-finance-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

---

## 📖 Usage Guide

### Adding Income
1. Click **"Add Income"** in the sidebar
2. Select the income source from the dropdown (Father, Shakir Bhai, etc.)
3. Enter the amount received
4. (Optional) Add a note
5. Click **"Record Income"**

### Adding Expenses
1. Click **"Add Expense"** in the sidebar
2. Enter the expense category (e.g., "Groceries", "Utilities")
3. Enter the amount spent
4. Click **"Record Expense"**

### Viewing Transactions
1. Click **"View Transactions"** to see complete history
2. Use filters to narrow results:
   - **Type:** Filter by Income or Expense
   - **Date Range:** Specify start and end dates
   - **Search:** Find by category/sender name

### Managing Income Sources
1. Click **"Manage Senders"** in the sidebar
2. View predefined senders (locked, cannot be deleted)
3. Add new custom sender names
4. Delete custom senders as needed

### Exporting Data
1. Click the **"Export CSV"** button in the sidebar
2. Your transaction history downloads as `transactions.csv`
3. Open in Excel, Google Sheets, or any spreadsheet application

--

## 💾 Data Storage

- **Location:** Browser's localStorage
- **Format:** JSON serialized transactions and senders arrays
- **Persistence:** Data survives page refreshes and browser restarts
- **Note:** Data is device-specific; clearing browser data will delete all records

### Data Schema

```typescript
Transaction {
  id: number              // Unique timestamp identifier
  type: 'INCOME' | 'EXPENSE'
  amount: number          // Transaction amount
  categoryOrSender: string // Income sender or expense category
  date: string            // ISO 8601 datetime
  note?: string           // Optional notes (income only)
}

Sender {
  name: string            // Income source name
  isDefault: boolean      // Cannot delete default senders
}
```

---

## 🎨 Customization

### Modifying Default Income Sources
Edit [`constants.ts`](constants.ts):
```typescript
export const PREDEFINED_SENDERS = [
  "Father (Abu)",
  "Shakir Bhai",
  "Ameen Bhai",
  "Tanveer Bhai"
];
```

### Changing Currency
Edit [`constants.ts`](constants.ts):
```typescript
export const CURRENCY = "PKR"; // Change to USD, EUR, etc.
```

### Theming
Modify color classes in component files (uses Tailwind CSS):
- Primary: `slate` colors
- Accents: `emerald` (income), `red` (expense)

---

## 🔄 Roadmap

### Planned Features
- 🔐 User authentication & multi-user support
- 📅 Recurring transaction templates
- 💾 Cloud backup & sync
- 📈 Advanced analytics & reports
- 🎯 Budget planning & spending alerts
- ✏️ Edit/delete existing transactions
- 📱 Native mobile app

---

## 🐛 Known Limitations

- No transaction editing or deletion (planned for v2)
- Data stored locally only (no cloud backup)
- No multi-user support
- Limited to browser storage size

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Here's how to help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the [usage guide](#-usage-guide) above

---

## 👨‍💻 Author

Created with ❤️ for personal finance management.

---

**Last Updated:** April 6, 2026
