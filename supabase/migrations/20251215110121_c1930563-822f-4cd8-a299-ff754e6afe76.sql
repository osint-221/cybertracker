-- Table pour stocker les cyberattaques
CREATE TABLE public.cyberattacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  victim TEXT NOT NULL,
  attack_type TEXT NOT NULL,
  hacker_group TEXT,
  date DATE NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  description TEXT,
  impact TEXT,
  target_data TEXT,
  lat DECIMAL(10, 6) NOT NULL,
  lng DECIMAL(10, 6) NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les événements de timeline d'une attaque
CREATE TABLE public.attack_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attack_id UUID REFERENCES public.cyberattacks(id) ON DELETE CASCADE NOT NULL,
  event_date DATE NOT NULL,
  event_description TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('alert', 'critical', 'action', 'success', 'info')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les sources d'une attaque
CREATE TABLE public.attack_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attack_id UUID REFERENCES public.cyberattacks(id) ON DELETE CASCADE NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT,
  source_type TEXT CHECK (source_type IN ('official', 'news', 'social', 'report')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les menaces en cours (live tracking)
CREATE TABLE public.active_threats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attack_id UUID REFERENCES public.cyberattacks(id) ON DELETE SET NULL,
  threat_name TEXT NOT NULL,
  threat_level TEXT NOT NULL CHECK (threat_level IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL CHECK (status IN ('active', 'monitoring', 'resolved')),
  last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.cyberattacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attack_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attack_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_threats ENABLE ROW LEVEL SECURITY;

-- Public read access policies (données publiques pour visualisation)
CREATE POLICY "Public read access for cyberattacks"
  ON public.cyberattacks FOR SELECT
  USING (true);

CREATE POLICY "Public read access for attack_events"
  ON public.attack_events FOR SELECT
  USING (true);

CREATE POLICY "Public read access for attack_sources"
  ON public.attack_sources FOR SELECT
  USING (true);

CREATE POLICY "Public read access for active_threats"
  ON public.active_threats FOR SELECT
  USING (true);

-- Enable realtime for active_threats
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_threats;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_cyberattacks_updated_at
  BEFORE UPDATE ON public.cyberattacks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();