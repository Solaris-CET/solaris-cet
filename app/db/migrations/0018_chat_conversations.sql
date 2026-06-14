-- Migration 0018: Add chat_conversations and chat_analytics tables

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  messages JSONB NOT NULL DEFAULT '[]',
  user_ip TEXT,
  first_message TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_conversations_session_id_idx ON chat_conversations (session_id);
CREATE INDEX IF NOT EXISTS chat_conversations_created_at_idx ON chat_conversations (created_at);
CREATE INDEX IF NOT EXISTS chat_conversations_resolved_idx ON chat_conversations (resolved);

CREATE TABLE IF NOT EXISTS chat_analytics (
  date TEXT PRIMARY KEY,
  total_conversations INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  avg_messages_per_conv INTEGER NOT NULL DEFAULT 0,
  top_topics JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS chat_analytics_date_idx ON chat_analytics (date);

-- Add leads table if not exists
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  service_type TEXT NOT NULL,
  power_needed TEXT,
  roof_type TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'nou',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
