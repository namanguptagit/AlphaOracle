import express from 'express';
import cors from 'cors';
import path from 'path';
import { AgentEngine } from './index';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

const agent = new AgentEngine();

app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const logListener = (data: any) => {
        res.write(`data: ${JSON.stringify({ event: 'log', ...data })}\n\n`);
    };

    const decisionListener = (data: any) => {
        res.write(`data: ${JSON.stringify({ event: 'decision', ...data })}\n\n`);
    };

    const executionListener = (data: any) => {
        res.write(`data: ${JSON.stringify({ event: 'execution', ...data })}\n\n`);
    };

    agent.on('log', logListener);
    agent.on('decision_update', decisionListener);
    agent.on('execution_update', executionListener);

    req.on('close', () => {
        agent.removeListener('log', logListener);
        agent.removeListener('decision_update', decisionListener);
        agent.removeListener('execution_update', executionListener);
    });
});

app.listen(port, () => {
    console.log(`[Dashboard] Server running at http://localhost:${port}`);
    agent.start();
});
