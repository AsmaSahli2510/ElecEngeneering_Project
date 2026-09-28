import AssetQr from "../assets/AssetQr.jsx";
import StatusPill from "../ui/StatusPill.jsx";
import { formatMoney } from "../../domain/quotation/index.js";
import { DEMO } from "./demoData.js";
import { Callout, Cursor, MiniButton, MiniField, MockWindow, Reveal } from "./SceneKit.jsx";
import { clickTime, cursorStep, isPressed, progress, typed, useElapsed } from "./timeline.js";

// Mini-écrans animés du guide de bienvenue : chaque scène rejoue, en accéléré, une étape réelle de
// l'application sur le projet d'exemple (DEMO). Tout est fonction du temps écoulé `t`.

const fr = (value, digits = 1) =>
  Number(value).toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

const CARD = "rounded-lg bg-surface-container-lowest p-space-md shadow-sm ring-1 ring-outline-variant/30";
const CARD_TITLE = "mb-space-sm font-label-caps text-[9px] font-bold uppercase tracking-wider text-on-surface-variant";

// 1. Bienvenue : la chaîne complète du cycle de vie s'allume maillon par maillon.
const CHAIN = [
  ["assignment", "Projet"],
  ["developer_board", "Armoire"],
  ["cable", "Départs"],
  ["calculate", "Calculs"],
  ["bolt", "Bilan"],
  ["request_quote", "Devis"],
  ["qr_code_2", "Actif"],
  ["build", "Maintenance"],
];

export function WelcomeScene({ duration }) {
  const t = useElapsed(duration);
  const lit = (index) => t >= 500 + index * 280;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-space-xl overflow-hidden rounded-xl bg-primary-container px-space-lg">
      <div className="onb-pop flex items-center gap-space-md">
        <div className="onb-pulse flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-on-secondary">
          <span className="material-symbols-outlined text-[28px]">electric_bolt</span>
        </div>
        <span className="font-headline-lg text-headline-lg font-bold tracking-tight text-surface-bright">ElecProject</span>
      </div>
      <div className="relative grid w-full grid-cols-4 gap-y-space-lg sm:grid-cols-8">
        <div className="absolute left-[6%] top-[18px] hidden h-0.5 w-[88%] bg-on-primary-container/30 sm:block" />
        <div
          className="absolute left-[6%] top-[18px] hidden h-0.5 bg-secondary sm:block"
          style={{ width: `${88 * progress(t, 500, CHAIN.length * 280)}%` }}
        />
        {CHAIN.map(([icon, label], index) => (
          <div className="relative flex flex-col items-center gap-space-xs" key={label}>
            <Reveal
              anim="onb-pop"
              className={`flex h-9 w-9 items-center justify-center rounded-full ${lit(index) ? "bg-secondary text-on-secondary" : "bg-surface-container-highest/20 text-on-primary-container"}`}
              show={lit(index)}>
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
            </Reveal>
            <Reveal className="text-[10px] font-semibold text-on-primary-container" show={lit(index)}>
              {label}
            </Reveal>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Projet : le formulaire se remplit, la référence apparaît toute seule, puis le projet est créé.
const PROJECT_PATH = [
  { at: 200, target: "name" },
  { at: 2000, target: "client" },
  { at: 3300, target: "site" },
  { at: 4500, target: "submit", click: true },
];

export function ProjectScene({ duration }) {
  const t = useElapsed(duration);
  const focus = cursorStep(t, PROJECT_PATH)?.target;
  const created = t >= clickTime(PROJECT_PATH[3]) + 250;

  return (
    <MockWindow activeIcon="folder" crumbs={["Projets", "Nouveau projet"]}>
      <div className="grid grid-cols-2 gap-space-md">
        <MiniField active={focus === "name"} caret={focus === "name"} label="Nom du projet" onb="name" value={typed("Extension atelier", t, 900)} />
        <MiniField highlight={t >= 1000 && t < 3200} label="Référence du projet" mono value={t >= 1000 ? DEMO.projectRef : ""} />
        <MiniField active={focus === "client"} caret={focus === "client"} label="Client" onb="client" value={typed("ABC Industrie", t, 2700)} />
        <MiniField active={focus === "site"} caret={focus === "site"} label="Site d'installation" onb="site" value={typed("Usine Tunis", t, 4000)} />
      </div>
      <div className="mt-space-xl flex justify-end">
        <MiniButton icon="arrow_forward" onb="submit" pressed={isPressed(t, PROJECT_PATH, "submit")}>
          Créer le projet
        </MiniButton>
      </div>
      <Callout arrow="up" className="right-[8%] top-[64px]" show={t >= 1300 && t < 3300}>
        Référence automatique
      </Callout>
      <Reveal
        className="absolute bottom-space-md left-space-md flex items-center gap-space-xs rounded-lg bg-inverse-surface px-space-md py-space-sm text-[12px] font-semibold text-surface"
        show={created}>
        <span className="material-symbols-outlined text-[16px] text-secondary-fixed-dim">check_circle</span>
        Projet {DEMO.projectRef} créé
      </Reveal>
      <Cursor path={PROJECT_PATH} t={t} />
    </MockWindow>
  );
}

// 3. Départs : trois clics sur « Ajouter », trois départs glissent dans le tableau.
const FEEDERS_PATH = [
  { at: 400, target: "add", click: true },
  { at: 1700, target: "add", click: true },
  { at: 3000, target: "add", click: true },
];
const FEEDER_GRID = "grid grid-cols-[40px_1fr_64px_84px] sm:grid-cols-[44px_1fr_80px_64px_84px] items-center gap-space-sm";

export function FeedersScene({ duration }) {
  const t = useElapsed(duration);
  const rowShown = (index) => t >= clickTime(FEEDERS_PATH[index]) + 150;
  // Les trois clics tombent sur le même bouton : on rejoue l'appui à chaque passage.
  const pressed = FEEDERS_PATH.some((step) => t >= clickTime(step) && t < clickTime(step) + 250);

  return (
    <MockWindow activeIcon="developer_board" crumbs={[DEMO.projectRef, `Armoire ${DEMO.cabinet.reference}`, "Départs"]}>
      <div className="mb-space-md flex items-center justify-between">
        <span className="font-headline-sm text-[14px] font-bold text-on-surface">Départs de l'armoire {DEMO.cabinet.reference}</span>
        <MiniButton icon="add" onb="add" pressed={pressed}>
          Ajouter
        </MiniButton>
      </div>
      <div className={`${FEEDER_GRID} border-b border-surface-container px-space-sm pb-space-xs text-[9px] font-bold uppercase tracking-wider text-on-surface-variant`}>
        <span>Réf.</span>
        <span>Désignation</span>
        <span className="hidden sm:block">Type</span>
        <span>Puissance</span>
        <span>Statut</span>
      </div>
      {DEMO.feeders.map((feeder, index) => (
        <Reveal anim="onb-slide" className={`${FEEDER_GRID} border-b border-surface-container px-space-sm py-space-sm text-[12px]`} key={feeder.reference} show={rowShown(index)}>
          <span className="font-tech-data-md text-[12px] font-bold text-secondary">{feeder.reference}</span>
          <span className="truncate text-on-surface">{feeder.designation}</span>
          <span className="hidden text-on-surface-variant sm:block">{feeder.loadType}</span>
          <span className="font-tech-data-md text-[12px] text-on-surface">
            {fr(feeder.power, feeder.power % 1 ? 1 : 0)} {feeder.powerUnit}
          </span>
          <span>
            <StatusPill>À calculer</StatusPill>
          </span>
        </Reveal>
      ))}
      <Callout arrow="up" className="bottom-space-md left-[22%]" show={t >= 4400}>
        Un départ = un circuit de l'armoire
      </Callout>
      <Cursor path={FEEDERS_PATH} t={t} />
    </MockWindow>
  );
}

// 4. Calcul d'un départ : Ib défile, la section est cherchée puis retenue, les trois vérifications passent.
const CALC_PATH = [{ at: 300, target: "calc", click: true }];
const SECTIONS = [1.5, 2.5, 4, 6, 10, 16];

export function CalculationScene({ duration }) {
  const t = useElapsed(duration);
  const { feeder, inputs, result } = DEMO.calculation;
  const start = clickTime(CALC_PATH[0]) + 150;
  const target = Math.max(0, SECTIONS.indexOf(result.cable.recommendedSection));
  const scanStart = start + 900;
  const reached = scanStart + target * 380;
  const scanIndex = t < scanStart ? -1 : Math.min(target, Math.floor((t - scanStart) / 380));
  const checks = [
    ["Échauffement", `Iz ${fr(result.cable.correctedCurrentCapacity)} A ≥ Ib`, result.checks.thermal],
    ["Chute de tension", `${fr(result.voltageDrop.feederPercent, 2)} % ≤ ${fr(result.voltageDrop.availablePercent)} %`, result.checks.voltageDrop],
    ["Pouvoir de coupure", `${result.shortCircuit.breakingCapacityKa} kA ≥ ${result.shortCircuit.iccKa} kA`, result.checks.breakingCapacity],
  ];

  return (
    <MockWindow activeIcon="developer_board" crumbs={[`Armoire ${DEMO.cabinet.reference}`, `Départ ${feeder.reference}`, "Calcul"]}>
      <div className="grid h-full grid-cols-5 gap-space-md">
        <div className={`${CARD} col-span-2 flex flex-col`}>
          <div className={CARD_TITLE}>{feeder.designation}</div>
          {[
            ["Puissance", `${feeder.power} ${feeder.powerUnit}`],
            ["Tension", `${inputs.circuit.nominalVoltage} V`],
            ["cos φ", fr(inputs.load.powerFactor, 2)],
            ["Rendement η", fr(inputs.load.efficiency, 2)],
            ["Longueur", `${inputs.load.cableLength} m`],
          ].map(([label, value]) => (
            <div className="flex justify-between py-[3px] text-[11px]" key={label}>
              <span className="text-on-surface-variant">{label}</span>
              <span className="font-tech-data-md text-[11px] font-bold text-on-surface">{value}</span>
            </div>
          ))}
          <div className="mt-auto pt-space-sm">
            <MiniButton className="w-full justify-center" icon="calculate" onb="calc" pressed={isPressed(t, CALC_PATH, "calc")}>
              Calculer
            </MiniButton>
          </div>
        </div>
        <div className="col-span-3 flex flex-col gap-space-sm">
          <Reveal className={`${CARD} flex items-baseline justify-between`} show={t >= start}>
            <span className="text-[11px] font-semibold text-on-surface-variant">Courant d'emploi Ib</span>
            <span className="font-tech-data-xl text-[24px] font-bold text-on-surface">
              {fr(result.designCurrent * progress(t, start, 800))} <span className="text-[12px] text-on-surface-variant">A</span>
            </span>
          </Reveal>
          <Reveal className={CARD} show={t >= scanStart - 150}>
            <div className="mb-space-xs flex gap-space-xs">
              {SECTIONS.map((section, index) => (
                <span
                  className={`flex-1 rounded py-space-xs text-center font-tech-data-md text-[11px] font-bold transition-colors ${
                    index < scanIndex
                      ? "bg-surface-container text-on-surface-variant line-through opacity-60"
                      : index === scanIndex
                        ? `bg-secondary text-on-secondary ${t >= reached ? "onb-pulse" : ""}`
                        : "bg-surface-container-low text-on-surface-variant"
                  }`}
                  key={section}>
                  {fr(section, section % 1 ? 1 : 0)}
                </span>
              ))}
            </div>
            <div className="text-[11px] text-on-surface-variant">
              {t >= reached ? (
                <span className="font-semibold text-secondary">Section retenue : {result.cable.recommendedSection} mm² (automatique)</span>
              ) : (
                "Recherche de la plus petite section suffisante…"
              )}
            </div>
          </Reveal>
          <div className="flex flex-col gap-space-2xs">
            {checks.map(([label, detail, status], index) => (
              <Reveal anim="onb-slide" className="flex items-center gap-space-xs text-[11px]" key={label} show={t >= reached + 400 + index * 350}>
                <span className={`material-symbols-outlined text-[16px] ${status === "compliant" ? "text-secondary" : "text-error"}`}>
                  {status === "compliant" ? "check_circle" : "cancel"}
                </span>
                <span className="font-semibold text-on-surface">{label}</span>
                <span className="ml-auto font-tech-data-md text-[11px] text-on-surface-variant">{detail}</span>
              </Reveal>
            ))}
          </div>
          <Reveal anim="onb-pop" className="mt-auto self-end" show={t >= reached + 1600}>
            <StatusPill icon="verified" tone="ok">
              Calcul validé
            </StatusPill>
          </Reveal>
        </div>
      </div>
      <Cursor path={CALC_PATH} t={t} />
    </MockWindow>
  );
}

// 5. Bilan : les barres de puissance montent, les totaux défilent, le bilan passe au vert.
export function BalanceScene({ duration }) {
  const t = useElapsed(duration);
  const { lines, totals, mainRating } = DEMO.balance;
  const max = Math.max(...lines.map((line) => line.absorbedKw));
  const validated = t >= 3000;
  const count = progress(t, 1900, 900);

  return (
    <MockWindow activeIcon="bolt" crumbs={[`Armoire ${DEMO.cabinet.reference}`, "Bilan de puissance"]}>
      <div className="grid h-full grid-cols-5 gap-space-md">
        <div className={`${CARD} col-span-3`}>
          <div className={CARD_TITLE}>Puissance absorbée par départ</div>
          <div className="flex flex-col gap-space-md">
            {lines.map((line, index) => {
              const grow = progress(t, 300 + index * 450, 700);
              return (
                <div key={line.reference}>
                  <div className="mb-space-2xs flex justify-between text-[11px]">
                    <span className="truncate text-on-surface">
                      <b className="font-tech-data-md text-secondary">{line.reference}</b> {line.designation}
                    </span>
                    <span className="font-tech-data-md font-bold text-on-surface">{fr(line.absorbedKw * grow)} kW</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${(line.absorbedKw / max) * 100 * grow}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="col-span-2 flex flex-col gap-space-sm">
          <Reveal className={CARD} show={t >= 1800}>
            {[
              ["Puissance absorbée", `${fr(totals.absorbedPowerKw * count)} kW`],
              ["Courant total", `${fr(totals.totalCurrent * count)} A`],
              ["cos φ global", fr(totals.globalPowerFactor * count, 2)],
            ].map(([label, value]) => (
              <div className="flex justify-between py-[3px] text-[11px]" key={label}>
                <span className="text-on-surface-variant">{label}</span>
                <span className="font-tech-data-md font-bold text-on-surface">{value}</span>
              </div>
            ))}
          </Reveal>
          <div className="flex justify-center">
            {validated ? (
              <span className="onb-pop rounded-full">
                <StatusPill className="onb-pulse" icon="check_circle" tone="ok">
                  BILAN VALIDÉ
                </StatusPill>
              </span>
            ) : (
              <StatusPill icon="hourglass_top" tone="info">
                Calcul du bilan…
              </StatusPill>
            )}
          </div>
          <Reveal anim="onb-slide" className="mt-auto flex items-start gap-space-xs rounded-lg bg-secondary-fixed p-space-sm text-[11px] text-on-secondary-fixed" show={t >= 3800}>
            <span className="material-symbols-outlined text-[16px]">subdirectory_arrow_right</span>
            <span>
              Départ général : disjoncteur <b>{mainRating} A</b> proposé
            </span>
          </Reveal>
        </div>
      </div>
    </MockWindow>
  );
}

// 6. Nomenclature → devis : les lignes passent d'un côté à l'autre, les totaux défilent, le devis est généré.
const QUOTE_PATH = [{ at: 3900, target: "generate", click: true }];
const SHOWN_LINES = 4;

export function QuotationScene({ duration }) {
  const t = useElapsed(duration);
  const { quotation, bom } = DEMO;
  const count = progress(t, 2800, 900);
  const generated = t >= clickTime(QUOTE_PATH[0]) + 250;

  return (
    <MockWindow activeIcon="request_quote" crumbs={[`Armoire ${DEMO.cabinet.reference}`, "Nomenclature & devis"]}>
      <div className="grid h-full grid-cols-[1fr_28px_1.2fr] gap-space-xs">
        <div className={CARD}>
          <div className={CARD_TITLE}>Nomenclature</div>
          {bom.slice(0, SHOWN_LINES).map((line, index) => (
            <Reveal anim="onb-slide" className="flex justify-between gap-space-xs border-b border-surface-container py-space-xs text-[10px]" key={line.autoKey} show={t >= 200 + index * 180}>
              <span className="truncate text-on-surface">{line.designation}</span>
              <span className="shrink-0 font-tech-data-md text-on-surface-variant">
                {line.quantity} {line.unit}
              </span>
            </Reveal>
          ))}
          <Reveal className="pt-space-xs text-[10px] italic text-on-surface-variant" show={t >= 1100}>
            + {bom.length - SHOWN_LINES} autres lignes générées
          </Reveal>
        </div>
        <div className="flex items-center justify-center">
          <Reveal anim="onb-pop" show={t >= 1300}>
            <span className="material-symbols-outlined onb-nudge-x text-[24px] text-secondary">east</span>
          </Reveal>
        </div>
        <div className={`${CARD} flex flex-col`}>
          <div className="mb-space-xs flex items-center justify-between">
            <span className="font-tech-data-md text-[12px] font-bold text-secondary">{DEMO.quotationRef}</span>
            {generated && (
              <StatusPill className="onb-pop" icon="lock" tone="ok">
                Généré
              </StatusPill>
            )}
          </div>
          {quotation.lines.slice(0, SHOWN_LINES).map((line, index) => (
            <Reveal anim="onb-enter" className="flex justify-between gap-space-xs py-[2px] text-[10px]" key={`${line.reference}-${index}`} show={t >= 1500 + index * 220}>
              <span className="truncate text-on-surface-variant">{line.designation}</span>
              <span className="shrink-0 font-tech-data-md text-on-surface">{formatMoney(line.total)}</span>
            </Reveal>
          ))}
          <Reveal className="mt-space-xs border-t border-surface-container pt-space-xs text-[11px]" show={t >= 2700}>
            <div className="flex justify-between text-on-surface-variant">
              <span>Total HT</span>
              <span className="font-tech-data-md">{formatMoney(quotation.totalHT * count)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>TVA {quotation.vatPercent} %</span>
              <span className="font-tech-data-md">{formatMoney(quotation.vatAmount * count)}</span>
            </div>
            <div className="flex justify-between font-bold text-on-surface">
              <span>Total TTC</span>
              <span className="font-tech-data-md text-secondary">{formatMoney(quotation.totalTTC * count)}</span>
            </div>
          </Reveal>
          <div className="mt-auto flex justify-end pt-space-xs">
            <MiniButton icon="description" onb="generate" pressed={isPressed(t, QUOTE_PATH, "generate")}>
              Générer
            </MiniButton>
          </div>
        </div>
      </div>
      <Cursor path={QUOTE_PATH} t={t} />
    </MockWindow>
  );
}

// 7. Installation → actif : l'installation est terminée, l'actif apparaît avec sa garantie et son QR code.
const ASSET_PATH = [{ at: 900, target: "finish", click: true }];
const INSTALLATION_STEPS = ["Planifiée", "En cours", "Terminée"];
// Durées de garantie par défaut du serveur (WARRANTY_PARTS_MONTHS / WARRANTY_LABOR_MONTHS).
const WARRANTY = [
  ["Pièces", 24],
  ["Main-d'œuvre", 12],
];

export function AssetScene({ duration }) {
  const t = useElapsed(duration);
  const finished = t >= clickTime(ASSET_PATH[0]);
  const stepIndex = finished ? 2 : t >= 500 ? 1 : 0;
  const fill = progress(t, 2500, 800);

  return (
    <MockWindow activeIcon="inventory_2" crumbs={[DEMO.projectRef, "Installation", "Actif"]}>
      <div className="grid h-full grid-cols-5 gap-space-md">
        <div className={`${CARD} col-span-2 flex flex-col`}>
          <div className={CARD_TITLE}>Installation — armoire {DEMO.cabinet.reference}</div>
          <div className="flex flex-col gap-space-sm">
            {INSTALLATION_STEPS.map((label, index) => (
              <div className="flex items-center gap-space-sm text-[12px]" key={label}>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] transition-colors ${
                    index <= stepIndex ? "bg-secondary text-on-secondary" : "bg-surface-container text-on-surface-variant"
                  } ${index === stepIndex && !finished ? "onb-pulse" : ""}`}>
                  {index < stepIndex || finished ? "✓" : index + 1}
                </span>
                <span className={index <= stepIndex ? "font-semibold text-on-surface" : "text-on-surface-variant"}>{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-space-sm">
            <MiniButton className="w-full justify-center" icon="task_alt" onb="finish" pressed={isPressed(t, ASSET_PATH, "finish")}>
              Terminer
            </MiniButton>
          </div>
        </div>
        <Reveal anim="onb-pop" className={`${CARD} col-span-3 flex flex-col gap-space-sm`} show={t >= 2000}>
          <div className="flex items-center justify-between">
            <span className="font-tech-data-lg text-[16px] font-bold text-secondary">{DEMO.assetRef}</span>
            <StatusPill tone="ok">En service</StatusPill>
          </div>
          <div className="text-[11px] text-on-surface-variant">
            Armoire {DEMO.cabinet.reference} · {DEMO.projectRef}
          </div>
          {WARRANTY.map(([label, months]) => (
            <div key={label}>
              <div className="mb-space-2xs flex justify-between text-[10px]">
                <span className="text-on-surface-variant">Garantie {label.toLowerCase()}</span>
                <span className="font-tech-data-md font-bold text-on-surface">{months} mois</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                <div className="h-full rounded-full bg-secondary" style={{ width: `${fill * 100}%` }} />
              </div>
            </div>
          ))}
          <div className="relative mt-auto inline-flex self-start">
            {t >= 2700 && (
              <div className="onb-wipe">
                <AssetQr label={`QR code ${DEMO.assetRef}`} size={76} value={DEMO.assetRef} />
              </div>
            )}
            <Callout arrow="left" className="left-full top-[26px] ml-space-xs" show={t >= 3700}>
              Scannez : fiche de l'actif
            </Callout>
          </div>
        </Reveal>
      </div>
      <Cursor path={ASSET_PATH} t={t} />
    </MockWindow>
  );
}

// 8. Maintenance & tickets : l'échéance approche et passe à l'orange, puis un ticket avance jusqu'à « Résolu ».
const TICKET_STEPS = ["Signalé", "Assigné", "En cours", "Résolu"];
const PERIOD_DAYS = 180;

export function MaintenanceScene({ duration }) {
  const t = useElapsed(duration);
  const days = Math.round(PERIOD_DAYS - (PERIOD_DAYS - 21) * progress(t, 400, 2200));
  const soon = days <= 30;
  const ticketIndex = t < 3300 ? 0 : Math.min(TICKET_STEPS.length - 1, 1 + Math.floor((t - 3300) / 600));
  const resolved = ticketIndex === TICKET_STEPS.length - 1;

  return (
    <MockWindow activeIcon="build" crumbs={[DEMO.assetRef, "Maintenance & tickets"]}>
      <div className="grid h-full grid-cols-2 gap-space-md">
        <div className={`${CARD} flex flex-col`}>
          <div className={CARD_TITLE}>Maintenance préventive · tous les 6 mois</div>
          <div className="flex flex-1 flex-col items-center justify-center gap-space-sm">
            <span className={`material-symbols-outlined text-[32px] ${soon ? "text-[#b26b00]" : "text-secondary"}`}>event</span>
            <div className="text-center">
              <div className="text-[11px] text-on-surface-variant">Prochaine visite dans</div>
              <div className={`font-tech-data-xl text-[26px] font-bold ${soon ? "text-[#b26b00]" : "text-on-surface"}`}>{days} j</div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
              <div className={`h-full rounded-full transition-colors ${soon ? "bg-[#f0a800]" : "bg-secondary"}`} style={{ width: `${(1 - days / PERIOD_DAYS) * 100}%` }} />
            </div>
            {soon ? (
              <StatusPill className="onb-pop" icon="notifications_active" tone="warn">
                Bientôt : alerte envoyée
              </StatusPill>
            ) : (
              <StatusPill tone="info">Planifiée</StatusPill>
            )}
          </div>
        </div>
        <Reveal anim="onb-pop" className={`${CARD} flex flex-col gap-space-sm`} show={t >= 2800}>
          <div className="flex items-center justify-between">
            <span className="font-tech-data-md text-[12px] font-bold text-secondary">{DEMO.ticketRef}</span>
            <StatusPill tone="error">Priorité haute</StatusPill>
          </div>
          <div className="text-[12px] font-semibold text-on-surface">Disjoncteur D01 déclenché</div>
          <div className="relative mt-space-sm flex justify-between">
            <div className="absolute left-[10px] right-[10px] top-[9px] h-0.5 bg-surface-container" />
            <div
              className="absolute left-[10px] top-[9px] h-0.5 bg-secondary transition-[width] duration-500"
              style={{ width: `calc((100% - 20px) * ${ticketIndex / (TICKET_STEPS.length - 1)})` }}
            />
            {TICKET_STEPS.map((label, index) => (
              <div className="relative flex flex-col items-center gap-space-2xs" key={label}>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] transition-colors ${
                    index <= ticketIndex ? "bg-secondary text-on-secondary" : "bg-surface-container text-on-surface-variant"
                  }`}>
                  {index < ticketIndex || resolved ? "✓" : index + 1}
                </span>
                <span className={`text-[9px] ${index === ticketIndex ? "font-bold text-on-surface" : "text-on-surface-variant"}`}>{label}</span>
              </div>
            ))}
          </div>
          {resolved && (
            <div className="onb-rise mt-auto flex items-center gap-space-xs rounded-lg bg-secondary-fixed p-space-sm text-[11px] text-on-secondary-fixed">
              <span className="material-symbols-outlined text-[16px]">history</span>
              Tout est tracé dans l'historique du projet
            </div>
          )}
        </Reveal>
      </div>
    </MockWindow>
  );
}
