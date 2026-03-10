import clsx from 'clsx';

export const Card = ({ children, className, ...props }) => {
  return (
    <div className={clsx("glass-card p-6", className)} {...props}>
      {children}
    </div>
  );
};
