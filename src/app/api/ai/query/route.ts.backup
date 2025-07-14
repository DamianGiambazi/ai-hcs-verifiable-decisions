// src/app/api/ai/query/route.ts
// COMPLETE WORKING VERSION - Mock AI + User Management + HCS Integration

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { hederaService } from '@/lib/hederaService';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[AI API] Processing AI query request (simplified auth)');

    // Parse request body - flexible field names
    const body = await request.json();
    console.log('[AI API] Request body received:', JSON.stringify(body, null, 2));

    const query_text = body.query_text || body.query || body.message || body.question || body.text;

    if (!query_text || typeof query_text !== 'string') {
      return NextResponse.json(
        {
          error: 'Query text is required and must be a string',
          received_fields: Object.keys(body),
          expected_fields: ['query_text', 'query', 'message', 'question', 'text']
        },
        { status: 400 }
      );
    }

    console.log(`[AI API] Processing query: ${query_text.substring(0, 50)}...`);

    // TEMPORARY: Mock Claude API response for HCS testing
    // TODO: Restore real Claude API once network issue is resolved
    console.log('[AI API] Using mock Claude response for testing HCS integration');

    const aiResponse = `Mock AI Response: "${query_text}" - This is a test response to validate the HCS blockchain integration. The actual Claude API will be restored once network connectivity is resolved.`;
    const processingTime = Date.now() - startTime;

    console.log(`[AI API] Mock response generated in ${processingTime}ms`);

    // Generate decision hash
    const timestamp = new Date();
    const decisionHash = crypto
      .createHash('sha256')
      .update(`${query_text}|${aiResponse}|${timestamp.toISOString()}`)
      .digest('hex');

    // Save decision to database (ensure user exists first)
    // For testing: Create or use existing test user
    let user;
    try {
      user = await prisma.user.findFirst({
        where: { email: 'test@example.com' }
      });

      if (!user) {
        console.log('[AI API] Creating test user for HCS testing');
        user = await prisma.user.create({
          data: {
            username: 'test-user',
            email: 'test@example.com',
            password_hash: 'test-hash-for-hcs-testing'
          }
        });
        console.log(`[AI API] Test user created with ID: ${user.id}`);
      } else {
        console.log(`[AI API] Using existing test user with ID: ${user.id}`);
      }
    } catch (userError) {
      console.error('[AI API] User creation/lookup failed:', userError);
      return NextResponse.json(
        { error: 'User management error during testing', details: userError },
        { status: 500 }
      );
    }

    const savedDecision = await prisma.aiDecision.create({
      data: {
        userId: user.id, // Use the actual user ID
        query: query_text,
        aiResponse,
        decisionHash,
        timestamp,
        processingTime,
        tokenCount: 50, // Mock token count for testing
        verified: false, // Will be updated after HCS submission
      }
    });

    console.log(`[AI API] Decision ${savedDecision.id} saved to database`);

    // ========================================
    // HCS INTEGRATION - ASYNC SUBMISSION
    // ========================================
    console.log(`[AI API] Initiating HCS submission for decision ${savedDecision.id}`);

    // Submit to HCS asynchronously (non-blocking response)
    setImmediate(async () => {
      try {
        console.log(`[AI API] Submitting decision ${savedDecision.id} to HCS in background`);

        const hcsResult = await hederaService.submitDecisionToHCS({
          id: savedDecision.id,
          query: savedDecision.query,
          aiResponse: savedDecision.aiResponse,
          decisionHash: savedDecision.decisionHash,
          userId: savedDecision.userId,
          timestamp: savedDecision.timestamp
        });

        if (hcsResult.success) {
          // Update database with HCS submission results
          await prisma.aiDecision.update({
            where: { id: savedDecision.id },
            data: {
              hcsTopicId: hcsResult.topicId,
              hcsMessageId: hcsResult.transactionId,
              consensusTime: hcsResult.consensusTimestamp ?
                new Date(hcsResult.consensusTimestamp) : null,
              verified: true,
              verifiedAt: new Date()
            }
          });

          console.log(`[AI API] ✅ Decision ${savedDecision.id} successfully submitted to HCS: ${hcsResult.transactionId}`);
          console.log(`[AI API] 🔗 View on HashScan: https://hashscan.io/testnet/transaction/${hcsResult.transactionId}`);
        } else {
          console.error(`[AI API] ❌ HCS submission failed for decision ${savedDecision.id}:`, hcsResult.error);

          // Mark as verification failed but keep the decision
          await prisma.aiDecision.update({
            where: { id: savedDecision.id },
            data: {
              verified: false,
              verifiedAt: new Date()
            }
          });
        }
      } catch (error) {
        console.error(`[AI API] Background HCS submission error for decision ${savedDecision.id}:`, error);

        // Mark as verification failed
        try {
          await prisma.aiDecision.update({
            where: { id: savedDecision.id },
            data: {
              verified: false,
              verifiedAt: new Date()
            }
          });
        } catch (dbError) {
          console.error(`[AI API] Failed to update decision ${savedDecision.id} with error status:`, dbError);
        }
      } finally {
        await prisma.$disconnect();
      }
    });

    // Return immediate response (don't wait for HCS)
    const response = {
      success: true,
      message: 'AI query processed successfully with HCS integration',
      data: {
        id: savedDecision.id,
        query: savedDecision.query,
        ai_response: savedDecision.aiResponse,
        decision_hash: savedDecision.decisionHash,
        timestamp: savedDecision.timestamp,
        processing_time: processingTime,
        token_count: savedDecision.tokenCount,
        user_id: user.id,
        // HCS Integration Status
        hcs_submission_initiated: true,
        verification_status: 'PENDING',
        verification_message: 'Decision submitted to Hedera blockchain for verification',
        topic_id: process.env.HEDERA_AI_DECISION_TOPIC_ID
      }
    };

    console.log(`[AI API] ✅ Response sent for decision ${savedDecision.id} - HCS submission running in background`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('[AI API] Unexpected error:', error);

    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        error: 'Internal server error during AI processing',
        processing_time: processingTime,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    // Main thread prisma disconnect
    await prisma.$disconnect();
  }
}
