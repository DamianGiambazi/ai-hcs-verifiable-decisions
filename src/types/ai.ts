export interface AIQueryRequest {
  query: string
  context?: string
}

export interface AIDecisionRecord {
  id: string
  userId: string
  query: string
  aiResponse: string
  decisionHash: string
  timestamp: Date
  processingTime?: number
  tokenCount?: number
  verified: boolean
  verifiedAt?: Date
  hcsTopicId?: string
  hcsMessageId?: string
  consensusTime?: Date
}

export interface VerificationStatus {
  verified: boolean
  consensusTime?: Date
  hcsMessageId?: string
  blockchainProof?: string
}
