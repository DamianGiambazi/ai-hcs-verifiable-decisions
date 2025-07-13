import { NextRequest } from 'next/server'
import { verifyToken, logAuditEvent } from '@/lib/auth'
import { processAIDecision } from '@/lib/claude'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError, validateRequest, handleApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return apiError('Authentication required', 401)
    }

    const authToken = await verifyToken(token)
    
    if (!authToken) {
      return apiError('Invalid or expired token', 401)
    }

    // Validate request body
    const body = await request.json()
    validateRequest(body, ['query'])

    const { query, context } = body

    // Process AI decision
    const aiDecision = await processAIDecision({
      query,
      userId: authToken.userId,
      context,
    })

    // Store decision in database
    const storedDecision = await prisma.aiDecision.create({
      data: {
        userId: authToken.userId,
        query: aiDecision.query,
        aiResponse: aiDecision.response,
        decisionHash: aiDecision.decisionHash,
        processingTime: aiDecision.processingTime,
        tokenCount: aiDecision.tokenCount,
        timestamp: aiDecision.timestamp,
      },
    })

    // Log the decision
    await logAuditEvent('ai_decision_processed', authToken.userId, {
      decisionId: storedDecision.id,
      queryLength: query.length,
      processingTime: aiDecision.processingTime,
    }, request)

    return apiResponse({
      success: true,
      decision: {
        id: storedDecision.id,
        query: storedDecision.query,
        ai_response: storedDecision.aiResponse,
        decision_hash: storedDecision.decisionHash,
        processing_time: storedDecision.processingTime,
        token_count: storedDecision.tokenCount,
        timestamp: storedDecision.timestamp,
        verified: storedDecision.verified,
      },
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}
