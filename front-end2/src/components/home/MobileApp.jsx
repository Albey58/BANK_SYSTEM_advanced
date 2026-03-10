import React from 'react';
import { Apple, Smartphone } from 'lucide-react';
import styles from './MobileApp.module.css';

const MobileApp = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.title}>Bank on the Go</h2>
          <p className={styles.description}>
            Manage your finances anytime, anywhere with the industry-leading Nexus Bank mobile app.
            Check balances, transfer funds, pay bills, and deposite checks with a tap.
          </p>
          
          <div className={styles.features}>
            <div className={styles.featureItem}>
              <span className={styles.check}>✓</span> Biometric Login
            </div>
            <div className={styles.featureItem}>
              <span className={styles.check}>✓</span> Real-time Alerts
            </div>
            <div className={styles.featureItem}>
              <span className={styles.check}>✓</span> Card Controls
            </div>
          </div>

          <div className={styles.badges}>
            <button className={styles.storeBtn}>
              <Apple size={24} fill="currentColor" />
              <div className={styles.btnText}>
                <span className={styles.smallText}>Download on the</span>
                <span className={styles.largeText}>App Store</span>
              </div>
            </button>
            
            <button className={styles.storeBtn}>
              <Smartphone size={24} />
              <div className={styles.btnText}>
                <span className={styles.smallText}>Get it on</span>
                <span className={styles.largeText}>Google Play</span>
              </div>
            </button>
          </div>
        </div>

        <div className={styles.mockupWrapper}>
           {/* CSS-only Phone Mockup */}
           <div className={styles.phone}>
              <div className={styles.screen}>
                 <div className={styles.appHeader}>
                    <div className={styles.time}>9:41</div>
                    <div className={styles.statusIcons}>•••</div>
                 </div>
                 <div className={styles.appBody}>
                    <div className={styles.balanceCard}>
                       <div className={styles.balanceLabel}>Total Balance</div>
                       <div className={styles.balanceAmount}>$24,500.00</div>
                    </div>
                    <div className={styles.actions}>
                       <div className={styles.actionBtn}>Transfer</div>
                       <div className={styles.actionBtn}>Pay</div>
                       <div className={styles.actionBtn}>More</div>
                    </div>
                    <div className={styles.transactionList}>
                       <div className={styles.transaction}>Grocery Store - $120</div>
                       <div className={styles.transaction}>Netflix - $15</div>
                       <div className={styles.transaction}>Salary - +$4,000</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
};

export default MobileApp;
