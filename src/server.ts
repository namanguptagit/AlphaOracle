import express from 'express';
import cors from 'cors';
import path from 'path';
import { AgentEngine } from './index';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

let tradeAmount = 0.10; // default
const agent = new AgentEngine(tradeAmount);

app.post('/api/start', async (req, res) => {
    await agent.start();
    res.json({ running: agent.getStatus() });
});

app.post('/api/stop', (req, res) => {
    agent.stop();
    res.json({ running: agent.getStatus() });
});

app.post('/api/trade-amount', (req, res) => {
    const amount = parseFloat(req.body.amount);
    if (isNaN(amount) || amount <= 0 || amount > 10) {
        return res.status(400).json({ error: 'Amount must be between $0.01 and $10.00' });
    }
    tradeAmount = amount;
    agent.setTradeAmount(amount);
    console.log(`[Config] Trade amount updated to: $${amount.toFixed(2)}`);
    res.json({ tradeAmount });
});

app.get('/api/status', (req, res) => {
    res.json({ running: agent.getStatus(), tradeAmount });
});

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

    const alertListener = (data: any) => {
        res.write(`data: ${JSON.stringify({ event: 'alert', ...data })}\n\n`);
    };

    agent.on('log', logListener);
    agent.on('decision_update', decisionListener);
    agent.on('execution_update', executionListener);
    agent.on('alert_update', alertListener);

    req.on('close', () => {
        agent.removeListener('log', logListener);
        agent.removeListener('decision_update', decisionListener);
        agent.removeListener('execution_update', executionListener);
        agent.removeListener('alert_update', alertListener);
    });
});

app.listen(port, () => {
    console.log(`[Dashboard] Server running at http://localhost:${port}`);
    console.log(`[Dashboard] Agent is IDLE. Default trade amount: $${tradeAmount.toFixed(2)}`);
});
