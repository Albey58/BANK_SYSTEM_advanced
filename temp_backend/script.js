// ==================== CONFIGURATION ====================
const API_BASE_URL = 'http://localhost:5000/api';

// Global Chart Instance
let spendingChart = null;

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
            const refreshed = await this.refreshToken();
            if (refreshed) {
                token = this.getToken();
                options.headers['Authorization'] = `Bearer ${token}`;
                response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            } else {
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

// Dashboard Elements
const dashboardContent = document.getElementById('dashboardContent');
const dashboardLoading = document.getElementById('dashboardLoading');
const dashboardLoginPrompt = document.getElementById('dashboardLoginPrompt');

// ==================== UI STATE MANAGEMENT ====================
function updateUIState() {
    const isLoggedIn = AuthManager.isLoggedIn();
    
    if (isLoggedIn) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        document.getElementById('profileLink').style.display = 'block';
        
        if (document.getElementById('dashboard').classList.contains('active')) {
            loadDashboard();
        }
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        document.getElementById('profileLink').style.display = 'none';
        
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
        
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        sections.forEach(section => section.classList.remove('active'));
        const targetElement = document.getElementById(targetSection);
        if (targetElement) {
            targetElement.classList.add('active');
        }
        
        if (targetSection === 'dashboard') {
            if (AuthManager.isLoggedIn()) loadDashboard();
            else {
                dashboardContent.style.display = 'none';
                dashboardLoginPrompt.style.display = 'block';
            }
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
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

loginBtn.addEventListener('click', () => openModal(loginModal));
registerBtn.addEventListener('click', async () => {
    openModal(registerModal);
    await fetchBranches();
});

heroGetStarted.addEventListener('click', () => registerBtn.click());
closeRegister.addEventListener('click', () => closeModal(registerModal));
registerOverlay.addEventListener('click', () => closeModal(registerModal));
closeLogin.addEventListener('click', () => closeModal(loginModal));
loginOverlay.addEventListener('click', () => closeModal(loginModal));

document.getElementById('openRegisterFromLogin').addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(loginModal);
    setTimeout(() => registerBtn.click(), 300);
});

// ==================== TOAST & ALERTS ====================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIc = document.getElementById('toastIcon');
    
    toastMsg.textContent = message;
    toast.className = `toast ${type}`;
    toastIc.textContent = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 4000);
}

function showResult(elementId, message, isSuccess) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.innerHTML = message;
    element.className = `result-message ${isSuccess ? 'success' : 'error'}`;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
        element.className = 'result-message';
    }, 5000);
}

// ==================== DASHBOARD LOAD ====================
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
            const primaryAccId = userData.account_id;

            // Update Header Stats
            document.getElementById('userName').textContent = userData.full_name;
            document.getElementById('verificationStatus').textContent = userData.verification_status || 'Active';
            document.getElementById('stellarStandingText').textContent = `Stellar Standing: ${userData.stellar_standing || 500} pts`;
            
            const totalBalance = data.data.reduce((sum, acc) => sum + acc.balance, 0);
            document.getElementById('totalBalance').textContent = `₹${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

            // Render Accounts
            renderAccountsList(data.data);

            // Parallel loading for advanced features
            await Promise.all([
                loadSpendingAnalysis(primaryAccId),
                loadMissions(primaryAccId),
                loadApprovals()
            ]);

            dashboardLoading.style.display = 'none';
            dashboardContent.style.display = 'block';
        }
    } catch (error) {
        console.error('Dashboard load failed:', error);
        dashboardLoading.innerHTML = '<p class="error-text">Network interference detected. Re-verify auth links.</p>';
    }
}

function renderAccountsList(accounts) {
    const list = document.getElementById('accountsList');
    list.innerHTML = '';
    accounts.forEach(acc => {
        const div = document.createElement('div');
        div.className = 'account-item';
        div.innerHTML = `
            <div class="account-info">
                <h4>${acc.account_type.toUpperCase()} Account</h4>
                <p class="text-sm text-secondary">ID: ${acc.account_id_masked}</p>
                <small class="text-muted">${acc.branch_name || 'Main Orbit'}</small>
            </div>
            <div class="account-balance">₹${acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        `;
        div.addEventListener('click', () => {
            document.getElementById('depositAccountId').value = acc.account_id;
            document.getElementById('fromAccount').value = acc.account_id;
            document.getElementById('withdrawAccountId').value = acc.account_id;
            document.getElementById('statementAccountId').value = acc.account_id;
            document.getElementById('missionAccount').value = acc.account_id;
            document.getElementById('loanAccount').value = acc.account_id;
            document.getElementById('resetPinAccountId').value = acc.account_id;
            showToast('Account ID synthesized to inputs.', 'info');
        });
        list.appendChild(div);
    });
}

// ==================== ADVANCED ANALYTICS ====================
async function loadSpendingAnalysis(accId) {
    try {
        const res = await AuthManager.fetchWithAuth(`/analytics/spending/${accId}`);
        const data = await res.json();
        
        if (data.success) {
            renderSpendingChart(data.summary.category_breakdown);
            renderInsights(data.stellar_insights);
        }
    } catch (err) {
        console.error("Analysis load failed", err);
    }
}

function renderSpendingChart(categories) {
    const ctx = document.getElementById('spendingChart').getContext('2d');
    if (spendingChart) spendingChart.destroy();

    const labels = categories.map(c => c.category);
    const amounts = categories.map(c => c.total_amount);

    spendingChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: amounts,
                backgroundColor: ['#667eea', '#f093fb', '#4facfe', '#f5576c', '#00f2fe'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } } }
            },
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%'
        }
    });
}

function renderInsights(insights) {
    const container = document.getElementById('stellarInsights');
    container.innerHTML = insights.map(i => `
        <div class="insight-bubble ${i.type}">
            <small class="text-muted uppercase font-bold tracking-widest">${i.type}</small>
            <p>${i.message}</p>
        </div>
    `).join('');
}

// ==================== MISSIONS & LOANS ====================
async function loadMissions(accId) {
    try {
        const res = await AuthManager.fetchWithAuth(`/account/missions/${accId}`);
        const data = await res.json();
        const list = document.getElementById('missionsList');
        
        if (data.success && data.missions.length > 0) {
            list.innerHTML = data.missions.map(m => {
                const pct = Math.min(100, (m.current_progress / m.target_amount) * 100);
                return `
                    <div class="mission-item mb-4">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span class="text-sm font-bold">${m.mission_name}</span>
                            <span class="text-xs text-accent-cyan">${pct.toFixed(0)}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${pct}%"></div>
                        </div>
                        <small class="text-muted">Target: ₹${m.target_amount.toLocaleString()}</small>
                    </div>
                `;
            }).join('');
        } else {
            list.innerHTML = '<p class="text-center text-muted text-sm">No planetary goals set.</p>';
        }
    } catch (err) {
        console.error("Missions failed", err);
    }
}

document.getElementById('submitMission').addEventListener('click', async () => {
    const account_id = document.getElementById('missionAccount').value;
    const mission_name = document.getElementById('missionName').value;
    const target_amount = document.getElementById('missionTarget').value;

    try {
        const res = await AuthManager.fetchWithAuth('/account/missions', {
            method: 'POST',
            body: JSON.stringify({ account_id, mission_name, target_amount: parseFloat(target_amount) })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Savings mission initialized!', 'success');
            closeModal(document.getElementById('missionModal'));
            loadDashboard();
        } else showResult('missionResult', data.error, false);
    } catch (err) { showResult('missionResult', err.message, false); }
});

document.getElementById('submitLoan').addEventListener('click', async () => {
    const account_id = document.getElementById('loanAccount').value;
    const amount = document.getElementById('loanAmount').value;
    const pin = document.getElementById('loanPin').value;

    try {
        const res = await AuthManager.fetchWithAuth('/loans/apply', {
            method: 'POST',
            body: JSON.stringify({ account_id, amount: parseFloat(amount), pin })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Credit fuel deployed as a pulsar!', 'success');
            closeModal(document.getElementById('loanModal'));
            loadDashboard();
        } else showResult('loanResult', data.error, false);
    } catch (err) { showResult('loanResult', err.message, false); }
});

// ==================== DUEL-AUTHENTICATION ====================
let activeTransferForApproval = null;

async function loadApprovals() {
    try {
        const res = await AuthManager.fetchWithAuth('/account/approvals');
        const data = await res.json();
        const banner = document.getElementById('approvalBanner');
        const list = document.getElementById('approvalsList');
        
        if (data.success && data.approvals.length > 0) {
            banner.style.display = 'block';
            list.innerHTML = data.approvals.map(app => `
                <div class="approval-card p-4 glass-card mb-3" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p class="text-sm"><b>₹${app.amount.toLocaleString()}</b> transfer request</p>
                        <small class="text-muted">Initiated by: ${app.initiator_name}</small>
                    </div>
                    <button class="btn-primary" style="padding: 0.5rem;" onclick="openApprovalVerification('${app.transfer_id}', ${app.amount})">Process</button>
                </div>
            `).join('');
        } else {
            banner.style.display = 'none';
            list.innerHTML = '<p class="text-center">No pending authorizations.</p>';
        }
    } catch (err) {
        console.error("Approvals failed", err);
    }
}

function openApprovalVerification(id, amt) {
    activeTransferForApproval = id;
    document.getElementById('approvalDetails').textContent = `Please provide your transaction PIN to authorize the ₹${amt.toLocaleString()} transfer initiated by your joint account partner.`;
    closeModal(document.getElementById('approvalsModal'));
    openModal(document.getElementById('verifyApprovalModal'));
}

async function processApprovalAction(action) {
    const pin = document.getElementById('approvalPin').value;
    try {
        const res = await AuthManager.fetchWithAuth('/account/approvals/process', {
            method: 'POST',
            body: JSON.stringify({ transfer_id: activeTransferForApproval, action, pin })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Authorization ${action}ed!`, 'success');
            closeModal(document.getElementById('verifyApprovalModal'));
            loadDashboard();
        } else showResult('verifyApprovalResult', data.error, false);
    } catch (err) { showResult('verifyApprovalResult', err.message, false); }
}

document.getElementById('confirmApproval').addEventListener('click', () => processApprovalAction('approve'));
document.getElementById('rejectApproval').addEventListener('click', () => processApprovalAction('reject'));

// ==================== BRANCHES & ONBOARDING ====================
async function fetchBranches() {
    const select = document.getElementById('regBranch');
    try {
        const res = await fetch(`${API_BASE_URL}/branches`);
        const data = await res.json();
        if (data.success && data.branches.length > 0) {
            select.innerHTML = data.branches.map(b => `<option value="${b.branch_id}">${b.branch_name} (${b.location})</option>`).join('');
        } else {
            // Fallback for demo if no branches in DB
            select.innerHTML = `
                <option value="default-1">Sirius Prime Command (Sirius Orbit)</option>
                <option value="default-2">Andromeda Hub (Galaxy Central)</option>
                <option value="default-3">Lunar Outpost (Moon)</option>
            `;
        }
    } catch (err) { 
        console.error("Branch fetch fail", err);
        select.innerHTML = '<option value="" disabled>Sector list unavailable. Connect to Mainnet.</option>';
    }
}

submitLogin.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) return showToast('Input credentials.', 'error');
    const res = await AuthManager.login(email, password);
    if (res.success) {
        showToast('Warp jump successful!', 'success');
        closeModal(loginModal);
        document.querySelector('[data-section="dashboard"]').click();
    } else showResult('loginResult', res.error, false);
});

submitRegister.addEventListener('click', async () => {
    const body = {
        full_name: document.getElementById('regFullName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        tax_id: document.getElementById('regTaxId').value,
        doc_type: document.getElementById('regDocType').value,
        doc_num: document.getElementById('regDocNum').value,
        initial_pin: document.getElementById('regPin').value,
        branch_id: document.getElementById('regBranch').value
    };
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (data.success) {
            showToast('Identity synthesized. Please login.', 'success');
            setTimeout(() => { closeModal(registerModal); openModal(loginModal); }, 2000);
        } else showResult('registerResult', data.error, false);
    } catch (err) { showResult('registerResult', 'Network orbit unstable.', false); }
});

// ==================== OPERATIONS ====================
depositBtn.addEventListener('click', async () => {
    const account_id = document.getElementById('depositAccountId').value;
    const amount = document.getElementById('depositAmount').value;
    try {
        const res = await AuthManager.fetchWithAuth('/account/deposit', {
            method: 'POST',
            body: JSON.stringify({ account_id, amount: parseFloat(amount) })
        });
        const data = await res.json();
        if (data.success) {
            showResult('depositResult', `Credits injected. New level: ₹${data.new_balance.toFixed(2)}`, true);
            loadDashboard();
        } else showResult('depositResult', data.error, false);
    } catch (err) { showResult('depositResult', err.message, false); }
});

transferBtn.addEventListener('click', async () => {
    const body = {
        from_account: document.getElementById('fromAccount').value,
        to_account: document.getElementById('toAccount').value,
        amount: parseFloat(document.getElementById('transferAmount').value),
        pin: document.getElementById('transferPin').value
    };
    try {
        const res = await AuthManager.fetchWithAuth('/account/transfer', { method: 'POST', body: JSON.stringify(body) });
        const data = await res.json();
        if (data.success) {
            showResult('transferResult', 'Warp transfer successful.', true);
            loadDashboard();
        } else showResult('transferResult', data.error, false);
    } catch (err) { showResult('transferResult', err.message, false); }
});

document.getElementById('withdrawBtn').addEventListener('click', async () => {
    const body = {
        account_id: document.getElementById('withdrawAccountId').value,
        amount: parseFloat(document.getElementById('withdrawAmount').value),
        pin: document.getElementById('withdrawPin').value
    };
    try {
        const res = await AuthManager.fetchWithAuth('/account/withdraw', { method: 'POST', body: JSON.stringify(body) });
        const data = await res.json();
        if (data.success) {
            showResult('withdrawResult', 'Credits extracted.', true);
            loadDashboard();
        } else showResult('withdrawResult', data.error, false);
    } catch (err) { showResult('withdrawResult', err.message, false); }
});

statementBtn.addEventListener('click', async () => {
    const accId = document.getElementById('statementAccountId').value;
    const days = document.getElementById('statementDays').value;
    try {
        const res = await AuthManager.fetchWithAuth(`/account/statement/${accId}?days=${days}`);
        const data = await res.json();
        const div = document.getElementById('statementResult');
        if (data.history?.length) {
            div.innerHTML = `<table class="statement-table">
                <thead><tr><th>Orbit Date</th><th>Event</th><th>Credits</th></tr></thead>
                <tbody>${data.history.map(tx => `<tr>
                    <td>${new Date(tx.created_at).toLocaleDateString()}</td>
                    <td class="capitalize">${tx.transaction_type.replace('_', ' ')}</td>
                    <td class="${tx.amount>=0?'text-success':'text-danger'}">${tx.amount>=0?'+':''}${tx.amount.toFixed(2)}</td>
                </tr>`).join('')}</tbody>
            </table>`;
        } else div.innerHTML = '<p class="text-center">No logs in this sector.</p>';
    } catch (err) { showToast(err.message, 'error'); }
});

logoutBtn.addEventListener('click', () => AuthManager.logout());

document.addEventListener('DOMContentLoaded', () => {
    updateUIState();
    console.log('Comet Bank OS v3.0 Powered Up.');
});
