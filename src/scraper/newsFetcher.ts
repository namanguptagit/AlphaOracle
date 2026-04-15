import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

export interface MarketEvent {
    title: string;
    description: string;
    endDate: string;
    volume: number;
    liquidity: number;
    markets: {
        question: string;
        outcomePrices: string;
        volume: string;
        active: boolean;
    }[];
}

export async function fetchLiveMarketEvents(): Promise<MarketEvent[]> {
    console.log(`[Scraper] Fetching live events from Polymarket Gamma API...`);
    const res = await axios.get('https://gamma-api.polymarket.com/events?active=true&closed=false&limit=15');
    const events: MarketEvent[] = res.data
        .filter((e: any) => e.title && e.markets?.length > 0)
        .map((e: any) => ({
            title: e.title,
            description: e.description || '',
            endDate: e.endDate || '',
            volume: e.volume || 0,
            liquidity: e.liquidity || 0,
            markets: (e.markets || []).map((m: any) => ({
                question: m.question,
                outcomePrices: m.outcomePrices || '[]',
                volume: m.volume || '0',
                active: m.active && !m.closed,
            })),
        }));
    return events;
}

export function formatMarketContext(event: MarketEvent): string {
    const activeMarkets = event.markets.filter(m => m.active);
    const marketLines = activeMarkets.map(m => {
        let prices: string[] = [];
        try { prices = JSON.parse(m.outcomePrices); } catch {}
        const yesPrice = prices[0] || '?';
        const noPrice = prices[1] || '?';
        return `  - "${m.question}" | Yes: ${yesPrice}, No: ${noPrice} | Volume: $${Number(m.volume).toLocaleString()}`;
    });

    return [
        `Event: ${event.title}`,
        `Description: ${event.description}`,
        `End Date: ${event.endDate}`,
        `Total Volume: $${event.volume.toLocaleString()}`,
        `Liquidity: $${event.liquidity.toLocaleString()}`,
        `Active Sub-Markets:`,
        ...marketLines,
    ].join('\n');
}
