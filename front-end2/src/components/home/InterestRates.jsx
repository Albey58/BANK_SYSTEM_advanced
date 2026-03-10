import React from 'react';
import { TrendingUp, ArrowRight, Percent } from 'lucide-react';
import styles from './InterestRates.module.css';

const rates = [
  { type: "Savings Account", rate: "7.50%", term: "p.a." },
  { type: "Fixed Deposit", rate: "8.20%", term: "1 Year" },
  { type: "Home Loan", rate: "6.90%", term: "Floating" },
  { type: "Personal Loan", rate: "10.50%", term: "Starting" },
];

const InterestRates = () => {
  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <div className={styles.textColumn}>
          <h2 className={styles.title}>Maximize Your Growth</h2>
          <p className={styles.description}>
            Competitive interest rates designed to help your money work harder for you. 
            Whether you're saving for a rainy day or planning a major purchase, we offer 
            some of the best rates in the market.
          </p>
          <button className={styles.calculatorBtn}>
            Open Calculator <ArrowRight size={18} />
          </button>
        </div>

        <div className={styles.ratesGrid}>
          {rates.map((item, index) => (
            <div key={index} className={styles.rateCard}>
              <div className={styles.rateHeader}>
                <span className={styles.rateIcon}><Percent size={16} /></span>
                <span className={styles.rateType}>{item.type}</span>
              </div>
              <div className={styles.rateValue}>{item.rate}</div>
              <div className={styles.rateTerm}>{item.term}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InterestRates;
