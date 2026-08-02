# Prompt — Mettre le README d'École 2.0 en cohérence avec le code réel

> À copier tel quel dans Claude Code (ou tout agent avec accès au dépôt
> `Ecole_2.0_Copie_2`). Objectif : corriger les points où `README.md` est en
> décalage avec l'état réel du code — sans rien enjoliver ni rien minimiser.

---

## Règle générale

Ne modifie **aucune** phrase du README sur la base de ce prompt seul : pour
chaque point ci-dessous, **vérifie d'abord toi-même dans le code actuel** (l'état
du dépôt a pu changer depuis cet audit), puis mets à jour uniquement si l'écart
est confirmé. Si un point a déjà été corrigé entre-temps (ex. MUI déjà retiré),
n'y touche pas et dis-le-moi.

Garde le ton, la structure, les emojis et la langue (français) du README
existant — il ne s'agit pas de le réécrire, seulement de corriger les endroits
précis listés ici.

---

## Point 1 · Roadmap Phase 2 — le mode offline est plus avancé que la checkbox ne le dit

**Constat** : la section « 🚀 Feuille de Route » liste
`- [ ] Mode offline pour zones à faible connexion` comme non fait. Or
`public/sw.js` (357 lignes) implémente déjà un cache d'app shell, un cache API,
et une file d'attente IndexedDB pour la synchronisation différée
(`ecole2-sync-db`, tag `notifications-write-sync`). La section « 📱 PWA » plus
bas dans le même README décrit d'ailleurs cette infra en détail — la
contradiction est interne au document, pas juste avec le code.

**Action** :
1. Relis `public/sw.js` en entier pour lister précisément ce qui fonctionne déjà
   (cache offline, synchronisation différée) et ce qui ne fonctionne pas encore
   (ex. couverture partielle de certains écrans, absence de tests end-to-end
   sur le scénario offline).
2. Reformule la ligne de roadmap pour refléter un état intermédiaire réel, par
   exemple (à ajuster selon ce que tu constates) :
   ```diff
   -- [ ] Mode offline pour zones à faible connexion
   +- [~] Mode offline pour zones à faible connexion — infrastructure (cache app shell, file de synchronisation différée) déjà en place ; validation de bout en bout sur l'ensemble des écrans restant à faire
   ```
3. Si le dépôt n'a pas de convention pour une case « en cours » (`[~]`), utilise
   la même convention que celle déjà utilisée ailleurs dans le README pour un
   item partiellement fait (vérifie s'il en existe une avant d'en inventer une).

---

## Point 2 · « Design system unifié » ✅ — vrai dans le code, contredit par les dépendances

**Constat** : la checkbox `- [x] Design system unifié` est exacte pour le code
(`grep -rl "@mui" src` ne retourne rien) mais `package.json` liste encore
`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`
comme dépendances actives.

**Action** :
1. Vérifie l'état actuel : `grep -rl "@mui\|@emotion" src` et
   `grep -n "@mui\|@emotion" package.json`.
2. **Si MUI est encore dans `package.json`** : n'affirme rien de plus dans le
   README (la checkbox reste correcte pour le code applicatif), mais ajoute une
   note courte dans la section technique concernée, par exemple sous
   « 🚀 Technologies Utilisées » :
   ```diff
    - **Radix UI** pour les composants accessibles
   +
   +> Note : `@mui/material` et `@emotion/*` figurent encore dans
   +> `package.json` pour des raisons historiques mais ne sont plus utilisés
   +> dans le code (nettoyage prévu).
   ```
3. **Si MUI a déjà été retiré** (ticket T-03 traité) : ne touche à rien ici, et
   dis-le-moi.

---

## Point 3 · Sécurité applicative — un branchement incomplet à documenter (optionnel, à ta discrétion)

**Constat** : la table `discipline_config` existe bien dès la migration
`001_profiles_and_rls.sql`, cohérent avec le README. Mais le code frontend
(`src/app/components/ElevesScreen.tsx`, fonction `handleToggleDiscipline`)
n'appelle jamais réellement cette table — l'upsert Supabase est commenté. Ce
n'est pas un problème de sécurité RLS (le README a raison sur ce point) mais un
écart entre schéma prêt et frontend pas branché.

**Action** :
1. Vérifie si ce point a été corrigé (ticket T-08). Si oui, ignore ce point.
2. Si non corrigé, **ne mentionne pas ce détail dans le README** (un README ne
   liste pas les bugs connus individuels) — mais signale-le-moi pour suivi si tu
   le retrouves non résolu, plutôt que de le documenter publiquement.

---

## Point 4 · Vérifier les autres affirmations chiffrées avant de les laisser telles quelles

Le README contient des chiffres précis (24 fichiers `programme_officiel/*.JSON`,
6 niveaux, 24 domaines, 42 sous-domaines, 92 activités, 215 paliers,
929 objectifs spécifiques, 2036 contenus). Ces chiffres ont été vérifiés comme
exacts lors du dernier audit (24 fichiers confirmés par `ls programme_officiel/
*.JSON | wc -l`). Si tu as modifié le contenu de `programme_officiel/` ou les
migrations associées depuis, revérifie ces chiffres avant de les laisser dans le
README — sinon laisse-les tels quels, ils sont corrects à ce jour.

---

## Point 5 · Ne pas introduire de nouveaux écarts

En corrigeant les points ci-dessus, ne transforme aucune formulation existante
en une affirmation que tu n'as pas toi-même vérifiée dans le code. En
particulier :
- N'ajoute pas de pourcentage de couverture de tests inventé.
- Ne déclare pas un module « complet » ou « prêt pour la production » sans
  l'avoir vérifié comme pour les points ci-dessus.
- Si un point te semble douteux mais que tu n'as pas le temps de le vérifier
  dans cette tâche, laisse-le tel quel et signale-le-moi plutôt que de deviner.

---

## Validation attendue

- Diff minimal : seules les lignes identifiées ci-dessus doivent changer.
- Après modification, relis le README en entier une fois et vérifie qu'aucune
  autre ligne ne contredit les changements que tu viens de faire (ex. si tu
  nuances la ligne offline, vérifie que la section « 📱 PWA » reste cohérente
  avec cette nuance).
- Fournis-moi un résumé des changements effectués, ligne par ligne, avec la
  justification (quelle vérification dans le code a motivé chaque changement).
