import { supabaseClient } from "@/supabase-client";
import toast from "react-hot-toast";

export async function getUserPlan(userId: string) {
  try {
    const subscriptionResponse = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .lte('valid_from', new Date().toISOString())
      .gte('valid_until', new Date().toISOString());

    if (subscriptionResponse.error) {
      localStorage.setItem("currentPlan", JSON.stringify({ plan_type: "free", valid_from: null, valid_until: null }));
    }
    if (subscriptionResponse.data === null || subscriptionResponse.data.length === 0) {
      localStorage.setItem("currentPlan", JSON.stringify({ plan_type: "free", valid_from: null, valid_until: null }));
    } else {
      localStorage.setItem("currentPlan", JSON.stringify(subscriptionResponse.data[0]));
    }
  } catch (error) {
    toast.error('Failed to get user subscription plan');
  }
}
