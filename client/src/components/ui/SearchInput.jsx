function SearchInput({ value, onChange, placeholder, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
        search
      </span>
      <input
        className="h-10 w-full rounded-lg bg-surface-container-low pl-10 pr-space-xl text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:ring-2 focus:ring-secondary/30"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type="search"
      />
      <span className="absolute right-space-md top-1/2 -translate-y-1/2 rounded bg-surface-container px-space-xs py-space-2xs font-tech-unit text-tech-unit text-on-surface-variant">
        ⌘K
      </span>
    </div>
  );
}

export default SearchInput;
