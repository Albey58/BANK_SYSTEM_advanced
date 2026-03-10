// ==================== CONFIGURATION ====================
const API_BASE_URL = 'http://localhost:5000/api';

// ==================== AUTHENTICATION MANAGER ====================
class AuthManager {
    static getToken() {
        return localStorage.getItem('access_token');
    }

    static getRefreshToken() {
        return localStorage.getItem('refresh_token');
    }

    static getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    static isLoggedIn() {
        return !!this.getToken();
    }

    static async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            updateUIState();
            return { success: true };
        }
        return { success: false, error: data.error };
    }

    static async logout() {
        try {
            const token = this.getToken();
            if (token) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.clear();
            updateUIState();
            window.location.reload();
        }
    }

    static async fetchWithAuth(endpoint, options = {}) {
        let token = this.getToken();
        
        if (!token) {
            showToast('Please login to continue', 'error');
            openModal(loginModal);
            throw new Error('No token found');
        }

        // Add headers
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        let response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        // Handle Token Expiry (401)
        if (response.status === 401) {
            // Try to refresh token
            const refreshed = await this.refreshToken();
            if (refreshed) {
                // Retry original request with new token
                token = this.getToken();
                options.headers['Authorization'] = `Bearer ${token}`;
                response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            } else {
                // Refresh failed - force logout
                this.logout();
                throw new Error('Session expired');
            }
        }

        return response;
    }

    static async refreshToken() {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) return false;

            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${refreshToken}` }
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('access_token', data.access_token);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }
        return false;
    }
}

// ==================== DOM ELEMENTS ====================
// Navigation
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navbar = document.getElementById('navbar');

// Auth Buttons
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const heroGetStarted = document.getElementById('heroGetStarted');
const learnMore = document.getElementById('learnMore');

// Modals
const registerModal = document.getElementById('registerModal');
const loginModal = document.getElementById('loginModal');
const closeRegister = document.getElementById('closeRegister');
const closeLogin = document.getElementById('closeLogin');
const registerOverlay = document.getElementById('registerOverlay');
const loginOverlay = document.getElementById('loginOverlay');

// Forms
const submitRegister = document.getElementById('submitRegister');
const submitLogin = document.getElementById('submitLogin');
const openRegisterFromLogin = document.getElementById('openRegisterFromLogin');

// Dashboard
const dashboardContent = document.getElementById('dashboardContent');
const dashboardLoading = document.getElementById('dashboardLoading');
const dashboardLoginPrompt = document.getElementById('dashboardLoginPrompt');

// Operations
const depositBtn = document.getElementById('depositBtn');
const transferBtn = document.getElementById('transferBtn');
const statementBtn = document.getElementById('statementBtn');
const applyInterestBtn = document.getElementById('applyInterestBtn');
const loadAuditBtn = document.getElementById('loadAuditBtn');

// Toast
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');
const toastClose = document.getElementById('toastClose');

// ==================== UI STATE MANAGEMENT ====================
function updateUIState() {
    const isLoggedIn = AuthManager.isLoggedIn();
    
    if (isLoggedIn) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        document.getElementById('profileLink').style.display = 'block';
        
        // Auto-load dashboard if on dashboard section
        if (document.getElementById('dashboard').classList.contains('active')) {
            loadDashboard();
        }
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        
        dashboardContent.style.display = 'none';
        dashboardLoading.style.display = 'none';
        dashboardLoginPrompt.style.display = 'block';
    }
}

// ==================== NAVIGATION ====================
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = link.getAttribute('data-section');
        
        // Update active nav link
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Show target section
        sections.forEach(section => section.classList.remove('active'));
        document.getElementById(targetSection).classList.add('active');
        
        // Handle Dashboard Access
        if (targetSection === 'dashboard') {
            if (AuthManager.isLoggedIn()) {
                loadDashboard();
            } else {
                dashboardContent.style.display = 'none';
                dashboardLoginPrompt.style.display = 'block';
            }
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ==================== MODAL HANDLING ====================
function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Event Listeners
loginBtn.addEventListener('click', () => openModal(loginModal));
registerBtn.addEventListener('click', () => openModal(registerModal));
heroGetStarted.addEventListener('click', () => openModal(registerModal));

closeRegister.addEventListener('click', () => closeModal(registerModal));
registerOverlay.addEventListener('click', () => closeModal(registerModal));

closeLogin.addEventListener('click', () => closeModal(loginModal));
loginOverlay.addEventListener('click', () => closeModal(loginModal));

openRegisterFromLogin.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(loginModal);
    setTimeout(() => openModal(registerModal), 300);
});

logoutBtn.addEventListener('click', () => AuthManager.logout());

learnMore.addEventListener('click', () => {
    document.querySelector('.features-section').scrollIntoView({ behavior: 'smooth' });
});

// ==================== TOAST & ALERTS ====================
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toastIcon.textContent = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 4000);
}

function showResult(elementId, message, isSuccess) {
    const element = document.getElementById(elementId);
    element.innerHTML = message;
    element.className = `result-message ${isSuccess ? 'success' : 'error'}`;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
        element.className = 'result-message';
    }, 5000);
}

// ==================== AUTH OPERATIONS ====================

// Login
submitLogin.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('Please enter both email and password', 'error');
        return;
    }
    
    submitLogin.disabled = true;
    submitLogin.textContent = 'Logging in...';
    
    const result = await AuthManager.login(email, password);
    
    if (result.success) {
        showToast('Login successful! Welcome back.', 'success');
        closeModal(loginModal);
        
        // Navigate to dashboard
        document.querySelector('[data-section="dashboard"]').click();
    } else {
        showResult('loginResult', result.error, false);
    }
    
    submitLogin.disabled = false;
    submitLogin.textContent = 'Login to Account';
});

// Registration
submitRegister.addEventListener('click', async () => {
    const fullName = document.getElementById('regFullName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const taxId = document.getElementById('regTaxId').value;
    const docType = document.getElementById('regDocType').value;
    const docNum = document.getElementById('regDocNum').value;
    
    if (!fullName || !email || !password || !taxId) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: fullName,
                email: email,
                password: password,
                tax_id: taxId,
                doc_type: docType,
                doc_num: docNum,
                initial_pin: document.getElementById('regPin').value
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResult('registerResult', 'Account created! Please login.', true);
            showToast('Registration successful! Please login.', 'success');
            setTimeout(() => {
                closeModal(registerModal);
                openModal(loginModal);
            }, 2000);
        } else {
            // Show validation errors cleanly
            let errorMsg = data.error;
            if (data.details) {
                errorMsg += ': ' + data.details.map(d => d.msg).join(', ');
            }
            showResult('registerResult', errorMsg, false);
        }
    } catch (error) {
        showResult('registerResult', 'Network error occurred', false);
    }
});

// ==================== DASHBOARD LOADING ====================
async function loadDashboard() {
    const user = AuthManager.getUser();
    if (!user) return;

    dashboardLoginPrompt.style.display = 'none';
    dashboardContent.style.display = 'none';
    dashboardLoading.style.display = 'block';

    try {
        const response = await AuthManager.fetchWithAuth(`/user/dashboard/${user.user_id}`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            const userData = data.data[0];
            
            // Update Stats
            document.getElementById('userName').textContent = userData.full_name;
            document.getElementById('verificationStatus').textContent = userData.verification_status || 'Pending';
            
            const totalBalance = data.data.reduce((sum, acc) => sum + acc.balance, 0);
            document.getElementById('totalBalance').textContent = 
                `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

            // Render Accounts
            const accountsList = document.getElementById('accountsList');
            accountsList.innerHTML = '';
            
            data.data.forEach(acc => {
                const div = document.createElement('div');
                div.className = 'account-item';
                div.innerHTML = `
                    <div class="account-info">
                        <h4>${acc.account_type.toUpperCase()} Account</h4>
                        <p class="text-sm text-secondary">ID: ${acc.account_id_masked}</p>
                        <span class="status-badge ${acc.status}">${acc.status}</span>
                    </div>
                    <div class="account-balance">
                        $${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                `;
                // Add click-to-copy functionality for account ID
                div.addEventListener('click', () => {
                    document.getElementById('depositAccountId').value = acc.account_id;
                    document.getElementById('fromAccount').value = acc.account_id;
                    document.getElementById('statementAccountId').value = acc.account_id;
                    document.getElementById('resetPinAccountId').value = acc.account_id;
                    showToast('Account ID copied to forms!', 'info');
                });
                accountsList.appendChild(div);
            });

            dashboardLoading.style.display = 'none';
            dashboardContent.style.display = 'block';
        }
    } catch (error) {
        console.error('Dashboard load failed:', error);
        dashboardLoading.innerHTML = '<p class="error-text">Failed to load dashboard. Please try logging in again.</p>';
    }
}

// ==================== OPERATIONS ====================

// Deposit
depositBtn.addEventListener('click', async () => {
    const accountId = document.getElementById('depositAccountId').value;
    const amount = document.getElementById('depositAmount').value;
    
    if (!accountId || !amount) return showToast('Invalid details', 'error');
    
    try {
        const response = await AuthManager.fetchWithAuth('/account/deposit', {
            method: 'POST',
            body: JSON.stringify({ account_id: accountId, amount: parseFloat(amount) })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResult('depositResult', `Success! New Balance: $${data.new_balance}`, true);
            loadDashboard(); // Refresh stats
            document.getElementById('depositAmount').value = '';
        } else {
            showResult('depositResult', data.error, false);
        }
    } catch (error) {
        showResult('depositResult', error.message, false);
    }
});

// Transfer
transferBtn.addEventListener('click', async () => {
    const from = document.getElementById('fromAccount').value;
    const to = document.getElementById('toAccount').value;
    const amount = document.getElementById('transferAmount').value;
    const pin = document.getElementById('transferPin').value;
    
    if (!from || !to || !amount || !pin) return showToast('Invalid details', 'error');
    
    try {
        const response = await AuthManager.fetchWithAuth('/account/transfer', {
            method: 'POST',
            body: JSON.stringify({ from_account: from, to_account: to, amount: parseFloat(amount), pin: pin })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResult('transferResult', `Transfer Complete! Fee: $${data.fee_charged}`, true);
            loadDashboard();
            document.getElementById('transferAmount').value = '';
        } else {
            showResult('transferResult', data.error, false);
        }
    } catch (error) {
        showResult('transferResult', error.message, false);
    }
});

// Withdraw
document.getElementById('withdrawBtn').addEventListener('click', async () => {
    const accountId = document.getElementById('withdrawAccountId').value;
    const amount = document.getElementById('withdrawAmount').value;
    const pin = document.getElementById('withdrawPin').value;
    
    if (!accountId || !amount || !pin) return showToast('Invalid details', 'error');
    
    try {
        const response = await AuthManager.fetchWithAuth('/account/withdraw', {
            method: 'POST',
            body: JSON.stringify({ 
                account_id: accountId, 
                amount: parseFloat(amount),
                pin: pin 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResult('withdrawResult', `Withdrawal Complete! New Balance: $${data.new_balance}`, true);
            loadDashboard();
            document.getElementById('withdrawAmount').value = '';
            document.getElementById('withdrawPin').value = '';
        } else {
            showResult('withdrawResult', data.error, false);
        }
    } catch (error) {
        showResult('withdrawResult', error.message, false);
    }
});

// Open New Account
document.getElementById('submitOpenAccount').addEventListener('click', async () => {
    const type = document.getElementById('newAccType').value;
    const pin = document.getElementById('newAccPin').value;
    
    if (!pin || pin.length < 4) return showResult('openAccountResult', 'Invalid PIN', false);
    
    try {
        const response = await AuthManager.fetchWithAuth('/account/create', {
            method: 'POST',
            body: JSON.stringify({ account_type: type, pin: pin })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Account Opened Successfully!', 'success');
            setTimeout(() => {
                document.getElementById('openAccountModal').classList.remove('active');
                loadDashboard();
            }, 1000);
        } else {
            showResult('openAccountResult', data.error, false);
        }
    } catch (error) {
        showResult('openAccountResult', error.message, false);
    }
});

// Update Profile
document.getElementById('submitProfileUpdate').addEventListener('click', async () => {
    const fullName = document.getElementById('updateFullName').value;
    const email = document.getElementById('updateEmail').value;
    
    if (!fullName && !email) return showResult('profileUpdateResult', 'Nothing to update', false);
    
    const user = AuthManager.getUser();
    
    try {
        const response = await AuthManager.fetchWithAuth(`/user/profile/${user.user_id}`, {
            method: 'PUT',
            body: JSON.stringify({ 
                full_name: fullName || undefined,
                email: email || undefined
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResult('profileUpdateResult', 'Profile Updated!', true);
        } else {
            showResult('profileUpdateResult', data.error, false);
        }
    } catch (error) {
        showResult('profileUpdateResult', error.message, false);
    }
});

// Reset PIN
document.getElementById('submitResetPin').addEventListener('click', async () => {
    const accountId = document.getElementById('resetPinAccountId').value;
    const newPin = document.getElementById('resetPinNewPin').value;
    const password = document.getElementById('resetPinPassword').value;
    
    if (!accountId || !newPin || !password) {
        return showResult('resetPinResult', 'Please fill all fields', false);
    }
    
    if (newPin.length < 4 || newPin.length > 6) {
        return showResult('resetPinResult', 'PIN must be 4-6 digits', false);
    }
    
    try {
        const response = await AuthManager.fetchWithAuth('/account/reset-pin', {
            method: 'POST',
            body: JSON.stringify({ 
                account_id: accountId, 
                new_pin: newPin,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResult('resetPinResult', 'PIN Reset Successfully!', true);
            showToast('PIN has been updated', 'success');
            setTimeout(() => {
                document.getElementById('resetPinModal').classList.remove('active');
                // Clear fields
                document.getElementById('resetPinNewPin').value = '';
                document.getElementById('resetPinPassword').value = '';
            }, 2000);
        } else {
            showResult('resetPinResult', data.error, false);
        }
    } catch (error) {
        showResult('resetPinResult', error.message, false);
    }
});

// Statement
statementBtn.addEventListener('click', async () => {
    const accountId = document.getElementById('statementAccountId').value;
    const days = document.getElementById('statementDays').value;
    
    if (!accountId) return showToast('Enter Account ID', 'error');
    
    try {
        const response = await AuthManager.fetchWithAuth(`/account/statement/${accountId}?days=${days}`);
        const data = await response.json();
        
        const resultDiv = document.getElementById('statementResult');
        if (data.history?.length) {
            resultDiv.innerHTML = `
                <table class="statement-table">
                    <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Balance</th></tr></thead>
                    <tbody>${data.history.map(tx => `
                        <tr>
                            <td>${new Date(tx.created_at).toLocaleDateString()}</td>
                            <td>${tx.transaction_type}</td>
                            <td class="${tx.amount>=0?'text-success':'text-danger'}">
                                ${tx.amount>=0?'+':''}$${Math.abs(tx.amount).toFixed(2)}
                            </td>
                            <td>$${tx.balance_after.toFixed(2)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>`;
        } else {
            resultDiv.innerHTML = '<p class="text-center">No transactions found.</p>';
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Admin Operations (Protected)
applyInterestBtn.addEventListener('click', async () => {
    if (!confirm('Apply daily interest?')) return;
    try {
        const response = await AuthManager.fetchWithAuth('/admin/apply-interest', { method: 'POST' });
        const data = await response.json();
        showResult('interestResult', data.message || data.error, data.success);
    } catch (error) {
        showResult('interestResult', error.message, false);
    }
});

loadAuditBtn.addEventListener('click', async () => {
    try {
        const response = await AuthManager.fetchWithAuth('/admin/audit-logs');
        const data = await response.json();
        
        const div = document.getElementById('auditLogsResult');
        div.innerHTML = data.logs.map(log => `
            <div class="audit-item" style="flex-direction: column; align-items: flex-start;">
                <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 0.5rem;">
                    <div>
                        <strong>${log.table_name}.${log.column_name || 'unspecified'}</strong>
                        ${log.owner_name ? `<br><span style="font-size: 0.85em; color: var(--primary-purple);">Owner: ${log.owner_name}</span>` : ''}
                    </div>
                    <span class="status-badge ${log.action_type === 'DELETE' ? 'closed' : 'active'}">
                        ${log.action_type || 'UPDATE'}
                    </span>
                </div>
                <p class="text-secondary" style="font-family: monospace;">
                    ${log.action_type === 'TRANSFER' 
                        ? `<span class="text-white">Amount: $${log.old_value.toFixed(2)}</span> <span class="text-muted">|</span> <span class="text-danger">Fee: $${log.new_value.toFixed(2)}</span>`
                        : `${log.old_value !== null ? '$' + log.old_value.toFixed(2) : 'N/A'} 
                           <span style="color: var(--primary-blue); margin: 0 0.5rem;">➜</span> 
                           ${log.new_value !== null ? '$' + log.new_value.toFixed(2) : 'N/A'}`
                    }
                </p>
                <small style="color: var(--text-muted); margin-top: 0.25rem;">
                    ${new Date(log.changed_at).toLocaleString()}
                </small>
            </div>
        `).join('');
    } catch (error) {
        showToast('Failed to load audit logs', 'error');
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateUIState();
    console.log('Comet Bank Frontend v2.0 Initialized');
});
