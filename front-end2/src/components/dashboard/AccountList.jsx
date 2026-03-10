import React from 'react';
import AccountManagementCard from './AccountManagementCard';

const AccountList = ({ accounts }) => {
    if (!accounts || accounts.length === 0) {
        return (
            <div className="neo-card" style={{ textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                No accounts found. Open a new one to get started!
            </div>
        );
    }

    return (
        <div className="accounts-list" style={{ display: 'grid', gap: '1.5rem' }}>
            {accounts.map((acc) => (
                <AccountManagementCard key={acc.account_id} account={acc} />
            ))}
        </div>
    );
};

export default AccountList;

