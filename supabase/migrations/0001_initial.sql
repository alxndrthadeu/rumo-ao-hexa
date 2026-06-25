-- Sessão anônima
CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  arquetipo   TEXT NOT NULL CHECK (arquetipo IN ('estrela', 'caido', 'futuro')),
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'completed', 'abandoned'))
);

-- Estado da run: 1 row por sessão, atualizada in-place
CREATE TABLE run_states (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  partida_atual  SMALLINT NOT NULL DEFAULT 1,
  morto          BOOLEAN NOT NULL DEFAULT false,
  causa_morte    TEXT CHECK (causa_morte IN ('placar', 'barra', 'vitoria', 'expulsao', 'penaltis')),
  state          JSONB NOT NULL,
  CONSTRAINT run_states_session_unique UNIQUE (session_id)
);

CREATE INDEX idx_run_states_session ON run_states(session_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER run_states_updated_at
  BEFORE UPDATE ON run_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS desabilitado para protótipo (sessão anônima, sem auth)
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE run_states DISABLE ROW LEVEL SECURITY;
