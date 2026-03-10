import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { 
    ArrowRightLeft, FileText, CreditCard, Settings, X, Loader2, CheckCircle, 
    AlertCircle, Target, Zap, PieChart, Users, ArrowUpRight, ArrowDownLeft, ShieldAlert 
} from 'lucide-react';
import api from '../api/axios';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [missions, setMissions] = useState([]);
    const [approvals, setApprovals] = useState([]);
    const [error, setError] = useState(null);

    // Modal States
    const [activeModal, setActiveModal] = useState(null); // 'deposit'|'transfer'|'loan'|'mission'|'approval'|'settings'
    const [modalLoading, setModalLoading] = useState(false);
    const [modalMessage, setModalMessage] = useState({ type: '', text: '' });
    
    // Form States
    const [amount, setAmount] = useState('');
    const [recipientId, setRecipientId] = useState('');
    const [pin, setPin] = useState('');
    const [password, setPassword] = useState('');
    const [missionName, setMissionName] = useState('');
    const [selectedApproval, setSelectedApproval] = useState(null);

    useEffect(() => {
        if (user) fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const dashRes = await api.get(`/user/dashboard/${user.user_id}`);
            if (dashRes.data.success && dashRes.data.data.length > 0) {
                const accData = dashRes.data.data[0];
                setAccount(accData);
                const realId = accData.account_id;

                // Parallel fetches for new features
                const [stmt, analytic, miss, apprv] = await Promise.all([
                    api.get(`/account/statement/${realId}?days=30`),
                    api.get(`/analytics/spending/${realId}`),
                    api.get(`/account/missions/${realId}`),
                    api.get(`/account/approvals`)
                ]);

                if (stmt.data.success) setTransactions(stmt.data.history);
                if (analytic.data.success) setAnalytics(analytic.data);
                if (miss.data.success) setMissions(miss.data.missions);
                if (apprv.data.success) setApprovals(apprv.data.approvals);
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            setError("Atmospheric interference detected. Dashboard sync incomplete.");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (endpoint, data, successMsg) => {
        setModalLoading(true);
        setModalMessage({ type: '', text: '' });
        try {
            const res = await api.post(endpoint, data);
            if (res.data.success) {
                setModalMessage({ type: 'success', text: successMsg });
                fetchDashboardData();
                setTimeout(() => closeModal(), 2000);
            }
        } catch (err) {
            setModalMessage({ type: 'error', text: err.response?.data?.error || 'Operation failed' });
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => {
        setActiveModal(null);
        setModalMessage({ type: '', text: '' });
        setAmount(''); setRecipientId(''); setPin(''); setPassword('');
        setMissionName(''); setSelectedApproval(null);
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
    );

    return (
        <div className="min-h-screen p-4 md:p-8 bg-background text-white pb-20">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-secondary">
                            Welcome back, {user?.full_name?.split(' ')[0]}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-accent uppercase tracking-widest border border-accent/20">
                                {account?.branch_name || 'Global Orbit'}
                            </span>
                            <span className="text-sm text-secondary">| Stellar Standing: {user?.stellar_standing || 500} pts</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {approvals.length > 0 && (
                            <button onClick={() => setActiveModal('approvals_list')} className="relative p-2 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
                                <ShieldAlert className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                                    {approvals.length}
                                </span>
                            </button>
                        )}
                        <Button onClick={logout} variant="secondary">Sign Out</Button>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Balance & Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-surface to-black border border-white/10 relative overflow-hidden group min-h-[240px] flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-accent/10 transition-all duration-700" />
                            <div className="relative z-10 flex flex-col h-full">
                                <div>
                                    <p className="text-secondary text-sm font-medium uppercase tracking-widest mb-1">Available Credits</p>
                                    <h2 className="text-6xl font-mono font-bold text-white tracking-tighter">
                                        ₹{account?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                                    </h2>
                                    <p className="text-xs text-secondary mt-2 font-mono opacity-60">ACCOUNT: {account?.account_id_masked}</p>
                                </div>
                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Button onClick={() => setActiveModal('deposit')} className="bg-white text-black hover:bg-gray-200 px-6">
                                        + Deposit
                                    </Button>
                                    <Button onClick={() => setActiveModal('transfer')} variant="secondary" className="border-white/10 hover:bg-white/5 px-6">
                                        Transfer
                                    </Button>
                                    <Button onClick={() => setActiveModal('loan')} variant="secondary" className="bg-accent/10 border-accent/20 text-accent hover:bg-accent/20 px-6 gap-2">
                                        <Zap className="w-4 h-4" /> Credit Fuel
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Analysis & Missions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Spending Overview */}
                            <Card className="p-6 backdrop-blur-md">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold flex items-center gap-2"><PieChart className="w-4 h-4 text-secondary" /> Spending Orbit</h3>
                                    <span className="text-xs text-secondary">Last 30 days</span>
                                </div>
                                {analytics?.summary?.category_breakdown?.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex h-3 w-full rounded-full overflow-hidden bg-white/5 border border-white/5">
                                            {analytics.summary.category_breakdown.map((c, i) => (
                                                <div 
                                                    key={c.category}
                                                    style={{ width: `${(c.total_amount / analytics.summary.total_spending) * 100}%` }}
                                                    className={`${['bg-accent', 'bg-blue-500', 'bg-purple-500', 'bg-red-500'][i % 4]}`}
                                                />
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {analytics.summary.category_breakdown.slice(0, 4).map((c, i) => (
                                                <div key={c.category} className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${['bg-accent', 'bg-blue-500', 'bg-purple-500', 'bg-red-500'][i % 4]}`} />
                                                    <span className="text-[10px] text-secondary truncate uppercase">{c.category}</span>
                                                    <span className="text-[10px] font-bold ml-auto">{((c.total_amount / analytics.summary.total_spending)*100).toFixed(0)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                        {analytics.stellar_insights.length > 0 && (
                                            <div className="p-3 rounded-lg bg-surface/50 border border-white/5 text-[10px] text-accent italic leading-relaxed">
                                                " {analytics.stellar_insights[0].message} "
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-24 flex items-center justify-center text-xs text-secondary italic">No spending data in current orbit.</div>
                                )}
                            </Card>

                            {/* Missions */}
                            <Card className="p-6 backdrop-blur-md">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold flex items-center gap-2"><Target className="w-4 h-4 text-secondary" /> Savings Missions</h3>
                                    <button onClick={() => setActiveModal('mission')} className="text-accent text-[10px] font-bold uppercase hover:underline">+ New Mission</button>
                                </div>
                                <div className="space-y-4">
                                    {missions.length > 0 ? missions.slice(0, 2).map(m => (
                                        <div key={m.mission_id} className="space-y-1">
                                            <div className="flex justify-between text-[11px] font-medium">
                                                <span className="text-secondary">{m.mission_name}</span>
                                                <span>{((m.current_progress / m.target_amount) * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${Math.min(100, (m.current_progress / m.target_amount) * 100)}%` }} />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="h-24 flex flex-col items-center justify-center text-center">
                                            <p className="text-[10px] text-secondary mb-2">Set collaborative goals for your Twin Stars.</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Transactions & Twin Stars */}
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" /> Transactions</h3>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {transactions.length > 0 ? transactions.slice(0, 5).map(tx => (
                                    <div key={tx.transaction_id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${tx.amount > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                                                {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4"/> : <ArrowUpRight className="w-4 h-4"/>}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold capitalize truncate w-24">{tx.transaction_type.replace('_', ' ')}</p>
                                                <p className="text-[9px] text-secondary">{new Date(tx.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-mono font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-white'}`}>
                                            {tx.amount > 0 ? '+' : ''}{Math.abs(tx.amount).toFixed(2)}
                                        </span>
                                    </div>
                                )) : <div className="text-center text-xs text-secondary py-4">No logs detected.</div>}
                            </div>
                            <Button variant="secondary" className="w-full mt-4 py-2 text-xs">View Full Ledger</Button>
                        </Card>

                        <Card className="p-6 bg-accent/5 border-accent/10">
                            <h3 className="font-bold mb-4 flex items-center gap-2 text-accent"><Users className="w-4 h-4" /> Twin Stars</h3>
                            <p className="text-[10px] text-secondary mb-4 leading-relaxed tracking-tight">Accounts with multiple owners allow for collaborative missions and secure dual-authenticated transfers.</p>
                            <Button onClick={() => setActiveModal('invite')} variant="secondary" className="w-full py-2 text-xs border-accent/20 text-accent hover:bg-accent/10">Invite Joint Member</Button>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Global Modals */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <Card className="w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-300">
                        <button onClick={closeModal} className="absolute top-6 right-6 text-secondary hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                        
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tighter capitalize">{activeModal.replace('_', ' ')}</h2>
                                <p className="text-xs text-secondary mt-1">Execute your financial protocols with precision.</p>
                            </div>

                            {modalMessage.text && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 border ${modalMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                    {modalMessage.type === 'success' ? <CheckCircle className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
                                    <span className="text-xs font-bold">{modalMessage.text}</span>
                                </div>
                            )}

                            <form className="space-y-4" onSubmit={(e) => {
                                e.preventDefault();
                                if (activeModal === 'deposit') handleAction('/account/deposit', { account_id: account.account_id, amount: parseFloat(amount) }, "Credits successfully deposited into your orbit.");
                                if (activeModal === 'transfer') handleAction('/account/transfer', { from_account: account.account_id, to_account: recipientId, amount: parseFloat(amount), pin: pin }, "Hyper-transfer sequence complete.");
                                if (activeModal === 'loan') handleAction('/loans/apply', { account_id: account.account_id, amount: parseFloat(amount), pin: pin }, "Credit Fuel injected. Repayment orbits synchronized.");
                                if (activeModal === 'mission') handleAction('/account/missions', { account_id: account.account_id, mission_name: missionName, target_amount: parseFloat(amount) }, "New savings mission initialized.");
                                if (activeModal === 'approval_process') handleAction('/account/approvals/process', { transfer_id: selectedApproval.transfer_id, action: 'approve', pin: pin }, "Duel-authentication successful. Transfer authorized.");
                                if (activeModal === 'invite') handleAction('/account/invite', { account_id: account.account_id, invitee_email: recipientId, role: 'joint_owner' }, "Joint invitation beamed to target user.");
                            }}>
                                {['transfer', 'invite'].includes(activeModal) && (
                                    <Input label={activeModal === 'transfer' ? "Beneficiary ID" : "Invitee Email"} value={recipientId} onChange={e => setRecipientId(e.target.value)} required />
                                )}
                                {activeModal === 'mission' && (
                                    <Input label="Mission Name" placeholder="e.g. Tesla Planet" value={missionName} onChange={e => setMissionName(e.target.value)} required />
                                )}
                                {activeModal !== 'approvals_list' && activeModal !== 'approval_process' && (
                                    <Input label={activeModal === 'mission' ? "Target Goal (₹)" : "Amount (₹)"} type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
                                )}
                                {['transfer', 'loan', 'approval_process'].includes(activeModal) && (
                                    <Input label="Security PIN" type="password" maxLength={6} value={pin} onChange={e => setPin(e.target.value)} required />
                                )}

                                {activeModal === 'approvals_list' && (
                                    <div className="space-y-3">
                                        {approvals.map(app => (
                                            <div key={app.transfer_id} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between group cursor-pointer hover:border-accent/50 transition-all" onClick={() => {
                                                setSelectedApproval(app);
                                                setActiveModal('approval_process');
                                            }}>
                                                <div>
                                                    <p className="text-[10px] text-secondary uppercase font-bold tracking-widest leading-none mb-1">Pending Transfer</p>
                                                    <p className="text-sm font-bold text-white">₹{app.amount.toLocaleString()}</p>
                                                    <p className="text-[10px] text-secondary mt-1 italic">Initiated by {app.initiator_name}</p>
                                                </div>
                                                <Button variant="secondary" className="group-hover:bg-accent group-hover:text-black transition-colors">Authorize</Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeModal !== 'approvals_list' && (
                                    <Button type="submit" className="w-full bg-accent text-black font-bold py-3 hover:bg-accent/90 shadow-lg shadow-accent/20" isLoading={modalLoading}>
                                        Confirm Protocol
                                    </Button>
                                )}
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
