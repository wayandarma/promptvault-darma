import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import promptsRouter from './routes/prompts.js';
import ingestRouter from './routes/ingest.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/prompts', promptsRouter);
app.use('/api/ingest', ingestRouter);

app.listen(PORT, () => {
    console.log(`PromptVault server running on port ${PORT}`);
});
