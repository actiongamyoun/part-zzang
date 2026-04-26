import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jeevovnnwswldgbeyzvg.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZXZvdm5ud3N3bGRnYmV5enZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjcwNjcsImV4cCI6MjA5MjcwMzA2N30.eG7bAi1l4qTtTLmLcsuhwmU8CN-fX7GVfjlWCQktlXU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
