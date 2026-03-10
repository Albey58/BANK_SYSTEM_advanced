# 🚀 Comet Bank OS v3.0 - The Financial Universe

**Comet Bank** is a stunning, modern banking system inspired by **Comet AI browser** aesthetics. Built with vanilla HTML, CSS, and JavaScript, it features glassmorphism, cosmic animations, and the elegant **Poppins** font.

The **v3.0 Pulsar Update** transforms the platform into an advanced financial ecosystem with AI-driven analytics, collaborative savings missions, and high-security duel-authentication protocols.

![Comet Bank](https://img.shields.io/badge/Version-3.0_Pulsar-00f2fe?style=for-the-badge)
![Security](https://img.shields.io/badge/Security-Duel--Auth_Enabled-success?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)

---

## ✨ Features

### 🌌 v3.0 Advanced Capabilities (New!)
*   📊 **Spending Orbit (AI Analytics)**: Deep sector breakdown using **Chart.js** with heuristic "Stellar Insights" providing real-time financial advice.
*   🎯 **Savings Missions**: Set collaborative planetary goals (e.g., "Tesla Planet" or "Lunar Base") for joint accounts with live progress tracking.
*   ⚖️ **Approval Protocol**: Duel-Authentication security for high-value transfers from joint accounts, requiring twin-PIN authorization.
*   ⚡ **Credit Pulsars**: Instant 'Credit Fuel' (loans) based on 5x monthly average balance with automated repayment orbits.

### 💼 Core Banking Features
*   ✅ **User Registration**: Complete KYC onboarding with instant account creation.
*   🛰️ **Galactic Sectors (Branches)**: Accounts are managed by specific regional sectors (e.g., Sirius Prime, Andromeda Hub), selectable during registration.
*   👥 **Twin Star Accounts (Joint Banking)**: Primary owners can invite partners to their accounts via email, enabling collaborative missions and shared liquidity.
*   📊 **Dashboard**: Real-time account overview with masked IDs and Stellar Standing (Credit Score).
*   💰 **Deposits**: Add funds with automated fraud detection for large transactions.
*   🔄 **Transfers**: Send money between accounts with automatic 1% service fee and secure warp transitions.
*   📋 **Statements**: View transaction history with customizable date ranges.
*   📈 **Admin Panel**: Apply system-wide daily interest and view comprehensive audit logs.

### 🎨 Design Highlights
*   **Cosmic Background**: Animated starfield with three-layer parallax and floating gradient orbs.
*   **Glassmorphism UI**: Frosted glass cards with optimized `backdrop-filter: blur(20px)` effects.
*   **Comet AI Theme**: Deep space gradients (Purple, Blue, Cyan, Pink) and Poppins typography.
*   **Smooth Animations**: Floating cards, shimmer effects, and micro-interactions for every state.

---

## 🗄️ Database Architecture (Schema)

| Feature Group | Table | Key Responsibility |
| :--- | :--- | :--- |
| **Identity** | `users`, `auth`, `kyc_documents` | Identity, hashed credentials, and KYC status. |
| **Network** | `branches` | Regional sectors with specific locations and manager AI. |
| **Joint Banking** | `account_members` | Maps users to accounts with roles like `primary` or `joint`. |
| **Financials** | `accounts`, `pending_transfers` | Balance management and Duel-Auth transaction queue. |
| **Audit & Goals**| `ledger`, `savings_missions`, `loans` | Immutable history, goal tracking, and credit pulsar records. |

---

## 🚀 Quick Start

### 📦 Prerequisites
- **Python 3.10+**, **MySQL Server**, **Flask**.

### 🛰️ Setup & Deployment
1.  **Install**: `pip install -r requirements.txt`
2.  **Initialize**: `python setup_comet_bank.py` (Creates tables, seeds branches, and injects security columns).
3.  **Run Backend**: `python app.py`
4.  **Open Interface**: Launch `index.html`.

---

## 📱 User Guide

### 🛰️ Branch & Sector Selection
During registration, you must choose your **Galactic Sector**. This sector handles all your local verification and manages your account orbit. You can view your sector details in the dashboard.

### 👥 Creating a Joint Account (Twin Star)
1.  Log in to your dashboard.
2.  Navigate to the **Twin Stars** card.
3.  Enter the **email address** of the partner you wish to invite (must be an existing Comet Bank user).
4.  Click **"Invite Joint Member"**.
5.  Once invited, your account becomes a "Twin Star" account, enabling shared missions and triggering **Duel-Authentication** for high-value transfers.

### 💰 Transactions & Credits
*   **Deposits**: Instant funding. $10k+ flags for manual fraud review.
*   **Transfers**: Standard transfers are instant. Joint account transfers require the partner's PIN approval via the **Authorization Banner**.
*   **Loans**: Apply for "Credit Pulsars" based on your average balance.

---

## � API Endpoints (v3.0)

| Category | Endpoint | Action |
| :--- | :--- | :--- |
| **Network** | `GET /api/branches` | Fetch all active Galactic Sectors. |
| **Joint Banking** | `POST /api/account/invite` | Invite a partner to join an account. |
| **Analytics** | `GET /api/analytics/spending/<id>` | Fetch spending orbit & AI insights. |
| **Missions** | `POST /api/account/missions` | New shared goal initialization. |
| **Security** | `POST /api/account/approvals/process` | Partner authorization workflow. |

---

<div align="center">

**Built with 💜 using Comet AI aesthetics and Poppins typography**

🌟 *Your Financial Universe Awaits* 🌟

</div>
