-- Brainy Cognitive Training Platform Schema
-- This schema supports the Thinking Fingerprint and cognitive training system

-- Core Thinking Fingerprint table
CREATE TABLE IF NOT EXISTS thinking_fingerprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Cognitive dimensions (JSON fields for complex data)
  concept_mastery JSONB NOT NULL DEFAULT '[]',
  misconception_patterns JSONB NOT NULL DEFAULT '[]',
  confidence_accuracy_mismatch JSONB NOT NULL DEFAULT '[]',
  reasoning_depth JSONB NOT NULL DEFAULT '{}',
  hint_dependency JSONB NOT NULL DEFAULT '{}',
  response_latency JSONB NOT NULL DEFAULT '{}',
  cognitive_entry_points JSONB NOT NULL DEFAULT '{}',
  
  -- Meta-cognitive tracking
  thinking_growth_trajectory JSONB NOT NULL DEFAULT '{}',
  cognitive_weaknesses JSONB NOT NULL DEFAULT '[]',
  cognitive_strengths JSONB NOT NULL DEFAULT '[]',
  
  -- Behavioral patterns
  avoidance_behaviors JSONB NOT NULL DEFAULT '[]',
  persistence_patterns JSONB NOT NULL DEFAULT '[]',
  metacognitive_awareness JSONB NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Interactions table for tracking cognitive responses
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID NOT NULL,
  problem_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('learn', 'practice', 'reflect', 'review')),
  
  -- Response data
  response TEXT NOT NULL,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  time_to_response INTEGER, -- in seconds
  hints_used INTEGER DEFAULT 0,
  correctness DECIMAL(3,2) CHECK (correctness >= 0 AND correctness <= 1),
  reasoning_depth INTEGER CHECK (reasoning_depth >= 1 AND reasoning_depth <= 5),
  
  -- Cognitive context
  thinking_gates_passed JSONB NOT NULL DEFAULT '[]',
  thinking_gates_failed JSONB NOT NULL DEFAULT '[]',
  constraints_applied JSONB NOT NULL DEFAULT '[]',
  friction_level INTEGER CHECK (friction_level >= 1 AND friction_level <= 5),
  
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cognitive Sessions table
CREATE TABLE IF NOT EXISTS cognitive_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('learn', 'practice', 'reflect', 'review')),
  domain TEXT NOT NULL,
  
  -- Session metrics
  problems_attempted INTEGER DEFAULT 0,
  hints_requested INTEGER DEFAULT 0,
  average_response_time DECIMAL(8,2),
  average_reasoning_depth DECIMAL(3,2),
  average_confidence DECIMAL(5,2),
  
  -- Growth tracking
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  cognitive_growth_score DECIMAL(5,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Constraints table
CREATE TABLE IF NOT EXISTS ai_constraints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  constraint_type TEXT NOT NULL CHECK (constraint_type IN (
    'answer_refusal', 'socratic_questioning', 'hint_delay', 
    'explanation_requirement', 'confidence_challenge'
  )),
  
  trigger_condition TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  
  -- Effectiveness tracking
  times_applied INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2), -- 0-1 scale
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cognitive Metrics table for tracking optimization goals
CREATE TABLE IF NOT EXISTS cognitive_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  
  -- Primary metrics (what we optimize for)
  hint_dependency_reduction DECIMAL(5,2),
  reasoning_depth_increase DECIMAL(5,2),
  skill_transfer_rate DECIMAL(5,2),
  articulation_quality DECIMAL(5,2),
  long_term_growth DECIMAL(5,2),
  
  -- Secondary metrics (what we track but don't optimize)
  engagement_time INTEGER, -- minutes
  problem_solving_speed DECIMAL(8,2), -- seconds
  accuracy_rate DECIMAL(5,2),
  session_frequency INTEGER,
  
  -- Anti-metrics (what we actively avoid optimizing)
  answer_speed DECIMAL(8,2), -- We don't track this
  convenience_score DECIMAL(5,2), -- We actively avoid convenience
  satisfaction_rating DECIMAL(5,2), -- We don't optimize for satisfaction
  user_retention DECIMAL(5,2), -- We don't optimize retention at expense of learning
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thinking Gates Usage table
CREATE TABLE IF NOT EXISTS thinking_gates_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gate_type TEXT NOT NULL,
  gate_id TEXT NOT NULL,
  
  -- Usage metrics
  times_presented INTEGER DEFAULT 0,
  times_passed INTEGER DEFAULT 0,
  times_failed INTEGER DEFAULT 0,
  average_time_to_pass INTEGER, -- seconds
  
  -- Learning metrics
  improvement_rate DECIMAL(5,2),
  frustration_level DECIMAL(3,2), -- 0-1 scale
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Concept Mastery tracking
CREATE TABLE IF NOT EXISTS concept_mastery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  concept TEXT NOT NULL,
  
  mastery_level INTEGER CHECK (mastery_level >= 0 AND mastery_level <= 100),
  last_assessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assessment_count INTEGER DEFAULT 1,
  improvement_trajectory DECIMAL(5,2),
  transfer_ability INTEGER CHECK (transfer_ability >= 0 AND transfer_ability <= 100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, domain, concept)
);

-- Misconception Patterns tracking
CREATE TABLE IF NOT EXISTS misconception_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'overgeneralization', 'false_analogy', 'procedural_error', 
    'conceptual_gap', 'misapplied_rule'
  )),
  
  domains TEXT[] NOT NULL DEFAULT '{}',
  frequency INTEGER DEFAULT 1,
  persistence DECIMAL(3,2) CHECK (persistence >= 0 AND persistence <= 1),
  last_occurrence TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  correction_attempts INTEGER DEFAULT 0,
  effectiveness_of_corrections DECIMAL(3,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_thinking_fingerprints_user_id ON thinking_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_session_id ON user_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON user_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_cognitive_sessions_user_id ON cognitive_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_constraints_user_id ON ai_constraints(user_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_metrics_user_date ON cognitive_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_user_domain ON concept_mastery(user_id, domain);
CREATE INDEX IF NOT EXISTS idx_misconception_patterns_user ON misconception_patterns(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE thinking_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE thinking_gates_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE misconception_patterns ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own thinking fingerprint" ON thinking_fingerprints
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own thinking fingerprint" ON thinking_fingerprints
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own thinking fingerprint" ON thinking_fingerprints
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own interactions" ON user_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions" ON user_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON cognitive_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON cognitive_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own constraints" ON ai_constraints
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own constraints" ON ai_constraints
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own metrics" ON cognitive_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own gates usage" ON thinking_gates_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own concept mastery" ON concept_mastery
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own concept mastery" ON concept_mastery
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own concept mastery" ON concept_mastery
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own misconception patterns" ON misconception_patterns
  FOR SELECT USING (auth.uid() = user_id);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_thinking_fingerprints_updated_at 
  BEFORE UPDATE ON thinking_fingerprints 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_constraints_updated_at 
  BEFORE UPDATE ON ai_constraints 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_thinking_gates_usage_updated_at 
  BEFORE UPDATE ON thinking_gates_usage 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_concept_mastery_updated_at 
  BEFORE UPDATE ON concept_mastery 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_misconception_patterns_updated_at 
  BEFORE UPDATE ON misconception_patterns 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create or get thinking fingerprint
CREATE OR REPLACE FUNCTION get_or_create_thinking_fingerprint(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  fingerprint_id UUID;
BEGIN
  -- Try to get existing fingerprint
  SELECT id INTO fingerprint_id 
  FROM thinking_fingerprints 
  WHERE user_id = p_user_id;
  
  -- If none exists, create one
  IF fingerprint_id IS NULL THEN
    INSERT INTO thinking_fingerprints (user_id)
    VALUES (p_user_id)
    RETURNING id INTO fingerprint_id;
  END IF;
  
  RETURN fingerprint_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate cognitive metrics
CREATE OR REPLACE FUNCTION calculate_daily_cognitive_metrics(p_user_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO cognitive_metrics (user_id, date, hint_dependency_reduction, reasoning_depth_increase)
  SELECT 
    p_user_id,
    p_date,
    -- Calculate hint dependency reduction (inverse of hint request frequency)
    CASE 
      WHEN AVG(ui.hints_used) > 0 THEN (1 - AVG(ui.hints_used)) * 100
      ELSE 100
    END,
    -- Calculate reasoning depth increase
    AVG(ui.reasoning_depth) * 20
  FROM user_interactions ui
  WHERE ui.user_id = p_user_id 
    AND DATE(ui.timestamp) = p_date
  GROUP BY ui.user_id
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    hint_dependency_reduction = EXCLUDED.hint_dependency_reduction,
    reasoning_depth_increase = EXCLUDED.reasoning_depth_increase,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
