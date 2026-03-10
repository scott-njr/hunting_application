-- Migration: Create module-specific AI query increment RPC
-- Part of the migration from global tier to module-specific tier system.
-- AI quota tracking moves from members.ai_queries_this_month to module_subscriptions.ai_queries_this_month.

CREATE OR REPLACE FUNCTION increment_module_ai_queries(
  user_id_param uuid,
  module_slug_param text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE module_subscriptions
  SET ai_queries_this_month = ai_queries_this_month + 1
  WHERE user_id = user_id_param
    AND module_slug = module_slug_param
    AND status = 'active'
  RETURNING ai_queries_this_month INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;

-- Legacy columns (members.ai_queries_this_month, members.membership_tier)
-- were removed in 0043_remove_legacy_member_columns.sql.
