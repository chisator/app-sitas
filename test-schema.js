const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_tables'); // Or maybe select from information_schema?
  // We can't access information_schema via standard supabase-js client directly without RPC.
  // Instead, let's fetch all records from `assigned_routines`, `user_routines`, `routines`, `workouts` and see which contain data.
  const tables = ['routines', 'workouts', 'user_routines', 'athlete_routines', 'plans'];
  for (const t of tables) {
    const { data } = await supabase.from(t).select('*').limit(1).catch(() => ({}));
    if (data) {
      console.log(`Table ${t} exists. Data length:`, data.length, 'Keys:', data.length > 0 ? Object.keys(data[0]) : 'no cols or empty');
    }
  }
}
check();
