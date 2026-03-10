import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Plus } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

import StatsGrid from '../components/dashboard/StatsGrid';
import AccountList from '../components/dashboard/AccountList';
import AddAccountModal from '../modals/AddAccountModal';

const DashboardPage = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    const fetchDashboardData = async () => {
        if (!user?.user_id) return;
        setIsLoading(true);
        try {
            const response = await api.get(`/api/user/dashboard/${user.user_id}`);
            if (response.data.success) {
                setDashboardData(response.data);
            } else {
                addToast('Failed to load dashboard data', 'error');
            }
        } catch (error) {
            console.error('Dashboard fetch error:', error);
            addToast('Error loading dashboard', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    if (isLoading) {
        return (
            <div className="section active" style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Loading...</div>
            </div>
        );
    }

    return (
        <section className="section active" id="dashboard">
             <AddAccountModal 
                isOpen={isAddAccountOpen} 
                onClose={() => setIsAddAccountOpen(false)} 
                onSuccess={() => {
                    setIsAddAccountOpen(false);
                    fetchDashboardData();
                }}
            />

            <div className="section-header">
                <h1 className="page-title">Your Dashboard</h1>
                <p className="page-subtitle" style={{fontFamily:"sans-serif"}}>Welcome back, {user?.full_name || 'Traveler'}! Here's your financial overview</p>
                <p style={{ fontWeight: 'bold', marginTop: '0.5rem', borderBottom: '3px solid #000', display: 'inline-block', paddingBottom: '0.25rem' }}>{currentDate}</p>
            </div>

            {/* Stats Grid */}
            <StatsGrid data={dashboardData} />

            {/* Dashboard Content */}
            <div className="dashboard-content" style={{ marginTop: '2rem' }}>
                <div className="neo-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '3px solid #000', paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: '#000', padding: '0.5rem', border: '3px solid #000' }}>
                                <CreditCard size={24} color="#fff" strokeWidth={3} />
                            </div>
                            <h3 style={{ textTransform: 'uppercase', fontWeight: 900, fontSize: '1.5rem', margin: 0 }}>Your Accounts</h3>
                        </div>
                        <button className="neo-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }} onClick={() => setIsAddAccountOpen(true)}>
                            <Plus size={16} strokeWidth={3} /> New Account
                        </button>
                    </div>
                    <div>
                        <AccountList accounts={dashboardData?.accounts || []} />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DashboardPage;

