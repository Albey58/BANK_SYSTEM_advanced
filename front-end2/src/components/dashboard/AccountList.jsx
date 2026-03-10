import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { CreditCard, Copy, Check } from 'lucide-react';

const AccountList = ({ accounts }) => {
    const { addToast } = useToast();
    const [copiedId, setCopiedId] = useState(null);

    if (!accounts || accounts.length === 0) {
        return (
            <div className="neo-card" style={{ textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                No accounts found. Open a new one to get started!
            </div>
        );
    }

    const handleCopy = (e, id) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        addToast('Account ID copied to clipboard', 'success');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const statusColor = (status) => {
        if (!status || status === 'active') return '#00ff00'; // high contrast green
        if (status === 'frozen') return '#00ffff'; // cyan
        return '#ff0000'; // red
    };

    return (
        <div className="accounts-list" style={{ display: 'grid', gap: '1rem' }}>
            {accounts.map((acc) => (
                <div key={acc.account_id} className="neo-card" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    border: '3px solid #fff',
                    padding: '1.25rem'
                }}>
                    <div className="account-info" style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{ background: '#fff', padding: '4px', display: 'flex' }}>
                                <CreditCard size={20} color="#000" />
                            </div>
                            <h4 style={{ 
                                textTransform: 'uppercase', 
                                margin: 0, 
                                fontWeight: 900, 
                                fontSize: '1.1rem',
                                letterSpacing: '0.05em' 
                            }}>
                                {acc.account_type || 'Account'}
                            </h4>
                            {acc.membership_role && (
                                <span style={{
                                    fontSize: '0.7rem', padding: '2px 6px',
                                    border: '1px solid #fff', 
                                    textTransform: 'uppercase', 
                                    fontWeight: 700,
                                    background: '#000'
                                }}>
                                    {acc.membership_role}
                                </span>
                            )}
                            <div style={{
                                width: '12px', height: '12px', 
                                background: statusColor(acc.status), 
                                border: '1px solid #fff',
                                marginLeft: 'auto'
                            }} title={acc.status || 'active'} />
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', fontFamily: 'monospace', color: '#ccc' }}>
                                ID: {acc.account_id ? `****${acc.account_id.slice(-8)}` : '****'}
                            </p>
                            <button
                                onClick={(e) => handleCopy(e, acc.account_id)}
                                title="Copy full account ID"
                                className="neo-btn-secondary"
                                style={{
                                    padding: '2px 8px',
                                    fontSize: '0.7rem',
                                    borderWidth: '1px',
                                    boxShadow: '2px 2px 0px 0px #fff'
                                }}
                            >
                                {copiedId === acc.account_id ? (
                                    <><Check size={12} /> Copied</>
                                ) : (
                                    <><Copy size={12} /> Copy ID</>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    <div className="account-balance" style={{ 
                        flexShrink: 0, 
                        textAlign: 'right',
                        borderLeft: '2px solid #333',
                        paddingLeft: '1.5rem',
                        marginLeft: '1rem'
                    }}>
                        <p className="label" style={{ marginBottom: 0, fontSize: '0.7rem' }}>Balance</p>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                            ${parseFloat(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AccountList;
