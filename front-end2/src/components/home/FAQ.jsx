import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './FAQ.module.css';

const faqs = [
  {
    question: "How do I open an account?",
    answer: "You can open an account online in just a few minutes. Simply download our app or click 'Open Account' on our website, provide your identification details, and verify your identity."
  },
  {
    question: "Is there a minimum balance requirement?",
    answer: "Our standard checking accounts have no minimum balance requirements. Some premium savings accounts may require a minimum deposit to earn higher interest rates."
  },
  {
    question: "Are my deposits insured?",
    answer: "Yes, Nexus Bank is a fully licensed bank and your deposits are insured up to the maximum limit allowed by law (e.g., FDIC or equivalent in your region)."
  },
  {
    question: "How can I contact customer support?",
    answer: "Our support team is available 24/7 through the in-app chat, by phone, or email. Premium members also have access to a dedicated relationship manager."
  },
  {
    question: "What are the international transaction fees?",
    answer: "We offer zero foreign transaction fees on all our credit cards and premium debit cards. Standard accounts may incur a small fee for currency conversion."
  }
];

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
            <h2 className={styles.title}>Refrequently Asked Questions</h2>
            <p className={styles.subtitle}>Everything you need to know about banking with us.</p>
        </div>

        <div className={styles.list}>
          {faqs.map((faq, index) => (
            <div key={index} className={styles.item}>
              <button 
                className={`${styles.question} ${activeIndex === index ? styles.active : ''}`}
                onClick={() => toggleFAQ(index)}
                aria-expanded={activeIndex === index}
              >
                <span>{faq.question}</span>
                {activeIndex === index ? <Minus size={20} /> : <Plus size={20} />}
              </button>
              
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={styles.answerWrapper}
                  >
                    <div className={styles.answer}>
                        {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
