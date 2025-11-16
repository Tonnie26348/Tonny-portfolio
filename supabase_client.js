import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkqqdntirbseovqctmrg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXFkbnRpcmJzZW92cWN0bXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNDQ0MjcsImV4cCI6MjA3ODgyMDQ0N30.0TzvcSsu_gTqKpUjd2cLPLgn8-uUEIAyefStlRcuuQQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);