import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Usamos las credenciales que pasaste
const supabaseUrl = 'https://qwedwwtvhrfvrsatwycm.supabase.co'
const supabaseKey = 'sb_publishable_pCHoQkg2BLWzgNU6QmjlTA_rtVDSX7j'

export const supabase = createClient(supabaseUrl, supabaseKey)