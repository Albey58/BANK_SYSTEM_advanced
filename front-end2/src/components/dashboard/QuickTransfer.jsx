import React, { useState } from 'react';
import { Send, DollarSign, User } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import Card from '../common/Card';
import Button from '../common/Button';
import styles from './QuickTransfer.module.css';

const QuickTransfer = () => {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const { addToast } = useToast();

    const handleTransfer = (e) => {
        e.preventDefault();
        
        if (!recipient || !amount) {
            addToast("Please fill in all fields", "error");
            return;
        }

        // Mock transfer logic
        addToast(`Transferred $${amount} to ${recipient}`, "success");
        setRecipient('');
        setAmount('');
    };

    return (
        <Card className={styles.container}>
            <h3 className={styles.title}>Quick Transfer</h3>
            <form onSubmit={handleTransfer} className={styles.form}>
                <div className={styles.inputGroup}>
                    <User size={18} className={styles.icon} />
                    <input
                        type="text"
                        placeholder="Recipient Username"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className={styles.input}
                        required
                    />
                </div>
                <div className={styles.inputGroup}>
                    <DollarSign size={18} className={styles.icon} />
                    <input
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={styles.input}
                        required
                    />
                </div>
                <Button type="submit" variant="primary" className={styles.button}>
                    Send Funds <Send size={16} className={styles.btnIcon} />
                </Button>
            </form>
        </Card>
    );
};

export default QuickTransfer;
