# Setup and Installation Guide

## Prerequisites

- Python 3.8 or higher
- MySQL 8.0 or higher
- pip (Python package installer)

## Installation Steps

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

The `.env` file has already been created with your database credentials. Review and update if needed:

```bash
# Edit .env file
notepad .env
```

**Important:** Never commit `.env` to version control. It contains sensitive credentials.

### 3. Initialize Database

Run the SQL schema file to create all required tables:

```bash
mysql -u root -p < ad.sql
```

Or manually in MySQL:

```sql
source C:/Users/adhin/OneDrive/Desktop/VS CODE/project/banking system/BANK-MANAGEMENT-SYSTEM/banking_system remastered/ad.sql
```

This will create:
- `users` table
- `user_auth` table
- `user_documents` table (NEW - for KYC)
- `accounts` table
- `ledger` table
- `audit_log` table

### 4. Verify Database Connection

```bash
python -c "from app import mysql; print('Database connection successful!')"
```

### 5. Run the Application

```bash
python app.py
```

You should see:
```
INFO - Starting Banking System API on port 5000 (debug=True)
 * Running on http://0.0.0.0:5000
```

### 6. Test the API

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

## What's New in Version 2.0

### ✅ Security Improvements
- **JWT Authentication**: All endpoints now require authentication
- **Environment Variables**: Database credentials removed from source code
- **Password Validation**: Strong password requirements enforced
- **Data Masking**: Sensitive data (account IDs, tax IDs) masked in responses

### ✅ New Features
- **Login/Logout**: Complete authentication flow
- **Token Refresh**: Automatic token renewal
- **Withdrawal**: New endpoint for withdrawing funds
- **Profile Updates**: Users can update their information
- **Enhanced Dashboard**: Complete user and account overview

### ✅ Bug Fixes
- **Interest Calculation**: Fixed ledger entry to show correct balance_after
- **KYC Tables**: Added missing `user_documents` table
- **Transaction Management**: Proper rollback on errors
- **Resource Management**: Standardized cursor cleanup

### ✅ Code Quality
- **Input Validation**: Pydantic schemas for all requests
- **Logging**: Comprehensive logging to file and console
- **Error Handling**: Consistent error responses
- **Documentation**: Complete API documentation

## Frontend Integration

The frontend needs to be updated to work with JWT authentication. Key changes:

### 1. Update Login Flow

Replace the old login logic with:

```javascript
async function login(email, password) {
    const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
    }
    return false;
}
```

### 2. Add Authorization Header to All Requests

```javascript
function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Example: Deposit
async function deposit(accountId, amount) {
    const response = await fetch('http://localhost:5000/api/account/deposit', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ account_id: accountId, amount })
    });
    
    return await response.json();
}
```

### 3. Handle Token Expiration

```javascript
async function handleApiCall(url, options) {
    let response = await fetch(url, options);
    
    // If token expired, try to refresh
    if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
            // Retry with new token
            options.headers = getAuthHeaders();
            response = await fetch(url, options);
        } else {
            // Redirect to login
            window.location.href = '/login.html';
        }
    }
    
    return response;
}

async function refreshToken() {
    const refresh = localStorage.getItem('refresh_token');
    const response = await fetch('http://localhost:5000/api/auth/refresh', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${refresh}`
        }
    });
    
    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        return true;
    }
    return false;
}
```

## Testing the System

### 1. Register a New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123",
    "tax_id": "TEST123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

Save the `access_token` and `account_id` from the response.

### 3. Deposit Funds

```bash
curl -X POST http://localhost:5000/api/account/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "account_id": "YOUR_ACCOUNT_ID",
    "amount": 1000
  }'
```

### 4. Check Balance

```bash
curl -X GET http://localhost:5000/api/user/dashboard/YOUR_USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### Database Connection Error

**Issue**: `Can't connect to MySQL server`

**Solution**:
1. Verify MySQL is running: `mysql -u root -p`
2. Check credentials in `.env` file
3. Ensure database exists: `SHOW DATABASES;`

### Import Error: No module named 'X'

**Issue**: Missing Python dependencies

**Solution**:
```bash
pip install -r requirements.txt
```

### Validation Errors

**Issue**: Request validation failures

**Solution**: Check the API documentation for required fields and formats. All requests must match the Pydantic schemas.

### 401 Unauthorized

**Issue**: Missing or invalid JWT token

**Solution**:
1. Ensure you're logged in
2. Include Authorization header: `Bearer <token>`
3. Check if token has expired (refresh it)

## Production Deployment

Before deploying to production:

1. **Change all secrets** in `.env`:
   - Generate strong `FLASK_SECRET_KEY`
   - Generate strong `JWT_SECRET_KEY`
   - Use production database credentials

2. **Disable debug mode**:
   ```
   FLASK_ENV=production
   FLASK_DEBUG=False
   ```

3. **Use HTTPS**: Deploy behind a reverse proxy (nginx, Apache)

4. **Add rate limiting**: Install Flask-Limiter

5. **Set up monitoring**: Track logs and errors

6. **Database backup**: Regular automated backups

7. **Firewall**: Restrict database access

## File Structure

```
banking_system remastered/
├── app.py                  # Main Flask application (UPDATED)
├── validators.py           # Pydantic validation schemas (NEW)
├── requirements.txt        # Python dependencies (NEW)
├── .env                    # Environment variables (NEW)
├── .env.example            # Environment template (NEW)
├── ad.sql                  # Database schema (UPDATED)
├── API_DOCUMENTATION.md    # Complete API docs (NEW)
├── SETUP_GUIDE.md          # This file (NEW)
├── index.html              # Frontend HTML
├── script.js               # Frontend JavaScript (NEEDS UPDATE)
├── styles.css              # Frontend CSS
└── banking_system.log      # Application logs (auto-generated)
```

## Next Steps

1. ✅ Backend is ready and fully functional
2. ⚠️ Update `script.js` to use JWT authentication
3. ⚠️ Add login/register pages to frontend
4. ⚠️ Test all features end-to-end
5. 🔜 Optional: Add password reset functionality
6. 🔜 Optional: Implement rate limiting
7. 🔜 Optional: Add account closure endpoint

## Support

For issues or questions:
1. Check `banking_system.log` for error details
2. Review API_DOCUMENTATION.md for endpoint details
3. Verify all environment variables are correct

---

**Version**: 2.0  
**Last Updated**: 2026-01-18
