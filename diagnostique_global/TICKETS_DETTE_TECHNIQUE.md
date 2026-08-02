# Tickets — dette technique École 2.0

Onze tickets, prêts à copier dans Jira/Linear. Chaque ticket référence un fichier et
des lignes précises du dépôt (`Ecole_2.0_Copie_2-main`, archive fournie le 30/07/2026).

---

## T-01 · Tests unitaires pour Facturation et Paiements

- **Type** : Tech debt / Qualité
- **Priorité** : P1 (quick win)
- **Statut** : ✅ Premier jet livré avec cette analyse
- **Fichiers** :
  - `src/modules/admin/components/BillingWorkspace.tsx` (130 lignes)
  - `src/modules/admin/components/PaymentsWorkspace.tsx` (193 lignes)
  - Tests ajoutés : `BillingWorkspace.test.tsx`, `PaymentsWorkspace.test.tsx`
- **Description** : ces deux écrans pilotent l'argent (plans, abonnements, factures,
  transactions) et n'avaient aucun test avant cette analyse.
- **Fait** : formatage des montants, câblage des callbacks (`onCreatePlan`,
  `onEditPlan`, `onOpenPayment`, `onExport`), pagination, état vide/chargement.
- **Reste à faire** : les filtres `Select` (Statut, Canal, Rapprochement) utilisent
  Radix UI, dont l'ouverture du menu est instable sous jsdom sans polyfills
  supplémentaires (`scrollIntoView`, `ResizeObserver`, `hasPointerCapture`) — non
  couvert, voir T-05.
- **Critères d'acceptation** : `pnpm run test` passe en local avec les deux nouveaux
  fichiers ; aucune régression sur les tests existants.
- **Estimation** : fait (0,5 j pour la revue/finalisation).

---

## T-02 · Ajouter lint + typecheck au pipeline CI

- **Type** : Tech debt / Qualité
- **Priorité** : P1 (quick win)
- **Fichiers** :
  - `.github/workflows/quality-gates.yml` (jobs actuels : `Checkout`, `Setup pnpm`,
    `Setup Node`, `Install dependencies` L.28-29, `Build` L.31-32, `Test` L.34-35,
    `Security audit gate` L.37+)
  - `tsconfig.json` L.14 (`"strict": true` déjà actif, jamais vérifié en CI)
  - Aucun fichier `.eslintrc*` / `.prettierrc*` trouvé à la racine du dépôt
- **Description** : le mode TypeScript strict existe mais rien ne l'exécute
  automatiquement (`vite build` ne fait pas de vérification de types complète).
  Aucun linter n'est configuré.
- **Actions** :
  1. Ajouter `"typecheck": "tsc --noEmit"` dans `package.json > scripts`.
  2. Installer ESLint (`eslint`, `@typescript-eslint/*`, `eslint-plugin-react-hooks`)
     + Prettier, avec une config de base.
  3. Ajouter un job `typecheck` et un job `lint` dans `quality-gates.yml`, avant ou
     en parallèle du job `Build`.
- **Critères d'acceptation** : la CI échoue si `tsc --noEmit` ou `eslint` remonte une
  erreur ; les deux jobs tournent sur chaque PR vers `main`.
- **Estimation** : 0,5 à 1 j (dépend du nombre d'erreurs de lint découvertes sur les
  28 669 lignes existantes — prévoir une passe de nettoyage séparée si besoin).

---

## T-03 · Retirer la dépendance MUI inutilisée

- **Type** : Tech debt / Nettoyage
- **Priorité** : P1 (quick win)
- **Fichiers** :
  - `package.json` L.24-27 (`@emotion/react`, `@emotion/styled`,
    `@mui/icons-material`, `@mui/material`)
  - `vite.config.ts` L.56 (chunk `mui` dans `manualChunks`)
- **Description** : recherche exhaustive dans `src/` — **aucun fichier** n'importe
  `@mui/*` ou `@emotion/*`. Ces 4 paquets alourdissent `pnpm install` et le graphe de
  dépendances sans aucun bénéfice actuel.
- **Actions** :
  1. `pnpm remove @mui/material @mui/icons-material @emotion/react @emotion/styled`.
  2. Supprimer la ligne 56 de `vite.config.ts` (chunk `mui` devenu inutile).
  3. Relancer `pnpm run build` pour confirmer qu'aucun import caché ne casse.
- **Critères d'acceptation** : build vert, taille du `pnpm-lock.yaml` réduite,
  aucune régression visuelle (aucun écran ne dépend de MUI).
- **Estimation** : 1 à 2 h.

---

## T-04 · Ajouter un fichier LICENSE explicite

- **Type** : Juridique
- **Priorité** : P1 (quick win)
- **Fichiers** : racine du dépôt (absence de `LICENSE`), `README.md` (section
  « Licence » qui reconnaît déjà le manque), `ATTRIBUTIONS.md` (mentionne déjà les
  composants shadcn/ui et photos Unsplash utilisés sous licence).
- **Description** : avant toute diffusion publique élargie, le projet doit avoir sa
  propre licence clairement définie (MIT, Apache-2.0, ou propriétaire).
- **Critères d'acceptation** : fichier `LICENSE` présent à la racine, référencé dans
  le `README.md`.
- **Estimation** : 1 h (décision + fichier), en excluant le temps de décision
  juridique interne.

---

## T-05 · Étendre la couverture de tests aux modules sans test

- **Type** : Tech debt / Qualité
- **Priorité** : P2
- **Fichiers concernés** (aucun test associé trouvé) :
  - `src/modules/admin/` (hors `schemas.test.ts` et `utils.test.ts` déjà présents) —
    notamment `BillingWorkspace`/`PaymentsWorkspace` couverts par T-01, mais
    `AdminScreen.tsx` (855 lignes), `UsersWorkspace.tsx` (506 lignes) et les dialogs
    (`PlanEditorDialog.tsx`, `PaymentDetailDialog.tsx`) ne le sont pas encore.
  - `src/modules/programme/` — aucun fichier de test.
  - `src/modules/audit/` — aucun fichier de test.
- **État des lieux** : 9 fichiers de test au total (4 unitaires dans `src/`, 5 dans
  `tests/`) pour environ 50 composants/modules réels hors `components/ui`.
- **Critères d'acceptation** : chaque module cité a au moins un test qui couvre son
  chemin nominal (rendu + une interaction clé).
- **Estimation** : 2 à 4 j selon la profondeur souhaitée (à découper en sous-tickets
  par module si besoin).

---

## T-06 · Externaliser la clé Supabase anon en variable d'environnement

- **Type** : Sécurité / Hygiène
- **Priorité** : P2
- **Fichiers** :
  - `utils/supabase/info.tsx` L.3-4 (`projectId`, `publicAnonKey` codés en dur,
    fichier marqué `AUTOGENERATED FILE - DO NOT EDIT CONTENTS`)
  - `src/lib/supabase.ts` (contient déjà, en commentaire, la marche à suivre :
    `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, avec une note interne « P2.3 »
    qui identifie ce point comme déjà connu de l'équipe)
- **Description** : il s'agit de la clé publique **anon** (protégée par des
  policies RLS vérifiées dans `guidelines/migration-rollout-report-2026-07-02.md`),
  pas d'un secret serveur. Le risque est donc plus une question d'hygiène (rotation,
  environnements multiples) que de fuite de données.
- **Actions** :
  1. Créer `.env.example` avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
  2. Modifier `src/lib/supabase.ts` pour lire `import.meta.env.VITE_SUPABASE_URL`
     et `import.meta.env.VITE_SUPABASE_ANON_KEY` (fallback sur `utils/supabase/info`
     uniquement en développement local si les variables sont absentes).
  3. Mettre à jour la doc de déploiement (README/Vercel) avec les nouvelles
     variables d'environnement.
- **Critères d'acceptation** : l'app fonctionne en local et en déploiement avec les
  clés fournies uniquement via variables d'environnement.
- **Estimation** : 2 à 3 h.

---

## T-07 · Découper ElevesScreen.tsx (2570 lignes)

- **Type** : Architecture / Refactor
- **Priorité** : P3 (chantier structurant)
- **Fichier** : `src/app/components/ElevesScreen.tsx`
- **Description détaillée** : voir la proposition de découpage complète partagée
  séparément (diagramme + détail des lignes). Résumé des seams identifiés :
  - L.34-113 : données mock (25 élèves, notes de base, mois scolaires) + générateurs
    pseudo-aléatoires (`getStudentGrades`, `getAttendance`) → à extraire dans
    `src/app/components/eleves/data/` et à terme remplacer par `studentsApi`.
  - L.127-243 : fonctions de calcul pur (`avg`, `computeWeightedAvg`,
    `useBulletinValidation`, `totalAbsencesNJ`) → `eleves/utils/grades.ts`, facilement
    testables unitairement dès leur extraction.
  - L.244-697 : `BulletinBody` (453 lignes) → `eleves/BulletinBody.tsx`.
  - L.698-840 : `buildOneBulletinHtml` / `buildBatchPrintHtml` (génération HTML pour
    impression, fonctions pures sans JSX) → `eleves/print/buildBulletinHtml.ts`.
  - L.841-1143 : `BatchPreviewModal` (302 lignes) → `eleves/BatchPreviewModal.tsx`.
  - L.1144-1315 : `AddStudentModal` (171 lignes) → `eleves/AddStudentModal.tsx`.
  - L.1316-2570 : composant principal, avec 3 vues gérées par un seul état `view`
    (`"liste"` L.1863, `"registre"` L.2068, `"bulletin"` L.2225) → à séparer en
    `EleveListView.tsx`, `RegistreView.tsx`, `BulletinView.tsx`, orchestrées par un
    `ElevesScreen.tsx` allégé à ~150 lignes.
- **Critères d'acceptation** : chaque nouveau fichier fait moins de 400 lignes ;
  aucune régression fonctionnelle sur les 3 vues ; les fonctions pures extraites ont
  des tests unitaires dédiés.
- **Estimation** : 3 à 5 j (à séquencer vue par vue plutôt qu'en un seul PR).

---

## T-08 · Toggle « inclusion des disciplines » non persisté

- **Type** : Bug fonctionnel (découvert lors de la lecture de code)
- **Priorité** : P2
- **Fichier** : `src/app/components/ElevesScreen.tsx` L.1393, L.1401-1402
- **Description** : le commentaire du code indique explicitement que le toggle
  d'inclusion/exclusion d'une discipline dans l'évaluation (`disciplineConfig`)
  devrait être sauvegardé dans la table Supabase `discipline_config`, mais l'appel
  réel (`supabase.from("discipline_config").upsert(...)`) est **commenté, jamais
  exécuté** :
  ```
  // Supabase integration point:
  // supabase.from("discipline_config").upsert({ ... });
  ```
  Résultat : un enseignant qui décoche une discipline la voit disparaître à l'écran,
  mais ce choix n'est pas sauvegardé — il revient à l'état initial au rechargement
  de la page, sans message d'erreur ni indication à l'utilisateur.
- **Critères d'acceptation** : soit l'appel Supabase est implémenté et testé, soit le
  toggle est marqué visuellement comme « en cours de développement » tant qu'il
  n'est pas branché — pour ne pas induire l'enseignant en erreur.
- **Estimation** : 0,5 j si la table `discipline_config` existe déjà côté migrations
  (à vérifier dans `supabase/migrations`), sinon 1-2 j avec la migration associée.

---

## T-09 · Performances mobiles non optimisées

- **Type** : Produit / Performance
- **Priorité** : P2
- **Contexte** : point déjà identifié dans la feuille de route du `README.md`
  (Phase 2 — Optimisation, case non cochée). Aucune mesure Lighthouse récente n'a pu
  être vérifiée dans cette analyse (fichiers présents dans `captures/*.json` mais
  non interprétés ici).
- **Action recommandée** : faire tourner Lighthouse mobile sur les 3-4 écrans les
  plus utilisés (probablement `ElevesScreen`, `CahierRoulementScreen`,
  `PlanningScreen` — les plus volumineux, cf. T-07) et prioriser selon les résultats.
- **Estimation** : 2 à 3 j (mesure + corrections ciblées).

---

## T-10 · Mode offline non livré

- **Type** : Produit
- **Priorité** : P3 (chantier structurant)
- **Contexte** : présent dans le manifest PWA (`public/manifest.webmanifest`,
  `public/sw.js`, `public/offline.html`) mais signalé comme non finalisé dans la
  feuille de route du `README.md`. Central pour la mission du produit (enseignants
  en zones à connectivité limitée).
- **Cadrage retenu** : première brique d'écriture différée avec synchronisation
  au retour du réseau pour les écritures cahier/notes, en conservant les lectures
  déjà mises en cache.
- **Tests e2e à couvrir** : saisie du cahier hors ligne, modification d'une note
  hors ligne, replay après reconnexion, plus les parcours hors ligne/retour en
  ligne pour les modules fiche et planification.
- **Estimation** : à cadrer séparément — dépend du périmètre (lecture seule hors
  ligne vs. écriture différée avec synchronisation).

---

## T-11 · Auditer les données mock intégrées à ElevesScreen.tsx

- **Type** : Tech debt / Qualité des données
- **Priorité** : P2
- **Fichier** : `src/app/components/ElevesScreen.tsx` L.34-113
- **Description** : 25 élèves fictifs, une grille de notes de base et des jours
  d'école sont codés en dur directement dans le composant, avec des générateurs
  pseudo-aléatoires (`getStudentGrades`, `getAttendance`) pour simuler des notes et
  des présences réalistes. Le composant utilise pourtant `studentsApi` (import
  L.5) pour les mutations — la lecture initiale, elle, semble s'appuyer sur ces
  données mock plutôt que sur l'API.
- **Action recommandée** : vérifier si `STUDENTS`/`gradesMap` initial vient bien de
  `studentsApi` en production, ou si ces mocks sont un reliquat de prototypage
  Figma Make encore actif. Si actif, c'est prioritaire — un enseignant ne doit pas
  voir de fausses données d'élèves.
- **Estimation** : 0,5 j de vérification, puis chiffrage selon le résultat.

---

## Résumé priorisation

| # | Titre | Priorité | Estimation |
|---|-------|----------|------------|
| T-01 | Tests Facturation/Paiements | P1 | Fait |
| T-02 | Lint + typecheck en CI | P1 | 0,5-1 j |
| T-03 | Retirer MUI inutilisé | P1 | 1-2 h |
| T-04 | Fichier LICENSE | P1 | 1 h |
| T-05 | Étendre couverture de tests | P2 | 2-4 j |
| T-06 | Externaliser clé Supabase | P2 | 2-3 h |
| T-08 | Toggle disciplines non persisté | P2 | 0,5-2 j |
| T-09 | Performances mobiles | P2 | 2-3 j |
| T-11 | Auditer données mock ElevesScreen | P2 | 0,5 j+ |
| T-07 | Découper ElevesScreen.tsx | P3 | 3-5 j |
| T-10 | Mode offline | P3 | à cadrer |
