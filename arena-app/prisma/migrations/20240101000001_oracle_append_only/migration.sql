-- Migration: oracle_append_only
-- Enforces append-only on oracle_results via two independent mechanisms:
--   1. arena_app DB role has only SELECT + INSERT (no UPDATE/DELETE)
--   2. BEFORE trigger raises EXCEPTION on any UPDATE/DELETE (catches superusers too)

-- Step 1: Create restricted application role
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'arena_app') THEN
    CREATE ROLE arena_app WITH LOGIN PASSWORD 'change_in_production';
  END IF;
END
$$;

-- Step 2: Grant full access on all tables
GRANT USAGE ON SCHEMA public TO arena_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO arena_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO arena_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO arena_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO arena_app;

-- Step 3: Restrict oracle_results to SELECT + INSERT only
REVOKE UPDATE, DELETE ON oracle_results FROM arena_app;

-- Step 4: Trigger function — fires for ALL roles including superuser
CREATE OR REPLACE FUNCTION prevent_oracle_results_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'oracle_results is append-only: UPDATE and DELETE are forbidden. hash=%, idempotencyKey=%',
    OLD.hash, OLD."idempotencyKey";
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Attach trigger
DROP TRIGGER IF EXISTS trg_oracle_results_append_only ON oracle_results;
CREATE TRIGGER trg_oracle_results_append_only
  BEFORE UPDATE OR DELETE ON oracle_results
  FOR EACH ROW EXECUTE FUNCTION prevent_oracle_results_mutation();
