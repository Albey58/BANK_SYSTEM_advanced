import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import styles from './Card.module.css';

const Card = ({ children, className, hover = true, ...props }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -5, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)" } : {}}
      className={clsx(styles.card, className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
