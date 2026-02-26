import 'dotenv/config';
import { parse } from 'csv-parse/sync';
import db from '../server/db.js';
import { assignCategory, extractTags } from './categories.js';

const CSV_URL = process.env.CSV_URL || 'https://raw.githubusercontent.com/f/prompts.chat/main/prompts.csv';

async function ingest() {
    let csv;
    try {
        const res = await fetch(CSV_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        csv = await res.text();
    } catch (err) {
        console.error(`Failed to fetch CSV: ${err.message}`);
        process.exit(1);
    }

    let rows;
    try {
        rows = parse(csv, { columns: true, skip_empty_lines: true, relax_column_count: true });
    } catch (err) {
        console.error(`Failed to parse CSV: ${err.message}`);
        process.exit(1);
    }

    const insert = db.prepare(`
    INSERT OR IGNORE INTO prompts (act, prompt, category, tags, source)
    VALUES (?, ?, ?, ?, 'prompts.chat')
  `);

    let inserted = 0;
    let skipped = 0;

    const runAll = db.transaction((rows) => {
        for (const row of rows) {
            const category = assignCategory(row.act);
            const tags = extractTags(row.act);
            const info = insert.run(row.act, row.prompt, category, tags);
            if (info.changes > 0) inserted++;
            else skipped++;
        }
    });

    runAll(rows);

    console.log(`Ingest complete: ${inserted} inserted, ${skipped} skipped`);
}

ingest();
