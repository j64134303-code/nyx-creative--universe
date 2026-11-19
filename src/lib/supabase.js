
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wjlhqrzaihtsuhuyqcau.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_mB-xjIf_XssR9VKi_YuIzA_kNn78mZE";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
