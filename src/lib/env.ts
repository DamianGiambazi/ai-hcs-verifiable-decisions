// Environment variable validation
export function validateEnvironment() {
  const requiredVars = [
    'DATABASE_URL',
    'ANTHROPIC_API_KEY',
    'NEXTAUTH_SECRET'
  ]

  const missingVars = requiredVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
}

// Validate on module load
validateEnvironment()
