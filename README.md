# VoltManager Pro

VoltManager Pro is an operations dashboard for electrical service teams. It brings admin, client, and electrician workflows into one place so crews can track jobs, tasks, payments, reports, uploads, and live operational status without switching tools.

The app is designed around a shared command-center experience: a live dashboard, role-based navigation, job and task management, payment actions, reporting views, and drag-and-drop report uploads. It runs with a lightweight Node/Express server and a React/Vite frontend, making it easy to launch locally and test across devices on the same network.

## What It Does

- Tracks jobs, tasks, electricians, clients, materials, and payments in one interface.
- Shows live operational metrics and status charts on the dashboard.
- Supports mock payment flows for client-to-admin and admin-to-electrician actions.
- Provides reporting views for archived reports, daily work, completion, and activity summaries.
- Allows drag-and-drop report uploads directly from the Reports section.
- Uses role-based access so admin, client, and electrician users see different actions.

## Requirements

You will need:

- Node.js 18 or newer
- npm 9 or newer
- A modern browser such as Chrome, Edge, or Firefox
- Port `3000` available on the machine running the server
- Local network access if you want to open the app from another device

Optional, if you plan to customize environment values:

- A `.env` file based on `.env.example`
- Razorpay test credentials if you want to swap the mocked payment setup for real keys later

## Setup

1. Install dependencies.
   ```bash
   npm install
   ```

2. Start the development server.
   ```bash
   npm run dev
   ```

3. Open the app in your browser.
   - Local machine: `http://localhost:3000`
   - Another device on the same Wi-Fi: `http://<your-host-ip>:3000`

4. Build the production bundle when you want a compiled output.
   ```bash
   npm run build
   ```

## Demo Accounts

Use one of these test accounts after starting the app:

- Admin: `admin@voltmanager.com` / `admin123`
- Electrician: `john@voltmanager.com` / `elec123`
- Client: `client@example.com` / `client123`

## Available Scripts

- `npm run dev` - starts the Express server and Vite dev workflow
- `npm run build` - creates the production frontend bundle
- `npm run preview` - serves the production build locally
- `npm run lint` - runs TypeScript checking with `tsc --noEmit`
- `npm run clean` - removes the `dist` folder

## Notes

- Uploaded reports are saved into the in-memory store for the current session.
- Report uploads support PDF, PNG, and JPG files.
- The server listens on `0.0.0.0`, so the app can be opened from other devices on the same network when the firewall allows it.

---

VoltManager Pro is a local-first demo workspace for electrical operations management.
