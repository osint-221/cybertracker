
-- Create table for Twitter/X posts linked to attacks
CREATE TABLE public.attack_twitter_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attack_id UUID NOT NULL REFERENCES public.cyberattacks(id) ON DELETE CASCADE,
  post_url TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT,
  post_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attack_twitter_posts ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read access for attack_twitter_posts"
ON public.attack_twitter_posts FOR SELECT USING (true);

-- Admin write
CREATE POLICY "Admins can insert attack_twitter_posts"
ON public.attack_twitter_posts FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update attack_twitter_posts"
ON public.attack_twitter_posts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete attack_twitter_posts"
ON public.attack_twitter_posts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
