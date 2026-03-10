import React from 'react';
import { ShieldCheck, Headset, EyeOff, CheckCircle } from 'lucide-react';
import styles from './USP.module.css';

const features = [
  {
    icon: <ShieldCheck size={48} />,
    title: "Bank-Grade Security",
    desc: "Your data is encrypted with AES-256 bit protocols. We use multi-factor authentication and real-time fraud monitoring to keep your assets safe."
  },
  {
    icon: <Headset size={48} />,
    title: "24/7 Dedicated Support",
    desc: "Our expert team is available round-the-clock via chat, email, or phone. No bots, just real humans ready to assist you anytime, anywhere."
  },
  {
    icon: <EyeOff size={48} />,
    title: "Zero Hidden Fees",
    desc: "Transparency is our policy. No maintenance fees, no surprise charges, and free ATM withdrawals worldwide. Keep more of what you earn."
  }
];

const USP = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
            <h2 className={styles.title}>Why Choose Nexus Bank?</h2>
            <p className={styles.subtitle}>We're redefining banking with security, transparency, and support at the core.</p>
        </div>

        <div className={styles.grid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.iconWrapper}>
                {feature.icon}
              </div>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDesc}>{feature.desc}</p>
              <ul className={styles.list}>
                  <li><CheckCircle size={16} /> 100% Digital Setup</li>
                  <li><CheckCircle size={16} /> Instant Notifications</li>
                  <li><CheckCircle size={16} /> Global Access</li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default USP;
