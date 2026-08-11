import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

const supabaseUrl: string =
  env.VITE_SUPABASE_URL || 'https://amerjacymzhmnmzulakt.supabase.co';

const supabaseAnonKey: string =
  env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZXJqYWN5bXpobW5tenVsYWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMDg2MzksImV4cCI6MjEwMTg4NDYzOX0.GmmIXLy6fzwUQT_quGKTfx_doPXn8sTXlo7mrq2-gT4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
