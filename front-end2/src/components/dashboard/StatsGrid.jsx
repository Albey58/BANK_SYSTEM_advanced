import React from 'react';
import { User, Wallet, ShieldCheck } from 'lucide-react';

const StatsGrid = ({ data }) => {
    // Determine user name and balance from data or use defaults
    const userName = data?.user?.full_name || 'User';
    // If total_balance is provided by API (sum of accounts), use it. 
    // Otherwise calculate from accounts array if available.
    let totalBalance = data?.total_balance || 0;
    if (data?.accounts && !data.total_balance) {
        totalBalance = data.accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    }
    const verificationStatus = data?.user?.verification_status || 'Pending';

    return (
        <div className="stats-grid">
            <div className="neo-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: '#fff', padding: '0.8rem', border: '3px solid #fff' }}>
                    <User size={32} color="#000" strokeWidth={2.5} />
                </div>
                <div className="stat-info">
                    <p className="label" style={{ marginBottom: '0.2rem' }}>Account Holder</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{userName}</h3>
                </div>
            </div>
            <div className="neo-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: '#fff', padding: '0.8rem', border: '3px solid #fff' }}>
                    <Wallet size={32} color="#000" strokeWidth={2.5} />
                </div>
                <div className="stat-info">
                    <p className="label" style={{ marginBottom: '0.2rem' }}>Total Balance</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                </div>
            </div>
            <div className="neo-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: '#fff', padding: '0.8rem', border: '3px solid #fff' }}>
                    <ShieldCheck size={32} color="#000" strokeWidth={2.5} />
                </div>
                <div className="stat-info">
                    <p className="label" style={{ marginBottom: '0.2rem' }}>Verification Status</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>{verificationStatus}</h3>
                </div>
            </div>
        </div>
    );
};

export default StatsGrid;
