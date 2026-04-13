import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

export interface BrainDecision {
    market_id: string;
    decision: 'BUY_YES' | 'BUY_NO' | 'HOLD';
    confidence: number;
    reasoning: string;
}

export async function analyzeMarketNews(marketId: string, newsContent: string): Promise<BrainDecision> {
    const apiKey = process.env.LOCUS_API_KEY;
    
    if (!apiKey) {
        throw new Error(`[Brain Mock] API Key missing.`);
    }

    try {
        const systemPrompt = `You are an expert prediction market analyzer. Analyze the following news.
Return a STRICT JSON object answering the probability of the market resolving to "Yes".
You MUST pick either "BUY_YES" or "BUY_NO" based on which is more likely. Do NOT return "HOLD".
Format: { "market_id": string, "decision": "BUY_YES" | "BUY_NO", "confidence": number (0-1), "reasoning": string }`;

        console.log(`[Brain] Calling OpenAI via Locus Proxy...`);
        const response = await axios.post(
            'https://beta-api.paywithlocus.com/api/wrapped/openai/chat',
            {
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Market ID: ${marketId}\nNews:\n${newsContent}` }
                ],
                response_format: { type: "json_object" }
            },
            { headers: { Authorization: `Bearer ${apiKey}` } }
        );

        // Locus wraps the result in { success: true, data: { choices: [...] } }
        const rData = response.data;
        if (!rData.success) {
            throw new Error(`Locus Error: ${JSON.stringify(rData)}`);
        }

        const content = rData.data.choices[0].message.content || "{}";
        return JSON.parse(content) as BrainDecision;
    } catch (e) {
        console.error(`[Brain] Error calling OpenAI via Locus:`, e);
        throw e;
    }
}
