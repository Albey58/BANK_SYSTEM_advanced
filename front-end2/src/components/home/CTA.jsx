import React from 'react';
import { ArrowRight } from 'lucide-react';
import styles from './CTA.module.css';

const CTA = ({ onOpenRegister }) => {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <h2 className={styles.title}>Ready to Experience Modern Banking?</h2>
                <p className={styles.description}>
                    Join over 2 million customers who trust Nexus Bank for their financial journey.
                    Opening an account takes less than 5 minutes.
                </p>
                
                <div className={styles.buttons}>
                    <button className={styles.primaryBtn} onClick={onOpenRegister}>
                        Open an Account <ArrowRight size={20} />
                    </button>
                    <button className={styles.secondaryBtn}>
                        Contact Sales
                    </button>
                </div>
            </div>
        </section>
    );
};

export default CTA;
