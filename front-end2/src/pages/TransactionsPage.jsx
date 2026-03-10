import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, FileText, Lock } from 'lucide-react';

const TransactionsPage = () => {
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [statementData, setStatementData] = useState([]);
    
    // ... states ...
    // Deposit State
    const [depositAccountId, setDepositAccountId] = useState('');
    const [depositAmount, setDepositAmount] = useState('');

    // Transfer State
    const [transferFrom, setTransferFrom] = useState('');
    const [transferTo, setTransferTo] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferPin, setTransferPin] = useState('');

    // Withdraw State
    const [withdrawAccountId, setWithdrawAccountId] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawPin, setWithdrawPin] = useState('');
    
    // Statement State
    const [statementAccountId, setStatementAccountId] = useState('');
    const [statementDays, setStatementDays] = useState('30');

    // ... handlers ...
    const handleDeposit = async () => {
        if (!depositAccountId || !depositAmount) {
            addToast('Please fill all fields', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const response = await api.post('/api/account/deposit', {
                account_id: depositAccountId,
                amount: parseFloat(depositAmount)
            });
            if (response.data.success) {
                addToast('Deposit successful!', 'success');
                setDepositAmount('');
                setDepositAccountId('');
            } else {
                addToast(response.data.error || 'Deposit failed', 'error');
            }
        } catch (error) {
            addToast(error.response?.data?.error || 'Deposit failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTransfer = async () => {
        if (!transferFrom || !transferTo || !transferAmount || !transferPin) {
            addToast('Please fill all fields', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const response = await api.post('/api/account/transfer', {
                source_account_id: transferFrom,
                target_account_id: transferTo,
                amount: parseFloat(transferAmount),
                pin: transferPin
            });
            if (response.data.success) {
                addToast('Transfer successful!', 'success');
                setTransferAmount('');
                setTransferPin('');
            } else {
                addToast(response.data.error || 'Transfer failed', 'error');
            }
        } catch (error) {
            addToast(error.response?.data?.error || 'Transfer failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdraw = async () => {
         if (!withdrawAccountId || !withdrawAmount || !withdrawPin) {
            addToast('Please fill all fields', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const response = await api.post('/api/account/withdraw', {
                account_id: withdrawAccountId,
                amount: parseFloat(withdrawAmount),
                pin: withdrawPin
            });
            if (response.data.success) {
                addToast('Withdrawal successful!', 'success');
                setWithdrawAmount('');
                setWithdrawPin('');
            } else {
                addToast(response.data.error || 'Withdrawal failed', 'error');
            }
        } catch (error) {
            addToast(error.response?.data?.error || 'Withdrawal failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatement = async () => {
        if (!statementAccountId) {
            addToast('Please enter Account ID', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const response = await api.get(`/api/account/statement/${statementAccountId}?days=${statementDays}`);
            if (response.data.success) {
                setStatementData(response.data.transactions);
                addToast('Statement loaded', 'success');
            } else {
                addToast(response.data.error || 'Failed to load statement', 'error');
            }
        } catch (error) {
            addToast(error.response?.data?.error || 'Failed to load statement', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="section active" id="transactions">
            <div className="section-header">
                <h1 className="page-title">Transactions</h1>
                <p className="page-subtitle">Deposit, transfer, and view your transaction history</p>
            </div>

            <div className="transaction-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                {/* Deposit Card */}
                <div className="neo-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '3px solid #fff', paddingBottom: '1rem' }}>
                        <div style={{ background: '#00ff00', padding: '0.5rem', border: '3px solid #fff' }}>
                            <ArrowDownLeft size={24} color="#000" strokeWidth={3} />
                        </div>
                        <h3 style={{ textTransform: 'uppercase', fontWeight: 900, fontSize: '1.5rem', margin: 0 }}>Deposit Funds</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>Account ID</label>
                            <input type="text" placeholder="Enter account ID" className="neo-input" 
                                value={depositAccountId} onChange={e => setDepositAccountId(e.target.value)} />
                        </div>
                        <div>
                            <label>Amount</label>
                            <input type="number" placeholder="0.00" className="neo-input" 
                                value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                        </div>
                        <button className="neo-btn" onClick={handleDeposit} disabled={isLoading} style={{ marginTop: '1rem' }}>
                            {isLoading ? 'Processing...' : 'Deposit Money'}
                        </button>
                    </div>
                </div>

                {/* Transfer Card */}
                <div className="neo-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '3px solid #fff', paddingBottom: '1rem' }}>
                        <div style={{ background: '#00ffff', padding: '0.5rem', border: '3px solid #fff' }}>
                            <ArrowRightLeft size={24} color="#000" strokeWidth={3} />
                        </div>
                        <h3 style={{ textTransform: 'uppercase', fontWeight: 900, fontSize: '1.5rem', margin: 0 }}>Transfer Funds</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>From Account</label>
                            <input type="text" placeholder="Sender account ID" className="neo-input"
                                value={transferFrom} onChange={e => setTransferFrom(e.target.value)} />
                        </div>
                        <div>
                            <label>To Account</label>
                            <input type="text" placeholder="Recipient account ID" className="neo-input"
                                value={transferTo} onChange={e => setTransferTo(e.target.value)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label>Amount</label>
                                <input type="number" placeholder="0.00" className="neo-input"
                                    value={transferAmount} onChange={e => setTransferAmount(e.target.value)} />
                            </div>
                            <div>
                                <label>PIN</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="password" placeholder="PIN" className="neo-input"
                                        value={transferPin} onChange={e => setTransferPin(e.target.value)} style={{ paddingRight: '30px' }} />
                                    <Lock size={14} style={{ position: 'absolute', right: '10px', top: '15px', color: '#fff' }} />
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#ccc', borderLeft: '3px solid #00ffff', paddingLeft: '0.5rem' }}>
                            ℹ️ 1% service fee applies to all transfers
                        </div>
                        <button className="neo-btn" onClick={handleTransfer} disabled={isLoading} style={{ marginTop: '0.5rem' }}>
                            {isLoading ? 'Processing...' : 'Transfer Money'}
                        </button>
                    </div>
                </div>

                {/* Withdrawal Card */}
                <div className="neo-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '3px solid #fff', paddingBottom: '1rem' }}>
                        <div style={{ background: '#ff0000', padding: '0.5rem', border: '3px solid #fff' }}>
                            <ArrowUpRight size={24} color="#fff" strokeWidth={3} />
                        </div>
                        <h3 style={{ textTransform: 'uppercase', fontWeight: 900, fontSize: '1.5rem', margin: 0 }}>Withdraw Funds</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>Account ID</label>
                            <input type="text" placeholder="Enter account ID" className="neo-input"
                                value={withdrawAccountId} onChange={e => setWithdrawAccountId(e.target.value)} />
                        </div>
                        <div>
                            <label>Amount</label>
                            <input type="number" placeholder="0.00" className="neo-input"
                                value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                        </div>
                        <div>
                            <label>PIN</label>
                            <input type="password" placeholder="Enter PIN" className="neo-input"
                                value={withdrawPin} onChange={e => setWithdrawPin(e.target.value)} />
                        </div>
                        <button className="neo-btn" onClick={handleWithdraw} disabled={isLoading} style={{ marginTop: '1rem' }}>
                            {isLoading ? 'Processing...' : 'Withdraw'}
                        </button>
                    </div>
                </div>

                {/* Statement Card */}
                <div className="neo-card" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '3px solid #fff', paddingBottom: '1rem' }}>
                        <div style={{ background: '#fff', padding: '0.5rem', border: '3px solid #fff' }}>
                            <FileText size={24} color="#000" strokeWidth={3} />
                        </div>
                        <h3 style={{ textTransform: 'uppercase', fontWeight: 900, fontSize: '1.5rem', margin: 0 }}>Account Statement</h3>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end', marginBottom: '2rem' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label>Account ID</label>
                            <input type="text" placeholder="Enter account ID" className="neo-input"
                                value={statementAccountId} onChange={e => setStatementAccountId(e.target.value)} />
                        </div>
                        <div style={{ width: '200px' }}>
                            <label>Period (Days)</label>
                            <select className="neo-input" value={statementDays} onChange={e => setStatementDays(e.target.value)} style={{ cursor: 'pointer' }}>
                                <option value="7">Last 7 days</option>
                                <option value="30">Last 30 days</option>
                                <option value="90">Last 90 days</option>
                                <option value="365">Last year</option>
                            </select>
                        </div>
                        <button className="neo-btn" onClick={handleStatement} disabled={isLoading} style={{ width: 'auto' }}>
                            Load Statement
                        </button>
                    </div>
                        
                    {statementData.length > 0 && (
                        <div style={{ overflowX: 'auto', border: '3px solid #fff' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace' }}>
                                <thead style={{ background: '#fff', color: '#000', textTransform: 'uppercase', fontWeight: 900 }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>ID</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statementData.map((tx, idx) => (
                                        <tr key={tx.transaction_id} style={{ borderBottom: '1px solid #333', background: idx % 2 === 0 ? '#000' : '#111' }}>
                                            <td style={{ padding: '1rem' }}>{new Date(tx.created_at).toLocaleString()}</td>
                                            <td style={{ padding: '1rem' }}>{tx.transaction_id.slice(-8)}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ 
                                                    background: tx.transaction_type === 'deposit' ? '#00ff00' : tx.transaction_type === 'withdrawal' ? '#ff0000' : '#00ffff',
                                                    color: tx.transaction_type === 'withdrawal' ? '#fff' : '#000',
                                                    padding: '2px 6px',
                                                    fontWeight: 'bold',
                                                    textTransform: 'uppercase',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {tx.transaction_type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right', color: parseFloat(tx.amount) > 0 ? '#00ff00' : '#ff0000', fontWeight: 'bold' }}>
                                                ${parseFloat(tx.amount).toFixed(2)}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>${parseFloat(tx.balance_after).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default TransactionsPage;
