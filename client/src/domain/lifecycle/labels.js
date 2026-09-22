// Libellés français des codes stockés en base (les codes restent en anglais / snake_case dans les données).

export const EVENT_TYPE_LABELS = {
  project_created: "Création projet",
  cabinet_created: "Création armoire",
  feeder_calculated: "Calcul départ",
  power_balance: "Bilan de puissance",
  main_feeder: "Départ général",
  bom: "Nomenclature",
  quotation: "Devis",
  installation: "Installation",
  asset_created: "Actif",
  maintenance: "Maintenance",
  ticket: "Ticket",
  repair: "Réparation",
  component_change: "Changement de composant",
};

export const EVENT_STATUS_LABELS = {
  completed: "Terminé",
  planned: "Planifiée",
  in_progress: "En cours",
  non_compliant: "Non conforme",
  reported: "Signalé",
  assigned: "Assigné",
  resolved: "Résolu",
  closed: "Clôturé",
};

export const PROJECT_STATUS_LABELS = { draft: "Brouillon", active: "En cours", completed: "Terminé", archived: "Archivé" };
export const INSTALLATION_STATUS_LABELS = { planned: "Planifiée", in_progress: "En cours", completed: "Terminée" };
export const TICKET_STATUS_LABELS = { reported: "Signalé", assigned: "Assigné", in_progress: "En cours", resolved: "Résolu", closed: "Clôturé" };
export const TICKET_PRIORITY_LABELS = { low: "Basse", medium: "Moyenne", high: "Haute", critical: "Critique" };
export const ASSET_STATUS_LABELS = { in_service: "En service", maintenance: "En maintenance", out_of_service: "Hors service", retired: "Retiré" };
export const INTERVENTION_TYPE_LABELS = { preventive: "Préventive", corrective: "Corrective", inspection: "Contrôle" };
export const INTERVENTION_RESULT_LABELS = { ok: "Conforme", reserves: "Avec réserves", defect: "Défaut constaté" };
export const WARRANTY_STATUS_LABELS = { active: "Active", expired: "Expirée", upcoming: "À venir", unknown: "—" };
export const FREQUENCY_LABELS = { 3: "3 mois", 6: "6 mois", 12: "12 mois" };
export const BALANCE_STATUS_LABELS = { validated: "BILAN VALIDÉ", attention: "BILAN À VÉRIFIER", incomplete: "BILAN INCOMPLET" };
