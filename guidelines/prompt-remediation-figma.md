# Prompt De Remediation Priorise Par Impact Pour Le Generateur Figma

## Role attendu
Tu es un lead engineer React + Supabase.

Objectif: executer un plan de remediation technique priorise par impact pour fiabiliser l'application Ecole 2.0 sans casser l'UI existante.

## Contraintes d'execution
1. Prioriser securite, permissions et coherence data avant le refactoring visuel.
2. Produire des commits logiques par lot: P0, P1, P2.
3. Apres chaque lot: lancer build et verifier absence de regression critique.
4. Ne pas modifier les parcours metier non concernes.
5. Preserver le design actuel, sauf si une tache demande explicitement une correction UX.

## Livrables attendus
1. Corrections implementees.
2. Changelog court par fichier modifie.
3. Liste des risques restants.

## Plan priorise

### P0 - Impact critique (securite, donnees, permissions)
1. Corriger l'elevation de privileges sur le profil.
Fichier: supabase/migrations/001_profiles_and_rls.sql
Action: renforcer la policy profiles_update_own pour empecher un utilisateur standard de changer role; autoriser uniquement les champs de profil non sensibles.

2. Securiser la mise a jour de profil cote client.
Fichiers: src/hooks/useProfile.ts, src/app/components/ProfilScreen.tsx
Action: retirer role du payload updateProfile pour les utilisateurs standards; rendre le champ role non editable tant qu'aucun flux admin dedie n'existe.

3. Corriger la gestion des fichiers documents.
Fichier: src/services/apiService.ts
Action: stocker file_path comme chemin bucket interne (et non URL publique); adapter upload, getSignedUrl et delete pour fonctionner sur ce chemin.

4. Durcir les policies Storage.
Fichier: supabase/migrations/001_profiles_and_rls.sql
Action: limiter upload/read/delete au perimetre classe/proprietaire au lieu d'un bucket global permissif.

5. Reduire l'exposition CORS de la fonction edge.
Fichier: supabase/functions/server/index.tsx
Action: remplacer origin "*" par une liste blanche configurable.

### P1 - Impact fort (coherence architecture et droits reels)
1. Supprimer la double source d'auth.
Fichier: src/components/PermissionGuard.tsx
Action: utiliser AuthContext au lieu d'un appel direct a useAuth pour eviter les etats divergents.

2. Retirer les autorisations codees en dur.
Fichier: src/app/components/DocumentsScreen.tsx
Action: remplacer ownerClassId fixe par la classe active reelle issue du contexte/profil.

3. Aligner classe/role UI avec persistance backend.
Fichiers: src/app/contexts/AppContext.tsx, src/app/components/AppLayout.tsx
Action: eviter les changements purement locaux qui contredisent les permissions RLS; persister explicitement ce qui doit l'etre.

4. Eliminer le mode mixte live/mock sur les documents.
Fichiers: src/app/components/DocumentsScreen.tsx, src/hooks/useDocumentsQuery.ts
Action: passer en source unique Supabase; garder un fallback mock uniquement derriere un flag explicite de developpement.

5. Brancher reellement les operations eleves.
Fichier: src/app/components/ElevesScreen.tsx
Action: remplacer les sections "In production" commentees par des appels effectifs aux hooks/services.

### P2 - Impact moyen (maintenabilite, dette technique, stabilite)
1. Reduire la complexite des ecrans monolithiques.
Fichiers: src/app/components/ElevesScreen.tsx, src/app/components/LessonEditor.tsx, src/app/components/PlanningScreen.tsx, src/app/components/DocumentsScreen.tsx
Action: extraire des sous-composants metier reutilisables sans changer le rendu final.

2. Clarifier la source de verite des hooks data.
Fichiers: src/hooks/useDocuments.ts, src/hooks/useStudents.ts
Action: soit supprimer ces hooks locaux non utilises, soit les faire converger vers React Query pour eviter les doublons.

3. Externaliser la configuration Supabase.
Fichiers: src/lib/supabase.ts, utils/supabase/info.tsx
Action: utiliser des variables d'environnement build-time et reduire la dependance a un fichier autogenere versionne.

4. Consolider les styles de base.
Fichiers: src/styles/theme.css, src/styles/index.css, src/styles/globals.css
Action: deplacer progressivement les styles inline repetitifs vers des tokens et classes utilitaires partagees.

5. Nettoyer le code potentiellement mort.
Fichiers: src/app/components/Portal.tsx, src/app/components/LessonCatalog.tsx
Action: confirmer l'usage reel; supprimer ou reintegrer correctement via le routing.

## Criteres d'acceptation globaux
1. Aucun utilisateur non autorise ne peut se promouvoir director via profil.
2. Upload et suppression documents fonctionnent de bout en bout sans fichiers orphelins.
3. Les permissions UI refletent les permissions backend.
4. Les ecrans Eleves et Documents fonctionnent en mode Supabase sans dependance implicite aux mocks.
5. Build OK et navigation principale intacte.

## Format de sortie impose au generateur
1. Resume de ce qui a ete fait (10 lignes max).
2. Liste des fichiers modifies, groupes par P0/P1/P2.
3. Diffs majeurs expliques en une phrase chacun.
4. Resultat des verifications (build/tests/lint si disponibles).
5. Risques restants et prochaines actions recommandees.
