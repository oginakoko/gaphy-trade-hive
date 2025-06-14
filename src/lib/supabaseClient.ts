
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iqrqdtjupeoyriptfgiw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxcnFkdGp1cGVveXJpcHRmZ2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyODM3MjIsImV4cCI6MjA2NDg1OTcyMn0.O_tPfqnA3N-0u29jyMkfFT4tGk3CmVfc_BLwMEyEg_U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
