# Banking System API Documentation

**Version**: 2.0  
**Base URL**: `http://localhost:5000/api`  
**Authentication**: JWT Bearer Token

---

## Table of Contents

- [Authentication](#authentication)
- [Banking Operations](#banking-operations)
- [User & Account Management](#user--account-management)
- [Admin Operations](#admin-operations)
- [Error Responses](#error-responses)

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Register User

**POST** `/auth/register`

Create a new user account with KYC verification.

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "tax_id": "123-45-6789",
  "doc_type": "National_ID",
  "doc_num": "ID123456"
}
```

**Validation Rules:**
- `full_name`: 2-100 characters
- `email`: Valid email format
- `password`: Min 8 chars, must contain uppercase, lowercase, and digit
- `tax_id`: Alphanumeric with hyphens
- `doc_type`: Optional, defaults to "National_ID"
- `doc_num`: Optional, defaults to "PENDING"

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user_id": "uuid-here",
  "account_id": "uuid-here"
}
```

**Error Response (409):**
```json
{
  "success": false,
  "error": "Email or Tax ID already registered"
}
```

---

### Login

**POST** `/auth/login`

Authenticate and receive JWT tokens.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "user_id": "uuid-here",
    "full_name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

**Token Expiry:**
- Access Token: 1 hour (3600 seconds)
- Refresh Token: 30 days (2592000 seconds)

---

### Refresh Token

**POST** `/auth/refresh`

Get a new access token using refresh token.

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "access_token": "new_token_here"
}
```

---

### Logout

**POST** `/auth/logout`

Revoke current JWT token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

---

## Banking Operations

### Deposit Funds

**POST** `/account/deposit`  
🔒 **Requires Authentication**

**Request Body:**
```json
{
  "account_id": "account-uuid",
  "amount": 1000.50
}
```

**Validation:**
- Amount: Positive, max 2 decimal places, up to 1,000,000
- Account must belong to authenticated user

**Success Response (200):**
```json
{
  "success": true,
  "new_balance": 1500.50,
  "status": "completed"
}
```

**Note:** Deposits ≥ $10,000 are flagged for review (`status: "flagged_for_review"`).

---

### Withdraw Funds

**POST** `/account/withdraw`  
🔒 **Requires Authentication**

**Request Body:**
```json
{
  "account_id": "account-uuid",
  "amount": 500.00
}
```

**Validation:**
- Amount: Positive, max 2 decimal places
- Account must have sufficient funds
- Account must be active

**Success Response (200):**
```json
{
  "success": true,
  "new_balance": 1000.50,
  "amount_withdrawn": 500.00
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Insufficient funds"
}
```

---

### Transfer Funds

**POST** `/account/transfer`  
🔒 **Requires Authentication**

Transfer money between accounts with 1% service fee.

**Request Body:**
```json
{
  "from_account": "sender-uuid",
  "to_account": "receiver-uuid",
  "amount": 1000.00
}
```

**Validation:**
- Amount: Positive, max 2 decimal places
- Sender and receiver must be different accounts
- Sender must have sufficient funds (amount + 1% fee)
- Both accounts must be active

**Success Response (200):**
```json
{
  "success": true,
  "message": "Transfer completed successfully",
  "transfer_amount": 1000.00,
  "fee_charged": 10.00,
  "total_deducted": 1010.00,
  "new_balance": 490.50
}
```

**Fee Calculation:**
```
Fee = Amount × 0.01 (1%)
Total Deduction = Amount + Fee
```

---

## User & Account Management

### Get User Dashboard

**GET** `/user/dashboard/<user_id>`  
🔒 **Requires Authentication**

Retrieve user information and account details.

**URL Parameter:**
- `user_id`: User UUID (must match authenticated user)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "full_name": "John Doe",
      "email": "john.doe@example.com",
      "tax_id": "123456789",
      "tax_id_masked": "***6789",
      "account_id": "full-uuid-here",
      "account_id_masked": "12345678****87654321",
      "account_type": "savings",
      "balance": 1500.50,
      "status": "active",
      "verification_status": "pending",
      "document_type": "National_ID"
    }
  ]
}
```

**Data Masking:**
- Account ID: Shows first 8 and last 8 chars
- Tax ID: Shows last 4 digits only

---

### Get Account Statement

**GET** `/account/statement/<account_id>?days=30`  
🔒 **Requires Authentication**

Retrieve transaction history.

**URL Parameters:**
- `account_id`: Account UUID (must belong to authenticated user)

**Query Parameters:**
- `days`: Number of days (default: 30, max: 365)

**Success Response (200):**
```json
{
  "success": true,
  "account_id": "account-uuid",
  "period_days": 30,
  "history": [
    {
      "transaction_id": 1,
      "transaction_type": "deposit",
      "amount": 500.00,
      "balance_after": 1500.50,
      "created_at": "2026-01-18T10:30:00"
    },
    {
      "transaction_type": "transfer_out",
      "amount": -1010.00,
      "balance_after": 490.50,
      "created_at": "2026-01-18T11:00:00"
    }
  ]
}
```

**Transaction Types:**
- `deposit`: Funds added
- `withdrawal`: Funds removed
- `transfer_in`: Received transfer
- `transfer_out`: Sent transfer (includes fee)

---

### Update User Profile

**PUT** `/user/profile/<user_id>`  
🔒 **Requires Authentication**

Update user information.

**Request Body:**
```json
{
  "full_name": "John Updated Doe",
  "email": "new.email@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

**Error Response (409):**
```json
{
  "success": false,
  "error": "Email already in use"
}
```

---

### Reset PIN

**POST** `/account/reset-pin`  
🔒 **Requires Authentication**

Reset or update account PIN. Requires password verification for security.

**Request Body:**
```json
{
  "account_id": "account-uuid",
  "new_pin": "1234",
  "password": "UserLoginPassword"
}
```

**Validation:**
- `new_pin`: 4-6 digits
- `password`: Must match user's login password

**Success Response (200):**
```json
{
  "success": true,
  "message": "PIN reset successfully"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid password"
}
```

---

## Admin Operations

### Apply Interest

**POST** `/admin/apply-interest`  
🔒 **Requires Authentication** ⚠️ *Admin Role Required*

Apply daily interest to all active savings accounts.

**Interest Rate:** 4% annual (0.011% daily)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Interest applied to 150 accounts",
  "rate": "0.0110%"
}
```

---

### Get Audit Logs

**GET** `/admin/audit-logs?limit=50`  
🔒 **Requires Authentication** ⚠️ *Admin Role Required*

Retrieve system audit logs.

**Query Parameters:**
- `limit`: Number of logs (default: 50, max: 200)

**Success Response (200):**
```json
{
  "success": true,
  "count": 50,
  "logs": [
    {
      "log_id": 1,
      "table_name": "accounts",
      "record_id": "account-uuid",
      "old_value": 1000.00,
      "new_value": 1500.00,
      "changed_at": "2026-01-18T10:30:00"
    }
  ]
}
```

---

## Utility Endpoints

### Health Check

**GET** `/health`

Check API and database connectivity.

**Success Response (200):**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

**Error Response (503):**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "Connection refused"
}
```

---

## Error Responses

### Validation Error (400)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "loc": ["password"],
      "msg": "Password must contain at least one uppercase letter",
      "type": "value_error"
    }
  ]
}
```

### Unauthorized (401)

```json
{
  "success": false,
  "error": "Token has expired",
  "message": "Please refresh your token"
}
```

### Forbidden (403)

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### Not Found (404)

```json
{
  "success": false,
  "error": "Account not found"
}
```

### Conflict (409)

```json
{
  "success": false,
  "error": "Email or Tax ID already registered"
}
```

### Internal Server Error (500)

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Example Usage (cURL)

### Register and Login Flow

```bash
# 1. Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Smith",
    "email": "jane@example.com",
    "password": "SecurePass123",
    "tax_id": "987-65-4321"
  }'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "SecurePass123"
  }'

# Save the access_token from response

# 3. Deposit funds
curl -X POST http://localhost:5000/api/account/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "account_id": "<your_account_id>",
    "amount": 5000.00
  }'

# 4. Get account statement
curl -X GET "http://localhost:5000/api/account/statement/<account_id>?days=7" \
  -H "Authorization: Bearer <your_access_token>"

# 5. Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer <your_access_token>"
```

---

## Frontend Integration Guide

### Storing JWT Tokens

**Option 1: localStorage (Simple)**
```javascript
// After login
localStorage.setItem('access_token', response.access_token);
localStorage.setItem('refresh_token', response.refresh_token);

// For API calls
const token = localStorage.getItem('access_token');
fetch('/api/account/deposit', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Option 2: httpOnly Cookies (More Secure)**
Requires backend modifications to set cookies.

### Handling Token Expiration

```javascript
// Intercept 401 responses
if (response.status === 401) {
  const refreshToken = localStorage.getItem('refresh_token');
  
  // Try to refresh
  const refreshResponse = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${refreshToken}`
    }
  });
  
  if (refreshResponse.ok) {
    const data = await refreshResponse.json();
    localStorage.setItem('access_token', data.access_token);
    // Retry original request
  } else {
    // Redirect to login
    window.location.href = '/login.html';
  }
}
```

### Logout Function

```javascript
async function logout() {
  const token = localStorage.getItem('access_token');
  
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login.html';
}
```

---

## Security Best Practices

1. **Always use HTTPS in production**
2. **Never log sensitive data** (passwords, tokens, full card numbers)
3. **Validate all inputs** on both client and server
4. **Use environment variables** for secrets
5. **Implement rate limiting** (recommended: Flask-Limiter)
6. **Set secure cookie flags** when using cookies
7. **Regularly rotate JWT secrets**
8. **Monitor for suspicious activity** (check logs)

---

## Development Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Initialize database:**
   ```bash
   mysql -u root -p < ad.sql
   ```

4. **Run application:**
   ```bash
   python app.py
   ```

5. **Test health endpoint:**
   ```bash
   curl http://localhost:5000/api/health
   ```

---

**Last Updated:** 2026-01-19  
**Maintained by:** Banking System Development Team
