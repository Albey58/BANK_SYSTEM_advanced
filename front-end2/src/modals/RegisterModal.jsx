import React, { useState } from 'react';
import Modal from '../components/common/Modal';
import api from '../api/axios';
import styles from './ModalForm.module.css';

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        tax_id: '',
        doc_type: 'National_ID',
        doc_num: '',
        initial_pin: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successData, setSuccessData] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long.");
            setLoading(false);
            return;
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            setError("Password must contain at least one uppercase letter, one lowercase letter, and one number.");
            setLoading(false);
            return;
        }

        if (!/^[A-Za-z0-9\-]+$/.test(formData.tax_id)) {
            setError("Tax ID must contain only letters, numbers, and hyphens.");
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/api/auth/register', formData);
            if (response.data.success) {
                setSuccessData({
                    userId: response.data.user_id,
                    accountId: response.data.account_id
                });
            }
        } catch (err) {
            console.error('Registration failed:', err);
            
            let errorMessage = err.response?.data?.error || err.message || 'Registration failed. Please check your details and try again.';
            
            // Check for specific validation details from backend
            if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
                const details = err.response.data.details.map(d => {
                    // Extract message from Pydantic error
                    // msg often looks like "Value error, Password must contain..."
                    let msg = d.msg || 'Invalid field';
                    if (msg.startsWith('Value error, ')) {
                        msg = msg.replace('Value error, ', '');
                    }
                    return msg;
                });
                errorMessage = `${errorMessage}: ${details.join(', ')}`;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
    };

    if (successData) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Account Created">
                <div className={styles.modalContainer}>
                    <div className={styles.successPanel}>
                        <h3 style={{ color: '#4ade80', marginBottom: '0.5rem' }}>Account Created Successfully!</h3>
                        <p style={{ color: '#fff', fontWeight: '500' }}>
                           Welcome to Comet Bank!
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <span className={styles.label}>User ID</span>
                            <div className={styles.credentialRow}>
                                <code className={styles.code}>{successData.userId}</code>
                                <button className={styles.copyBtn} onClick={() => handleCopy(successData.userId)}>Copy</button>
                            </div>
                        </div>
                        
                        <div>
                            <span className={styles.label}>Account ID</span>
                            <div className={styles.credentialRow}>
                                <code className={styles.code}>{successData.accountId}</code>
                                <button className={styles.copyBtn} onClick={() => handleCopy(successData.accountId)}>Copy</button>
                            </div>
                        </div>
                        
                        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', textAlign: 'center' }}>
                            Please save these credentials securely.
                        </p>
                    </div>

                    <button 
                        onClick={() => { onClose(); if(onSwitchToLogin) onSwitchToLogin(); }}
                        className={styles.submitBtn}
                    >
                        Proceed to Login
                    </button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Account">
            <form onSubmit={handleSubmit} className={styles.modalContainer}>
                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.twoColumnGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Full Name</label>
                        <input 
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className={styles.input} 
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <input 
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={styles.input} 
                            placeholder="john@example.com"
                            required
                        />
                    </div>
                </div>

                <div className={styles.twoColumnGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input 
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={styles.input} 
                            placeholder="Min 8 chars"
                            required
                            minLength={8}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Initial PIN</label>
                        <input 
                            name="initial_pin"
                            type="password"
                            value={formData.initial_pin}
                            onChange={handleChange}
                            className={styles.input} 
                            placeholder="4-6 Digits"
                            required
                            pattern="\d{4,6}"
                            maxLength={6}
                        />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Tax ID / SSN</label>
                    <input 
                        name="tax_id"
                        value={formData.tax_id}
                        onChange={handleChange}
                        className={styles.input} 
                        placeholder="XXX-XX-XXXX"
                        required
                    />
                </div>

                <div className={styles.twoColumnGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Doc Type</label>
                        <select 
                            name="doc_type"
                            value={formData.doc_type}
                            onChange={handleChange}
                            className={styles.select}
                        >
                            <option value="National_ID">National ID</option>
                            <option value="Passport">Passport</option>
                            <option value="Drivers_License">Driver's License</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Doc Number</label>
                        <input 
                            name="doc_num"
                            value={formData.doc_num}
                            onChange={handleChange}
                            className={styles.input} 
                            placeholder="ID Number"
                            required
                        />
                    </div>
                </div>

                <div className={styles.actions}>
                    <button 
                        type="button" 
                        onClick={onClose}
                        className={styles.btnSecondary}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={styles.submitBtn}
                    >
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default RegisterModal;


