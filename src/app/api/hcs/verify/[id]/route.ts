// src/app/api/hcs/verify/[id]/route.ts
// NEW FILE - HCS verification endpoint

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hederaService } from '@/lib/hederaService';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log(`[HCS Verify] Checking verification status for decision ${params.id}`);

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

        const decisionId = parseInt(params.id);
        if (isNaN(decisionId)) {
            return NextResponse.json(
                { error: 'Invalid decision ID' },
                { status: 400 }
            );
        }

        // Fetch decision from database
        const decision = await prisma.aiDecision.findFirst({
            where: {
                id: decisionId,
                userId: userId
            }
        });

        if (!decision) {
            return NextResponse.json(
                { error: 'Decision not found or access denied' },
                { status: 404 }
            );
        }

        // Check if not yet submitted to HCS
        if (!decision.hcsMessageId) {
            return NextResponse.json({
                verified: false,
                status: 'PENDING',
                message: 'Decision not yet submitted to HCS',
                decision: {
                    id: decision.id,
                    decisionHash: decision.decisionHash,
                    timestamp: decision.timestamp,
                    submitted: false
                }
            });
        }

        // Verify on Mirror Node
        console.log(`[HCS Verify] Checking Mirror Node for transaction ${decision.hcsMessageId}`);

        const mirrorResult = await hederaService.verifyDecisionOnMirrorNode(decision.hcsMessageId);

        if (!mirrorResult.verified) {
            return NextResponse.json({
                verified: false,
                status: 'SUBMITTED_PENDING_CONSENSUS',
                message: 'Decision submitted but not yet confirmed on Mirror Node',
                transactionId: decision.hcsMessageId,
                error: mirrorResult.error,
                decision: {
                    id: decision.id,
                    decisionHash: decision.decisionHash,
                    timestamp: decision.timestamp,
                    hcsTopicId: decision.hcsTopicId,
                    hcsMessageId: decision.hcsMessageId,
                    submitted: true
                }
            });
        }

        // Verify hash integrity
        const hashValid = hederaService.constructor.validateDecisionHash(
            decision.query,
            decision.aiResponse,
            decision.timestamp,
            decision.decisionHash
        );

        const verificationResult = {
            verified: true,
            status: 'CONFIRMED',
            message: 'Decision successfully verified on Hedera network',
            transactionId: decision.hcsMessageId,
            consensusTimestamp: mirrorResult.consensusTimestamp,
            sequence: mirrorResult.sequence,
            hashIntegrity: hashValid,
            mirrorNodeUrl: `https://hashscan.io/testnet/transaction/${decision.hcsMessageId}`,
            decision: {
                id: decision.id,
                query: decision.query,
                aiResponse: decision.aiResponse,
                decisionHash: decision.decisionHash,
                timestamp: decision.timestamp,
                hcsTopicId: decision.hcsTopicId,
                hcsMessageId: decision.hcsMessageId,
                consensusTime: decision.consensusTime,
                verified: decision.verified,
                verifiedAt: decision.verifiedAt,
                processingTime: decision.processingTime
            }
        };

        console.log(`[HCS Verify] Decision ${decisionId} verification complete - Status: CONFIRMED`);

        return NextResponse.json(verificationResult);

    } catch (error) {
        console.error('[HCS Verify] Unexpected error:', error);

        return NextResponse.json(
            { error: 'Internal server error during verification' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log(`[HCS Verify] Manual verification trigger for decision ${params.id}`);

        // This endpoint triggers both HCS submission AND verification
        // First, try to submit to HCS if not already done
        const submitResponse = await fetch(`${request.url.replace('/verify/', '/submit')}`, {
            method: 'POST',
            headers: {
                'Authorization': request.headers.get('authorization') || '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ decisionId: parseInt(params.id) })
        });

        if (!submitResponse.ok) {
            const error = await submitResponse.json();
            return NextResponse.json(error, { status: submitResponse.status });
        }

        // Then check verification status
        const verifyResponse = await fetch(request.url, {
            method: 'GET',
            headers: {
                'Authorization': request.headers.get('authorization') || ''
            }
        });

        return verifyResponse;

    } catch (error) {
        console.error('[HCS Verify] Manual verification error:', error);

        return NextResponse.json(
            { error: 'Internal server error during manual verification' },
            { status: 500 }
        );
    }
}
