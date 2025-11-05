SPECIFICATION TECHNIQUE — « Dernier Gouvernement »

0. Résumé exécutif (obligations clés)
	•	Le jeu MUST être une SPA PWA 100 % client, sans aucun appel réseau en jeu (hors import manuel de fichiers JSON).
	•	Hébergement MUST se faire sur GitHub Pages (branche gh-pages) avec fallback SPA par 404.html (voir §11).  ￼
	•	Persistance MUST utiliser IndexedDB (états de partie, historiques), localStorage MAY stocker des préférences non-critiques.  ￼
	•	Mode hors-ligne MUST être garanti via Service Worker + cache des assets et des derniers jeux de données importés ; Manifest Web MUST être fourni.  ￼
	•	Données KPI/Cartes/Objectifs MUST respecter des JSON Schema (draft 2020-12) fournis (validation à l’import).  ￼
	•	Le cycle de jeu MUST être mensuel (1 tour = 1 mois), sans phase de vote (les décisions s’appliquent avec délais/“lags”).
	•	Le système d’Objectifs (“promesses de campagne”) MUST déterminer victoire/défaite (checkpoints à mi-parcours + fin).
	•	L’UI MUST regrouper les KPI par ministère avec un Indice de Performance Ministériel (IPM) et un Indice Global de Gouvernement (IGG).
	•	L’ensemble de la spec MUST être implémenté à l’identique (versions/outils figés ci-dessous).

⸻

1. Portée & objectifs produit

1.1 But

Simulateur politique/éco « France » jouable dans le navigateur, sans backend, basé sur des KPI publics importés périodiquement (INSEE et autorités). L’utilisateur joue des cartes (budget, lois, décrets, diplomatie, communication), observe des effets différés avec incertitudes et dépendances, et doit atteindre des objectifs mesurables avant l’intervention de la « Troïka ».

1.2 Contraintes non-fonctionnelles
	•	Offline-first PWA (installable).  ￼
	•	Performances : TTI ≤ 2,5 s sur laptop milieu de gamme, interactions sous 100 ms, rendu 60 fps pour animations simples.
	•	Accessibilité : WCAG-AA, navigation clavier complète (Tab/Shift+Tab/Enter/Esc/Arrows).
	•	Sécurité : pas de collecte/émission de données utilisateurs (pas d’analytics).
	•	I18n : FR par défaut ; toutes chaînes isolées dans un catalogue.

⸻

2. Pile technique & versions (figées)
	•	Langage : TypeScript 5.4.5 (MUST).
	•	Bundler : Vite 5.0.12 (MUST).
	•	UI : React 18.2.0 (MUST) + TailwindCSS 3.4 (SHOULD).
	•	PWA : vite-plugin-pwa 0.19.x (SHOULD) ; fallback possible Workbox build custom.  ￼
	•	Stockage : IndexedDB via lib idb 7.x (SHOULD).  ￼
	•	Routage SPA : React Router 6.22 (SHOULD) avec fallback SPA GitHub Pages (§11).
	•	Tests : Vitest 1.x (unit.), Playwright 1.48 (E2E).
	•	Node : LTS 20.x pour builds locaux et CI (MUST).
	•	CI/CD : GitHub Actions (workflow §11.3).

Notes “state of the art” : exigences PWA (Service Worker, Manifest) et IndexedDB sont directement issues de MDN/web.dev. Vocabulaire MUST/SHOULD conforme au RFC 2119.  ￼

⸻

3. Architecture logicielle (C4 — niveau Système/Container)

3.1 Vue Système

SPA PWA en lecture locale de fichiers JSON importés manuellement. Aucun appel réseau en jeu.

3.2 Vue Container (modules)
	•	App Shell
	•	Router, layout, theming, i18n, accès clavier.
	•	Service Worker registration + update UX.
	•	Core Engine
	•	GameState (state machine), RNG (seeded), Tick Engine (boucle mensuelle).
	•	Effects Engine (application cartes → KPI avec profils de lags).
	•	Causality Engine (propagation, synergies/antagonismes).
	•	Aggregators (IPM, IGG).
	•	Victory/Defeat Engine (objectifs + seuils Troïka).
	•	Data Layer
	•	Import/Validation des JSON (KPI, Cartes, Objectifs, Difficulté) via JSON Schema 2020-12 (MUST).  ￼
	•	Persistence : IndexedDB (saves, historiques) + localStorage (prefs).  ￼
	•	UI Layer
	•	Dashboard (IGG, Troïka, objectifs épinglés).
	•	Ministry Views (IPM, KPI, graphe causal local).
	•	Budget, Cartes (modals), Rapport mensuel, Stress-tests, Données/Import.
	•	404 fallback SPA pour GitHub Pages (§11).  ￼

⸻

4. Données — Schémas et formats (normatifs)

4.1 Règles générales
	•	Tous les fichiers d’entrée MUST respecter les JSON Schema draft 2020-12 ci-dessous. Un import MUST être rejeté si invalide.  ￼
	•	Encodage UTF-8, fin de ligne \n, séparateur . pour décimales.
	•	Les dates MUST être ISO 8601 (YYYY-MM).
	•	Les identifiants MUST être uniques dans leur domaine (kpiId, cardId, etc.).

4.2 KPI.json (extrait de schema — conceptuel)
	•	kpiId: string (MUST) — stable.
	•	ministry: enum<…> (MUST) — voir §5.1.
	•	label: string (MUST), unit: string (MUST).
	•	direction: enum<increase_good|decrease_good> (MUST).
	•	bounds: {min:number, max:number} (MUST).
	•	history: Array<{date, value}> (MUST) — mensuel ; value:number.
	•	weightInIPM: number ∈ [0,1] (MUST).
	•	source: {name, url?} (SHOULD), lastUpdated: YYYY-MM (MUST).

Normalisation (MUST) :

if direction == increase_good: norm = clamp((v - min)/(max - min), 0, 1)
else                         : norm = clamp((max - v)/(max - min), 0, 1)

IPM_ministry = round(100 * Σ(w_i * norm_i)/Σ(w_i)) ; IGG = round(100 * Σ(W_m * IPM_m)/Σ(W_m)).

4.3 CARDS.json (politiques)
	•	cardId: string (MUST), type: enum<budget|law|decree|diplomacy|communication|event> (MUST).
	•	ministries: string[] (MUST).
	•	options: Option[] (2..4) (MUST).

Option
	•	label: string (MUST).
	•	costs: {eur:number, cp:number, leg:number, rj:number, cm:number} (MUST; eur peut être ±).
	•	lags: {start:int>=0, ramp:int>=0, duration:int>=1} en mois (MUST).
	•	effects: Effect[] (MUST).
	•	risks: {probRJ:0..1, probStrike:0..1} (MAY).
	•	synergies: string[] (MAY) — ids de règles.
	•	antagonisms: string[] (MAY).

Effect
	•	kpiId: string (MUST).
	•	delta: number (MUST) — en unités KPI (pas en points IPM).
	•	interval: {min:number, max:number} (MUST).
	•	confidence: enum<low|med|high> (MUST).
	•	profile: enum<step|linear|sigmoid|exp> (MUST).

4.4 OBJECTIVES.json (promesses de campagne)
	•	objectiveId: string (MUST), label, description (MUST).
	•	checks: Array<Check> (1..3) (MUST).
	•	evaluationWindow: {months:int, method:enum<last|avg|trend>} (MUST).
	•	difficultyTargets: {easy:TargetSet, normal:TargetSet, hard:TargetSet} (MUST).

Check : kpiId, comparator: enum<=|>=|trend_up|trend_down, value:number? (selon comparator).
TargetSet : requiredCount:int (combien de checks à satisfaire) + tolérances éventuelles.

4.5 DIFFICULTY.json
	•	mode: enum<moderate|severe|extreme> (MUST).
	•	objectiveSelection: {choose:int, mustComplete:int, midCheckpointMin:int} (MUST).
	•	troikaThresholds: {deficitPct: number, months:int, debtPct:number, cmMin:number, interestToRevenuePct:number} (MUST).
	•	weights: { ministries: Record<ministry, W_m> } (MUST).

Les structures ci-dessus MUST être capturées en JSON Schema 2020-12 et validées à l’import (erreurs bloquantes).  ￼

⸻

5. Modèle métier

5.1 Liste des ministères (figée)

EconomyFinance, LaborEmployment, Health, EducationResearch, InteriorJustice, HousingPlanning, EnergyClimateIndustry, Transport, SocialAffairs, ForeignEU, Defense, CultureYouthSport, DigitalSovereignty.

La liste MUST être exactement celle-ci.

5.2 Indicateurs composites
	•	IPM par ministère : moyenne pondérée de KPI normalisés (§4.2), bornée [0;100].
	•	IGG : moyenne pondérée d’IPM, bornée [0;100].
	•	TS (Tension sociale), CM (Confiance marchés), LEG (Légitimité), CP (capital politique), RJ (risques juridiques) sont des compteurs globaux ∈ [0;100] avec 50 par défaut ; limites dures 0..100.

5.3 Profils temporels (application des effets)

Pour une option appliquée au mois t₀ avec lags {start, ramp, duration} et profile :
	•	Fenêtre d’effet Ω = [t₀+start ; t₀+start+ramp+duration-1].
	•	Linear : progression linéaire de 0 → 100 % sur ramp, puis plateau sur duration.
	•	Step : 100 % dès t₀+start jusqu’à duration.
	•	Sigmoid : courbe logistique (params fixes : midpoint start+ramp/2, pente κ=6/ramp).
	•	Exp : approche exponentielle 1−e^(−t/τ), avec τ = ramp/3.

Delta appliqué au KPI (valeur attendue) au mois t :
Δ(t) = delta * profileFactor(t) * (1 - riskDamp)
riskDamp = f(TS, RJ, LEG) (linéaire : riskDamp = clamp( (TS/100)*α + (RJ/100)*β - (LEG/100)*γ , 0, 0.5) avec α=0.4, β=0.3, γ=0.2).

Incertitude affichée : bande [min; max] interpolée par le même profileFactor.

5.4 Synergies / antagonismes
	•	Une règle de synergie associe un set de cartes {A,B,…} à un multiplicateur μ (par défaut 1.15) ou réduction de ramp (−25 %).
	•	Antagonisme : multiplicateur ν (par défaut 0.75) ou augmentation de ramp (+25 %).
	•	Application MUST être déterministe : trier règles par ruleId, appliquer synergies puis antagonismes.

5.5 RNG & événements
	•	RNG MUST être seeded (seed = hash(SaveId)).
	•	Tirages d’événements : 1 carte Event/mois si TS>60 ou CM<40 ; sinon 1/3 de chance.
	•	Les événements MUST être de type exogène (énergie, taux, climat, etc.) avec effets paramétrés comme des cartes.

⸻

6. Boucle de jeu (mois)
	1.	Conjoncture & événements : Appliquer exogènes + tirer 0..1 Event.
	2.	Décisions : l’utilisateur MUST pouvoir jouer ≤ 2 cartes majeures + ≤ 1 carte communication.
	3.	Application : coûts immédiats, programmation des effets différés (profils §5.3), synergies/antagonismes.
	4.	Agrégation : mise à jour KPI → IPM → IGG, mise à jour TS/CM/LEG/RJ/CP.
	5.	Rapport mensuel : synthèse, alertes, progression vers Objectifs.

Aucune phase de vote ne doit exister ; les cartes s’appliquent immédiatement avec leurs lags.

⸻

7. Objectifs, victoire/défaite

7.1 Sélection (début de partie)

Selon difficulté (§4.5), le joueur MUST choisir choose cartes Objectif.
Il MUST en réaliser au moins mustComplete à la fin.

7.2 Checkpoint mi-partie

Au mois N/2, si le nombre d’objectifs réalisés < midCheckpointMin → défaite immédiate (Troïka).

7.3 Déclencheurs de défaite (à tout moment)
	•	Solde < -deficitPct du PIB pendant months consécutifs ;
	•	Dette/PIB > debtPct ET CM < cmMin pendant months ;
	•	Intérêts/Recettes > interestToRevenuePct.

Seuils fournis dans DIFFICULTY.json.

7.4 Calcul « Objectif réalisé »

Chaque Check est évalué sur evaluationWindow :
	•	method=last : dernière valeur ; avg : moyenne simple ; trend : régression linéaire (pente signe).
L’objectif est réalisé si requiredCount checks sont vrais.

⸻

8. UX/UI (normatif, non-ambigu)

8.1 Guiding UX (Nielsen)
	•	Statut visible (feedback), langage clair non-jargon, prévention erreur (confirmations non-intrusives), contrôle utilisateur (undo sur carte non validée), navigation cohérente.  ￼

8.2 Palette/typos
	•	Font : Inter, fallbacks système.
	•	Couleurs :
	•	Primaire #0F172A (texte), accent #2563EB, succès #16A34A, alerte #DC2626, neutres gris Tailwind.
	•	Convention : KPI mieux = vert ↑, pire = rouge ↓ ; daltonisme-friendly (éviter vert/rouge seuls → ajouter icônes).

8.3 Écrans (structure exacte)

/ (Dashboard)
	•	Topbar : Mois courant, boutons Fin du mois, Rapport, Import données, Sauvegarder.
	•	IGG (gros cadran), Thermomètre Troïka (barre horizontale).
	•	Colonne droite : Objectifs (cartes compactes : pastille vert/ambre/rouge, % progression).
	•	Grille Ministères 3×4 : tuile = IPM (0..100), 2 KPI vedettes (mini sparkline 6 mois), bouton Détails.

/ministry/:id
	•	Header : IPM, bande de confiance.
	•	Table KPI (colonnes : Label, Valeur, Δm, Tendance, Source).
	•	Panneau Graphe causal (nœuds KPI + cartes actives pertinentes).
	•	Section Cartes suggérées (filtrées par ministère).

/budget
	•	Stack bar par ministère (Prévu vs Exécuté YTD).
	•	Simulateur (prévisualisation d’impact immédiat IGG/IPM/solde).

Modale Carte
	•	Onglets d’options (min 2, max 4).
	•	Panneau Effets (Δ KPI + intervalles + lags).
	•	Risques (RJ/TS/CM) jauges.
	•	Boutons Appliquer (validation), Annuler.

/report (Rapport mensuel)
	•	Section Objectifs en tête (progression, ce qui manque).
	•	Tableau ministères trié du plus critique.
	•	Journal du mois (événements, cartes jouées, coûts).

/data
	•	Drag-drop fichiers JSON (KPI/CARDS/OBJECTIVES/DIFFICULTY), validation visuelle (OK/erreurs).
	•	Historique imports (cache) + bouton Rétablir.

/stress
	•	Sliders exogènes (taux, énergie, climat…). Graph radar des sensibilités par ministère.

8.4 Navigation clavier
	•	1..9 / A..Z : accès direct aux ministères (mnémoniques).
	•	G : Dashboard, B : Budget, R : Rapport, D : Données.
	•	Enter : valider, Esc : annuler/fermer modal, ←/→ changer d’option de carte.

⸻

9. Persistance & PWA

9.1 IndexedDB (obligations)
	•	Store games (clé saveId), events, imports (datasets versionnés), settings.
	•	Les écritures MUST être atomiques par “fin de mois” (transaction unique).
	•	Export MUST produire un SaveGame.json complet (rechargeable).

9.2 Service Worker
	•	MUST pré-cacher index.html, manifest.webmanifest, JS/CSS, icônes, 404.html.
	•	Politique de cache MUST : Stale-While-Revalidate sur assets versionnés ; NO-NETWORK pour le jeu.
	•	Les JSON importés sont MUST être mis en cache (clé : checksum) et réutilisables hors-ligne.  ￼

9.3 Manifest Web
	•	name, short_name, start_url = /<repo>/, display = standalone, icônes 192/512, thème sombre/clair.  ￼

⸻

10. Algorithmes & formules (normatifs)

10.1 Normalisation KPI → IPM (repris §4.2)
	•	MUST utiliser les bornes fournies par KPI.
	•	S’il manque une valeur d’un mois, MUST interpoler linéairement si possible, sinon reporter la dernière valeur connue.

10.2 Application d’une carte (ordre MUST)
	1.	Débiter costs (eur, cp, leg, rj, cm).
	2.	Programmer les effets dans le calendrier interne, selon lags + profile.
	3.	Appliquer synergies puis antagonismes.
	4.	À chaque tick mensuel, pour chaque effet actif, calculer Δ(t) et mettre à jour le KPI (bornage [min,max]).
	5.	Recalculer IPM/IGG.

10.3 TS/CM/LEG/RJ/CP (compteurs globaux)
	•	Variation MUST être la somme des deltas liés aux cartes (p. ex. une réforme impopulaire ajoute TS+3 instantané) + dérivés des KPI emblématiques (p. ex. inflation haute alimente TS).
	•	Limites MUST être clampées [0..100].
	•	riskDamp dépend de ces compteurs (formule §5.3).

10.4 Victoire/défaite
	•	Mid-game : si < midCheckpointMin objectifs réalisés → défaite.
	•	Any-time : seuils budgétaires/dette/CM/intérêts → défaite.
	•	End : si ≥ mustComplete objectifs réalisés ET aucun déclencheur actif sur le dernier trimestre → victoire.

⸻

11. Déploiement GitHub Pages (normatif)

11.1 Routage SPA
	•	GitHub Pages ne supporte pas nativement le routage SPA ; la MUST-solution est un 404.html qui réécrit vers /index.html en préservant le chemin (pathSegmentsToKeep = 1 pour conserver /<repo>/…).  ￼

11.2 Arborescence

/ (repo root)
  /public   (manifest, icons, 404.html, favicon)
  /src      (app)
  /schemas  (json-schema 2020-12 pour KPI/CARDS/OBJECTIVES/DIFFICULTY)
  /datasets (exemples .json)

11.3 CI/CD
	•	MUST utiliser GitHub Actions :
	•	Job build: Node 20.x, npm ci, npm run build.
	•	Job deploy: publication du dossier dist/ sur gh-pages.
	•	SW MUST être invalidé par révision (self.__WB_MANIFEST ou hash d’assets).
	•	Les en-têtes HTTP MAY être simulés via meta tags pour CSP stricte : default-src 'self'; connect-src 'none';.

⸻

12. Qualité & tests

12.1 Unitaires (Vitest)
	•	MUST couvrir : normalisation KPI, calcul IPM/IGG, profils d’effets, synergies/antagonismes, triggers victoire/défaite, validation JSON via schemas.

12.2 E2E (Playwright)
	•	MUST vérifier : import jeux de données, enchaînement d’un trimestre (3 tours), hors-ligne (SW actif), sauvegarde/restauration, fallback 404.

12.3 Performance
	•	MUST mesurer :
	•	TTI < 2,5 s (laptop milieu de gamme),
	•	actions de carte < 100 ms,
	•	recalcul IPM/IGG pour 200 KPI < 16 ms (1 frame).
	•	SHOULD profiler et memoizer les agrégations par ministère.

⸻

13. Accessibilité
	•	MUST fournir focus visible, ordre logique tabulaire, libellés ARIA pour jauges/cadrans, alternatives textuelles aux graphiques (tables téléchargeables CSV).
	•	MUST prévoir messages d’erreur d’import clairs (ligne/chemin JSON Schema).

⸻

14. Contenus & libellés (non-ambigu)
	•	KPI : libellés FR explicites (ex. « Inflation glissante 12 mois (%) »).
	•	Cartes : titres impératifs (« Accélérer le permis de construire ») + options nominales (« Pilote », « Standard », « Ambitieux »).
	•	Rapport : sections fixes : Objectifs, Synthèse budget, Ministères (triés), Alertes (TS/CM/RJ), Journal.

⸻

15. Sécurité & vie privée
	•	MUST ne collecter aucune télémetrie.
	•	MUST confiner toutes données utilisateur en local (IndexedDB).
	•	MUST fonctionner sans permissions spéciales (pas de notifications, pas de sync BG).

⸻

16. Données d’exemple (obligatoires pour dev/QA)
	•	Fournir 1 set KPI.json exemple (3 mois de data) couvrant tous les ministères (≥ 2 KPI/ministère).
	•	Fournir CARDS.json avec ≥ 20 cartes (≥ 2 par type) et options complètes.
	•	Fournir OBJECTIVES.json avec ≥ 9 objectifs (3 difficultés).
	•	Fournir DIFFICULTY.json avec les trois modes et leurs seuils.

(Les fichiers d’exemple sont strictement de test et ne contiennent pas de données réelles.)

⸻

17. Acceptation (critères de recette)
	1.	Lancer en local (vite) → l’app passe en PWA installable (Chrome/Edge/Firefox) ; hors-ligne complet après premier chargement.  ￼
	2.	Import d’un pack JSON valide → aucun warning, KPI visibles par ministère, IPM/IGG calculés.
	3.	Jouer 6 mois en posant exactement 2 cartes/mois → Rapport mensuel affiche évolutions, bandes d’incertitude, synergies appliquées.
	4.	À mi-parcours, déclencher défaite si aucun objectif atteint selon DIFFICULTY.json.
	5.	Déployer sur GitHub Pages → rafraîchissement direct d’une URL interne NE DOIT PAS 404 (grâce au 404.html).  ￼

⸻

18. Glossaire (normatif)
	•	KPI : indicateur primaire (source exogène).
	•	IPM : agrégat ministériel (0..100).
	•	IGG : agrégat global (0..100).
	•	Lags : délais d’entrée en vigueur/rampe/durée.
	•	TS/CM/LEG/RJ/CP : compteurs méta (tension, marchés, légitimité, risque juridique, capital politique).
	•	Objectif : promesse mesurable constituée de checks sur KPI.

⸻

Annexes (références)
	•	SRS (structure, complétude/traçabilité) : ISO/IEC/IEEE 29148 (synthèse & template)  ￼
	•	Vocabulaire normatif : RFC 2119 (MUST/SHOULD/MAY)  ￼
	•	UX Heuristics : Nielsen/NNg (10 heuristiques)  ￼
	•	PWA/Service Worker/Manifest : MDN & web.dev  ￼
	•	IndexedDB : MDN (guide)  ￼
	•	JSON Schema 2020-12 : spécification & overview  ￼
	•	GitHub Pages SPA 404 workaround : discussions/réponses communautaires  ￼
