import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required')
}

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface AIDecisionRequest {
  query: string
  userId: string
  context?: string
}

export interface AIDecisionResponse {
  id: string
  query: string
  response: string
  decisionHash: string
  processingTime: number
  tokenCount?: number
  timestamp: Date
}

export async function processAIDecision(request: AIDecisionRequest): Promise<AIDecisionResponse> {
  const startTime = Date.now()
  
  try {
    const message = await claude.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: request.query
      }]
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    const processingTime = Date.now() - startTime
    
    // Create decision hash for verification
    const decisionData = {
      query: request.query,
      response: response,
      userId: request.userId,
      timestamp: new Date().toISOString()
    }
    
    const decisionHash = await generateDecisionHash(JSON.stringify(decisionData))
    
    return {
      id: crypto.randomUUID(),
      query: request.query,
      response: response,
      decisionHash: decisionHash,
      processingTime: processingTime,
      tokenCount: message.usage?.input_tokens + message.usage?.output_tokens,
      timestamp: new Date()
    }
  } catch (error) {
    console.error('Claude AI processing error:', error)
    throw new Error('Failed to process AI decision')
  }
}

async function generateDecisionHash(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Simple wrapper function for route compatibility
export async function queryClaudeAI(query: string) {
  try {
    const message = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: query
      }]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    return {
      content: content.text,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens
      },
      model: message.model
    };
  } catch (error) {
    console.error('Claude API Error:', error);
    throw new Error(`Claude AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
