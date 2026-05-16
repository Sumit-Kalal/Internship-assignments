# ⚡ VoltManager Pro - Enterprise Electrician Management

VoltManager Pro is a comprehensive, enterprise-grade contractor management system designed for electrical service companies. It streamlines the workflow between Admins, Clients, and Electricians.

## 🚀 Key Features

- **Enterprise Dashboard**: Real-time KPI tracking, revenue analytics, and operational metrics.
- **Payment Gateway**: Integration with Razorpay (Mock) for Client-to-Admin and Admin-to-Electrician payments.
- **Role-Based Access Control (RBAC)**: Secure access for Admins, Clients, and Electricians.
- **Job & Task Management**: Full lifecycle tracking from project scheduling to completion.
- **Real-time Notifications**: Instant updates via Socket.io for job assignments and completions.
- **Resource Management**: Inventory tracking for materials and equipment.
- **Reporting Engine**: Automated daily reports, performance audits, and completion analytics.
- **File Center**: Secure document and image uploads for evidence and safety reports.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion, Chart.js.
- **Backend**: Node.js, Express, Socket.io, Multer, JWT.
- **Persistence**: Hybrid Model (Scalable Store ready for MongoDB/PostgreSQL).

## 📋 Prerequisites & Requirements

Before running VoltManager Pro, ensure you have the following installed:

1. **Node.js**: Version 18.x or higher.
2. **NPM**: Version 9.x or higher.
3. **Firebase Account**: A Google account to access [Firebase Console](https://console.firebase.google.com/).
4. **Firebase Project**:
   - Create a new project in Firebase.
   - Enable **Cloud Firestore** in your project.
   - (Optional) Enable **Firebase Authentication** if you plan to use client-side auth hooks directly.
5. **Razorpay Account (Optional)**: For real payments, obtain your API keys from the [Razorpay Dashboard](https://dashboard.razorpay.com).

## 🛠️ Environment Configuration

1. **Firebase Configuration**:
   The application expects a `firebase-applet-config.json` in the root directory. If you are running outside of AI Studio, you must create this file with your Firebase web configuration:
   ```json
   {
     "apiKey": "YOUR_API_KEY",
     "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
     "projectId": "YOUR_PROJECT_ID",
     "storageBucket": "YOUR_PROJECT_ID.appspot.com",
     "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
     "appId": "YOUR_APP_ID",
     "firestoreDatabaseId": "(default)"
   }
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   # Server
   PORT=3000
   NODE_ENV=development

   # Security
   JWT_SECRET=your_super_secret_jwt_key
   BCRYPT_SALT_ROUNDS=10

   # Razorpay (Test Mode)
   RAZORPAY_KEY_ID=rzp_test_xxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxx

   # Storage
   UPLOAD_LIMIT_MB=5
   ```

## 📦 Setup & Installation

### ⚡ Quick Start (Required Configuration Files)

Before running the project, you **MUST** have these two files in the root directory:

1. **`.env` file** - Environment variables for backend
   - Copy from `.env.example` or create with the template shown above
   - Update `JWT_SECRET` with your own secret value
   - Configure Razorpay keys if needed

2. **`firebase-applet-config.json`** - Firebase web configuration
   - Obtain from your Firebase project settings
   - Contains: apiKey, authDomain, projectId, storageBucket, etc.
   - ⚠️ **DO NOT commit to version control** (use `.gitignore`)

### Installation Steps

1. **Clone the repository**
2. **Add configuration files** (`.env` and `firebase-applet-config.json`)
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Initialize Database Subscriptions**:
   Ensure Firestore has the collections defined in `firebase-blueprint.json` (`jobs`, `tasks`, `electricians`, `reports`, `materials`, `payments`, `clients`).
5. **Development Mode**:
   ```bash
   npm run dev
   ```
   This starts the Express server with Vite middleware for React.
6. **Production Build**:
   ```bash
   npm run build
   npm start
   ```
   The build command bundles the frontend with Vite and the backend with Esbuild.

## 💳 Testing the Application

1. Open `http://localhost:3000` in your browser.
2. Use the **Default Login Credentials** provided below to explore different roles.
3. Observe real-time updates via Socket.io when tasks are completed or jobs updated.

## 💳 Payment Gateway Setup

VoltManager uses Razorpay for transactions. To enable live payments:
1. Obtain `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Configure them in your environment variables.
3. The system currently runs in **Test Mode** by default.

## 🌐 Deployment Logic

### Backend (Express)
- Configure `CORS` for your production frontend domain.
- Ensure `NODE_ENV=production` is set.
- Standard ports: `3000` (default) or environment specified.

### Frontend (React/Vite)
- Build optimized assets using `npm run build`.
- Serve static files from the `dist` directory.

## 🔐 Security & Access
- **JWT Authentication**: All API endpoints protected by token validation.
- **Password Hashing**: Bcrypt with salt rounds for secure storage.

### Default Login Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@voltmanager.com` | `password123` |
| **Electrician** | `rajesh@voltmanager.com` | `password123` |
| **Client** | `tata@example.com` | `password123` |

---
© 2026 VoltManager Enterprise Solutions.
