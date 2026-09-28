-- =====================================================
-- FUNIL DE VENDAS CINE BOSS
-- Tabela que registra os eventos do funil:
--   paywall_open   -> paywall aberto (tentou assistir sem plano)
--   checkout_click -> clicou em um plano (pass/mensal/trimestral)
--   purchase       -> pagamento aprovado (gravado pelo webhook)
-- Rodar no SQL Editor do Supabase (Dashboard -> SQL Editor).
-- =====================================================

create table if not exists funnel_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  plan text,
  user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists funnel_events_event_idx on funnel_events (event, created_at);
create index if not exists funnel_events_user_idx on funnel_events (user_id);

-- RLS ativa sem politicas: apenas o backend (service role) le e grava.
-- O painel admin acessa via /api/admin/overview, nunca direto.
alter table funnel_events enable row level security;
