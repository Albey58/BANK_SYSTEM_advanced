import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import Card from '../common/Card';
import styles from './RecentTransactions.module.css';

const mockTransactions = [
    { id: 1, type: 'send', user: 'Amazon Prime', date: 'Today, 2:30 PM', amount: -12.99, status: 'Completed' },
    { id: 2, type: 'receive', user: 'Salary Deposit', date: 'Yesterday, 9:00 AM', amount: 3450.00, status: 'Completed' },
    { id: 3, type: 'send', user: 'Starbucks', date: 'Yesterday, 8:15 AM', amount: -5.40, status: 'Completed' },
    { id: 4, type: 'send', user: 'Electric Bill', date: 'Oct 24, 2023', amount: -145.20, status: 'Pending' },
    { id: 5, type: 'receive', user: 'John Doe', date: 'Oct 22, 2023', amount: 50.00, status: 'Completed' },
];

const RecentTransactions = () => {
    const navigate = useNavigate();

    return (
        <Card className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Recent Activity</h3>
                <button 
                    className={styles.viewAll} 
                    onClick={() => navigate('/transactions')}
                >
                    View All
                </button>
            </div>
            <div className={styles.list}>
                {mockTransactions.map((tx) => (
                    <div key={tx.id} className={styles.item}>
                        <div className={`${styles.iconBox} ${tx.type === 'receive' ? styles.receive : styles.send}`}>
                            {tx.type === 'receive' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div className={styles.details}>
                            <span className={styles.user}>{tx.user}</span>
                            <span className={styles.date}>{tx.date}</span>
                        </div>
                        <div className={styles.amountBox}>
                            <span className={`${styles.amount} ${tx.amount > 0 ? styles.positive : styles.negative}`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                            </span>
                            <span className={`${styles.status} ${styles[tx.status.toLowerCase()]}`}>
                                {tx.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default RecentTransactions;
