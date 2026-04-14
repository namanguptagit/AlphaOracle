import { EventEmitter } from 'events';
import { analyzeMarketNews } from './brain/analyzer';
import { fetchLatestNews } from './scraper/newsFetcher';
import { executeTrade } from './market/executor';

export class AgentEngine extends EventEmitter {
    private MARKETS = [
        "Will the US Federal Reserve cut interest rates at the May meeting?",
        "Will OpenAI release GPT-5 before July?",
        "Will Bitcoin reach $100k in 2026?",
        "Will the SEC approve Solana ETFs by June?"
    ];
    private DRY_RUN = false;
    private INTERVAL_MS = 120 * 1000;
    private timer: NodeJS.Timeout | null = null;
    private isRunning = false;

    // Helper to log both to console and emit to UI
    private logInfo(module: string, message: string) {
        const text = `[${module}] ${message}`;
        console.log(text);
        this.emit('log', { type: 'info', module, message, timestamp: new Date().toISOString() });
    }

    private logError(module: string, message: string, error?: any) {
        const text = `[${module}] ${message} ${error ? error.toString() : ''}`;
        console.error(text);
        this.emit('log', { type: 'error', module, message, error: error?.toString(), timestamp: new Date().toISOString() });
    }

    async tick() {
        this.logInfo('Engine', 'Starting AlphaOracle evaluation cycle...');

        try {
            // 1. Ingestion Phase
            const activeMarket = this.MARKETS[Math.floor(Math.random() * this.MARKETS.length)];
            this.logInfo('Scraper', `Fetching latest updates for market: ${activeMarket}`);
            const news = await fetchLatestNews(activeMarket);

            // 2. Reasoning Phase
            this.logInfo('Brain', 'Analyzing news against market probability...');
            const decision = await analyzeMarketNews(activeMarket, news);

            this.logInfo('Brain', `Confidence: ${(decision.confidence * 100).toFixed(1)}% | Decision: ${decision.decision}`);
            this.logInfo('Brain', `Reasoning: ${decision.reasoning}`);

            this.emit('decision_update', decision); // Emit pure JSON to update UI widgets

            // 3. Execution Phase
            if (this.DRY_RUN) {
                this.logInfo('Dry-Run', ` DRY_RUN is ON. Would have executed trade for ${activeMarket} based on decision: ${decision.decision}`);
                return;
            }

            if (decision.confidence >= 0.50 && decision.decision !== 'HOLD') {
                this.logInfo('Executor', ` Confidence >= 50%. Proceeding with live execution...`);
                const txId = await executeTrade(decision);
                if (txId) {
                    this.logInfo('Executor', `Locus Transaction Placed successfully! TX ID: ${txId}`);
                    this.emit('execution_update', { txId });
                }
            } else {
                this.logInfo('Executor', `🟡 Confidence too low or decision is HOLD. Skipping execution.`);
            }
        } catch (error: any) {
            this.logError('Error', 'Execution cycle failed:', error);
            if (error?.message?.includes("LOCUS_ALLOWANCE_EXCEEDED")) {
                this.emit('alert_update', { message: error.message });
            }
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.logInfo('Engine', `=== AlphaOracle Autonomous Agent Loop Started ===`);
        this.logInfo('Engine', `Mode: ${this.DRY_RUN ? 'DRY RUN' : 'LIVE'} | Interval: ${this.INTERVAL_MS / 1000}s`);

        this.tick();
        this.timer = setInterval(() => this.tick(), this.INTERVAL_MS);
    }

    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.logInfo('Engine', `=== AlphaOracle Autonomous Agent Stopped ===`);
    }

    getStatus() {
        return this.isRunning;
    }
}
