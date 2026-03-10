import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '0',
                  border: '3px solid #000',
                  boxShadow: '12px 12px 0px 0px #000',
                  width: '100%',
                  maxWidth: '500px',
                  overflow: 'hidden',
                  position: 'relative',
                  color: '#000'
                }}
            >
                {/* Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.5rem',
                  borderBottom: '3px solid #000',
                  background: '#000',
                  color: '#fff'
                }}>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: '900',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      {title}
                    </h2>
                    <button 
                      onClick={onClose}
                      style={{
                        background: '#fff',
                        border: '2px solid #fff',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000'
                      }}
                    >
                      <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                  padding: '1.5rem',
                  maxHeight: '80vh',
                  overflowY: 'auto'
                }}>
                    {children}
                </div>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;


