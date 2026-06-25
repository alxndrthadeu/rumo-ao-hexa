-- completed_runs: registro permanente de runs finalizadas (game over ou vitória).
-- O estado da run ativa fica apenas no localStorage do cliente.
-- Apenas ao encerrar (morte ou vitória) o estado final é persistido aqui.

CREATE TABLE completed_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  state       JSONB NOT NULL,
  CONSTRAINT completed_runs_session_unique UNIQUE (session_id)
);

CREATE INDEX idx_completed_runs_session ON completed_runs(session_id);

ALTER TABLE public.completed_runs ENABLE ROW LEVEL SECURITY;

-- Remove tabelas da arquitetura anterior (estado não é mais persistido durante o jogo)
DROP TABLE IF EXISTS run_states;
DROP TABLE IF EXISTS sessions;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
