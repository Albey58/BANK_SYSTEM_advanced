# 🚀 Comet Bank - Your Financial Universe

A stunning, modern banking system frontend inspired by **Comet AI browser** aesthetics, built with vanilla HTML, CSS, and JavaScript, featuring glassmorphism, cosmic animations, and the elegant **Poppins** font.

![Comet Bank](https://img.shields.io/badge/Banking-Platform-blueviolet?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![Font](https://img.shields.io/badge/Font-Poppins-ff69b4?style=for-the-badge)

## ✨ Features

### 🎨 Design Highlights
- **Cosmic Background**: Animated starfield with floating gradient orbs
- **Glassmorphism UI**: Frosted glass cards with backdrop blur effects
- **Comet AI Theme**: Deep space gradients (purple, blue, cyan, pink)
- **Poppins Typography**: Clean, modern font throughout
- **Smooth Animations**: Floating cards, shimmer effects, and micro-interactions
- **Responsive Design**: Works beautifully on all screen sizes

### 💼 Banking Features
- ✅ **User Registration**: Complete KYC onboarding with instant account creation
- 📊 **Dashboard**: Real-time account overview with masked IDs
- 💰 **Deposits**: Add funds with fraud detection for large transactions
- 🔄 **Transfers**: Send money with automatic 1% service fee
- 📋 **Statements**: View transaction history with customizable date ranges
- 📈 **Admin Panel**: Apply interest and view audit logs

## 🚀 Quick Start

### Prerequisites
- Python 3.x
- MySQL Server
- Flask and required dependencies

### Backend Setup
1. Ensure your MySQL server is running
2. Database should be configured as `advanced_bank` (check `app.py` for credentials)
3. Start the Flask backend:
```bash
cd "c:\Users\adhin\OneDrive\Desktop\VS CODE\project\banking system\BANK-MANAGEMENT-SYSTEM\banking_system remastered"
python app.py
```

The backend will start on `http://localhost:5000`

### Frontend Setup
Simply open the `index.html` file in your browser:
```bash
# Option 1: Direct file open
file:///c:/Users/adhin/OneDrive/Desktop/VS CODE/project/banking system/BANK-MANAGEMENT-SYSTEM/banking_system remastered/index.html

# Option 2: Use a local server (recommended)
# Using Python
python -m http.server 8000
# Then visit: http://localhost:8000

# Or using Node.js
npx serve
```

## 📱 User Guide

### 1️⃣ Registration
1. Click **"Get Started"** or **"Launch Your Journey"**
2. Fill in your details:
   - Full Name
   - Email
   - Password
   - Tax ID
   - Document Type & Number
3. Submit to create your account
4. Note your **User ID** and **Account ID** for future access

### 2️⃣ Dashboard Access
1. Navigate to **Dashboard**
2. Enter your **User ID**
3. Click **"Load Dashboard"**
4. View your accounts, balances, and verification status

### 3️⃣ Making Deposits
1. Go to **Transactions** section
2. Enter your **Account ID**
3. Enter the **amount** to deposit
4. Click **"Deposit Money"**
5. ⚠️ Deposits over $10,000 are flagged for review

### 4️⃣ Transferring Funds
1. In **Transactions** section
2. Enter **From Account** ID
3. Enter **To Account** ID
4. Enter **amount** (remember: 1% fee applies)
5. Click **"Transfer Money"**

### 5️⃣ Viewing Statements
1. In **Transactions** section
2. Enter your **Account ID**
3. Select time period (7, 30, 90, or 365 days)
4. Click **"Load Statement"**
5. View detailed transaction history

### 6️⃣ Admin Functions
1. Navigate to **Admin** section
2. **Apply Interest**: Adds 4% APY (daily) to all savings accounts
3. **Audit Logs**: View system changes and modifications

## 🎨 Color Palette

```css
Primary Purple: #667eea
Secondary Violet: #764ba2
Primary Blue: #4facfe
Accent Cyan: #00f2fe
Primary Pink: #f093fb
Accent Coral: #f5576c

Dark Background: #0a0e27
Darker Background: #050816
```

## 📂 Project Structure

```
banking_system remastered/
├── index.html          # Main HTML structure
├── styles.css          # Cosmic styling & animations
├── script.js           # Frontend logic & API integration
├── app.py              # Flask backend server
└── README.md           # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account

### Banking Operations
- `POST /api/account/deposit` - Deposit funds
- `POST /api/account/transfer` - Transfer between accounts

### Information
- `GET /api/user/dashboard/<user_id>` - Get user dashboard
- `GET /api/account/statement/<account_id>?days=<n>` - Get transaction history

### Admin
- `POST /api/admin/apply-interest` - Apply interest to savings accounts
- `GET /api/admin/audit-logs` - Retrieve audit trail

## 🎯 Key Technologies

### Frontend
- **HTML5**: Semantic structure
- **CSS3**: Custom properties, animations, glassmorphism
- **JavaScript (ES6+)**: Async/await, Fetch API
- **Google Fonts**: Poppins family

### Backend
- **Flask**: Python web framework
- **MySQL**: Database management
- **Flask-CORS**: Cross-origin requests
- **Werkzeug**: Password hashing

## 🌟 Special Effects

### Animations
- ⭐ **Starfield**: Three-layer parallax stars
- 🌌 **Floating Orbs**: Gradient orbs with blur filters
- 💫 **Shimmer Text**: Animated gradient headings
- 🎴 **Floating Cards**: 3D hover effects with glow
- 🔄 **Smooth Transitions**: All interactions are buttery smooth

### Glassmorphism
- Frosted glass cards with `backdrop-filter: blur(20px)`
- Semi-transparent backgrounds
- Subtle borders and shadows
- Premium, modern aesthetic

## 📊 Feature Highlights

### Smart Fraud Detection
Transactions over **$10,000** are automatically flagged as `flagged_deposit` for manual review.

### Transaction Fees
All transfers include a **1% service fee** automatically calculated and deducted.

### KYC Integration
Every registration creates a complete user profile including:
- User account
- Authentication credentials (hashed)
- KYC documents
- Default savings account

### Data Masking
Account IDs are masked in the dashboard (e.g., `abcd****xyz1`) for security.

## 🔐 Security Features

- ✅ Password hashing with Werkzeug
- ✅ Atomic database transactions
- ✅ Data validation on both frontend and backend
- ✅ Account ID masking
- ✅ Fraud detection system
- ✅ Comprehensive audit logging

## 🎨 Design Philosophy

**Comet Bank** embraces the philosophy that **banking should be beautiful**. Inspired by the cosmos and modern space-tech interfaces, every pixel is crafted to:

1. **Inspire Trust**: Premium aesthetics signal reliability
2. **Reduce Friction**: Intuitive navigation and clear CTAs
3. **Delight Users**: Micro-animations make every interaction enjoyable
4. **Stay Consistent**: Unified design language across all sections

## 🚀 Future Enhancements

- [ ] Mobile menu implementation
- [ ] Login system with authentication
- [ ] Real-time balance updates (WebSockets)
- [ ] Transaction notifications
- [ ] Account settings & profile management
- [ ] Multi-factor authentication
- [ ] Dark/Light mode toggle
- [ ] Export statements to PDF
- [ ] Currency conversion
- [ ] Savings goals tracker

## 📸 Screenshots

The frontend features:
- Cosmic animated background
- Hero section with floating cards
- Feature grid showcase
- Registration modal
- Dashboard with stats
- Transaction management
- Admin panel

## 🤝 Contributing

This is a demonstration banking system. For production use, additional security measures and testing are required.

## 📄 License

This project is created for educational and demonstration purposes.

## 👨‍💻 Developer Notes

### Customization
- Modify color palette in `styles.css` `:root` variables
- API endpoint in `script.js` constant `API_BASE_URL`
- Database credentials in `app.py` config section

### Performance
- All animations use CSS transforms (GPU accelerated)
- Minimal DOM manipulation
- Debounced scroll events
- Optimized gradient rendering

### Browser Support
- Modern browsers (Chrome, Firefox, Edge, Safari)
- CSS Grid & Flexbox
- Backdrop filter support required for glassmorphism

---

<div align="center">

**Built with 💜 using Comet AI aesthetics and Poppins typography**

🌟 *Your Financial Universe Awaits* 🌟

</div>
