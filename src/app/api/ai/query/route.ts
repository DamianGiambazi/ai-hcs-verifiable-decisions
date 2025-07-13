import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { claude } from '@/lib/claude';
import { prisma } from '@/lib/prisma';
import { HederaService } from '@/lib/hedera';

// Initialize Hedera service
const hederaService = HederaService.createFromEnv();

// AI Decision Topic ID - Will be created in Step 6
const AI_DECISION_TOPIC_ID = process.env.HEDERA_AI_DECISION_TOPIC_ID || null;

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { query } = await request.json();
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // Step 1: Process AI query with Claude
    const claudeResponse = await claude.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: query.trim()
        }
      ]
    });

    // Fix: Handle Claude response correctly
    const aiResponse = claudeResponse.content[0]?.type === 'text' 
      ? claudeResponse.content[0].text 
      : 'No response generated';
    const processingTime = Date.now() - startTime;

    // Step 2: Create cryptographic hash for blockchain verification
    // Fix: Convert userId to number if needed
    const userIdNumber = typeof decoded.userId === 'string' ? parseInt(decoded.userId) : decoded.userId;
    
    const decisionHash = hederaService.createDecisionHash(
      userIdNumber,
      query.trim(),
      aiResponse,
      timestamp
    );

    // Step 3: Store AI decision in database
    const aiDecision = await prisma.aiDecision.create({
      data: {
        userId: decoded.userId,
        query: query.trim(),
        aiResponse: aiResponse,
        decisionHash: decisionHash.hash,
        timestamp: new Date(timestamp),
        processingTime: processingTime
      }
    });

    // Step 4: Submit to HCS (if topic is configured)
    let hcsResult = null;
    if (AI_DECISION_TOPIC_ID) {
      try {
        hcsResult = await hederaService.submitDecisionToHCS(
          AI_DECISION_TOPIC_ID,
          decisionHash
        );

        // Store HCS submission record
        if (hcsResult.success) {
          await prisma.hCSSubmission.create({
            data: {
              ai_decision_id: aiDecision.id,
              topic_id: AI_DECISION_TOPIC_ID,
              decision_hash: decisionHash.hash,
              transaction_id: hcsResult.transactionId,
              submission_status: 'SUBMITTED'
            }
          });
        }
      } catch (hcsError) {
        console.error('HCS submission failed:', hcsError);
        // Continue processing - don't fail the entire request if HCS fails
      }
    }

    // Step 5: Return enhanced response with blockchain metadata
    return NextResponse.json({
      success: true,
      data: {
        id: aiDecision.id,
        query: query.trim(),
        response: aiResponse,
        processing_time_ms: processingTime,
        blockchain: {
          decision_hash: decisionHash.hash,
          hcs_submitted: hcsResult?.success || false,
          topic_id: AI_DECISION_TOPIC_ID,
          transaction_id: hcsResult?.transactionId,
          verification_status: 'PENDING'
        },
        timestamp
      }
    });

  } catch (error) {
    console.error('AI query processing error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error during AI processing',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
