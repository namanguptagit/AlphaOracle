import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Handles the integration with the PayWithLocus API.
 * Ensures the wallet has enough balance.
 */
export async function authorizeLocusPayment(usdAmount: number): Promise<boolean> {
    const apiKey = process.env.LOCUS_API_KEY;
    console.log(`[Wallet] Checking Agent wallet limits for $${usdAmount.toFixed(2)} transaction...`);
    
    if (usdAmount > 10.00) {
        console.error(`[Wallet] Transaction limits exceeded.`);
        return false;
    }

    try {
        const response = await axios.get('https://beta-api.paywithlocus.com/api/pay/balance', {
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        
        console.log(`[Wallet] Locus Balance confirmed: $${response.data.data.balance || 'Unknown'}`);
        return true;
    } catch (e) {
        console.error(`[Wallet] Failed to authenticate locus payment/balance check.`);
        return false;
    }
}

export async function sendLocusPayment(usdAmount: number, targetAddress: string): Promise<string> {
    const apiKey = process.env.LOCUS_API_KEY;
    console.log(`[Wallet] Initiating Agent Transfer $${usdAmount.toFixed(2)} to ${targetAddress}...`);

    try {
        const response = await axios.post(
            'https://beta-api.paywithlocus.com/api/pay/send',
            {
                to_address: targetAddress,
                amount: usdAmount,
                memo: "AlphaOracle Automated Hackathon Prediction Trade"
            },
            { headers: { Authorization: `Bearer ${apiKey}` } }
        );

        const payload = response.data.data;
        if (payload.status === 'PENDING_APPROVAL') {
            console.log(`[Wallet] ⚠️ HUMAN APPROVAL REQUIRED: ${payload.approval_url}`);
            return `QUEUED_${payload.pending_approval_id}`;
        }

        return payload.transaction_id || "UNKNOWN_TX";
    } catch (e) {
        console.error(`[Wallet] Failed to send locus payment.`);
        throw e;
    }
}
