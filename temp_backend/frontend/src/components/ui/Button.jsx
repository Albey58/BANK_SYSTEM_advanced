import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  className, 
  isLoading, 
  disabled, 
  ...props 
}) => {
  return (
    <button
      className={clsx(
        variant === 'primary' ? 'btn-primary' : 'btn-secondary',
        (disabled || isLoading) && 'opacity-70 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};
