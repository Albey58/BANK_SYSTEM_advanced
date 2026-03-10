import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ArrowRightLeft, FileText, CreditCard, Settings, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState(null);

    // Modal States
    const [activeModal, setActiveModal] = useState(null); // 'deposit' | 'transfer' | null
    const [modalLoading, setModalLoading] = useState(false);
    const [modalMessage, setModalMessage] = useState({ type: '', text: '' });
    
    // Form States
    const [amount, setAmount] = useState('');
    const [recipientId, setRecipientId] = useState('');
    const [pin, setPin] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // 1. Get User Dashboard (Account Info)
            const dashRes = await api.get(`/user/dashboard/${user.user_id}`);
            if (dashRes.data.success && dashRes.data.data.length > 0) {
                const accData = dashRes.data.data[0];
                setAccount(accData);

                // 2. Get Account Statement (History) using the real account ID
                // Note: The API returns masked ID for display, but we need the real ID for queries.
                // The dashboard endpoint actually returns 'account_id' (raw) AND 'account_id_masked'.
                // Let's check app.py: row['account_id_masked'] = ... but original 'account_id' is also in result if not overwritten.
                // Looking at app.py, 'account_id' is NOT removed, just 'account_id_masked' is added.
                const realAccountId = accData.account_id; 
                
                const stmtRes = await api.get(`/account/statement/${realAccountId}?days=30`);
                if (stmtRes.data.success) {
                    setTransactions(stmtRes.data.history);
                }
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            setError("Failed to load account details.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeposit = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalMessage({ type: '', text: '' });

        try {
            const res = await api.post('/account/deposit', {
                account_id: account.account_id,
                amount: parseFloat(amount)
            });
            
            if (res.data.success) {
                setModalMessage({ type: 'success', text: 'Deposit successful!' });
                setAmount('');
                fetchDashboardData(); // Refresh data
                setTimeout(() => closeModal(), 2000);
            }
        } catch (err) {
            setModalMessage({ type: 'error', text: err.response?.data?.error || 'Deposit failed' });
        } finally {
            setModalLoading(false);
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalMessage({ type: '', text: '' });

        try {
            const res = await api.post('/account/transfer', {
                from_account: account.account_id,
                to_account: recipientId,
                amount: parseFloat(amount),
                pin: pin
            });

            if (res.data.success) {
                setModalMessage({ type: 'success', text: 'Transfer successful!' });
                setAmount('');
                setRecipientId('');
                setPin('');
                fetchDashboardData(); // Refresh data
                setTimeout(() => closeModal(), 2000);
            }
        } catch (err) {
            setModalMessage({ type: 'error', text: err.response?.data?.error || 'Transfer failed' });
        } finally {
            setModalLoading(false);
        }
    };

    const handleSetPin = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalMessage({ type: '', text: '' });

        try {
            // Use reset-pin instead of set-pin to allow changing existing PINs
            const res = await api.post('/account/reset-pin', {
                account_id: account.account_id,
                new_pin: pin,
                password: password
            });

            if (res.data.success) {
                setModalMessage({ type: 'success', text: 'PIN reset successfully!' });
                setPin('');
                setPassword('');
                setTimeout(() => closeModal(), 2000);
            }
        } catch (err) {
            setModalMessage({ type: 'error', text: err.response?.data?.error || 'Failed to reset PIN' });
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => {
        setActiveModal(null);
        setModalMessage({ type: '', text: '' });
        setAmount('');
        setRecipientId('');
        setPin('');
        setPassword('');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-background text-white pb-20">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-secondary">
                            Welcome back, {user?.full_name?.split(' ')[0]}
                        </h1>
                        <p className="text-secondary mt-1">Here's your financial overview for today</p>
                    </div>
                    <Button onClick={logout} variant="secondary" className="w-fit">
                        Sign Out
                    </Button>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                        {error}
                    </div>
                )}

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Balance Card */}
                    <div className="col-span-1 md:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-surface to-black border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-accent/10 transition-all duration-500" />
                        <div className="relative z-10">
                            <p className="text-secondary text-sm font-medium uppercase tracking-wider">Total Balance</p>
                            <h2 className="text-5xl font-mono font-bold mt-2 text-white">
                                ₹{account?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                            </h2>
                            <div className="text-xs text-secondary mt-1 font-mono">{account?.account_id_masked}</div>
                            
                            <div className="mt-6 flex gap-3">
                                <Button onClick={() => setActiveModal('deposit')} className="bg-white text-black hover:bg-gray-200">
                                    + Add Money
                                </Button>
                                <Button variant="secondary" className="border-white/10 hover:bg-white/5">
                                    View Details
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Card */}
                    <Card className="p-6 space-y-4">
                        <h3 className="font-semibold text-lg">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setActiveModal('transfer')} className="p-4 rounded-xl bg-surface/50 hover:bg-surface border border-white/5 hover:border-accent/20 transition-all text-center group cursor-pointer flex flex-col items-center justify-center gap-2">
                                <div className="p-3 rounded-full bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                                    <ArrowRightLeft className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-secondary group-hover:text-white">Transfer</span>
                            </button>
                            <button className="p-4 rounded-xl bg-surface/50 hover:bg-surface border border-white/5 hover:border-accent/20 transition-all text-center group cursor-pointer flex flex-col items-center justify-center gap-2">
                                <div className="p-3 rounded-full bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-secondary group-hover:text-white">Bills</span>
                            </button>
                            <button className="p-4 rounded-xl bg-surface/50 hover:bg-surface border border-white/5 hover:border-accent/20 transition-all text-center group cursor-pointer flex flex-col items-center justify-center gap-2">
                                <div className="p-3 rounded-full bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-secondary group-hover:text-white">Cards</span>
                            </button>
                            <button onClick={() => setActiveModal('settings')} className="p-4 rounded-xl bg-surface/50 hover:bg-surface border border-white/5 hover:border-accent/20 transition-all text-center group cursor-pointer flex flex-col items-center justify-center gap-2">
                                <div className="p-3 rounded-full bg-green-500/10 text-green-400 group-hover:scale-110 transition-transform">
                                    <Settings className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-secondary group-hover:text-white">Settings</span>
                            </button>
                        </div>
                    </Card>
                </div>

                {/* Recent Transactions */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">Recent Transactions</h3>
                        <button className="text-sm text-accent hover:text-accent/80">View All</button>
                    </div>
                    {transactions.length === 0 ? (
                        <div className="p-8 text-center bg-surface/30 border border-white/5 rounded-xl text-secondary">
                            No transactions yet.
                        </div>
                    ) : (
                        <div className="bg-surface/30 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                            {transactions.map((tx) => (
                                <div key={tx.transaction_id} className="p-4 border-b border-white/5 last:border-0 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            tx.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                            {tx.amount > 0 ? <ArrowDownLeft className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white capitalize">{tx.transaction_type.replace('_', ' ')}</p>
                                            <p className="text-xs text-secondary">{new Date(tx.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-mono font-medium ${
                                            tx.amount > 0 ? 'text-green-400' : 'text-white'
                                        }`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-secondary capitalize">Completed</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-surface border border-white/10 rounded-2xl p-6 relative animate-in fade-in zoom-in duration-200">
                        <button onClick={closeModal} className="absolute top-4 right-4 text-secondary hover:text-white">
                            <X className="w-5 h-5" />
                        </button>

                        {/* Modal Content */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-center">
                                {activeModal === 'deposit' ? 'Deposit Funds' : 
                                 activeModal === 'transfer' ? 'Transfer Money' : 'Account Settings'}
                            </h2>

                            {modalMessage.text && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                                    modalMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                    {modalMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    <span className="text-sm font-medium">{modalMessage.text}</span>
                                </div>
                            )}

                            <form onSubmit={
                                activeModal === 'deposit' ? handleDeposit : 
                                activeModal === 'transfer' ? handleTransfer : handleSetPin
                            } className="space-y-4">
                                {activeModal === 'transfer' && (
                                    <Input
                                        label="Recipient Account ID"
                                        placeholder="Enter account ID"
                                        value={recipientId}
                                        onChange={(e) => setRecipientId(e.target.value)}
                                        required
                                    />
                                )}
                                
                                {activeModal !== 'settings' && (
                                    <Input
                                        label="Amount (₹)"
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        min="1"
                                        step="0.01"
                                        required
                                    />
                                )}

                                {(activeModal === 'transfer' || activeModal === 'settings') && (
                                    <Input
                                        label={activeModal === 'settings' ? "Set New PIN (4-6 digits)" : "Confirm PIN"}
                                        type="password"
                                        placeholder="Enter PIN"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        required
                                        minLength={4}
                                        maxLength={6}
                                    />
                                )}

                                <Button type="submit" className="w-full bg-accent hover:bg-accent/90" isLoading={modalLoading}>
                                    {activeModal === 'deposit' ? 'Confirm Deposit' : 
                                     activeModal === 'transfer' ? 'Send Money' : 'Reset PIN'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
export default Dashboard;
