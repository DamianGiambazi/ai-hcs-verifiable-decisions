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

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: authToken.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    if (!user) {
      return apiError('User not found', 404)
    }

    // Get user statistics
    const totalDecisions = await prisma.aiDecision.count({
      where: { userId: authToken.userId },
    })

    const verifiedDecisions = await prisma.aiDecision.count({
      where: { 
        userId: authToken.userId,
        verified: true,
      },
    })

    const pendingVerifications = totalDecisions - verifiedDecisions

    // Get average processing time
    const avgProcessingResult = await prisma.aiDecision.aggregate({
      where: { 
        userId: authToken.userId,
        processingTime: { not: null },
      },
      _avg: {
        processingTime: true,
      },
    })

    // Get recent decisions
    const recentDecisions = await prisma.aiDecision.findMany({
      where: { userId: authToken.userId },
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: {
        id: true,
        query: true,
        aiResponse: true,
        decisionHash: true,
        timestamp: true,
        verified: true,
        verifiedAt: true,
        processingTime: true,
      },
    })

    // System health check (simplified for Phase 1)
    const systemHealth = {
      aiServiceStatus: 'online' as const,
      blockchainStatus: 'offline' as const,
      databaseStatus: 'online' as const,
    }

    return apiResponse({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        memberSince: user.createdAt,
      },
      stats: {
        totalDecisions,
        verifiedDecisions,
        pendingVerifications,
        avgProcessingTime: Math.round(avgProcessingResult._avg.processingTime || 0),
        recentDecisions,
      },
      systemHealth,
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}