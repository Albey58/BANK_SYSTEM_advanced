import React, { useState } from 'react';
import styles from './AnimatedBackground.module.css';

const AnimatedBackground = () => {
    // Generate stars only once
    const [stars] = useState(() => Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 2 + 1}px`,
        delay: `${Math.random() * 5}s`,
        duration: `${Math.random() * 3 + 2}s`
    })));

    return (
        <div className={styles.backgroundContainer}>
            <div className={styles.gradientOverlay} />
            
            <div className={styles.starsContainer}>
                {stars.map((star) => (
                    <div 
                        key={star.id} 
                        className={styles.star} 
                        style={{
                            top: star.top,
                            left: star.left,
                            width: star.size,
                            height: star.size,
                            animationDelay: star.delay,
                            animationDuration: star.duration
                        }}
                    />
                ))}
            </div>

            <motion.div 
                className={`${styles.blob} ${styles.blob1}`}
                animate={{
                    x: [0, 100, -50, 0],
                    y: [0, -50, 50, 0],
                    scale: [1, 1.2, 0.8, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            
            <motion.div 
                className={`${styles.blob} ${styles.blob2}`}
                animate={{
                    x: [0, -70, 30, 0],
                    y: [0, 80, -40, 0],
                    scale: [1, 0.9, 1.1, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
            />

            <motion.div 
                className={`${styles.blob} ${styles.blob3}`}
                animate={{
                    x: [0, 50, -80, 0],
                    y: [0, -30, 60, 0],
                    scale: [1, 1.3, 0.9, 1],
                }}
                transition={{
                    duration: 22,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 5
                }}
            />
        </div>
    );
};

export default AnimatedBackground;
