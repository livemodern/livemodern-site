-- 2026-07-24_mila_conversations.sql
-- Full-transcript capture for consumer MiLa (and future agent-facing captures).
-- One row per chat session, upserted each turn. Powers the mlg-admin review UI:
-- read transcripts, filter to flagged/refused/problem chats, analyze accuracy.
--
-- Stored deliberately: the whole conversation (user + MiLa, every turn), the
-- tools she called, the listings she surfaced, and the security flags we already
-- compute (injection_suspected / output_scrubbed). This is separate from the
-- security-minimal site_events 'mila_turn' rows — this table is the human-review
-- record and intentionally DOES keep message bodies.

create table if not exists public.mila_conversations (
  id            uuid primary key default gen_random_uuid(),
  session_id    text not null,
  site_slug     text not null default 'livemodern',
  surface       text not null default 'consumer',   -- consumer | agent (future)

  -- The full transcript: [{ role: 'user'|'assistant', content: text, at: iso }]
  transcript    jsonb not null default '[]'::jsonb,

  -- Rollups for list/filter without parsing the transcript every time.
  message_count int  not null default 0,
  tools_used    text[] not null default '{}',        -- distinct tool names across the chat
  listings_shown text[] not null default '{}',        -- mls ids MiLa surfaced
  flags         text[] not null default '{}',         -- injection_suspected, output_scrubbed, rate_limited, max_rounds
  known_visitor boolean not null default false,       -- was this a signed-in session
  lead_captured boolean not null default false,       -- did capture_lead fire

  -- Light client context (no PII beyond what a visitor typed, which lives in the
  -- transcript itself). user_agent/referrer help spot bots.
  user_agent    text,
  referrer      text,

  started_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- One conversation row per (session_id, site_slug) — upsert target.
create unique index if not exists mila_conversations_session_uq
  on public.mila_conversations (session_id, site_slug);

-- Common review filters.
create index if not exists mila_conversations_site_updated_idx
  on public.mila_conversations (site_slug, updated_at desc);
create index if not exists mila_conversations_flags_idx
  on public.mila_conversations using gin (flags);

comment on table public.mila_conversations is
  'Full MiLa chat transcripts for human review + accuracy analysis. Upserted per turn keyed on (session_id, site_slug).';
