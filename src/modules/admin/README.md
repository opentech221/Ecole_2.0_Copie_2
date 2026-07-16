# Admin Module

## Installation

1. Installer les dépendances:

```bash
npm install
```

2. Initialiser ou mettre à jour la base locale / distante:

```bash
npm run db:local:start
npm run db:local:reset
npx supabase db push
```

3. Charger les données de démonstration:

```bash
npx supabase db query < supabase/seeds/admin_console_demo.sql
```

## Variables d’environnement

- `SUPABASE_ACCESS_TOKEN`: déploiement CLI Supabase
- `SUPABASE_PROJECT_REF`: pour `npm run db:remote:link`
- `PLAYWRIGHT_BASE_URL`: optionnel pour e2e sur une URL déjà lancée
- `E2E_ADMIN_EMAIL`: login smoke test admin
- `E2E_ADMIN_PASSWORD`: mot de passe smoke test admin

## Scripts

- `npm run build`: build Vite
- `npm run test`: tests unitaires + intégration Vitest
- `npm run test:e2e`: smoke e2e Playwright
- `npm run db:local:reset`: rejoue migrations et seeds locales
- `npm run db:remote:push`: pousse les migrations distantes

## Architecture

- `src/modules/admin`: page cockpit, hook, client API, schémas et utilitaires
- `src/modules/payments`: exports du domaine paiements
- `src/modules/billing`: exports du domaine facturation/abonnements
- `src/modules/audit`: exports du domaine audit/compliance
- `supabase/functions/admin-console`: API Edge sécurisée RBAC
- `supabase/migrations/010_admin_console_foundation.sql`: schéma finance/admin multi-tenant
- `supabase/seeds/admin_console_demo.sql`: seed démo
- `supabase/reporting/admin_console_queries.sql`: requêtes SQL business

## Guide d’utilisation admin

1. Ouvrir `/admin` avec un profil `director` ou un utilisateur disposant d’un rôle `owner`, `super_admin`, `admin_finance` ou `support` dans `user_roles`.
2. Sélectionner un établissement dans l’en-tête.
3. Piloter le business depuis `Vue exécutive`.
4. Gérer les transactions depuis `Paiements`: filtre, export CSV, détail, remboursement, relance, paiement hors-ligne, note interne.
5. Gérer les plans, factures et abonnements dans `Facturation & abonnements`.
6. Contrôler la traçabilité dans `Audit & conformité`.

## Checklist sécurité avant prod

- Vérifier les policies RLS de `010_admin_console_foundation.sql` après déploiement.
- Déployer la fonction Edge `admin-console` avec `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_URL` et `ALLOWED_ORIGINS`.
- S’assurer qu’aucun utilisateur non autorisé n’a accès à `user_roles` administratifs.
- Activer la surveillance des `webhook_events` en échec.
- Vérifier les index `payments`, `invoices`, `subscriptions`, `audit_logs` après import initial.
- Revoir les logs d’audit et la rétention RGPD avant mise en production réelle.
- Brancher un vrai fournisseur d’email/SMS pour les relances si nécessaire.