import clsx from 'clsx';

export const Input = ({ label, error, className, ...props }) => {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && <label className="text-secondary text-xs font-medium uppercase tracking-wide">{label}</label>}
      <input
        className={clsx(
          "input-field",
          error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
        )}
        {...props}
      />
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
};
