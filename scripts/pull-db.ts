import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from '../src/lib/supabase.ts';

const TABLE_NAME = 'topsivi_database';
const RECORD_ID = 'default';

async function pullDb() {
  try {
    const url = `${DEFAULT_SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${RECORD_ID}&select=data`;
    const res = await fetch(url, {
      headers: {
        apikey: DEFAULT_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${DEFAULT_SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) {
      console.warn(`[Sync] Failed to fetch cloud database: ${res.statusText}`);
      return;
    }

    const rows = await res.json();
    if (rows && rows[0] && rows[0].data) {
      const db = rows[0].data;
      const jsonPath = new URL('../src/data/database.json', import.meta.url).pathname;
      await Deno.writeTextFile(jsonPath, JSON.stringify(db, null, 2) + '\n');
      console.log(`[Sync] Successfully pulled cloud database (${db.jobs?.length || 0} jobs, ${db.users?.length || 0} users) into src/data/database.json`);
    }
  } catch (err) {
    console.warn(`[Sync] Cloud fetch error (continuing with existing database.json):`, err);
  }
}

pullDb();
