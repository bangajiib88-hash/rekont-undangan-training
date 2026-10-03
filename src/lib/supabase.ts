import { createClient } from '@supabase/supabase-js';

// Reads from environment variables (configured in Vercel / .env) or fallback to configured project
export const SUPABASE_URL = 
  (import.meta.env?.VITE_SUPABASE_URL as string) || 
  'https://mmrjblorrtfjmiqhodcl.supabase.co';

export const SUPABASE_ANON_KEY = 
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tcmpibG9ycnRmam1pcWhvZGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MjA0MDYsImV4cCI6MjEwNjQ5NjQwNn0.-IFzZiZrvsjvhxTjoX8yZZYIvwH1xsEQU3IPT6un0-k';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

