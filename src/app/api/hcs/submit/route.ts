// src/app/api/hcs/submit/route.ts
// NEW FILE - HCS submission endpoint

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hederaService } from '@/lib/hederaService';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        console.log('[HCS API] Processing submission request');

        // Verify JWT authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing or invalid authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        let userId: number;

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
            userId = decoded.userId;
        } catch {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Parse request body
        const { decisionId } = await request.json();

        if (!decisionId) {
            return NextResponse.json(
                { error: 'Decision ID is required' },
                { status: 400 }
            );
        }

        console.log(`[HCS API] Submitting decision ${decisionId} for user ${userId}`);

        // Fetch decision from database
        const decision = await prisma.aiDecision.findFirst({
            where: {
                id: decisionId,
                userId: userId.toString() // Ensure user owns the decision
            }
        });

        if (!decision) {
            return NextResponse.json(
                { error: 'Decision not found or access denied' },
                { status: 404 }
            );
        }

        // Check if already submitted
        if (decision.hcsMessageId) {
            return NextResponse.json({
                success: true,
                message: 'Decision already submitted to HCS',
                transactionId: decision.hcsMessageId,
                consensusTimestamp: decision.consensusTime,
                alreadySubmitted: true
            });
        }

        // Submit to HCS
        const submissionResult = await hederaService.submitDecisionToHCS({
            id: decision.id,
            query: decision.query,
            aiResponse: decision.aiResponse,
            decisionHash: decision.decisionHash,
            userId: decision.userId,
            timestamp: decision.timestamp
        });

        if (!submissionResult.success) {
            console.error(`[HCS API] Submission failed:`, submissionResult.error);

            // Update database with failure status
            await prisma.aiDecision.update({
                where: { id: decisionId },
                data: {
                    verified: false,
                    verifiedAt: new Date()
                }
            });

            return NextResponse.json(
                {
                    error: 'HCS submission failed',
                    details: submissionResult.error
                },
                { status: 500 }
            );
        }

        // Update database with successful submission
        const updatedDecision = await prisma.aiDecision.update({
            where: { id: decisionId },
            data: {
                hcsTopicId: submissionResult.topicId,
                hcsMessageId: submissionResult.transactionId,
                consensusTime: submissionResult.consensusTimestamp ?
                    new Date(submissionResult.consensusTimestamp) : null,
                verified: true,
                verifiedAt: new Date()
            }
        });

        console.log(`[HCS API] Successfully submitted decision ${decisionId} - TX: ${submissionResult.transactionId}`);

        return NextResponse.json({
            success: true,
            message: 'Decision successfully submitted to HCS',
            transactionId: submissionResult.transactionId,
            consensusTimestamp: submissionResult.consensusTimestamp,
            topicId: submissionResult.topicId,
            decision: {
                id: updatedDecision.id,
                verified: updatedDecision.verified,
                verifiedAt: updatedDecision.verifiedAt,
                hcsTopicId: updatedDecision.hcsTopicId,
                hcsMessageId: updatedDecision.hcsMessageId,
                consensusTime: updatedDecision.consensusTime
            }
        });

    } catch (error) {
        console.error('[HCS API] Unexpected error:', error);

        return NextResponse.json(
            { error: 'Internal server error during HCS submission' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
