import { NextResponse } from 'next/server'
import { logAuditEvent } from './auth'

export function apiResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status })
}

export function apiError(message: string, status: number = 400, details?: any) {
  return NextResponse.json(
    { 
      error: message, 
      details,
      timestamp: new Date().toISOString() 
    },
    { status }
  )
}

export async function handleApiError(error: any, request?: Request, userId?: string) {
  console.error('API Error:', error)
  
  if (request && userId) {
    await logAuditEvent('api_error', userId, { error: error.message }, request)
  }

  if (error.message.includes('Unauthorized')) {
    return apiError('Unauthorized access', 401)
  }

  if (error.message.includes('Not found')) {
    return apiError('Resource not found', 404)
  }

  return apiError('Internal server error', 500)
}

export function validateRequest(body: any, requiredFields: string[]) {
  const missingFields = requiredFields.filter(field => !body[field])
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
  }
}
