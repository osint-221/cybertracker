-- Add CVE field to cyberattacks table
ALTER TABLE public.cyberattacks 
ADD COLUMN IF NOT EXISTS cve TEXT;

-- Add RLS policy for CVE field (public read access)
DROP POLICY IF EXISTS "Public read access for cyberattacks" ON public.cyberattacks;
CREATE POLICY "Public read access for cyberattacks"
  ON public.cyberattacks FOR SELECT
  USING (true);

-- Add admin write policies for CVE
CREATE POLICY "Admins can update cyberattacks CVE"
ON public.cyberattacks
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
