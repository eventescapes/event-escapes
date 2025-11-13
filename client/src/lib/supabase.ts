export const SUPABASE_URL = 'https://jxrrhsqffnzeljszbecg.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cnJoc3FmZm56ZWxqc3piZWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcxMzczMzMsImV4cCI6MjA0MjcxMzMzM30.xLj5l7LBLr0YD-hMuOVLfbWPxJ4RFvh9YlFgdcD_naE';

export function getSupabaseFunctionUrl(functionName: string): string {
  return `${SUPABASE_URL}/functions/v1/${functionName}`;
}
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  throw new Error('Supabase configuration missing')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const isSupabaseConfigured = true

// For backwards compatibility with existing components
export const ensureSupabaseInit = async () => {
  return { 
    supabase, 
    isSupabaseConfigured: true 
  }
}

console.log('✅ Supabase client initialized')