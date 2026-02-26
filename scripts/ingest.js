import 'dotenv/config';
import { parse } from 'csv-parse/sync';
import db from '../server/db.js';
import { assignCategory, extractTags } from './categories.js';

const CSV_URL = process.env.CSV_URL || 'https://raw.githubusercontent.com/f/prompts.chat/main/prompts.csv';

export async function runIngest() {
    let csv;
    try {
        const res = await fetch(CSV_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        csv = await res.text();
    } catch (err) {
        throw new Error(`Failed to fetch CSV: ${err.message}`);
    }

    let rows;
    try {
        rows = parse(csv, { columns: true, skip_empty_lines: true, relax_column_count: true });
    } catch (err) {
        throw new Error(`Failed to parse CSV: ${err.message}`);
    }

    let inserted = 0;
    let skipped = 0;

    // Supabase allows bulk inserts with upsert/ignore, but we might hit duplicate errors if we just insert.
    // Instead of doing individual inserts sequentially which is slow, we can use `upsert` in Supabase with `onConflict: "act"`.
    // We only want to ignore if it already exists though, so `ignoreDuplicates: true`.

    // Prepare the payload array.
    const payload = rows.map(row => ({
        act: row.act,
        prompt: row.prompt,
        category: assignCategory(row.act),
        tags: extractTags(row.act),
        source: 'prompts.chat',
        is_favorite: 0
    }));

    // In Supabase, if we want to "insert or ignore" based on unique strictness, we use `upsert` with ignoreDuplicates.
    const { data, error } = await db.from('prompts').upsert(payload, { onConflict: 'act', ignoreDuplicates: true }).select();

    if (error) {
        throw new Error(error.message);
    }

    // The data returned usually contains inserted rows if ignoreDuplicates is true, but we could just say:
    inserted = data ? data.length : 0;
    skipped = rows.length - inserted;

    return { inserted, skipped, total: rows.length };
}

// If running as script directly:
if (process.argv[1] === import.meta.filename) {
    runIngest().then(stats => {
        console.log(`Ingest complete: ${stats.inserted} inserted, ${stats.skipped} skipped/already existing, from ${stats.total} total`);
        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(1);
    });
}
