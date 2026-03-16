
CREATE TABLE public.incident_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation TEXT NOT NULL,
  incident_date DATE NOT NULL,
  attack_type TEXT NOT NULL,
  description TEXT NOT NULL,
  source_url TEXT,
  reporter_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a report (no auth required)
CREATE POLICY "Anyone can insert incident reports"
ON public.incident_reports
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read/update/delete reports
CREATE POLICY "Admins can read incident reports"
ON public.incident_reports
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update incident reports"
ON public.incident_reports
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete incident reports"
ON public.incident_reports
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
