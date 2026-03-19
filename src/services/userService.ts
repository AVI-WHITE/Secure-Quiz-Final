import { supabase } from "@/integrations/supabase/client";

export interface UserData {
  id: string;
  user_id: string;
  name: string;
  email: string;
  photo_url: string;
  role: string | null;
}

export const updateUserRole = async (userId: string, role: "admin" | "participant") => {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("user_id", userId);
  if (error) throw error;
};
