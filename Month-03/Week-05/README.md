# VoltManager - Electrician Management System

A comprehensive real-time dashboard for managing electricians, jobs, tasks, materials, and work reports. Built with modern web technologies for efficient field operations and project tracking.

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Technology Stack](#technology-stack)
- [Login Credentials](#login-credentials)
- [Project Features](#project-features)
- [API Endpoints](#api-endpoints)
- [Data Persistence](#data-persistence)
- [Project Structure](#project-structure)

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

1. **Navigate to project directory:**
   ```bash
   cd Month-03/Week-05
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Open your browser and navigate to: `http://localhost:3000`

---

## 🛠 Technology Stack

### Backend
- **Framework:** Express.js 4.21.2
- **Real-time Communication:** Socket.IO 4.8.3
- **Authentication:** JWT (jsonwebtoken 9.0.3)
- **Security:** bcryptjs 3.0.3 (password hashing)
- **File Upload:** Multer 2.1.1
- **Input Validation:** express-validator 7.3.2

### Frontend
- **UI Framework:** React 19.0.0
- **Type Safety:** TypeScript 5.8.2
- **Styling:** Tailwind CSS 4.1.14
- **Icons:** Lucide React 0.546.0
- **Animations:** Motion 12.23.24
- **Charts:** Chart.js 4.5.1 & react-chartjs-2 5.3.1
- **Date Formatting:** date-fns 4.1.0
- **Build Tool:** Vite 6.2.0

### Development
- **Language:** TypeScript
- **Linting:** TypeScript Compiler (`npm run lint`)
- **Build:** `npm run build`
- **Preview:** `npm run preview`

---

## 🔐 Login Credentials

### Admin Account
```
Email:    admin@gmail.com
Password: admin123
Role:     Admin (Full system access)
```

### Electrician Account
```
Email:    john@gmail.com
Password: elec123
Role:     Electrician (Limited access - own tasks only)
```

### 📂 Credential Storage Location
**Path:** `src/models/store.ts` (lines 6-24)

Credentials are stored with bcrypt-hashed passwords. To add new users, edit this file and add entries to the `users` array following the same structure.

**Important:** Never commit plain-text passwords. Always use `bcrypt.hashSync(password, 10)` for hashing.

---

## ✨ Project Features

### Dashboard
- Real-time operational overview with KPIs
- Active electrician tracking
- Job pipeline visualization
- System health monitoring (JWT Protected)
- Interactive charts and graphs

### Electrician Management
- View all electricians with skill levels
- Filter by availability status (Available/Busy)
- Track current status and skill levels
- Add/Edit/Delete electrician records (Admin only)

### Job Management
- Create and assign work orders
- Track job status (Scheduled, In Progress, Completed)
- Multi-field search (title, location, assigned electrician)
- Job deadline monitoring
- Real-time job notifications

### Task Management
- Granular task tracking within jobs
- Priority-based task filtering
- Task completion status toggling
- Role-based task visibility (electricians see only assigned tasks)
- Hours worked tracking

### Reporting & Analytics
- **Daily Work Reports:** Date-filtered task summaries
- **Completion Analytics:** Task efficiency metrics with visual progress bars
- **Electrician Performance:** Per-electrician completion rates and workload

### Materials Inventory
- Track materials and components
- Quantity and unit tracking
- Low stock alerts (< 10 units)
- Add/Edit/Delete inventory items (Admin only)

### File Management
- Image uploads for work evidence
- Report uploads (Admin only)
- File metadata tracking
- 5MB file size limit
- Supported formats: PNG, JPEG, PDF

### Real-time Features
- WebSocket notifications via Socket.IO
- Live task completion alerts
- Job assignment notifications
- System-wide notification center with timestamp tracking

---

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/login
- Request: { email, password }
- Response: { token, user: { id, email, role, name } }
```

### Electricians
```
GET    /api/electricians                    # List all
GET    /api/electricians?status=Active      # Filter by status
GET    /api/electricians?availability=Busy  # Filter by availability
POST   /api/electricians                    # Create (Admin)
PUT    /api/electricians/:id                # Update (Admin)
DELETE /api/electricians/:id                # Delete (Admin)
```

### Jobs
```
GET    /api/jobs                           # List all
GET    /api/jobs/search?keyword=term       # Search jobs
POST   /api/jobs                           # Create (Admin)
PUT    /api/jobs/:id                       # Update (Admin)
DELETE /api/jobs/:id                       # Delete (Admin)
```

### Tasks
```
GET    /api/tasks                          # List all (role-filtered)
GET    /api/tasks?status=Completed         # Filter by status
POST   /api/tasks                          # Create (Admin)
PUT    /api/tasks/:id                      # Update (mark complete)
DELETE /api/tasks/:id                      # Delete (Admin)
```

### Materials
```
GET    /api/materials                      # List all
POST   /api/materials                      # Create (Admin)
PUT    /api/materials/:id                  # Update (Admin)
DELETE /api/materials/:id                  # Delete (Admin)
```

### Reports
```
GET    /api/reports                        # List archived reports
GET    /api/reports/daily?date=YYYY-MM-DD # Daily work logs
GET    /api/reports/completion             # Task completion metrics
GET    /api/reports/electrician            # Per-electrician performance
DELETE /api/reports/:id                    # Delete report (Admin)
```

### File Uploads
```
POST /api/upload/image   # Upload work evidence (all users)
POST /api/upload/report  # Upload reports (Admin only)
```

### Dashboard
```
GET /api/dashboard/stats # System statistics and chart data
```

---

## 💾 Data Persistence

### Storage Method
Data is persisted to a JSON file for reliability across server restarts.

### Data File Location
**Path:** `data/store.json`

The file is automatically created on first run. All CRUD operations (Create, Read, Update, Delete) are immediately saved to this file.

### Data Structure
```
{
  "users": [...],           # Authentication accounts
  "electricians": [...],    # Staff profiles
  "jobs": [...],           # Work orders
  "tasks": [...],          # Task items
  "materials": [...],      # Inventory
  "reports": [...],        # Generated reports
  "uploads": [...]         # File metadata
}
```

### Loading Data
- On server startup, the application loads data from `data/store.json`
- If the file doesn't exist, default sample data is used
- All changes are automatically persisted to the file

---

## 📁 Project Structure

```
Month-03/Week-05/
├── src/
│   ├── App.tsx                    # Main React application
│   ├── main.tsx                   # React entry point
│   ├── index.css                  # Global styles
│   ├── models/
│   │   └── store.ts              # Data store & credentials
│   ├── routes/
│   │   ├── authRoutes.ts         # Login endpoints
│   │   └── dashboardRoutes.ts    # Dashboard analytics
│   ├── middleware/
│   │   └── auth.ts               # JWT & role-based auth
│   └── utils/
│       ├── response.ts           # API response formatting
│       └── persistence.ts        # Data file I/O
├── server.ts                      # Express server & API routes
├── vite.config.ts                 # Vite build configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind CSS config
├── package.json                   # Dependencies & scripts
├── .env.example                   # Environment template
├── data/
│   └── store.json                # Persistent data storage (auto-created)
└── README.md                      # This file
```

---

## 🔒 Security Features

- **JWT Authentication:** Secure token-based authentication with 24-hour expiration
- **Password Hashing:** Passwords hashed with bcrypt (10 salt rounds)
- **Role-Based Access Control:** Admin and Electrician roles with endpoint restrictions
- **Input Validation:** Express-validator for all API inputs
- **CORS Enabled:** Socket.IO configured for cross-origin requests
- **File Upload Restrictions:** Whitelist for file types, 5MB size limit

---

## 📝 Available Scripts

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run lint

# Clean build artifacts
npm run clean
```

---

## 🐛 Troubleshooting

### Server won't start
- Ensure Node.js v18+ is installed: `node --version`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check port 3000 is available: `lsof -i :3000`

### Login fails
- Verify credentials in `src/models/store.ts`
- Ensure `.env` has `JWT_SECRET` configured
- Check browser console for detailed error messages

### Data not persisting
- Ensure `data/` directory exists and is writable
- Check file permissions: `ls -la data/`
- Review server logs for persistence errors

### Styles not loading
- Run `npm install` to install Tailwind dependencies
- Rebuild: `npm run clean && npm run build`

---

## 📞 Support & Contact

For issues or questions:
1. Check the troubleshooting section above
2. Review API endpoints documentation
3. Inspect browser DevTools (F12) for error details
4. Check server console output for error logs

---

## 📄 License

This is a development/educational project for Month-03, Week-05 of the VoltManager initiative.

---

**Last Updated:** April 2026  
**Version:** 5.0.4 (Enterprise Edition)  
**Status:** Active Development
