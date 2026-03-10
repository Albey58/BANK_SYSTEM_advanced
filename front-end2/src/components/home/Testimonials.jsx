import React from 'react';
import { Star, User } from 'lucide-react';
import styles from './Testimonials.module.css';

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "Small Business Owner",
    text: "Nexus Bank transformed how I manage my business finances. The dashboard is intuitive, and the support team is always just a click away.",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Software Engineer",
    text: "Finally, a bank that understands modern security needs. The API integrations and real-time alerts give me total peace of mind.",
    rating: 5
  },
  {
    name: "Elena Rodriguez",
    role: "Freelance Designer",
    text: "Low fees, great exchange rates, and a beautiful mobile app. It's everything I've ever wanted in a banking partner.",
    rating: 4
  }
];

const Testimonials = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
            <h2 className={styles.title}>Trusted by Thousands</h2>
            <p className={styles.subtitle}>Don't just take our word for it. Here's what our customers have to say.</p>
        </div>

        <div className={styles.grid}>
          {testimonials.map((item, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={16} 
                    fill={i < item.rating ? "currentColor" : "none"} 
                    className={i < item.rating ? styles.starFilled : styles.starEmpty}
                  />
                ))}
              </div>
              <p className={styles.text}>"{item.text}"</p>
              
              <div className={styles.author}>
                <div className={styles.avatar}>
                    <User size={20} />
                </div>
                <div>
                    <div className={styles.name}>{item.name}</div>
                    <div className={styles.role}>{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
