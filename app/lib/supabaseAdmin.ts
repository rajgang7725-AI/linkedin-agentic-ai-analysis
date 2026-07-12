import { createClient } from '@supabase/supabase-js'

// SERVER-SIDE ONLY. Never import this file in client components.
// Uses the service_role key, which bypasses Row Level Security.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)