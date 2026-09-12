import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://irsmjpvyajpabdaekglx.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlyc21qcHZ5YWpwYWJkYWVrZ2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODk2NzYsImV4cCI6MjEwMzg2NTY3Nn0.ZWBS3zYiM_EmcP6sSPyrH-aAYW3_ffcYYdJU83EVx_s'
  );
}
