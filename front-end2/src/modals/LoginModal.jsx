import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import styles from './ModalForm.module.css';

const LoginModal = ({ isOpen, onClose }) => {
    const { login } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email || !password) {
            addToast("Please fill in all fields", "error");
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (result.success) {
            addToast("Login successful!", "success");
            onClose();
            navigate('/dashboard');
        } else {
            addToast(result.error, "error");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Welcome Back">
            <form onSubmit={handleSubmit} className={styles.modalContainer}>
                <div className={styles.formGroup}>
                    <label htmlFor="login-email" className={styles.label}>Email Address</label>
                    <input 
                        id="login-email"
                        type="email" 
                        className={styles.input}
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />
                </div>
                
                <div className={styles.formGroup}>
                    <label htmlFor="login-password" className={styles.label}>Password</label>
                    <input 
                        id="login-password"
                        type="password" 
                        className={styles.input}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </div>

                <div className={styles.actions}>
                    <button 
                        type="submit" 
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default LoginModal;

