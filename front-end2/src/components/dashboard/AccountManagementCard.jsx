import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { CreditCard, Copy, Check, Users, Lock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/axios';

const AccountManagementCard = ({ account }) => {
    const { addToast } = useToast();
    const [copiedId, setCopiedId] = useState(null);
    const [activeTab, setActiveTab] = useState('details'); // details, twin, pin, approvals
    
    // Twin Star State
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    
    // PIN Reset State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPin, setNewPin] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    
    // Approvals State
    const [approvals, setApprovals] = useState([]);
    const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
    const [approvalPin, setApprovalPin] = useState('');

    const isPrimary = account.membership_role === 'primary';

    useEffect(() => {
        if (activeTab === 'approvals') {
            fetchApprovals();
        }
    }, [activeTab]);

    const handleCopy = (e, id) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        addToast('Account ID copied to clipboard', 'success');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const statusColor = (status) => {
        if (!status || status === 'active') return '#00ff00';
        if (status === 'frozen') return '#00ffff';
        return '#ff0000';
    };

    const handleInviteTwin = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setIsInviting(true);
        try {
            const response = await api.post('/api/account/invite', {
                account_id: account.account_id,
                invitee_email: inviteEmail,
                role: 'joint'
            });
            if (response.data.success) {
                addToast('Twin Star invited successfully!', 'success');
                setInviteEmail('');
                setActiveTab('details');
            }
        } catch (error) {
            addToast(error.response?.data?.error || 'Failed to invite Twin Star', 'error');
        } finally {
            setIsInviting(false);
        }
    };

    const handleResetPin = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPin) return;
        setIsResetting(true);
        try {
            const response = await api.post('/api/account/reset-pin', {
                account_id: account.account_id,
                new_pin: newPin,
                password: currentPassword
            });
            if (response.data.success) {
                addToast('PIN reset successfully', 'success');
                setCurrentPassword('');
                setNewPin('');
                setActiveTab('details');
            }
        } catch (error) {
            addToast(error.response?.data?.error || 'Failed to reset PIN', 'error');
        } finally {
            setIsResetting(false);
        }
    };

    const fetchApprovals = async () => {
        setIsLoadingApprovals(true);
        try {
            const response = await api.get('/api/account/approvals');
            if (response.data.success) {
                // Filter approvals for this specific account
                const accountApprovals = response.data.approvals.filter(a => a.account_id === account.account_id);
                setApprovals(accountApprovals);
            }
        } catch (error) {
            addToast('Failed to load pending approvals', 'error');
        } finally {
            setIsLoadingApprovals(false);
        }
    };

    const handleApprovalAction = async (transferId, action) => {
        if (!approvalPin) {
            addToast('Please enter your PIN to authorize', 'error');
            return;
        }
        try {
            const response = await api.post('/api/account/approvals/process', {
                transfer_id: transferId,
                action: action,
                pin: approvalPin
            });
            if (response.data.success) {
                addToast(`Transfer ${action}ed successfully`, 'success');
                setApprovalPin('');
                fetchApprovals(); // Refresh list
            }
        } catch (error) {
            addToast(error.response?.data?.error || `Failed to ${action} transfer`, 'error');
        }
    };

    return (
        <div className="neo-card" style={{ padding: 0, overflow: 'hidden', border: '3px solid #fff' }}>
            {/* Header / Details Area */}
            <div style={{ padding: '1.25rem', borderBottom: '3px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                                {account.account_type || 'Account'}
                            </h4>
                            {account.membership_role && (
                                <span style={{
                                    fontSize: '0.7rem', padding: '2px 6px',
                                    border: '1px solid #fff', 
                                    textTransform: 'uppercase', 
                                    fontWeight: 700,
                                    background: '#000'
                                }}>
                                    {account.membership_role}
                                </span>
                            )}
                            <div style={{ 
                                width: '12px', height: '12px', 
                                background: statusColor(account.status), 
                                border: '1px solid #fff',
                                marginLeft: '1rem' 
                            }} title={account.status || 'active'} />
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', fontFamily: 'monospace', color: '#ccc' }}>
                                ID: {account.account_id ? `****${account.account_id.slice(-8)}` : '****'}
                            </p>
                            <button
                                onClick={(e) => handleCopy(e, account.account_id)}
                                title="Copy full account ID"
                                className="neo-btn-secondary"
                                style={{ padding: '2px 8px', fontSize: '0.7rem', borderWidth: '1px', boxShadow: '2px 2px 0px 0px #fff' }}
                            >
                                {copiedId === account.account_id ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy ID</>}
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
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#00ff00' }}>
                            ${parseFloat(account.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Tabs Menu */}
            <div style={{ display: 'flex', background: '#111', borderBottom: '1px solid #333' }}>
                <button 
                    onClick={() => setActiveTab('details')}
                    style={{ flex: 1, padding: '0.75rem', background: activeTab === 'details' ? '#222' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', borderRight: '1px solid #333' }}
                >
                    Details
                </button>
                <button 
                    onClick={() => setActiveTab('twin')}
                    style={{ flex: 1, padding: '0.75rem', background: activeTab === 'twin' ? '#222' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', borderRight: '1px solid #333' }}
                >
                    <Users size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }}/> Twin Star
                </button>
                <button 
                    onClick={() => setActiveTab('pin')}
                    style={{ flex: 1, padding: '0.75rem', background: activeTab === 'pin' ? '#222' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', borderRight: '1px solid #333' }}
                >
                    <Lock size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }}/> Reset PIN
                </button>
                <button 
                    onClick={() => setActiveTab('approvals')}
                    style={{ flex: 1, padding: '0.75rem', background: activeTab === 'approvals' ? '#222' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                    <AlertCircle size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }}/> Approvals
                </button>
            </div>

            {/* Tab Content */}
            <div style={{ padding: '1.25rem', background: '#0a0a0a', minHeight: '150px' }}>
                
                {activeTab === 'details' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: '#888', margin: '0 0 0.25rem 0' }}>Branch</p>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{account.branch_name || 'Main Branch'}</p>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#ccc' }}>{account.branch_location || 'Earth'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: '#888', margin: '0 0 0.25rem 0' }}>KYC Status</p>
                            <span style={{ 
                                padding: '2px 8px', 
                                background: account.verification_status === 'verified' ? '#00ff00' : '#ffa500', 
                                color: '#000', 
                                fontWeight: 'bold', 
                                fontSize: '0.8rem',
                                textTransform: 'uppercase'
                            }}>
                                {account.verification_status || 'Pending'}
                            </span>
                        </div>
                    </div>
                )}

                {activeTab === 'twin' && (
                    <div>
                        <h5 style={{ marginTop: 0, marginBottom: '1rem', textTransform: 'uppercase' }}>Invite Twin Star (Joint Owner)</h5>
                        {!isPrimary ? (
                            <p style={{ color: '#ff0000', fontSize: '0.9rem' }}>Only the primary account owner can invite members.</p>
                        ) : (
                            <form onSubmit={handleInviteTwin} style={{ display: 'flex', gap: '1rem' }}>
                                <input 
                                    type="email" 
                                    placeholder="Enter invitee's email address" 
                                    className="neo-input" 
                                    style={{ flex: 1 }}
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                />
                                <button type="submit" className="neo-btn" style={{ width: 'auto' }} disabled={isInviting}>
                                    {isInviting ? 'Inviting...' : 'Send Invite'}
                                </button>
                            </form>
                        )}
                        <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '1rem' }}>
                            Twin Stars have full access to view and transact on this account. High-value transfers {'>'} $5000 will require duel-authentication (approval from both owners).
                        </p>
                    </div>
                )}

                {activeTab === 'pin' && (
                    <div>
                        <h5 style={{ marginTop: 0, marginBottom: '1rem', textTransform: 'uppercase' }}>Reset Account Security PIN</h5>
                        <form onSubmit={handleResetPin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#888' }}>Login Password</label>
                                    <input 
                                        type="password" 
                                        placeholder="Verify your password" 
                                        className="neo-input" 
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#888' }}>New PIN (4-6 digits)</label>
                                    <input 
                                        type="password" 
                                        placeholder="Enter new PIN" 
                                        className="neo-input" 
                                        pattern="\d{4,6}"
                                        maxLength={6}
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="neo-btn" style={{ alignSelf: 'flex-start', width: 'auto' }} disabled={isResetting}>
                                {isResetting ? 'Resetting...' : 'Update PIN'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'approvals' && (
                    <div>
                        <h5 style={{ marginTop: 0, marginBottom: '1rem', textTransform: 'uppercase' }}>Pending High-Value Transfers</h5>
                        {isLoadingApprovals ? (
                            <p style={{ color: '#888' }}>Loading approvals...</p>
                        ) : approvals.length === 0 ? (
                            <p style={{ color: '#888', fontStyle: 'italic' }}>No pending transfers require your approval at this time.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {approvals.map(approval => (
                                    <div key={approval.transfer_id} style={{ padding: '1rem', border: '1px solid #333', background: '#000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold', color: '#ff00ff' }}>
                                                Transfer of ${approval.amount.toFixed(2)}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#ccc' }}> To: ****{approval.beneficiary_account.slice(-8)}</p>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}> Initiated by: {approval.initiator_name}</p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '150px' }}>
                                            <input 
                                                type="password" 
                                                placeholder="Enter PIN" 
                                                className="neo-input" 
                                                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                                value={approvalPin}
                                                onChange={(e) => setApprovalPin(e.target.value)}
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => handleApprovalAction(approval.transfer_id, 'reject')} className="neo-btn-secondary" style={{ flex: 1, padding: '4px', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', borderColor: '#ff0000', color: '#ff0000' }}>
                                                    <XCircle size={14}/>
                                                </button>
                                                <button onClick={() => handleApprovalAction(approval.transfer_id, 'approve')} className="neo-btn" style={{ flex: 1, padding: '4px', fontSize: '0.8rem', display: 'flex', justifyContent: 'center' }}>
                                                    <CheckCircle size={14} color="#000"/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountManagementCard;
