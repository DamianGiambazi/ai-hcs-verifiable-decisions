import { NextRequest } from 'next/server'
import { createUser, generateToken, logAuditEvent } from '@/lib/auth'
import { apiResponse, apiError, validateRequest, handleApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    validateRequest(body, ['email', 'password'])

    const { email, password, name } = body

    // Validate password strength
    if (password.length < 8) {
      return apiError('Password must be at least 8 characters long', 400)
    }

    // Create user
    const user = await createUser(email, password, name)

    // Generate JWT token
    const token = await generateToken(user)

    // Log successful registration
    await logAuditEvent('user_registered', user.id, { email }, request)

    return apiResponse({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }, 201)
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return apiError('User already exists', 409)
    }
    return handleApiError(error, request)
  }
}
