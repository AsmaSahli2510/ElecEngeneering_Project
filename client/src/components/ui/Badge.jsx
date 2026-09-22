function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
