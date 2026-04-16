import { BrainDecision } from '../brain/analyzer';
import { authorizeLocusPayment, sendLocusPayment } from '../wallet/locusClient';

export async function executeTrade(decision: BrainDecision, amountToBet: number = 0.10): Promise<string | null> {
    
    // 1. Authorize via Locus Wallet limits
    const authorized = await authorizeLocusPayment(amountToBet);
    
    if (!authorized) {
        console.error(`[Executor] Locus payment failed or limit reached. Aborting trade.`);
        return null;
    }

    // 2. Transact via Locus Agent Network (Proxy to Polygon/Base)
    try {
        console.log(`[Executor] Using Locus Wallet (beta/stage environment) to place $${amountToBet} trade...`);
        // Mock prediction market LP address for the hackathon MVP
        const predictionMarketAddress = "0x8E1c8280f8DdA821B2c7d9eCcBAd0F85A23C9F47"; 

        const txId = await sendLocusPayment(amountToBet, predictionMarketAddress);
        return txId;
    } catch (e: any) {
        console.error(`[Executor] Locus execution failed:`, e);
        if (e?.response?.data?.message && e.response.data.message.includes("allowance")) {
             throw new Error("LOCUS_ALLOWANCE_EXCEEDED: " + e.response.data.message);
        }
        return null;
    }
}
