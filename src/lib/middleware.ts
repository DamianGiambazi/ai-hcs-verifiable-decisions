import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'

export async function withAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const authToken = await verifyToken(token)

  if (!authToken) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }

  // Add user info to request headers for use in API routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', authToken.userId)
  requestHeaders.set('x-user-email', authToken.email)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}
