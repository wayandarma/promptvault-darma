import { Router } from 'express';
import { runIngest } from '../../scripts/ingest.js';

const router = Router();

router.post('/', async (req, res) => {
    try {
        const stats = await runIngest();
        res.json({ message: 'Ingest complete', ...stats });
    } catch (err) {
        res.status(500).json({ error: 'Ingest failed', details: err.message });
    }
});

export default router;
