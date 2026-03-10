import React from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';
import styles from './Hero.module.css';
import { ArrowRight, ShieldCheck, Lock, Award } from 'lucide-react';
import Globe from './Globe'; // Import the Globe component

const Hero = ({ onOpenRegister }) => {
    return (
        <section className={styles.heroSection}>
            <div className={styles.container}>
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className={styles.content}
                >
                    <h1 className={styles.headline}>
                        Banking Made Simple <br/>
                        <span className={styles.highlight}>& Secure</span>
                    </h1>
                    <p className={styles.subtext}>
                        Experience a new standard of financial control with 24/7 support, industry-leading security, and a seamless digital interface designed for you.
                    </p>
                    
                    <div className={styles.ctaGroup}>
                        <Button size="lg" className={styles.primaryBtn} onClick={onOpenRegister}>
                            Open Account
                        </Button>
                        <Button variant="secondary" size="lg" className={styles.secondaryBtn}>
                            Explore Products
                        </Button>
                    </div>

                    <div className={styles.badges}>
                        <div className={styles.badge}>
                            <Lock size={16} /> 256-bit SSL
                        </div>
                        <div className={styles.badge}>
                            <ShieldCheck size={16} /> RBI Regulated
                        </div>
                        <div className={styles.badge}>
                            <Award size={16} /> Award Winning
                        </div>
                    </div>
                </motion.div>
            </div>
            
            {/* Globe positioned absolutely within the hero section, independent of content container */}
            <div style={{ 
                position: 'absolute', 
                top: '0%', 
                right: '0%', 
                width: '600px',
                height: '600px',
                zIndex: 0, 
                pointerEvents: 'none',
                opacity: 0.8
            }}>
                <Globe />
            </div>
            
        </section>
    );
};

export default Hero;
