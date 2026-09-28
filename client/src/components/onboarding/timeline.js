import { useEffect, useState } from "react";

// Horloge des mini-écrans animés du guide : chaque scène est une fonction du temps écoulé `t` (ms), ce qui la
// rend entièrement déterministe (rejouer = remonter le composant). Si l'utilisateur a demandé à réduire les
// animations, `t` vaut d'emblée +∞ : la scène s'affiche directement dans son état final.
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function useElapsed(duration) {
  const [reduced] = useState(prefersReducedMotion);
  const [elapsed, setElapsed] = useState(() => (reduced ? Infinity : 0));

  useEffect(() => {
    if (reduced) return undefined;
    const start = performance.now();
    const id = setInterval(() => {
      const now = performance.now() - start;
      setElapsed(now);
      if (now >= duration) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [duration, reduced]);

  return elapsed;
}

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const easeOut = (value) => 1 - (1 - value) ** 3;

// Avancement 0 → 1 (adouci) entre `start` et `start + duration`.
export const progress = (t, start, duration) => easeOut(clamp01((t - start) / duration));

// Texte « tapé » lettre par lettre à partir de `start`.
export function typed(text, t, start, charsPerSecond = 18) {
  const count = Math.floor(((t - start) * charsPerSecond) / 1000);
  return text.slice(0, Math.max(0, Math.min(text.length, count)));
}

export const typingEnd = (text, start, charsPerSecond = 18) => start + (text.length * 1000) / charsPerSecond;

// Étape courante du curseur : la dernière dont l'instant `at` est passé.
export function cursorStep(t, path) {
  let current = null;
  for (const step of path) if (step.at <= t) current = step;
  return current;
}

// Le curseur met CURSOR_MOVE_MS à rejoindre sa cible ; le clic a lieu à l'arrivée.
export const CURSOR_MOVE_MS = 700;
export const clickTime = (step) => step.at + CURSOR_MOVE_MS;

// Vrai pendant le court instant où le curseur « appuie » sur la cible `target`.
export const isPressed = (t, path, target) =>
  path.some((step) => step.click && step.target === target && t >= clickTime(step) && t < clickTime(step) + 250);
