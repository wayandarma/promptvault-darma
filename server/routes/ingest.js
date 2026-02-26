import { Router } from 'express';
import { execFile } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execFile);
const router = Router();

router.post('/', async (req, res) => {
    try {
        const { stdout } = await exec('node', ['scripts/ingest.js']);
        res.json({ message: 'Ingest complete', stdout: stdout.trim() });
    } catch (err) {
        res.status(500).json({ error: 'Ingest failed', details: err.stderr || err.message });
    }
});

export default router;
