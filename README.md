# Savora Atlas (formerly CafePOS)

## Overview
Savora Atlas is a **modern, premium self‑ordering & POS web application** built with Next.js 14, Tailwind CSS, Prisma, and OneSignal.  The UI has been re‑branded with a warm color palette (#e1d4c2 / #6e473b) and the new **Savora Atlas** logo throughout.

## Features
- Customer dashboard with real‑time order updates (WebSocket/BroadcastChannel)
- Self‑ordering experience for tables and take‑away
- Admin backend for menu, categories, products, coupons & reports
- Web push notifications via OneSignal
- Dark‑mode friendly, glassmorphism style, micro‑animations
- Fully responsive design for mobile/tablet/desktop

## Tech Stack
- **Framework**: Next.js 14 (App Router) – React 18
- **Styling**: Tailwind CSS with custom palette and gradients
- **Database**: Prisma ORM (PostgreSQL/MySQL/SQLite)
- **Auth**: NextAuth (email/password) – located under `src/app/(auth)`
- **Push**: OneSignal SDK (initialized in `src/app/layout.tsx`)
- **Realtime**: BroadcastChannel + optional Pusher integration for remote displays

## Getting Started
```bash
# Clone the repository
git clone https://github.com/praveenrajs2608-creator/cafepos.git
cd cafepos

# Install dependencies
npm ci   # or `npm install`

# Set up environment variables
cp .env.example .env
# Edit .env with your DB URL and OneSignal credentials

# Run database migrations
npx prisma migrate dev --name init

# Start the development server
npm run dev
```
Open http://localhost:3000 in your browser.

## Build & Deploy
```bash
npm run build   # creates an optimized production bundle
npm start       # runs the built app
```
Deploy to Vercel, Netlify, or any Node.js host.

## Branding
- **Primary colors**: `#e1d4c2` (light beige) and `#6e473b` (deep brown). These are defined in `tailwind.config.ts`.
- **Logos** (placed in `public/`):
  - `logo-48.png` – used in the KDS top bar and admin sidebar
  - `logo-1080.png` – used on login, signup, and self‑order landing screens
- All components now reference the new logo via Next.js `Image` component.

## Project Structure (high‑level)
- `src/app/` – Next.js route groups (`(auth)`, `(backend)`, `customer-display`, etc.)
- `src/components/` – reusable UI components (KDS top bar, shared widgets)
- `src/lib/` – helper utilities (pricing, API wrappers)
- `public/` – static assets, logos, OneSignal files

## Contributing
1. Fork the repo and create a feature branch.
2. Follow the existing code style (Prettier + ESLint).
3. Write tests for new functionality.
4. Submit a Pull Request with a clear description.

## License
This project is licensed under the MIT License.

---
*Savora Atlas – your premium self‑ordering solution.*
