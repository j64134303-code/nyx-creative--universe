import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  "https://wjlhqrzaihtsuhuyqcau.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable__cbyLAN0G1m0JbC_uGg5tw_zabom7HQ";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
