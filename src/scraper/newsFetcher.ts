import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

export async function fetchLatestNews(marketId: string): Promise<string> {
    console.log(`[Scraper] Initializing Locus Wrapper for Firecrawl...`);
    const apiKey = process.env.LOCUS_API_KEY;
    
    if (!apiKey) {
        throw new Error("[Scraper] LOCUS_API_KEY missing");
    }

    try {
        console.log(`[Scraper] Firing request to search API for market ${marketId}...`);
        const response = await axios.post(
            'https://beta-api.paywithlocus.com/api/wrapped/firecrawl/search',
            { query: `latest news regarding prediction market ${marketId}` },
            { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        return JSON.stringify(response.data);
    } catch (e) {
        console.error(`[Scraper] Error fetching from API via Locus:`, e);
        throw e;
    }
}
