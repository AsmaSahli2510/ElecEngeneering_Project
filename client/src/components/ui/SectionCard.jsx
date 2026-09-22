// Carte de section : en-tête (icône, titre, sous-titre, badge / actions) + contenu.
function SectionCard({ icon, title, subtitle, badge, actions, children, className = "", id, ...rest }) {
  return (
    <section
      className={`scroll-mt-24 space-y-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-sm lg:p-space-xl ${className}`}
      id={id}
      {...rest}>
      {(title || actions || badge) && (
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            {icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-fixed text-on-secondary-fixed">
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </div>
            )}
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">{title}</h2>
              {subtitle && <p className="font-body-sm text-body-sm text-on-surface-variant">{subtitle}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            {badge}
            {actions}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

export default SectionCard;
