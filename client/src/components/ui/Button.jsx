function Button({ children, className = "", variant = "primary", ...props }) {
  const variants = {
    primary:
      "bg-secondary text-on-secondary hover:bg-secondary-container shadow-sm",
    neutral:
      "bg-surface-container-low text-on-surface hover:bg-surface-container",
    ghost:
      "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
  };

  return (
    <button
      className={`transition-colors ${variants[variant]} ${className}`}
      {...props}>
      {children}
    </button>
  );
}

export default Button;
