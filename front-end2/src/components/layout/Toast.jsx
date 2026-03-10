import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import styles from './Toast.module.css';

const Toast = () => {
  const { toasts, removeToast } = useToast();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className={styles.iconSuccess} />;
      case 'error':
        return <AlertTriangle size={20} className={styles.iconError} />;
      case 'warning':
        return <AlertTriangle size={20} className={styles.iconWarning} />;
      default:
        return <Info size={20} className={styles.iconInfo} />;
    }
  };

  return (
    <div className={styles.toastContainer}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`${styles.toast} ${styles[toast.type]}`}
            layout
          >
            <div className={styles.content}>
              {getIcon(toast.type)}
              <span className={styles.message}>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className={styles.closeButton}
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <div className={`${styles.progressBar} ${styles[toast.type]}`} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
