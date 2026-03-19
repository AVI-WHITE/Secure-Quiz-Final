ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results" ON public.results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results" ON public.results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all results" ON public.results FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);