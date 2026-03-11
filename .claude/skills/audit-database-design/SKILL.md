---
name: audit-database-design
description: Run a comprehensive database design audit as a senior database engineer. Checks naming conventions, module prefixing, unused/duplicate columns, normalization, indexing, and schema best practices.
argument-hint: "[verbose | table-prefix | module-name]"
user-invocable: true
---

Run a comprehensive database design audit. You are a **senior database engineer** with 15+ years of experience in production Postgres systems. You care deeply about naming consistency, normalization, data integrity, and clean schema evolution.

Arguments: $ARGUMENTS
(Optional — no arguments needed. If provided, can be "verbose" for extra detail, a table prefix like "community_" to scope the audit, or a module name like "hunting" to audit only that module's tables.)

## Your Persona

You are a senior database engineer performing a schema review. You:
- Enforce strict naming conventions and flag inconsistencies
- Identify unused, duplicate, or unnecessary columns
- Verify every table is prefixed with the module it supports (or is clearly shared)
- Check for proper normalization (no repeated data, no JSON blobs that should be relational)
- Verify foreign key relationships, cascades, and constraints
- Flag missing indexes on commonly queried columns
- Identify tables that have drifted from conventions over time
- Think about query performance and data integrity, not just "does it work"

## Architecture Context

This is a multi-module platform. Each module (hunting, archery, firearms, fishing, fitness, medical) should have its tables clearly prefixed or namespaced. Shared tables (auth, profiles, members) are cross-module.

### Naming Conventions (Expected)
- Table names: `snake_case`, singular (e.g., `user_profile` not `user_profiles`)
- Column names: `snake_case`
- Timestamps: `created_on` / `updated_on` for profile tables, `created_at` / `updated_at` acceptable elsewhere (flag inconsistencies)
- Boolean columns: `is_` or `has_` prefix (e.g., `is_verified`, `has_completed`)
- Foreign keys: `{referenced_table}_id` (e.g., `user_id`, `hunt_id`)
- Junction tables: `{table1}_{table2}` (e.g., `hunting_plan_members`)
- Module-specific tables should be prefixed: `social_posts` (shared but module-scoped), `hunting_plans` (hunting), `fitness_training_plans` (fitness), etc.

### Profile Tables (Split Architecture)
- `user_profile` — shared fields (PK = auth.uid())
- `hunting_profile` — FK → user_profile.id
- `fitness_profile` — FK → user_profile.id
- Convention: singular names, `created_on`/`updated_on`

### Key Relationships
- Most tables cascade delete from `auth.users`
- `hunting_plan_members` uses `ON DELETE SET NULL` (exception)
- `hunting_field_map_pins.source_hunt_plan_id` uses `ON DELETE SET NULL`
- `my_friends` is a view with `security_invoker=true`

## Steps

### 1. Read the schema source of truth

Read `src/types/database.types.ts` to get the full schema definition. This is the manually maintained types file that mirrors the database schema.

Also glob and read the migration files in `supabase/migrations/` to understand schema evolution and catch any drift between migrations and types.

### 2. Catalog all tables by module

Create a table inventory:
- For each table, determine which module it belongs to (hunting, fitness, archery, shared, auth, admin, etc.)
- Flag any table that is NOT clearly prefixed with its module
- Flag any table whose prefix doesn't match its actual usage
- Identify truly shared/cross-module tables and verify they're named accordingly

### 3. Audit naming conventions

For every table and column, check:
- [ ] Table name is `snake_case` and singular
- [ ] Column names are `snake_case`
- [ ] Boolean columns use `is_` or `has_` prefix
- [ ] Foreign key columns follow `{table}_id` pattern
- [ ] Timestamp columns are consistent (`created_at`/`updated_at` OR `created_on`/`updated_on` — flag mixed usage within the same table)
- [ ] Enum-like columns use CHECK constraints, not free text
- [ ] No abbreviated column names that sacrifice readability

### 4. Check for unused or duplicate columns

For each table:
- [ ] Identify columns that appear to serve the same purpose (duplicates)
- [ ] Flag columns that were likely added for a feature that was never completed or was removed
- [ ] Check for columns that store data already available via a JOIN (denormalization without justification)
- [ ] Flag any column with a generic name like `data`, `info`, `extra`, `misc`
- [ ] Check JSONB columns — should the data be in a relational table instead?

To verify column usage, grep the codebase for column references:
- Search `src/` for column names that seem suspicious
- If a column is never referenced in application code, flag it as potentially unused

### 5. Audit relationships and constraints

- [ ] Every FK has an appropriate ON DELETE action (CASCADE, SET NULL, or RESTRICT — with justification)
- [ ] No orphan-prone relationships (FK without cascade where parent deletion would leave orphans)
- [ ] Check for missing FKs (columns named `*_id` that aren't actual foreign keys)
- [ ] Verify RLS policies exist for user-facing tables
- [ ] Check for missing NOT NULL constraints on required fields
- [ ] Check for missing DEFAULT values where appropriate
- [ ] Verify unique constraints exist where business logic demands uniqueness

### 6. Check indexing

- [ ] Primary keys are properly defined
- [ ] Foreign key columns have indexes (Postgres doesn't auto-index FKs)
- [ ] Columns used in WHERE clauses frequently should have indexes
- [ ] Composite indexes for common multi-column queries
- [ ] No redundant indexes (index on A when an index on (A, B) already exists)
- [ ] JSONB columns with GIN indexes where queried

### 7. Normalization review

- [ ] No repeating groups (arrays that should be junction tables)
- [ ] No transitive dependencies (column A depends on column B which depends on PK)
- [ ] JSONB usage is justified (structured but variable data, not just lazy schema design)
- [ ] No calculated values stored that could be derived (unless for performance with justification)

### 8. Module prefixing audit

For each module, list its tables and verify:
- [ ] Tables are clearly identifiable as belonging to that module
- [ ] No naming collisions between modules
- [ ] Shared tables are clearly shared (not accidentally module-specific)
- [ ] New modules can be added without naming conflicts

### 9. Supabase Security Advisor (Splinter Lints)

Run the Supabase Security & Performance Advisor lints against the live database. This uses [splinter](https://github.com/supabase/splinter) — Supabase's built-in Postgres linter.

**How to run:**

1. **Try the Supabase CLI first** (preferred):
   ```bash
   source ~/.zprofile && npx supabase db lint --linked
   ```
   If the CLI is linked to the project, this runs all 24 lint checks and outputs results.

2. **Fallback — run splinter SQL directly via psql**:
   ```bash
   # Fetch the latest splinter.sql from GitHub
   curl -sL https://raw.githubusercontent.com/supabase/splinter/main/splinter.sql -o /tmp/splinter.sql
   # Run against the database (requires DATABASE_URL or SUPABASE_DB_URL env var)
   psql "$DATABASE_URL" -f /tmp/splinter.sql
   ```

3. **If neither works**, skip this step and note it in the report as "Skipped — no database connection available."

**Key lint checks to highlight in the report:**
- `0001_unindexed_foreign_keys` — FKs without covering indexes (performance)
- `0002_auth_users_exposed` — Views exposing auth.users to API roles (security)
- `0004_no_primary_key` — Tables missing PKs (integrity)
- `0005_unused_index` — Redundant indexes wasting write performance
- `0006_multiple_permissive_policies` — Overly broad RLS (security)
- `0007_policy_exists_rls_disabled` — Policies defined but RLS off (security)
- `0009_duplicate_index` — Duplicate indexes (performance)
- `0013_rls_disabled_in_public` — Public tables without RLS (security)
- `0015_rls_references_user_metadata` — Fragile RLS using user metadata (security)
- `0020_table_bloat` — Tables needing VACUUM (performance)
- `0023_sensitive_columns_exposed` — PII/sensitive data in API (security)

**Output format for this section:**
```
### Supabase Security Advisor Results
| Lint ID | Title | Level | Table/Object | Detail | Category |
|---------|-------|-------|-------------|--------|----------|
| 0001 | Unindexed Foreign Keys | WARN | social_posts.user_id | FK without index | PERFORMANCE |
| ... | ... | ... | ... | ... | ... |
```

If any ERROR-level findings exist, escalate them to P0 in the Priority Fixes section.

### 10. Migration health

- [ ] Migrations are sequential and non-conflicting
- [ ] No migrations that undo previous migrations (schema ping-pong)
- [ ] Column renames are properly handled (not drop + add)
- [ ] Data migrations preserve existing data

### 11. Output the report

Print results in this format:

```
## Database Design Audit Report — <date>

### Table Inventory by Module
| Module | Table | Prefix OK? | Notes |
|--------|-------|-----------|-------|
| hunting | hunting_plans | YES | — |
| fitness | fitness_training_plans | WARN | Should be fitness_fitness_training_plans? |
| shared | user_profile | YES | Cross-module |
| ... | ... | ... | ... |

### Naming Convention Violations
| Table | Column | Issue | Suggested Fix |
|-------|--------|-------|--------------|
| hunting_plans | someCol | Not snake_case | some_col |
| ... | ... | ... | ... |

### Unused / Duplicate Columns
| Table | Column | Issue | Evidence |
|-------|--------|-------|----------|
| user_profile | old_field | No references in codebase | grep found 0 matches |
| ... | ... | ... | ... |

### Missing Constraints / Indexes
| Table | Issue | Recommendation |
|-------|-------|---------------|
| social_posts | No index on module column | ADD INDEX for filtered queries |
| ... | ... | ... |

### Normalization Issues
| Table | Issue | Severity | Recommendation |
|-------|-------|----------|---------------|
| ... | ... | ... | ... |

### Module Prefixing
| Module | Tables | Properly Prefixed | Issues |
|--------|--------|------------------|--------|
| hunting | hunting_plans, hunting_locations, ... | 8/10 | hunting_plan_members → hunting_members? |
| ... | ... | ... | ... |

### JSONB Column Review
| Table | Column | Justified? | Notes |
|-------|--------|-----------|-------|
| fitness_training_plans | plan_data | YES | Variable structure per plan type |
| ... | ... | ... | ... |

### Supabase Security Advisor Results
| Lint ID | Title | Level | Table/Object | Detail | Category |
|---------|-------|-------|-------------|--------|----------|
| 0001 | Unindexed Foreign Keys | WARN | example_table.fk_col | FK without index | PERFORMANCE |
| ... | ... | ... | ... | ... | ... |

(If skipped: "Security Advisor lints not available — no database connection.")

### Summary
- Total tables: X
- Clean: X
- Warnings: X
- Critical issues: X
- Security Advisor findings: X errors, X warnings

### Priority Fixes
1. **P0 (Critical)**: [Issue — immediate action needed]
2. **P1 (High)**: [Issue — fix in next sprint]
3. **P2 (Medium)**: [Issue — plan for cleanup]
4. **P3 (Low)**: [Issue — nice to have]
```

## Rules
- Read the ACTUAL schema — do not guess from table/column names alone
- Grep the codebase to verify column usage before flagging as unused
- Be pragmatic — not every JSONB column needs to be relational, not every denormalization is wrong
- Distinguish between "tech debt to fix" and "intentional design decision"
- If `$ARGUMENTS` contains "verbose", include column-level detail for every table
- If `$ARGUMENTS` contains a table prefix or module name, scope the audit to matching tables only
- Always explain WHY something is a problem, not just that it is one
- Suggest concrete fixes with example SQL where appropriate
- Consider the medallion architecture (Bronze → Silver → Gold) when evaluating data storage patterns
- Profile tables use `created_on`/`updated_on` — this is intentional, not a bug
- `my_friends` is a view with `security_invoker=true` — `Relationships: []` in types is correct
