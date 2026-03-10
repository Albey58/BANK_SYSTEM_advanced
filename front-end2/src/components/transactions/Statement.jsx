import React, { useState } from 'react';
import styles from './Statement.module.css';

const Statement = () => {
    const [accId, setAccId] = useState('');
    const [amount, setAmount] = useState('');
    
    // Mock transactions
    const transactions = [
        { date: '2023-10-25', desc: 'Payroll Deposit', type: 'Deposit', amount: 4250.00, status: 'Completed' },
        { date: '2023-10-24', desc: 'Grocery Store', type: 'Transfer', amount: -156.32, status: 'Completed' },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Account Statements</h2>
            </div>
            
            <div className={styles.controls}>
                <div className={styles.controlGroup}>
                    <label className={styles.label}>Account ID</label>
                    <input 
                        className={styles.input} 
                        placeholder="Enter ID" 
                        value={accId} 
                        onChange={e => setAccId(e.target.value)} 
                    />
                </div>
                <div className={styles.controlGroup}>
                    <label className={styles.label}>Amount</label>
                    <input 
                        className={styles.input} 
                        placeholder="Limit" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                    />
                </div>
                <button className={styles.loadButton}>Load Statements</button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx, idx) => (
                            <tr key={idx}>
                                <td>{tx.date}</td>
                                <td>{tx.desc}</td>
                                <td>{tx.type}</td>
                                <td>{tx.amount}</td>
                                <td>{tx.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Statement;
