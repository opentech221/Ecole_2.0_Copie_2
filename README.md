# 🏫 Ecole 2.0

## Plateforme de Gestion Scolaire pour les Enseignants d'Afrique Francophone

[![License](https://img.shields.io/badge/License-%C3%A0%20d%C3%A9finir-lightgrey.svg)](ATTRIBUTIONS.md)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![Made in Africa](https://img.shields.io/badge/Made%20for-Africa%20🌍-orange.svg)](https://github.com/opentech221)

---

## 💡 La Vision

> **"Donner aux enseignants les outils qu'ils méritent."**

Dans les écoles primaires d'Afrique francophone, les enseignants gèrent des classes entières avec peu ou pas d'outils numériques.

- **Cahiers de roulement** tenus à la main, difficiles à archiver
- **Planification des cours** chronophage et dispersée
- **Suivi des élèves** peu structuré faute d'outils adaptés
- **Communication avec la direction** souvent informelle

### Notre Solution

**Ecole 2.0** est une plateforme numérique pensée pour les **directeurs et enseignants du primaire**, qui centralise la gestion de classe, la planification pédagogique et le suivi des élèves — dans une interface simple, accessible et pensée pour le terrain africain.

---

## 🎯 Fonctionnalités Principales

### 📋 Gestion des Classes
- Suivi des niveaux CI, CP, CE1, CE2, CM1, CM2
- Inscription et gestion des élèves par classe
- Vue d'ensemble par directeur et par enseignant
- Tableau de bord centralisé multi-rôles

### 📝 Éditeur de Leçons
- Création et structuration de leçons par matière
- Workflow guidé via sélection de contexte + éditeur
- Planification hebdomadaire et mensuelle
- Historique et archivage des séquences pédagogiques

### 📒 Cahier de Roulement Numérique
- Saisie des notes et appréciations par élève
- Suivi des performances dans le temps
- Génération de documents imprimables
- Aperçu et export des bulletins

### 📁 Gestion Documentaire
- Stockage et organisation des documents scolaires
- Prévisualisation intégrée
- Partage entre enseignants et direction
- Archivage structuré par année scolaire

### 🗓️ Planning et Emploi du Temps
- Planification des cours par classe et par niveau
- Vue calendaire hebdomadaire
- Gestion des événements et activités scolaires

---

## 🚀 Technologies Utilisées

### Frontend
- **React 18** + **TypeScript** avec Vite pour des performances optimales
- **Tailwind CSS 4** avec design system personnalisé
- **Thématisation avancée** (light, dark, emerald, ocean)
- **React Router 7** pour la navigation côté client
- **Radix UI** pour les composants accessibles

### Backend
- **Supabase** (PostgreSQL + RLS)
- **Row Level Security** pour isoler les données par établissement
- **Policies Storage durcies** par classe/propriétaire
- **TanStack React Query** pour la gestion de l'état serveur

---

## 📦 Installation

### Prérequis
- Node.js 18+
- npm (ou pnpm)
- Compte Supabase (gratuit)

### Étapes

```bash
# 1. Cloner le repository
git clone https://github.com/opentech221/Ecole_2.0_Copie_2.git
cd Ecole_2.0_Copie_2

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev
```

Note: le client Supabase utilise actuellement `utils/supabase/info.tsx`.
Pour un déploiement standard, externaliser ensuite les clés en variables d'environnement.

Le site sera accessible sur `http://localhost:5173`

## 🗄️ Workflow Supabase Local Et Distant

### Initialisation (une seule fois)

```bash
npx supabase init
```

### Local: developper et tester les migrations sans dashboard distant

```bash
# Demarrer Postgres local Supabase
npm run db:local:start

# Rejouer toutes les migrations locales (000, 001, 002, ...)
npm run db:local:reset

# Executer une requete SQL locale
npm run db:local:query -- "select * from supabase_migrations.schema_migrations order by version;"

# Arreter les services locaux
npm run db:local:stop
```

### Distant: pousser les migrations depuis le terminal

```bash
# 1) Se connecter (token perso Supabase)
npx supabase login

# 2) Lier le repo au projet distant
export SUPABASE_PROJECT_REF="votre_project_ref"
npm run db:remote:link

# 3) Pousser les migrations vers la base distante
npm run db:remote:push
```

### Astuce equipe

Avant chaque PR backend:
1. `npm run db:local:reset`
2. verifier que les migrations passent de zero sans erreur
3. seulement ensuite faire `npm run db:remote:push`

Option automatisée en une commande:

```bash
npm run db:preflight
```

Astuce debug preflight (sans execution des commandes):

```bash
node scripts/db-preflight.mjs --dry-run
```

Checklist integrite/RLS (cross-platform):

```bash
# base locale
npm run db:integrity:local

# base distante liee
npm run db:integrity:linked
```

Ce preflight exécute:
1. start DB locale
2. reset complet des migrations
3. verification des versions appliquees
4. checklist integrite/RLS (tables, index, FKs, policies, triggers)
5. build frontend

## Documentation Interne

- Guide exploitation admin: [guidelines/admin-exploitation-runbook.md](guidelines/admin-exploitation-runbook.md)

## PWA (Installable Android/iOS)

L'application est configurée en Progressive Web App avec:
- manifest: `public/manifest.webmanifest`
- service worker: `public/sw.js`
- fallback offline: `public/offline.html`
- icones: `public/icons/*`
- push web: abonnement navigateur + réception via service worker
- background sync: synchronisation différée des actions notifications hors ligne

### Lancer en local

```bash
npm install
npm run dev
```

Pour tester le service worker localement, préférer un build preview:

```bash
npm run build
npx vite preview
```

### Build production

```bash
npm run build
```

### Variables d'environnement PWA avancée

- `VITE_VAPID_PUBLIC_KEY`: clé publique VAPID exposée au frontend pour l'abonnement push
- `VAPID_PUBLIC_KEY`: clé publique lue côté fonction Edge
- `VAPID_PRIVATE_KEY`: clé privée VAPID pour signer les push
- `VAPID_SUBJECT`: contact VAPID, ex. `mailto:admin@ecole20.app`

Sans ces variables, la PWA reste installable/offline, mais le push web reste désactivé.

### Tester l'installation mobile

Android (Chrome):
1. Ouvrir l'app en HTTPS.
2. Attendre le bouton `Installer l'app`.
3. Installer puis relancer depuis l'ecran d'accueil.

iOS (Safari):
1. Ouvrir l'app en HTTPS.
2. Partager.
3. Choisir `Sur l'ecran d'accueil`.

### HTTPS requis

Le mode installable PWA et le service worker exigent HTTPS en production.
Vercel/Supabase couvrent ce prerequis par defaut.

### Limites iOS

- Pas d'evenement `beforeinstallprompt` standard.
- Le prompt d'installation est remplace par une indication utilisateur.
- Fonctionnalites avancees (push/background sync) plus limitees que sur Android.

### Checklist debug PWA

1. Verifier `Application > Manifest` dans DevTools.
2. Verifier `Application > Service Workers` (scope `/`, statut actif).
3. Confirmer que `sw.js` et `manifest.webmanifest` renvoient HTTP 200.
4. Vider cache/service worker puis recharger hard (`Ctrl+Shift+R`).
5. Tester offline avec DevTools Network `Offline` et navigation vers une route SPA.
6. Verifier qu'aucune requete API sensible authentifiee n'est servie stale sans reseau.
7. Verifier `PushManager` et les permissions navigateur avant de tester les notifications push.
8. Sur Vercel, verifier que l'URL finale publique n'est pas protegee par SSO si vous voulez tester l'installabilite sur mobile externe.


---

## 🤝 Contribuer

Ce projet est ouvert aux contributions !

### Qui peut contribuer ?

- 💻 **Développeurs** — Améliorations techniques et nouvelles fonctionnalités
- 👨‍🏫 **Enseignants** — Retours terrain et besoins pédagogiques
- 🏫 **Directeurs d'école** — Expertise en gestion scolaire
- 🌍 **Traducteurs** — Adaptation aux langues locales (Wolof, Bambara, etc.)
- 🧪 **Testeurs** — Retours utilisateurs et rapports de bugs

### Comment Contribuer ?

1. **Fork** le projet
2. **Créer** une branche : `git checkout -b feature/ma-feature`
3. **Commit** vos changements : `git commit -m 'Ajout de ma feature'`
4. **Push** vers la branche : `git push origin feature/ma-feature`
5. **Ouvrir** une Pull Request

### Guidelines

- Tester sur mobile ET desktop
- Respecter l'architecture existante (`src/app/`, `src/services/`, `src/hooks/`)
- Documenter les nouvelles fonctionnalités
- Utiliser le design system et les composants Radix UI existants

---

## 🚀 Feuille de Route

### ✅ Phase 1 — MVP (Complété)
- [x] Interface enseignant et directeur
- [x] Authentification et gestion des rôles
- [x] Gestion des classes et des élèves
- [x] Éditeur de leçons et catalogue
- [x] Cahier de roulement numérique
- [x] Gestion documentaire
- [x] Planning et emploi du temps

### 🔄 Phase 2 — Optimisation (En cours)
- [x] Design system unifié
- [x] Dark mode
- [x] Workflow migrations local/distant (Supabase CLI)
- [ ] Tests utilisateurs en conditions réelles
- [ ] Mode offline pour zones à faible connexion
- [ ] Optimisations performances mobiles

### 🔮 Phase 3 — Expansion (Futur)
- [ ] Application mobile native
- [ ] Support multilingue (Wolof, Bambara, etc.)
- [ ] Messagerie interne entre enseignants et direction
- [ ] Tableau de bord analytique pour les inspecteurs

### 🌍 Phase 4 — Impact (Long terme)
- [ ] Déploiement dans plusieurs pays d'Afrique francophone
- [ ] Intégration avec les systèmes ministériels
- [ ] Certification et partenariats institutionnels

---

## 📞 Contact

**Créateur :** opentech221  
**GitHub :** [@opentech221](https://github.com/opentech221)  
**Pays :** Sénégal 🇸🇳

Pour toute question ou collaboration :
- Ouvrir une [Issue](https://github.com/opentech221/Ecole_2.0_Copie_2/issues)
- Ou une [Discussion](https://github.com/opentech221/Ecole_2.0_Copie_2/discussions)

---

## 🎖️ Licence

La licence du projet applicatif n'est pas encore formalisée dans un fichier `LICENSE` dédié.
Les attributions et licences tierces utilisées sont documentées dans [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

Vous êtes libre de :
- ✅ Utiliser le code pour vos projets
- ✅ Modifier et adapter selon vos besoins
- ✅ Distribuer avec ou sans modifications
- ✅ Utiliser commercialement

**Condition :** Clarifier et ajouter une licence projet explicite avant diffusion publique large.

---

## 🌟 Remerciements

À tous ceux qui rendent ce projet possible :

- Aux **enseignants** qui font avancer l'éducation avec des moyens limités
- Aux **directeurs d'école** qui portent leurs établissements à bout de bras
- Aux **familles** qui croient en l'éducation comme levier de développement
- Aux **contributeurs** qui donnent de leur temps pour ce projet

**Ce projet est pour vous, avec vous.** 🙏

---

<div align="center">

**Ensemble, modernisons l'école africaine !** 🌍✨

Made with ❤️ in Senegal 🇸🇳

</div>
