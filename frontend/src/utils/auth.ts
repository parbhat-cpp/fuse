import { supabaseClient } from "@/supabase-client"

export const logout = async () => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('currentPlan');

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    return;
  }

  window.location.href = '/'
}
