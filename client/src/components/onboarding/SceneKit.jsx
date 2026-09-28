import { useLayoutEffect, useRef } from "react";
import { clickTime, cursorStep } from "./timeline.js";

const SIDEBAR_ICONS = ["dashboard", "folder", "developer_board", "bolt", "request_quote", "inventory_2", "build"];

// Cadre « fenêtre de l'application » : mini barre latérale (mêmes couleurs que la vraie) + fil d'Ariane.
// Le corps porte data-onb-host : c'est le repère dans lequel le curseur animé se déplace.
export function MockWindow({ crumbs = [], activeIcon = "folder", children }) {
  return (
    <div className="flex h-full overflow-hidden rounded-xl bg-background shadow-lg ring-1 ring-outline-variant/50">
      <div className="hidden w-11 shrink-0 flex-col items-center gap-space-sm bg-primary-container py-space-sm sm:flex">
        <div className="mb-space-xs flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-on-secondary">
          <span className="material-symbols-outlined text-[16px]">electric_bolt</span>
        </div>
        {SIDEBAR_ICONS.map((icon) => (
          <span
            className={`material-symbols-outlined flex h-7 w-7 items-center justify-center rounded text-[16px] ${
              icon === activeIcon ? "bg-secondary/30 text-surface-bright" : "text-on-primary-container"
            }`}
            key={icon}>
            {icon}
          </span>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-8 shrink-0 items-center gap-space-xs border-b border-surface-container bg-surface-container-lowest px-space-md font-body-sm text-[11px] text-on-surface-variant">
          {crumbs.map((crumb, index) => (
            <span className="flex items-center gap-space-xs" key={crumb}>
              {index > 0 && <span className="text-outline">/</span>}
              <span className={index === crumbs.length - 1 ? "font-semibold text-on-surface" : ""}>{crumb}</span>
            </span>
          ))}
        </div>
        <div className="relative flex-1 overflow-hidden p-space-md" data-onb-host>
          {children}
        </div>
      </div>
    </div>
  );
}

// Curseur de souris qui rejoint l'élément [data-onb="<target>"] de l'étape courante, avec un « clic » visible.
// La position est posée directement sur le DOM (mesure de mise en page), sans état React.
export function Cursor({ t, path }) {
  const ref = useRef(null);
  const step = cursorStep(t, path);
  const target = step?.target;

  useLayoutEffect(() => {
    const cursor = ref.current;
    const host = cursor?.closest("[data-onb-host]");
    if (!host) return;
    const element = target && host.querySelector(`[data-onb="${target}"]`);
    let x = host.clientWidth * 0.92;
    let y = host.clientHeight * 0.95;
    if (element) {
      x = element.offsetWidth * 0.6;
      y = element.offsetHeight * 0.55;
      for (let node = element; node && node !== host; node = node.offsetParent) {
        x += node.offsetLeft;
        y += node.offsetTop;
      }
    }
    cursor.style.transform = `translate(${x}px, ${y}px)`;
  }, [target]);

  const clicking = step?.click && t >= clickTime(step) && t < clickTime(step) + 450;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute left-0 top-0 z-30 transition-[transform,opacity] duration-700 ease-in-out ${step ? "opacity-100" : "opacity-0"}`}
      ref={ref}>
      {clicking && <span className="onb-ripple absolute left-0 top-0 h-8 w-8 rounded-full bg-secondary/40" key={step.at} />}
      <svg className="relative drop-shadow-md" height="22" viewBox="0 0 24 24" width="22">
        <path d="M4 2l15 11.5-6.6 1.1 3.9 7.2-2.8 1.5-3.9-7.3L4 20.5z" fill="#0b1c30" stroke="#ffffff" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

const CALLOUT_ARROWS = {
  left: { icon: "west", nudge: "onb-nudge-x", order: "flex-row" },
  right: { icon: "east", nudge: "onb-nudge-x", order: "flex-row-reverse" },
  up: { icon: "north", nudge: "onb-nudge-y", order: "flex-col" },
  down: { icon: "south", nudge: "onb-nudge-y", order: "flex-col-reverse" },
};

// Bulle avec flèche animée qui pointe un élément de la scène (position donnée par `className`).
export function Callout({ show, arrow = "left", className = "", children }) {
  if (!show) return null;
  const { icon, nudge, order } = CALLOUT_ARROWS[arrow];
  return (
    <div className={`onb-pop pointer-events-none absolute z-20 flex items-center gap-space-2xs ${order} ${className}`}>
      <span className={`material-symbols-outlined text-[22px] font-bold text-secondary ${nudge}`}>{icon}</span>
      <span className="whitespace-nowrap rounded-lg bg-secondary px-space-sm py-space-xs font-body-sm text-[11px] font-bold text-on-secondary shadow-lg">
        {children}
      </span>
    </div>
  );
}

// Élément qui apparaît (avec l'animation `anim`) à partir du moment où `show` devient vrai ; il garde sa place avant.
export function Reveal({ show, anim = "onb-rise", as: Tag = "div", className = "", children, ...rest }) {
  return (
    <Tag className={`${className} ${show ? anim : "opacity-0"}`} {...rest}>
      {children}
    </Tag>
  );
}

export function MiniField({ label, value, caret, active, highlight, mono, onb, className = "" }) {
  return (
    <div className={className}>
      <div className="mb-space-2xs font-label-caps text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</div>
      <div
        className={`flex h-8 items-center rounded-lg px-space-sm text-[12px] text-on-surface transition-shadow ${
          mono ? "font-tech-data-md font-bold text-secondary" : ""
        } ${active ? "bg-surface-container-lowest ring-2 ring-secondary/50" : "bg-surface-container-low"} ${highlight ? "onb-pulse" : ""}`}
        data-onb={onb}>
        <span className="truncate">{value}</span>
        {caret && <span className="onb-caret ml-px h-4 w-px bg-on-surface" />}
      </div>
    </div>
  );
}

export function MiniButton({ onb, pressed, icon, children, className = "" }) {
  return (
    <span
      className={`inline-flex h-8 items-center gap-space-xs rounded-lg bg-secondary px-space-md text-[12px] font-bold text-on-secondary shadow-sm transition-transform duration-150 ${
        pressed ? "scale-90 brightness-90" : ""
      } ${className}`}
      data-onb={onb}>
      {icon && <span className="material-symbols-outlined text-[16px]">{icon}</span>}
      {children}
    </span>
  );
}
