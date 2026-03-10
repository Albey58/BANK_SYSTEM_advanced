import React from 'react';
import { Lock, Shield, CheckCircle } from 'lucide-react';
import styles from './SecurityBanner.module.css';

const SecurityBanner = () => {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <h2 className={styles.title}>Bank-Grade Security & Compliance</h2>
                    <p className={styles.description}>
                        We adhere to the highest international standards of data protection and financial regulation.
                        Your peace of mind is our top priority.
                    </p>
                </div>
                
                <div className={styles.certificates}>
                    <div className={styles.certItem}>
                        <Lock size={32} className={styles.icon} />
                        <div>
                            <h4 className={styles.certTitle}>256-bit Encryption</h4>
                            <p className={styles.certDesc}>Data transmission security</p>
                        </div>
                    </div>
                    
                    <div className={styles.certItem}>
                        <Shield size={32} className={styles.icon} />
                        <div>
                            <h4 className={styles.certTitle}>GDPR Compliant</h4>
                            <p className={styles.certDesc}>Strict data privacy controls</p>
                        </div>
                    </div>

                    <div className={styles.certItem}>
                        <CheckCircle size={32} className={styles.icon} />
                        <div>
                            <h4 className={styles.certTitle}>RBI Regulated</h4>
                            <p className={styles.certDesc}>Authorized banking entity</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SecurityBanner;
