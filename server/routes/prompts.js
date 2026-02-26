import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;
    const { search, category, tags, favorites } = req.query;

    let query = db.from('prompts').select('*', { count: 'exact' });

    if (search) {
        query = query.or(`act.ilike.%${search}%,prompt.ilike.%${search}%`);
    }

    if (category) {
        query = query.eq('category', category);
    }

    if (tags) {
        const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
        if (tagList.length) {
            const orConditions = tagList.map(tag => `tags.ilike.%${tag}%`).join(',');
            query = query.or(orConditions);
        }
    }

    if (favorites === '1') {
        query = query.eq('is_favorite', 1);
    }

    query = query.order('id', { ascending: true }).range(offset, offset + limit - 1);

    const { data: prompts, count: total, error } = await query;

    if (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }

    res.json({ prompts, total });
});

router.get('/categories', async (req, res) => {
    const { data, error } = await db.from('prompts').select('category');
    if (error) {
        return res.status(500).json({ error: error.message });
    }

    const countMap = {};
    for (const item of data) {
        const cat = item.category || 'Uncategorized';
        countMap[cat] = (countMap[cat] || 0) + 1;
    }

    const categories = Object.keys(countMap).map(name => ({ name, count: countMap[name] }))
        .sort((a, b) => b.count - a.count);

    res.json({ categories });
});

router.get('/tags', async (req, res) => {
    const { data, error } = await db.from('prompts').select('tags');
    if (error) {
        return res.status(500).json({ error: error.message });
    }

    const countMap = {};
    for (const item of data) {
        if (!item.tags) continue;
        const tagList = item.tags.split(',').map(t => t.trim()).filter(Boolean);
        for (const tag of tagList) {
            countMap[tag] = (countMap[tag] || 0) + 1;
        }
    }

    const tags = Object.keys(countMap).map(name => ({ name, count: countMap[name] }))
        .sort((a, b) => b.count - a.count);

    res.json({ tags });
});

router.post('/', async (req, res) => {
    const { act, prompt, category, tags } = req.body;

    if (!act || typeof act !== 'string' || !prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'act and prompt are required' });
    }

    const { data: row, error } = await db.from('prompts').insert({
        act,
        prompt,
        category: category || 'Uncategorized',
        tags: tags || '',
        source: 'custom',
        is_favorite: 0
    }).select().single();

    if (error) {
        if (error.code === '23505') { // Postgres unique constraint violation
            return res.status(409).json({ error: 'Prompt with this title already exists' });
        }
        return res.status(500).json({ error: error.message });
    }

    res.json(row);
});

router.patch('/:id/favorite', async (req, res) => {
    const { id } = req.params;

    const { data: current, error: getError } = await db.from('prompts').select('is_favorite').eq('id', id).single();

    if (getError || !current) {
        return res.status(404).json({ error: 'Prompt not found' });
    }

    const newValue = current.is_favorite ? 0 : 1;

    const { data: updated, error } = await db.from('prompts')
        .update({ is_favorite: newValue })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ id: updated.id, is_favorite: updated.is_favorite });
});

export default router;
