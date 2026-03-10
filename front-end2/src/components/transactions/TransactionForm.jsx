import React, { useState } from 'react';
import styles from './TransactionForm.module.css';

const TransactionForm = () => {
    // Deposit State
    const [depositId, setDepositId] = useState('');
    const [depositAmount, setDepositAmount] = useState('');

    // Transfer State
    const [transferTo, setTransferTo] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferPin, setTransferPin] = useState('');

    // Withdraw State
    const [withdrawId, setWithdrawId] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawPin, setWithdrawPin] = useState('');

    return (
        <div className={styles.container}>
            {/* Deposit Section */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Deposit Funds</h3>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Account ID</label>
                    <input 
                        className={styles.input} 
                        type="text" 
                        placeholder="Enter ID" 
                        value={depositId}
                        onChange={(e) => setDepositId(e.target.value)}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Amount</label>
                    <input 
                        className={styles.input} 
                        type="number" 
                        placeholder="Amount" 
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                    />
                </div>
                <button className={styles.button}>Add Deposited Money</button>
            </div>

            {/* Transfer Section */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Transfer Money</h3>
                <div className={styles.formGroup}>
                    <label className={styles.label}>To Account</label>
                    <input 
                        className={styles.input} 
                        type="text" 
                        placeholder="Recipient Account" 
                        value={transferTo}
                        onChange={(e) => setTransferTo(e.target.value)}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Amount</label>
                    <input 
                        className={styles.input} 
                        type="number" 
                        placeholder="Amount" 
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>PIN</label>
                    <input 
                        className={styles.input} 
                        type="password" 
                        placeholder="Enter PIN" 
                        value={transferPin}
                        onChange={(e) => setTransferPin(e.target.value)}
                    />
                </div>
                <button className={styles.button}>Transfer Money</button>
            </div>

            {/* Withdraw Section */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Withdraw Funds</h3>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Account ID</label>
                    <input 
                        className={styles.input} 
                        type="text" 
                        placeholder="Enter ID" 
                        value={withdrawId}
                        onChange={(e) => setWithdrawId(e.target.value)}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Amount</label>
                    <input 
                        className={styles.input} 
                        type="number" 
                        placeholder="Amount" 
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>PIN</label>
                    <input 
                        className={styles.input} 
                        type="password" 
                        placeholder="Enter PIN" 
                        value={withdrawPin}
                        onChange={(e) => setWithdrawPin(e.target.value)}
                    />
                </div>
                <button className={styles.button}>Withdraw Funds</button>
            </div>
        </div>
    );
};

export default TransactionForm;
