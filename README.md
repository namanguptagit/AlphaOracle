# AlphaOracle: The Autonomous Prediction Agent

**AlphaOracle** is a fully autonomous, predictive inference agent built for the Locus Paygentic [Machine Economy Track]. It continuously monitors real-world macroeconomic and crypto trends, arrives at logical market predictions via an LLM, and autonomously executes financial transactions securely via the Locus API gateway.

![AlphaOracle Dashboard](https://raw.githubusercontent.com/namanguptagit/AlphaOracle/main/assets/demo.webp) *(Placeholder)*

## 🏆 Hackathon Context

AlphaOracle implements the exact infrastructure outlined by the Locus "Machine Economy" track:
1. **API Bundling:** Operates Locus's encapsulated endpoint wrappers (`/api/wrapped/...`) to securely and anonymously pay for dynamic `Firecrawl` scrapes and `OpenAI GPT-4o` reasoning without ever needing to expose proprietary OpenAI/Firecrawl API keys or subscription balances directly in code.
2. **Autonomous Spending:** Implements `POST /pay/send` natively from an Agent Wallet securely provisioned by Locus. The Agent acts on high-confidence scenarios autonomously, firing real 1.00 USDC micro-transactions onto the Base blockchain based solely on what the Brain decides!

## ⚙️ How It Works

1. **Scraping (`scraper/newsFetcher.ts`)**: Picks a highly relevant prediction market (e.g. "Will Federal Reserve cut interest rates?"), automatically deducts micro-cents from its Locus balance, and scrapes the live internet.
2. **Analysis (`brain/analyzer.ts`)**: Forwards the compiled data to GPT-4o through Locus. The LLM acts as an expert analyst to format a JSON `{ "decision": "BUY_YES", "confidence": 0.85 }` block. 
3. **Execution (`market/executor.ts`)**: Uses the agent's Locus Wallet limits to ensure extreme safety. Once clear, it autonomously spends USDC, returning an immediate pending transaction receipt directly to the live Web UI!

---

## 🚀 Getting Started

### 1. Requirements & Install
Make sure you have Node > 18.
```bash
npm install
```

### 2. Environment Setup
Rename `.env.example` to `.env` and assign your global `LOCUS_API_KEY`.
```bash
# AlphaOracle Environment Configuration

# Locus API (Billing / Wallets / Proxies)
LOCUS_API_KEY=claw_dev_a8... # Your specific API Key
```

### 3. Execution
Launch the backend and its real-time Glassmorphism Dashboard:
```bash
npx ts-node src/server.ts
```
Then navigate to `http://localhost:3000` to watch the agent do its live magic!

*Note: For the safety of the Hackathon demo, executions reflect a safe $1.00 capped expenditure via the Locus dashboard config. If your wallet returns a `PENDING_APPROVAL` status, simply click the notification generated in your terminal to easily approve the live Base sweep directly through Locus.*
