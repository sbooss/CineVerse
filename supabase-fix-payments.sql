-- ============================================
-- CINE BOSS - Correcao do fluxo de pagamentos
-- RODE ESTE ARQUIVO UMA VEZ no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dofzztjpqedsaazbvzfg/sql/new
-- ============================================

-- 1) Permitir o plano diario (Pass 24 Horas) nas assinaturas
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
    CHECK (plan IN ('daily', 'monthly', 'quarterly'));

-- 2) Colunas de dispositivo nas sessoes (o painel mostra navegador/IP)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_name TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_os TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_browser TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Pronto. Nada mais precisa ser feito aqui.
