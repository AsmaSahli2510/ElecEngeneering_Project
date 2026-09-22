# Moteur de calcul d'un départ

Code pur (sans React, réseau ni base) : `calculateFeeder(inputs, provider)` retourne `{ errors, issues, ready, result, coefficients, table }`.
Tests : `npm test` (dans `client/`).

## Chaîne de calcul

1. `Ib = P / (√3 · U · cos φ · η)` (monophasé : sans √3 ; kVA : `S / (√3 · U)`).
2. `K = K3 × K4 × K5`, `Iz = Iz_table × K`.
3. Section automatique : plus petite section de la table Iz telle que `Iz ≥ Ib` ; si `ΔU` n'est pas respectée, on passe à la section supérieure jusqu'à la respecter (`limitingCriterion: "voltageDrop"`).
4. `ΔU = √3 · I · L · (R cos φ + X sin φ)` (monophasé : `2 · I · L · …`), `ΔU% = ΔU / U · 100`, comparée à `ΔU disponible = ΔU max − ΔU amont`. R et X viennent du câble retenu.
5. Pouvoir de coupure : `Icu ≥ Icc`.

## Remplacer les valeurs de prototype par les tables de référence

Toutes les valeurs de table sont dans `referenceData.js` (marquées `status: "prototype"`, non normatives) et lues **uniquement** via l'interface de `referenceProvider.js`.

- Ajouter une table Iz (aluminium, PR/EPR, 2 conducteurs chargés…) : ajouter un objet à `CURRENT_CAPACITY_TABLES`. Tant qu'une combinaison n'a pas de table, le calcul est bloqué avec un message explicite : aucune valeur n'est inventée.
- R/X d'un autre matériau : ajouter une entrée à `CONDUCTOR_ELECTRICAL_DATA`.
- K3 (température), K4 (groupement), K5 : tables `K3_TEMPERATURE_TABLES`, `K4_GROUPING_TABLES`, `K5_SPECIAL_INSTALLATION`.
- Autre source (base de données, autre norme) : fournir un objet respectant l'interface décrite en tête de `referenceProvider.js` comme second argument de `calculateFeeder`.

Le formulaire 5 propose la saisie contrôlée (valeurs de test 1,00 / 0,80 / 1,00, bornes 0,1 – 1,5) ou le calcul depuis les tables.

## Données pour le futur « Bilan de puissance »

Chaque départ a son propre document `CableCalculation` (un par `feederId`), enregistré via `PUT /api/feeders/:feederId/calculation`. Le bilan lit :

- `GET /api/cabinets/:cabinetId/calculations`
- `result.designCurrent` (Ib, A), `result.absorbedPowerKw`, `result.apparentPowerKva`
- `inputs.load.powerFactor`, `inputs.load.efficiency`, `inputs.circuit.nominalVoltage`
- `status` (`validated` / `non_compliant`) pour ne retenir que les départs calculés.
