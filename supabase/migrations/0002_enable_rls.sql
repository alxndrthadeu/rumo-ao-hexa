-- Habilita RLS nas duas tabelas.
-- Nenhuma policy para anon/authenticated: acesso direto com anon key é negado.
-- O servidor usa service_role, que bypassa RLS automaticamente.
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_states ENABLE ROW LEVEL SECURITY;
