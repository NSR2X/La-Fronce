# Dernier Gouvernement

Simulateur politique/économique France - Une application PWA permettant de gérer un gouvernement virtuel et d'atteindre des objectifs mesurables.

## Description

« Dernier Gouvernement » est un simulateur politique et économique basé sur des KPI publics (INSEE et autres autorités). L'utilisateur joue des cartes (budget, lois, décrets, diplomatie, communication), observe des effets différés avec incertitudes et dépendances, et doit atteindre des objectifs mesurables avant l'intervention de la « Troïka ».

## Caractéristiques

- **PWA Offline-First**: Fonctionne entièrement hors-ligne après le premier chargement
- **100% Client-Side**: Aucun backend requis, toutes les données sont stockées localement
- **Validation stricte**: Tous les datasets sont validés via JSON Schema (draft 2020-12)
- **Effets temporels complexes**: Profils d'effets (step, linear, sigmoid, exp) avec lags configurables
- **Système de synergies/antagonismes**: Les cartes interagissent entre elles
- **Objectifs mesurables**: Victoire/défaite basée sur l'atteinte d'objectifs quantifiables

## Technologies

- **Frontend**: React 18.2.0 + TypeScript 5.4.5
- **Build**: Vite 5.0.12
- **UI**: TailwindCSS 3.4
- **Routage**: React Router 6.22
- **PWA**: vite-plugin-pwa 0.19.x
- **Stockage**: IndexedDB (via idb 7.x)
- **Validation**: Ajv (JSON Schema validator)
- **Tests**: Vitest 1.x (unitaires)

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

L'application sera disponible sur http://localhost:5173

## Build

```bash
npm run build
```

Le build génère les fichiers dans `dist/` prêts pour le déploiement.

## Tests

```bash
npm run test
```

## Déploiement

Le projet est configuré pour GitHub Pages. Le workflow `.github/workflows/deploy.yml` déploie automatiquement sur la branche `gh-pages`.

## Structure du Projet

```
/
├── public/              # Assets statiques
│   ├── 404.html        # Fallback SPA pour GitHub Pages
│   ├── icons/          # Icônes PWA
│   └── manifest.webmanifest
├── schemas/            # JSON Schema pour validation
│   ├── kpi-dataset.schema.json
│   ├── cards-dataset.schema.json
│   ├── objectives-dataset.schema.json
│   └── difficulty-dataset.schema.json
├── datasets/           # Données d'exemple
│   ├── KPI.json
│   ├── CARDS.json
│   ├── OBJECTIVES.json
│   └── DIFFICULTY.json
├── src/
│   ├── core/          # Moteur de jeu (Game Engine)
│   ├── data/          # Data Layer (validation, DB)
│   ├── types/         # Types TypeScript
│   ├── pages/         # Pages React
│   ├── context/       # React Context
│   └── App.tsx
└── vite.config.ts
```

## Importer des Données

1. Rendez-vous sur `/data`
2. Importez les 4 fichiers JSON requis:
   - KPI.json (indicateurs)
   - CARDS.json (cartes/politiques)
   - OBJECTIVES.json (objectifs)
   - DIFFICULTY.json (paramètres de difficulté)
3. Cliquez sur "Commencer la Partie"

## Spécification Technique

Voir `SPECIFICATION TECHNIQUE.md` pour la spécification complète et détaillée du projet.

## Licence

Projet éducatif - Voir LICENSE pour plus de détails.
