import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  return user.id;
}
