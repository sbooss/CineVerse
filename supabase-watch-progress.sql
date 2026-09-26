-- ============================================
-- CINE BOSS - Continuar Assistindo individual por conta
-- Execute este SQL no Supabase SQL Editor
-- https://supabase.com/dashboard/project/dofzztjpqedsaazbvzfg/sql/new
-- ============================================

-- Tabela de progresso de assistimento (por usuario)
CREATE TABLE IF NOT EXISTS watch_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'movie' CHECK (media_type IN ('movie', 'tv', 'anime')),
    title TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    season INTEGER DEFAULT 1,
    episode INTEGER DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tmdb_id)
);

-- Indice para busca rapida por usuario (mais recente primeiro)
CREATE INDEX IF NOT EXISTS idx_watch_progress_user
    ON watch_progress(user_id, updated_at DESC);

-- RLS: a API usa a service key (bypass), mas policies garantem defesa extra
ALTER TABLE watch_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role gerencia watch_progress"
    ON watch_progress FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
