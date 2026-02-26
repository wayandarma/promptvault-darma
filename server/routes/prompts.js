import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;
    const { search, category, tags, favorites } = req.query;

    if (search) {
        let prompts;
        let total;
        try {
            prompts = db.prepare(`
        SELECT p.* FROM prompts_fts fts
        JOIN prompts p ON p.id = fts.rowid
        WHERE prompts_fts MATCH ?
        ORDER BY rank
        LIMIT ? OFFSET ?
      `).all(search + '*', limit, offset);

            total = db.prepare(`
        SELECT COUNT(*) as count FROM prompts_fts fts
        JOIN prompts p ON p.id = fts.rowid
        WHERE prompts_fts MATCH ?
      `).get(search + '*').count;
        } catch {
            // FTS5 unavailable — LIKE fallback
            const like = `%${search}%`;
            prompts = db.prepare(`
        SELECT * FROM prompts
        WHERE act LIKE ? OR prompt LIKE ?
        LIMIT ? OFFSET ?
      `).all(like, like, limit, offset);

            total = db.prepare(`
        SELECT COUNT(*) as count FROM prompts
        WHERE act LIKE ? OR prompt LIKE ?
      `).get(like, like).count;
        }

        return res.json({ prompts, total });
    }

    const clauses = [];
    const params = [];

    if (category) {
        clauses.push('category = ?');
        params.push(category);
    }

    if (tags) {
        const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
        if (tagList.length) {
            const tagClauses = tagList.map(() => 'tags LIKE ?');
            clauses.push(`(${tagClauses.join(' OR ')})`);
            tagList.forEach(t => params.push(`%${t}%`));
        }
    }

    if (favorites === '1') {
        clauses.push('is_favorite = 1');
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const prompts = db.prepare(`SELECT * FROM prompts ${where} ORDER BY id LIMIT ? OFFSET ?`).all(...params, limit, offset);
    const total = db.prepare(`SELECT COUNT(*) as count FROM prompts ${where}`).get(...params).count;

    res.json({ prompts, total });
});

router.get('/categories', (req, res) => {
    const rows = db.prepare('SELECT category AS name, COUNT(*) AS count FROM prompts GROUP BY category ORDER BY count DESC').all();
    res.json({ categories: rows });
});

router.post('/', (req, res) => {
    const { act, prompt, category, tags } = req.body;

    if (!act || typeof act !== 'string' || !prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'act and prompt are required' });
    }

    try {
        const info = db.prepare(`
      INSERT INTO prompts (act, prompt, category, tags, source, is_favorite)
      VALUES (?, ?, ?, ?, 'custom', 0)
    `).run(act, prompt, category || 'Uncategorized', tags || '');

        const row = db.prepare('SELECT * FROM prompts WHERE id = ?').get(info.lastInsertRowid);
        res.json(row);
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'Prompt with this title already exists' });
        }
        throw err;
    }
});

router.patch('/:id/favorite', (req, res) => {
    const { id } = req.params;
    const row = db.prepare('SELECT id, is_favorite FROM prompts WHERE id = ?').get(id);

    if (!row) {
        return res.status(404).json({ error: 'Prompt not found' });
    }

    const newValue = row.is_favorite ? 0 : 1;
    db.prepare('UPDATE prompts SET is_favorite = ? WHERE id = ?').run(newValue, id);

    res.json({ id: row.id, is_favorite: newValue });
});

export default router;
