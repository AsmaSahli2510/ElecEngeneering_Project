# ElecEngeneering_Project

Application web académique de conception et de dimensionnement d'armoires électriques basse tension, puis de suivi de leur cycle de vie.

```
Projet → Armoire → Départs → Calcul de chaque départ → Bilan de puissance → Départ général → Nomenclature → Devis
→ Installation → Actif (garantie, QR code) → Maintenance → Tickets → Historique
```

Le câble fait partie du calcul de chaque départ (il n'y a pas de page « Câbles » séparée). Chaque étape réutilise automatiquement les données de la précédente ; la vue globale d'un projet (`/projects/:id`) affiche la progression de tout le cycle.

## Lancer

```bash
# MongoDB local requis (mongodb://127.0.0.1:27017)
cd server && cp .env.example .env && npm install && npm run dev   # API sur http://localhost:5000
cd client && npm install && npm run dev                            # interface sur http://localhost:5173
```

## Tests

```bash
cd client && npm test    # moteurs de calcul purs (câbles, bilan, départ général, nomenclature, devis, dates, progression)
cd server && npm test    # cycle complet contre une base MongoDB éphémère (supprimée à la fin)
```

## Architecture

- `client/src/domain/` : toute la logique métier, en fonctions pures testées (aucune dépendance à React ni au réseau).
  - `calculation/` : calcul d'un départ ; les tables de référence sont isolées dans `referenceData.js` derrière l'interface de `referenceProvider.js` (voir `calculation/README.md`).
  - `balance/`, `mainFeeder/`, `bom/`, `quotation/`, `lifecycle/` : bilan, départ général, nomenclature, devis, dates/garantie/maintenance et progression du workflow.
- `server/` : API Express + Mongoose. Les automatismes du cycle de vie (création de l'actif à la fin de l'installation, séquences d'identifiants, journal d'historique) sont côté serveur ; les montants du devis y sont toujours recalculés.
- L'historique n'est jamais saisi à la main : il est alimenté par le serveur à chaque événement.

## Données de prototype à remplacer

Ces valeurs sont clairement signalées dans l'interface et le code comme non normatives / indicatives :

- tables de courants admissibles, coefficients K3/K4/K5 et résistances/réactances : `client/src/domain/calculation/referenceData.js` ;
- série de calibres des protections : `client/src/domain/protection.js` ;
- prix et règles de génération de la nomenclature : `client/src/domain/bom/` ;
- TVA et validité par défaut du devis : `client/src/domain/quotation/index.js` ;
- durées de garantie par défaut : variables `WARRANTY_PARTS_MONTHS` / `WARRANTY_LABOR_MONTHS` du serveur.
