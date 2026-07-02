# Migration Rollout Report - 2026-07-02

## Scope
- Remote Supabase project: `macnyqeakdiydttzenrp` (Ecole 2.0 Mobile App Design)
- Applied migrations: `000` to `006`
- Objective: bootstrap schema, harden RLS/storage, and validate production readiness.

## Applied Migration Chain
1. `000_init_schema.sql`
2. `001_profiles_and_rls.sql`
3. `002_profiles_extended.sql`
4. `003_profile_theme.sql`
5. `004_fix_rls_and_storage.sql`
6. `005_security_hardening.sql`
7. `006_school_terms_rls.sql`

## Execution Notes
- Fixed remote migration-history mismatch via `supabase migration repair`.
- Resolved duplicate local migration version numbers by renaming:
  - `003_security_hardening.sql` -> `005_security_hardening.sql`
  - `004_school_terms_rls.sql` -> `006_school_terms_rls.sql`
- Final `supabase db push` completed successfully.

## Verification Results

### Build / Static checks
- `npm run build`: PASS (non-blocking chunk-size warnings only)
- Editor diagnostics: PASS (no blocking errors)

### Database security checks (linked remote)
- RLS enabled on:
  - `public.profiles`
  - `public.students`
  - `public.student_grades`
  - `public.discipline_config`
  - `public.documents`
  - `public.school_terms`

- Policies present:
  - `profiles_select_own`, `profiles_update_own`
  - `students_director_all`, `students_teacher_own_class`
  - `grades_director_all`, `grades_teacher_own`
  - `discconf_director_all`, `discconf_teacher_own_class`
  - `documents_director_all`, `documents_teacher_own_class`
  - `school_terms_director_all`, `school_terms_teacher_own_class`

- Security/consistency functions present:
  - `prevent_profile_role_change`
  - `prevent_role_elevation`
  - `set_updated_at`

### Migration parity
- `supabase migration list`: local == remote for `000..006`

## Remaining Manual QA (recommended)
1. Teacher cannot read/write other class data.
2. Director can access all class data.
3. Document upload/delete still works end-to-end after storage policy hardening.
4. Profile update cannot self-promote role.

## Operational Status
- Remote DB migration state: HEALTHY
- Security baseline (RLS + policies): ENFORCED
- Ready for application-level QA and release signoff.
