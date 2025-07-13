import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError, handleApiError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Fetch user's decisions
    const decisions = await prisma.aiDecision.findMany({
      where: { userId: authToken.userId },
      orderBy: { timestamp: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        query: true,
        aiResponse: true,
        decisionHash: true,
        timestamp: true,
        processingTime: true,
        tokenCount: true,
        verified: true,
        verifiedAt: true,
        hcsTopicId: true,
        hcsMessageId: true,
        consensusTime: true,
      },
    })

    // Get total count for pagination
    const totalCount = await prisma.aiDecision.count({
      where: { userId: authToken.userId },
    })

    return apiResponse({
      success: true,
      decisions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}
