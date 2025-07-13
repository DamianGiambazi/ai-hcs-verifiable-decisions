import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError, handleApiError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return apiError('Token required', 401)
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

    return apiResponse({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        memberSince: user.createdAt,
      },
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}
