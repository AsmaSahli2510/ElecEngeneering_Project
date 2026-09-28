import { useEffect, useRef, useState } from "react";
import { SLIDES } from "./slides.js";

const LAST = SLIDES.length - 1;

// Guide de bienvenue : slides avec mini-écrans animés de l'application. Affiché automatiquement à la
// première connexion d'un compte, et à la demande (barre du haut, Paramètres).
// onClose : guide terminé ou passé ; onStart : « Créer mon premier projet » sur la dernière slide.
function OnboardingTour({ onClose, onStart }) {
  const [index, setIndex] = useState(0);
  const [replay, setReplay] = useState(0);
  const [sceneDone, setSceneDone] = useState(false);
  const nextRef = useRef(null);
  const slide = SLIDES[index];
  const { Scene } = slide;

  const goTo = (target) => {
    setIndex(Math.max(0, Math.min(LAST, target)));
    setSceneDone(false);
  };

  // Une fois l'animation jouée, le bouton « Suivant » s'anime pour inviter à continuer.
  useEffect(() => {
    const id = setTimeout(() => setSceneDone(true), slide.duration);
    return () => clearTimeout(id);
  }, [index, replay, slide.duration]);

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(LAST, current + 1));
        setSceneDone(false);
      }
      if (event.key === "ArrowLeft") {
        setIndex((current) => Math.max(0, current - 1));
        setSceneDone(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    nextRef.current?.focus();
  }, [index]);

  return (
    <div
      aria-labelledby="onboarding-title"
      aria-modal="true"
      className="onb-fade fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1c30]/60 p-space-lg backdrop-blur-sm print:hidden"
      role="dialog">
      <div className="onb-pop flex max-h-full w-full max-w-3xl flex-col overflow-y-auto rounded-2xl bg-surface-container-lowest shadow-2xl">
        <div className="flex items-start justify-between gap-space-md px-space-xl pt-space-lg">
          <div className="onb-rise" key={slide.key}>
            <div className="font-label-caps text-label-caps font-bold uppercase tracking-wider text-secondary">
              Étape {index + 1} / {SLIDES.length}
            </div>
            <h2 className="mt-space-2xs font-headline-md text-headline-md font-bold tracking-tight text-on-surface" id="onboarding-title">
              {slide.title}
            </h2>
            <p className="mt-space-2xs font-body-md text-body-md text-on-surface-variant">{slide.caption}</p>
          </div>
          <button
            className="shrink-0 rounded-lg px-space-sm py-space-xs font-body-sm text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
            onClick={onClose}
            type="button">
            Passer
          </button>
        </div>

        <div className="relative mx-space-xl mt-space-md h-[330px] shrink-0 sm:h-[300px]">
          <div className="onb-enter h-full" key={`${slide.key}-${replay}`}>
            <Scene duration={slide.duration} />
          </div>
          {sceneDone && (
            <button
              aria-label="Rejouer l'animation"
              className="onb-pop absolute right-space-sm top-[4px] z-40 flex h-6 items-center gap-space-2xs rounded-full bg-secondary-fixed px-space-sm text-[11px] font-semibold text-on-secondary-fixed hover:bg-secondary-fixed-dim"
              onClick={() => {
                setReplay((count) => count + 1);
                setSceneDone(false);
              }}
              title="Rejouer l'animation"
              type="button">
              <span className="material-symbols-outlined text-[14px]">replay</span>
              Rejouer
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-space-md px-space-xl py-space-lg">
          <div className="flex items-center gap-space-xs">
            {SLIDES.map((item, dot) => (
              <button
                aria-current={dot === index ? "step" : undefined}
                aria-label={`Aller à l'étape ${dot + 1} : ${item.title}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  dot === index ? "w-6 bg-secondary" : dot < index ? "w-2 bg-secondary/50" : "w-2 bg-surface-container-high hover:bg-outline-variant"
                }`}
                key={item.key}
                onClick={() => goTo(dot)}
                type="button"
              />
            ))}
          </div>
          <div className="flex items-center gap-space-sm">
            {index > 0 && (
              <button
                className="flex h-10 items-center gap-space-xs rounded-lg px-space-md font-body-md text-body-md font-semibold text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                onClick={() => goTo(index - 1)}
                type="button">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Précédent
              </button>
            )}
            {index < LAST ? (
              <button
                className={`flex h-10 items-center gap-space-xs rounded-lg bg-secondary px-space-lg font-body-md text-body-md font-bold text-on-secondary outline-none hover:bg-secondary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${sceneDone ? "onb-pulse" : ""}`}
                onClick={() => goTo(index + 1)}
                ref={nextRef}
                type="button">
                Suivant
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            ) : (
              <>
                <button
                  className="flex h-10 items-center rounded-lg bg-surface-container-low px-space-md font-body-md text-body-md font-semibold text-on-surface hover:bg-surface-container"
                  onClick={onClose}
                  type="button">
                  Terminer
                </button>
                <button
                  className={`flex h-10 items-center gap-space-xs rounded-lg bg-secondary px-space-lg font-body-md text-body-md font-bold text-on-secondary outline-none hover:bg-secondary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${sceneDone ? "onb-pulse" : ""}`}
                  onClick={onStart}
                  ref={nextRef}
                  type="button">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Créer mon premier projet
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingTour;
