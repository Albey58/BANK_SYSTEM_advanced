import React, { useState } from 'react';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import styles from './ModalForm.module.css';
import api from '../api/axios';

const AddAccountModal = ({ isOpen, onClose, onSuccess }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        accountType: 'savings',
        currency: 'USD',
        initialDeposit: '',
        nickname: '',
        pin: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!formData.initialDeposit || parseFloat(formData.initialDeposit) < 100) {
            addToast("Minimum initial deposit is $100", "error");
            return;
        }
        if (!formData.pin || !/^\d{4,6}$/.test(formData.pin)) {
             addToast("PIN must be 4-6 digits (numbers only)", "error");
             return;
        }

        try {
            const response = await api.post('/api/account/create', {
                account_type: formData.accountType,
                pin: formData.pin,
                initial_deposit: parseFloat(formData.initialDeposit) || 0
            });

            if (response.data.success) {
                addToast(`Successfully opened new ${formData.accountType} account!`, "success");
                setFormData({
                    accountType: 'savings',
                    currency: 'USD',
                    initialDeposit: '',
                    nickname: '',
                    pin: ''
                });
                // Call onSuccess to refresh dashboard, fall back to onClose
                if (onSuccess) {
                    onSuccess();
                } else {
                    onClose();
                }
            } else {
                 addToast(response.data.error || "Failed to create account", "error");
            }
        } catch (error) {
            console.error(error);
            let errorMessage = error.response?.data?.error || "Error creating account";
            
            // Check for specific validation details from backend
            if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
                const details = error.response.data.details.map(d => {
                    let msg = d.msg || 'Invalid field';
                    if (msg.startsWith('Value error, ')) {
                        msg = msg.replace('Value error, ', '');
                    }
                    return msg;
                });
                errorMessage = `${errorMessage}: ${details.join(', ')}`;
            }
            
            addToast(errorMessage, "error");
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Open New Account">
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                    <label className={styles.label}>Account Type</label>
                    <div className={styles.selectWrapper}>
                        <select
                            name="accountType"
                            value={formData.accountType}
                            onChange={handleChange}
                            className={styles.select}
                        >
                            <option value="savings">Savings Account</option>
                            <option value="checking">Checking Account</option>
                        </select>
                    </div>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Account Nickname (Optional)</label>
                    <input
                        type="text"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleChange}
                        placeholder="e.g. Vacation Fund"
                        className={styles.input}
                    />
                </div>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label}>Currency</label>
                        <div className={styles.selectWrapper}>
                            <select
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                className={styles.select}
                                disabled
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Initial Deposit</label>
                        <input
                            type="number"
                            name="initialDeposit"
                            value={formData.initialDeposit}
                            onChange={handleChange}
                            placeholder="Min. $100"
                            min="100"
                            className={styles.input}
                            required
                        />
                    </div>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Set Account PIN (4-6 digits)</label>
                    <input
                        type="password"
                        name="pin"
                        value={formData.pin}
                        onChange={handleChange}
                        placeholder="****"
                        maxLength="6"
                        className={styles.input}
                        required
                    />
                </div>

                <div className={styles.infoBox}>
                    <p>By clicking "Open Account", you agree to our Terms of Service and Electronic Disclosure Agreement.</p>
                </div>

                <div className={styles.actions}>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                        Open Account
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddAccountModal;
