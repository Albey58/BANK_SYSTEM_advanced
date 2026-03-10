import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Rocket, Target, Star, Lock } from 'lucide-react';

const ServicesPage = () => {
    const { addToast } = useToast();
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    
    // Loan State
    const [loanData, setLoanData] = useState({
        account_id: '',
        amount: '',
        term_months: 12,
        pin: ''
    });
    const [isApplyingLoan, setIsApplyingLoan] = useState(false);

    // Mission State
    const [missionData, setMissionData] = useState({
        account_id: '',
        mission_name: '',
        target_amount: ''
    });
    const [isCreatingMission, setIsCreatingMission] = useState(false);
    
    // View Missions State
    const [selectedAccountForMissions, setSelectedAccountForMissions] = useState('');
    const [missions, setMissions] = useState([]);
    const [isLoadingMissions, setIsLoadingMissions] = useState(false);

    useEffect(() => {
        fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchAccounts = async () => {
        if (!user?.user_id) return;
        try {
            const response = await api.get(`/api/user/dashboard/${user.user_id}`);
            if (response.data.success) {
                setAccounts(response.data.data || []);
                if (response.data.data.length > 0) {
                    const firstId = response.data.data[0].account_id;
                    setLoanData(prev => ({...prev, account_id: firstId}));
                    setMissionData(prev => ({...prev, account_id: firstId}));
                    setSelectedAccountForMissions(firstId);
                }
            }
        } catch (error) {
            console.error('Failed to fetch accounts', error);
        }
    };

    useEffect(() => {
        if (selectedAccountForMissions) {
            fetchMissions(selectedAccountForMissions);
        }
    }, [selectedAccountForMissions]);

    const fetchMissions = async (accountId) => {
        setIsLoadingMissions(true);
        try {
            const response = await api.get(`/api/account/missions/${accountId}`);
            if (response.data.success) {
                setMissions(response.data.missions);
            }
        } catch (error) {
            console.error('Failed to load missions', error);
            setMissions([]);
        } finally {
            setIsLoadingMissions(false);
        }
    };

    const handleLoanSubmit = async (e) => {
        e.preventDefault();
        if (!loanData.account_id || !loanData.amount || !loanData.pin) {
            addToast('Please fill all required fields', 'error');
            return;
        }
        setIsApplyingLoan(true);
        try {
            const response = await api.post('/api/loans/apply', {
                account_id: loanData.account_id,
                amount: parseFloat(loanData.amount),
                term_months: parseInt(loanData.term_months),
                pin: loanData.pin
            });
            if (response.data.success) {
                addToast(response.data.message || 'Loan applied successfully!', 'success');
                setLoanData(prev => ({...prev, amount: '', pin: ''}));
            }
        } catch (error) {
            addToast(error.response?.data?.error || 'Failed to apply for loan', 'error');
        } finally {
            setIsApplyingLoan(false);
        }
    };

    const handleMissionSubmit = async (e) => {
        e.preventDefault();
        if (!missionData.account_id || !missionData.mission_name || !missionData.target_amount) {
            addToast('Please fill all required fields', 'error');
            return;
        }
        setIsCreatingMission(true);
        try {
            const response = await api.post('/api/account/missions', {
                account_id: missionData.account_id,
                mission_name: missionData.mission_name,
                target_amount: parseFloat(missionData.target_amount)
            });
            if (response.data.success) {
                addToast('Mission created successfully!', 'success');
                setMissionData(prev => ({...prev, mission_name: '', target_amount: ''}));
                if (selectedAccountForMissions === missionData.account_id) {
                    fetchMissions(missionData.account_id);
                }
            }
        } catch (error) {
            addToast(error.response?.data?.error || 'Failed to create mission', 'error');
        } finally {
            setIsCreatingMission(false);
        }
    };

    return (
        <section className="section active" id="services">
            <div className="section-header">
                <h1 className="page-title">Financial Services</h1>
                <p className="page-subtitle">Ignite Credit Pulsars and align your Savings Missions</p>
            </div>

            <div className="transaction-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                
                {/* Credit Pulsars (Loans) Card */}
                <div className="neo-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '3px solid #fff', paddingBottom: '1rem' }}>
                        <div style={{ background: '#ff00ff', padding: '0.5rem', border: '3px solid #fff' }}>
                            <Rocket size={24} color="#fff" strokeWidth={3} />
                        </div>
                        <div>
                            <h3 style={{ textTransform: 'uppercase', fontWeight: 900, fontSize: '1.5rem', margin: 0 }}>Credit Pulsars</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#ccc' }}>Get instant credit fuel based on average balance</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleLoanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>Deposit To Account</label>
                            <select 
                                className="neo-input" 
                                value={loanData.account_id}
                                onChange={e => setLoanData({...loanData, account_id: e.target.value})}
                            >
                                {accounts.map(acc => (
                                    <option key={acc.account_id} value={acc.account_id}>
                                        {acc.account_type.toUpperCase()} (****{acc.account_id.slice(-4)}) - Balance: ${parseFloat(acc.balance).toFixed(2)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label>Amount (Credits)</label>
                                <input 
                                    type="number" 
                                    placeholder="Max 5x Avg Balance" 
                                    className="neo-input"
                                    value={loanData.amount}
                                    onChange={e => setLoanData({...loanData, amount: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label>Term (Months)</label>
                                <select 
                                    className="neo-input"
                                    value={loanData.term_months}
                                    onChange={e => setLoanData({...loanData, term_months: e.target.value})}
                                >
                                    <option value={6}>6 Months</option>
                                    <option value={12}>12 Months</option>
                                    <option value={24}>24 Months</option>
                                    <option value={36}>36 Months</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label>Security PIN</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="password" 
                                    placeholder="Enter account PIN" 
                                    className="neo-input"
                                    value={loanData.pin}
                                    onChange={e => setLoanData({...loanData, pin: e.target.value})}
                                    required
                                />
                                <Lock size={14} style={{ position: 'absolute', right: '10px', top: '15px', color: '#fff' }} />
                            </div>
                        </div>
                        
                        <div style={{ fontSize: '0.8rem', color: '#ccc', borderLeft: '3px solid #ff00ff', paddingLeft: '0.5rem' }}>
                            Interest rate is calculated at 12% annually. Deductions occur monthly on the 1st.
                        </div>
                        
                        <button type="submit" className="neo-btn" disabled={isApplyingLoan} style={{ marginTop: '0.5rem' }}>
                            {isApplyingLoan ? 'Processing...' : 'Ignite Credit Pulsar'}
                        </button>
                    </form>
                </div>

                {/* Savings Missions Card */}
                <div className="neo-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '3px solid #fff', paddingBottom: '1rem' }}>
                        <div style={{ background: '#ffa500', padding: '0.5rem', border: '3px solid #fff' }}>
                            <Target size={24} color="#000" strokeWidth={3} />
                        </div>
                        <div>
                            <h3 style={{ textTransform: 'uppercase', fontWeight: 900, fontSize: '1.5rem', margin: 0 }}>Financial Missions</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#ccc' }}>Set and track shared savings goals</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleMissionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                        <div>
                            <label>Target Account</label>
                            <select 
                                className="neo-input" 
                                value={missionData.account_id}
                                onChange={e => setMissionData({...missionData, account_id: e.target.value})}
                            >
                                {accounts.map(acc => (
                                    <option key={acc.account_id} value={acc.account_id}>
                                        {acc.account_type.toUpperCase()} (****{acc.account_id.slice(-4)})
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                            <div>
                                <label>Mission Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Lunar Base Fund" 
                                    className="neo-input"
                                    value={missionData.mission_name}
                                    onChange={e => setMissionData({...missionData, mission_name: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label>Target Amount</label>
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    className="neo-input"
                                    value={missionData.target_amount}
                                    onChange={e => setMissionData({...missionData, target_amount: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        
                        <button type="submit" className="neo-btn" disabled={isCreatingMission}>
                            {isCreatingMission ? 'Creating...' : 'Launch Mission'}
                        </button>
                    </form>

                    {/* View Missions */}
                    <div style={{ borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Star size={16} color="#ffa500"/> Active Missions
                            </h4>
                            <select 
                                className="neo-input" 
                                style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                value={selectedAccountForMissions}
                                onChange={e => setSelectedAccountForMissions(e.target.value)}
                            >
                                {accounts.map(acc => (
                                    <option key={acc.account_id} value={acc.account_id}>
                                        ****{acc.account_id.slice(-4)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {isLoadingMissions ? (
                            <p style={{ color: '#888', fontSize: '0.9rem' }}>Scanning for missions...</p>
                        ) : missions.length === 0 ? (
                            <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem' }}>No active missions found for this account.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {missions.map(mission => {
                                    const progress = Math.min(100, Math.max(0, (mission.current_progress / mission.target_amount) * 100));
                                    const isComplete = progress >= 100;
                                    return (
                                        <div key={mission.mission_id} style={{ background: '#000', border: `1px solid ${isComplete ? '#00ff00' : '#333'}`, padding: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: 'bold' }}>{mission.mission_name}</span>
                                                <span style={{ color: isComplete ? '#00ff00' : '#ffa500' }}>
                                                    ${parseFloat(mission.current_progress).toFixed(2)} / ${parseFloat(mission.target_amount).toFixed(2)}
                                                </span>
                                            </div>
                                            <div style={{ height: '8px', background: '#333', width: '100%', overflow: 'hidden' }}>
                                                <div style={{ 
                                                    height: '100%', 
                                                    width: `${progress}%`, 
                                                    background: isComplete ? '#00ff00' : '#ffa500',
                                                    transition: 'width 0.5s ease-out'
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default ServicesPage;
