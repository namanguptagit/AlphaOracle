import { EventEmitter } from 'events';
import { analyzeMarketNews } from './brain/analyzer';
import { fetchLiveMarketEvents, formatMarketContext, MarketEvent } from './scraper/newsFetcher';
import { executeTrade } from './market/executor';

export class AgentEngine extends EventEmitter {
    private FALLBACK_MARKETS = [
        "Will the US Federal Reserve cut interest rates at the May meeting?",
        "Will OpenAI release GPT-5 before July?",
        "Will Bitcoin reach $100k in 2026?",
        "Will the SEC approve Solana ETFs by June?"
    ];
    private liveEvents: MarketEvent[] = [];
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
            // 1. Ingestion Phase — pick a market and build context
            let activeMarket: string;
            let newsContext: string;

            if (this.liveEvents.length > 0) {
                const event = this.liveEvents[Math.floor(Math.random() * this.liveEvents.length)];
                activeMarket = event.title;
                newsContext = formatMarketContext(event);
                this.logInfo('Scraper', `Selected live Polymarket event: ${activeMarket}`);
            } else {
                activeMarket = this.FALLBACK_MARKETS[Math.floor(Math.random() * this.FALLBACK_MARKETS.length)];
                newsContext = `Market question: ${activeMarket}\nNo additional market data available — using general knowledge.`;
                this.logInfo('Scraper', `Using fallback market: ${activeMarket}`);
            }

            // 2. Reasoning Phase
            this.logInfo('Brain', 'Analyzing market data against probability...');
            const decision = await analyzeMarketNews(activeMarket, newsContext);

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
                this.logInfo('Executor', `Confidence too low or decision is HOLD. Skipping execution.`);
            }
        } catch (error: any) {
            this.logError('Error', 'Execution cycle failed:', error);
            if (error?.message?.includes("LOCUS_ALLOWANCE_EXCEEDED")) {
                this.emit('alert_update', { message: error.message });
            }
        }
    }

    private async fetchLiveMarkets() {
        try {
            this.logInfo('Engine', 'Fetching real-time markets from Polymarket Gamma API...');
            this.liveEvents = await fetchLiveMarketEvents();
            if (this.liveEvents.length > 0) {
                this.logInfo('Engine', `Successfully ingested ${this.liveEvents.length} live Polymarket events!`);
            } else {
                this.logInfo('Engine', 'No live events found, using fallback markets.');
            }
        } catch (e) {
            this.logError('Engine', 'Failed to fetch Polymarket API, falling back to local defaults.');
            this.liveEvents = [];
        }
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.logInfo('Engine', `=== AlphaOracle Autonomous Agent Loop Started ===`);
        this.logInfo('Engine', `Mode: ${this.DRY_RUN ? 'DRY RUN' : 'LIVE'} | Interval: ${this.INTERVAL_MS / 1000}s`);

        await this.fetchLiveMarkets();
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
