import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gpoclkbziyzwqmsjmbtx.supabase.co";
const supabaseKey = "sb_publishable_QtILVcaWrsxYk2_kIFyLjw_WZ2gMNYk";

export const supabase = createClient(supabaseUrl, supabaseKey);
