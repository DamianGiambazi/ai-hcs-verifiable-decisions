import { NextRequest } from 'next/server'
import { authenticateUser, generateToken, logAuditEvent } from '@/lib/auth'
import { apiResponse, apiError, validateRequest, handleApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    validateRequest(body, ['email', 'password'])

    const { email, password } = body

    // Authenticate user
    const user = await authenticateUser(email, password)
    
    if (!user) {
      await logAuditEvent('login_failed', undefined, { email }, request)
      return apiError('Invalid credentials', 401)
    }

    // Generate JWT token
    const token = await generateToken(user)

    // Log successful login
    await logAuditEvent('login_success', user.id, { email }, request)

    return apiResponse({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}
