import React from 'react';
import Card from '../common/Card';
import styles from './Features.module.css';
import { ShieldCheck, Zap, Globe, PieChart, Users, Key } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Globe size={32} />,
      title: "Cosmic Design",
      description: "Glassmorphism UI with smooth, Reactbits-inspired animations and a deep space aesthetic.",
      color: "var(--color-primary)"
    },
    {
      icon: <ShieldCheck size={32} />,
      title: "Secure Banking",
      description: "Advanced fraud detection for large deposits and secure KYC onboarding process.",
      color: "var(--color-success)"
    },
    {
      icon: <Zap size={32} />,
      title: "Instant Transfers",
      description: "Lightning fast transfers with automatic fee calculation and real-time status updates.",
      color: "var(--color-warning)"
    },
    {
      icon: <PieChart size={32} />,
      title: "Smart Dashboard",
      description: "Visual stats and account overviews with masked data for privacy in public spaces.",
      color: "var(--color-accent)"
    },
    {
      icon: <Users size={32} />,
      title: "Admin Console",
      description: "Powerful tools for applying interest, auditing logs, and managing user accounts.",
      color: "var(--color-secondary)"
    },
    {
      icon: <Key size={32} />,
      title: "Role-Based Access",
      description: "Separate views and capabilities for regular users and administrators.",
      color: "#38bdf8"
    }
  ];

  return (
    <section className={styles.featuresSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Why Choose Nexus Bank?</h2>
        <div className={styles.grid}>
          {features.map((feature, index) => (
            <Card key={index} className={styles.featureCard}>
              <div 
                className={styles.iconWrapper}
                style={{ color: feature.color, background: `${feature.color}20` }}
              >
                {feature.icon}
              </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
