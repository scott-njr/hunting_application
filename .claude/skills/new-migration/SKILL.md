---
name: new-migration
description: Scaffold a new Supabase migration file with correct numbering and boilerplate.
argument-hint: "<snake_case_description>"
---

Scaffold a new Supabase migration file for this project.

Arguments: $ARGUMENTS
(Expected format: a short snake_case description — e.g., `add_scout_reports_table` or `alter_hunting_plans_add_safety_share`)

## Your Task

Create the next numbered Supabase migration file in `supabase/migrations/` with correct boilerplate matching this project's style.

## Steps

1. **Find the next number** — Glob `supabase/migrations/` to list all existing `.sql` files. Identify the highest `NNNN` prefix (e.g., if `0004_phase1_additions.sql` exists, the next is `0005`).

2. **Read the style reference** — Read `supabase/migrations/0003_hunt_tables.sql` for the exact comment style, RLS pattern, and trigger pattern used in this project.

3. **Determine the migration type from the argument:**
   - If argument starts with `add_` or `create_` → new table
   - If argument starts with `alter_` → column addition/change
   - If argument starts with `drop_` → removal (add a safety comment)
   - Otherwise → use judgment

4. **Create the file** at `supabase/migrations/000N_<argument>.sql` with:

   **For a new table:**
   ```sql
   -- <plain English description of what this table does>

   CREATE TABLE IF NOT EXISTS public.<table_name> (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     -- TODO: add columns here
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- RLS
   ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

   -- TODO: add appropriate policies
   -- CREATE POLICY "Users manage own rows" ON public.<table_name>
   --   USING (auth.uid() = user_id)
   --   WITH CHECK (auth.uid() = user_id);

   -- Auto-update updated_at
   CREATE TRIGGER <table_name>_updated_at
     BEFORE UPDATE ON public.<table_name>
     FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
   ```

   **For an ALTER:**
   ```sql
   -- <plain English description>

   ALTER TABLE public.<table_name>
     ADD COLUMN IF NOT EXISTS <column_name> <TYPE>;
   ```

5. **Write the file** — Create it. Do not leave it empty.

6. **Remind the user** of the next step:
   ```
   Run: supabase db push
   Then regenerate types: supabase gen types typescript --linked > src/types/database.types.ts
   ```

## Style Rules (match existing migrations)
- Use `public.` prefix on all table references
- Use `IF NOT EXISTS` on CREATE TABLE and ADD COLUMN
- Use `TIMESTAMPTZ NOT NULL DEFAULT NOW()` for timestamps
- RLS policies: one for SELECT, one combined FOR ALL, or separate per operation — match the closest existing table's pattern
- Always add the `handle_updated_at` trigger if the table has `updated_at`
- Comment style: `-- ─── table_name ──────` section headers (em-dashes, matching 0003 style)
