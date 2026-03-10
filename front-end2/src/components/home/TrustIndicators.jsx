import React from 'react';
import styles from './TrustIndicators.module.css';

const TrustIndicators = () => {
    // These could be SVGs or actual partner logos
    const partners = ["Stripe", "Visa", "Mastercard", "AWS", "Deloitte"];

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.statGroup}>
                    <p className={styles.statLabel}>Trusted by</p>
                    <h2 className={styles.statValue}>2M+</h2>
                    <p className={styles.statSub}>Customers Worldwide</p>
                </div>
                
                <div className={styles.partnersGrid}>
                    {partners.map((partner, index) => (
                        <div key={index} className={styles.partnerLogo}>
                            {partner}
                        </div>
                    ))}
                </div>

                <div className={styles.certifications}>
                    <span className={styles.certItem}>PCI-DSS Level 1</span>
                    <span className={styles.separator}>•</span>
                    <span className={styles.certItem}>ISO 27001 Certified</span>
                    <span className={styles.separator}>•</span>
                    <span className={styles.certItem}>GDPR Compliant</span>
                </div>
            </div>
        </section>
    );
};

export default TrustIndicators;
