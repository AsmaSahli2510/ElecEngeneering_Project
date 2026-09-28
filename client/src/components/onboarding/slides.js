import {
  AssetScene,
  BalanceScene,
  CalculationScene,
  FeedersScene,
  MaintenanceScene,
  ProjectScene,
  QuotationScene,
  WelcomeScene,
} from "./scenes.jsx";

// Slides du guide de bienvenue : un titre, une seule phrase, et un mini-écran animé (durée en ms).
export const SLIDES = [
  {
    key: "welcome",
    title: "Bienvenue sur ElecProject",
    caption: "De la conception de l'armoire jusqu'à sa maintenance, tout le cycle au même endroit.",
    Scene: WelcomeScene,
    duration: 3200,
  },
  {
    key: "project",
    title: "Créez votre projet",
    caption: "Client et site suffisent : la référence est attribuée automatiquement.",
    Scene: ProjectScene,
    duration: 6000,
  },
  {
    key: "feeders",
    title: "Ajoutez les départs de l'armoire",
    caption: "Moteurs, éclairage, prises… chaque circuit devient un départ.",
    Scene: FeedersScene,
    duration: 5200,
  },
  {
    key: "calculation",
    title: "Calculez chaque départ en un clic",
    caption: "Ib, section du câble, chute de tension et pouvoir de coupure sont vérifiés pour vous.",
    Scene: CalculationScene,
    duration: 5600,
  },
  {
    key: "balance",
    title: "Obtenez le bilan de puissance",
    caption: "Les départs sont totalisés et la protection générale est proposée.",
    Scene: BalanceScene,
    duration: 4800,
  },
  {
    key: "quotation",
    title: "Nomenclature et devis, automatiquement",
    caption: "Les composants et les prix découlent directement des calculs.",
    Scene: QuotationScene,
    duration: 5400,
  },
  {
    key: "asset",
    title: "Installez : l'actif est créé",
    caption: "Garantie et QR code sont prêts dès la fin de l'installation.",
    Scene: AssetScene,
    duration: 4600,
  },
  {
    key: "maintenance",
    title: "Suivez maintenance et pannes",
    caption: "Les échéances sont signalées à l'avance, les tickets suivis jusqu'à leur résolution.",
    Scene: MaintenanceScene,
    duration: 5400,
  },
];
