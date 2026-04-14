-- Antigravity Roulette Platform - Database Migration
-- Run this in Supabase SQL Editor when ready to connect

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roulettes table
CREATE TABLE IF NOT EXISTS roulettes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Nueva Ruleta',
  code_6d VARCHAR(6) NOT NULL UNIQUE,
  colors JSONB DEFAULT '["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F"]',
  logo_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  form_config JSONB DEFAULT '{"fields":[{"key":"name","label":"Nombre","type":"text","required":true,"order":0},{"key":"email","label":"Email","type":"email","required":true,"order":1}]}',
  email_template JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items / prizes
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  roulette_id UUID REFERENCES roulettes(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Premio',
  emoji TEXT DEFAULT '🎁',
  image_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (one per roulette)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  roulette_id UUID REFERENCES roulettes(id) ON DELETE CASCADE UNIQUE,
  status TEXT DEFAULT 'libre' CHECK (status IN ('libre', 'ocupado', 'girando')),
  current_participant_id UUID DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  roulette_id UUID REFERENCES roulettes(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Results
CREATE TABLE IF NOT EXISTS results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  roulette_id UUID REFERENCES roulettes(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  item_won TEXT NOT NULL,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_roulette ON items(roulette_id);
CREATE INDEX IF NOT EXISTS idx_sessions_roulette ON sessions(roulette_id);
CREATE INDEX IF NOT EXISTS idx_participants_roulette ON participants(roulette_id);
CREATE INDEX IF NOT EXISTS idx_results_roulette ON results(roulette_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE results;
