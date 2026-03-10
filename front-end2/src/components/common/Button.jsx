import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import styles from './Button.module.css';

const Button = ({ children, variant = "primary", size = "md", className, ...props }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={clsx(styles.button, styles[variant], styles[size], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
