// src/lib/hederaService.ts
// NEW FILE - Pure addition, no existing code changes

import {
    Client,
    AccountId,
    PrivateKey,
    TopicMessageSubmitTransaction,
    TopicCreateTransaction,
    Hbar,
} from '@hashgraph/sdk';
import crypto from 'crypto';

interface HCSSubmissionResult {
    success: boolean;
    transactionId?: string;
    consensusTimestamp?: string;
    error?: string;
    topicId?: string;
}

interface AIDecisionData {
    id: string;      //  Correct - matches CUID
    query: string;
    aiResponse: string;
    decisionHash: string;
    userId: string;  //  Correct - matches CUID
    timestamp: Date;
}

export class HederaService {
    private client: Client;
    private accountId: AccountId;
    private privateKey: PrivateKey;
    private topicId: string;

    constructor() {
        // Initialize Hedera client with environment variables
        const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
        const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;
        const topicIdStr = process.env.HEDERA_AI_DECISION_TOPIC_ID;

        if (!accountIdStr || !privateKeyStr || !topicIdStr) {
            throw new Error(`Missing required Hedera environment variables:
        HEDERA_ACCOUNT_ID: ${accountIdStr ? 'FOUND' : 'MISSING'}
        HEDERA_PRIVATE_KEY: ${privateKeyStr ? 'FOUND' : 'MISSING'}
        HEDERA_AI_DECISION_TOPIC_ID: ${topicIdStr ? 'FOUND' : 'MISSING'}`);
        }

        this.accountId = AccountId.fromString(accountIdStr);
        this.privateKey = PrivateKey.fromStringECDSA(privateKeyStr);
        this.topicId = topicIdStr;

        // Configure client for testnet
        this.client = Client.forTestnet();
        this.client.setOperator(this.accountId, this.privateKey);
        this.client.setDefaultMaxTransactionFee(new Hbar(2));
    }

    /**
     * Submit AI decision to HCS topic
     */
    async submitDecisionToHCS(decisionData: AIDecisionData): Promise<HCSSubmissionResult> {
        try {
            console.log(`[HCS] Submitting decision ${decisionData.id} to topic ${this.topicId}`);

            // Create HCS message payload
            const messagePayload = {
                decisionId: decisionData.id,
                decisionHash: decisionData.decisionHash,
                query: decisionData.query,
                userId: decisionData.userId,
                timestamp: decisionData.timestamp.toISOString(),
                verification: 'AI Decision Verification Trail',
                system: 'ai-hcs-verifiable-decisions'
            };

            const messageString = JSON.stringify(messagePayload);

            // Create and execute HCS submission transaction
            const transaction = new TopicMessageSubmitTransaction()
                .setTopicId(this.topicId)
                .setMessage(messageString)
                .setMaxTransactionFee(new Hbar(1));

            console.log(`[HCS] Executing transaction for decision ${decisionData.id}`);
            const response = await transaction.execute(this.client);

            // Get transaction receipt
            const receipt = await response.getReceipt(this.client);
            const consensusTimestamp = (receipt as any).consensusTimestamp || null;

            console.log(`[HCS] Success! Transaction ID: ${response.transactionId.toString()}`);
            console.log(`[HCS] Consensus timestamp: ${consensusTimestamp?.toString()}`);

            return {
                success: true,
                transactionId: response.transactionId.toString(),
                consensusTimestamp: consensusTimestamp?.toString(),
                topicId: this.topicId
            };

        } catch (error) {
            console.error(`[HCS] Submission failed for decision ${decisionData.id}:`, error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                topicId: this.topicId
            };
        }
    }

    /**
     * Verify decision exists on HCS via Mirror Node
     */
    async verifyDecisionOnMirrorNode(transactionId: string): Promise<{
        verified: boolean;
        consensusTimestamp?: string;
        sequence?: number;
        error?: string;
    }> {
        try {
            console.log(`[Mirror] Verifying transaction ${transactionId}`);

            // Query Mirror Node API for transaction details
            const mirrorUrl = `https://testnet.mirrornode.hedera.com/api/v1/transactions/${transactionId}`;
            const response = await fetch(mirrorUrl);

            if (!response.ok) {
                throw new Error(`Mirror Node API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.transactions && data.transactions.length > 0) {
                const transaction = data.transactions[0];
                return {
                    verified: true,
                    consensusTimestamp: transaction.consensus_timestamp,
                    sequence: transaction.transaction_index
                };
            }

            return {
                verified: false,
                error: 'Transaction not found on Mirror Node'
            };

        } catch (error) {
            console.error(`[Mirror] Verification failed:`, error);
            return {
                verified: false,
                error: error instanceof Error ? error.message : 'Mirror Node query failed'
            };
        }
    }

    /**
     * Generate verification hash for decision integrity
     */
    static generateDecisionHash(query: string, aiResponse: string, timestamp: Date): string {
        const content = `${query}|${aiResponse}|${timestamp.toISOString()}`;
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Validate decision hash integrity
     */
    static validateDecisionHash(
        query: string,
        aiResponse: string,
        timestamp: Date,
        expectedHash: string
    ): boolean {
        const calculatedHash = this.generateDecisionHash(query, aiResponse, timestamp);
        return calculatedHash === expectedHash;
    }
}

// Export singleton instance
export const hederaService = new HederaService();
