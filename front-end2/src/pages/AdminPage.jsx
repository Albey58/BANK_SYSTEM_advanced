import React, { useState } from 'react';
import AuditLogs from '../components/admin/AuditLogs';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, DollarSign, AlertCircle } from 'lucide-react';

const AdminPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const applyInterest = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await api.post('/api/admin/apply-interest');
            if (response.data.success) {
                setMessage({ type: 'success', text: response.data.message });
            } else {
                setMessage({ type: 'error', text: response.data.error || 'Failed to apply interest' });
            }
        } catch (error) {
            console.error('Interest application failed:', error);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to apply interest' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="section active">
            <div className="section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#000', color: '#fff', padding: '0.5rem', border: '3px solid #000' }}>
                        <ShieldCheck size={32} strokeWidth={3} />
                    </div>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Admin Console</h1>
                        <p className="page-subtitle">Manage system settings and view logs</p>
                    </div>
                </div>
                
                <div className="neo-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <User size={20} />
                        <span style={{ fontWeight: 'bold' }}>Logged in as: {user?.email || 'Administrator'}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', padding: '0.25rem 0.5rem', background: '#000', color: '#fff' }}>
                        Super User
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                 {/* System Actions Card */}
                 <div className="neo-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '3px solid #000', paddingBottom: '1rem' }}>
                        <div style={{ background: '#ffff00', padding: '0.5rem', border: '3px solid #000' }}>
                            <DollarSign size={24} color="#000" strokeWidth={3} />
                        </div>
                        <h3 style={{ textTransform: 'uppercase', fontWeight: 900, fontSize: '1.25rem', margin: 0 }}>Interest Management</h3>
                    </div>
                    <p style={{ marginBottom: '1.5rem' }}>Apply daily interest to all savings accounts. This action is irreversible.</p>
                    <button 
                        onClick={applyInterest}
                        disabled={loading}
                        className="neo-btn"
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Processing...' : 'Apply Daily Interest'}
                    </button>
                    {message && (
                        <div style={{ 
                            marginTop: '1rem', 
                            padding: '1rem', 
                            border: '3px solid #000', 
                            background: message.type === 'success' ? '#00ff00' : '#ff0000', 
                            color: message.type === 'success' ? '#000' : '#fff',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            {message.type === 'error' && <AlertCircle size={16} />}
                            {message.text}
                        </div>
                    )}
                </div>
            </div>

            <AuditLogs />
        </div>
    );
};

export default AdminPage;
