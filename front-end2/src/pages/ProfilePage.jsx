import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [name, setName] = useState(user?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [loading, setLoading] = useState(false);

    const copyUserId = () => {
        navigator.clipboard.writeText(user?.user_id || '');
        addToast('User ID copied to clipboard', 'success');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.put(`/api/user/profile/${user.user_id}`, {
                full_name: name,
                email: email
            });
            if (response.data.success) {
                addToast('Profile updated successfully', 'success');
                // sync localStorage
                const updated = { ...user, full_name: name, email };
                localStorage.setItem('user', JSON.stringify(updated));
            } else {
                addToast(response.data.error || 'Update failed', 'error');
            }
        } catch (error) {
            console.error('Update failed:', error);
            addToast(error.response?.data?.error || 'Failed to update profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>My Profile</h1>

            {/* Profile Header Card */}
            <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    background: '#ffffff', color: '#000000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', fontWeight: 800, flexShrink: 0,
                    border: '2px solid #ffffff'
                }}>
                    {(user?.full_name || 'U')[0].toUpperCase()}
                </div>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{user?.full_name || '—'}</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{user?.email || '—'}</p>
                </div>
            </div>

            {/* Edit Form */}
            <div className={styles.card}>
                <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Details</h3>
                <form onSubmit={handleSubmit}>
                    {/* User ID (read-only, copyable) */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>User ID</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                className={styles.input}
                                style={{ opacity: 0.5, cursor: 'not-allowed', flex: 1 }}
                                type="text"
                                value={user?.user_id || ''}
                                readOnly
                            />
                            <button
                                type="button"
                                onClick={copyUserId}
                                style={{
                                    padding: '0 1rem',
                                    background: '#000', color: '#fff',
                                    border: '1px solid #fff',
                                    cursor: 'pointer', fontWeight: 600,
                                    borderRadius: 'var(--radius-md)',
                                    whiteSpace: 'nowrap', fontSize: '0.8rem'
                                }}
                            >
                                📋 Copy
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Full Name</label>
                        <input
                            className={styles.input}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            className={styles.input}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.button}
                        style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;