# <img src="https://www.handtohandloans.com/icon-192x192.png" width="32" height="32" align="center" /> HandToHand Loans

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

> India's fastest-growing fintech distribution ecosystem. Seamlessly empowering Loan DSA Agents, borrowers, and distributors with real-time analytics, automated eligibility checks, and instant commodity live tracking.

---

## 🌟 Key Features

### 🏦 Loan DSA Agent Portal
* **Automated Eligibility Checks:** Instant credit worthiness & bank matching engine in under 60 seconds.
* **DSA Partner Verification:** Secure, QR-based digital partner verification agreements.
* **Commission Desk:** Structured DSA payouts tracking across 100+ Banks & NBFCs.

### 💰 Live Commodities Rates Desk
* **Real-time Pricing:** Real-time spot price fetch for **Gold (24K, 22K, 18K)** and **Silver (999, 925)** powered by open-source feeds.
* **City-Wise Premiums:** Indian city-specific pricing adjustments matching standard IBJA indices.
* **Historical Trackers:** 12-month performance logs and valuation estimators.

### 🧮 Comprehensive Financial Calculators
* **EMI Engines:** Flat vs. Reducing interest comparisons with visual charts and breakdown graphs.
* **100+ Calculators:** Dedicated pages for APY, SIP, FD, RD, GST, Loan Eligibility, and custom credit cards checkers.

---

## 🛠️ Tech Stack

* **Core Framework:** Next.js 15.5.x (App Router)
* **Frontend Library:** React 19.0
* **State & Fetching:** React Hooks, Axios, CDN-cached Commodity Feeds
* **Styling System:** Vanilla CSS custom variables (optimized for dark mode, glassmorphism, & micro-animations)
* **Database & Auth:** Supabase (PostgreSQL with custom Row Level Security policies)

---

## 🚀 Getting Started

### 📋 Prerequisites
* Node.js v18.0.0 or higher
* npm or yarn

### 🔧 Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/handtohandloans/HandToHand-Loans.git
   cd HandToHand-Loans
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

---

## 📦 Deployment

This project is fully optimized for static builds and serverless environments:

```bash
# Build the production application
npm run build

# Start production server
npm run start
```

---

## 🛡️ Security & Policies
* PostgreSQL RLS policies are defined in `supabase_rls_policies.sql` to protect user-submitted applications and DSA agreements.
* Admin operations are restricted via server-side session checks.

---

## 🌐 Brand Channels
* 🎥 [YouTube Channel](https://www.youtube.com/@HANDTOHANDLOANS)
* 📸 [Instagram Page](https://www.instagram.com/handtohandloans)
* 📘 [Facebook Page](https://www.facebook.com/handtohanloans)
* 🐦 [Twitter (X)](https://x.com/HandToHandLoans)
* 📢 [Telegram Channel](https://t.me/handtohandloans)
* 💼 [LinkedIn Page](https://linkedin.com/company/handtohandloansofficial)

---
© 2026 HandToHand Loans. All rights reserved. Built with precision for financial empowerment.
