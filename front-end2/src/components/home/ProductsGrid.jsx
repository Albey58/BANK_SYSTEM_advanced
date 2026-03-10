import React from 'react';
import { Banknote, Briefcase, Landmark, CreditCard, ShieldCheck, Gem, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './ProductsGrid.module.css';

const services = [
  {
    icon: <Landmark size={32} />,
    title: "Savings",
    desc: "Up to 7.5% APY",
    detail: "High-yield savings with no monthly fees and instant access."
  },
  {
    icon: <Briefcase size={32} />,
    title: "Checking",
    desc: "Zero fees, unlimited transfers",
    detail: "A powerful account for your daily needs with 1% cashback on all debit purchases."
  },
  {
    icon: <CreditCard size={32} />,
    title: "Credit",
    desc: "Premium rewards",
    detail: "Exclusive travel perks, 3x points on dining, and no foreign transaction fees."
  },
  {
    icon: <Banknote size={32} />,
    title: "Loans",
    desc: "Low APR Personal & Home loans",
    detail: "Flexible terms and quick approval for personal, auto, and home financing."
  },
  {
    icon: <Gem size={32} />,
    title: "Wealth",
    desc: "Smart investing",
    detail: "Automated portfolios and dedicated advisors to grow your net worth."
  },
  {
    icon: <ShieldCheck size={32} />,
    title: "Insurance",
    desc: "Comprehensive coverage",
    detail: "Protect what matters most with life, home, and auto insurance bundles."
  }
];

const ProductsGrid = () => {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Financial Solutions</h2>
        <p className={styles.subtitle}>Comprehensive banking products designed for modern life.</p>
      </div>

      <div className={styles.grid}>
        {services.map((service, index) => (
          <motion.div 
            key={index} 
            className={styles.card}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.iconWrapper}>
              {service.icon}
            </div>
            <div className={styles.content}>
              <h3 className={styles.cardTitle}>{service.title}</h3>
              <p className={styles.cardDesc}>{service.desc}</p>
              <p className={styles.cardDetail}>{service.detail}</p>
              
              <div className={styles.cardLink}>
                Learn more <ArrowRight size={16} className={styles.arrow} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ProductsGrid;
