import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

export interface User {
  id: string
  email: string
  name?: string
}

export interface AuthToken {
  userId: string
  email: string
  iat: number
  exp: number
}

// Custom JWT payload interface that extends JWTPayload
interface CustomJWTPayload extends JWTPayload {
  userId: string
  email: string
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// JWT token management
export async function generateToken(user: User): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)

  // Store session in database
  await prisma.userSession.create({
    data: {
      userId: user.id,
      token: token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  })

  return token
}

export async function verifyToken(token: string): Promise<AuthToken | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    // Verify session exists in database
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    // Type-safe conversion using custom interface
    const customPayload = payload as CustomJWTPayload
    
    // Validate required fields exist
    if (!customPayload.userId || !customPayload.email) {
      return null
    }

    return {
      userId: customPayload.userId,
      email: customPayload.email,
      iat: customPayload.iat || 0,
      exp: customPayload.exp || 0,
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

// User management
export async function createUser(email: string, password: string, name?: string): Promise<User> {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error('User already exists')
  }

  const hashedPassword = await hashPassword(password)
  
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      name,
    },
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return null
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash)
  
  if (!isValidPassword) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
  }
}

export async function logAuditEvent(action: string, userId?: string, details?: any, request?: Request) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        details,
        ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown',
        userAgent: request?.headers.get('user-agent') || 'unknown',
      },
    })
  } catch (error) {
    console.error('Audit log error:', error)
  }
}