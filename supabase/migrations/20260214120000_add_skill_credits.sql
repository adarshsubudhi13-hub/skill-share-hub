
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS skill_credits INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_credits(target_user_id UUID, amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET skill_credits = COALESCE(skill_credits, 0) + amount
  WHERE user_id = target_user_id;
END;
$$;
