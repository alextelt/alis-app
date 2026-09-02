import { createClient } from '@supabase/supabase-js'

// Ces deux valeurs sont publiques (clé "anon"), c'est normal qu'elles soient dans le code
const supabaseUrl = 'https://oambezcwklyrdupjuhsd.supabase.co'
const supabaseAnonKey = 'sb_publishable_f1xI8beXcajSv5BqYduPbg_AHuILFvh'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
