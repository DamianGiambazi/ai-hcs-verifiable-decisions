// Import AI types from the ai types file
import { AIDecisionRecord } from './ai'

export interface DashboardStats {
  totalDecisions: number
  verifiedDecisions: number
  pendingVerifications: number
  avgProcessingTime: number
  recentDecisions: AIDecisionRecord[]
}

export interface DashboardOverview {
  user: {
    id: string
    email: string
    name?: string
    memberSince: Date
  }
  stats: DashboardStats
  systemHealth: {
    aiServiceStatus: 'online' | 'offline' | 'degraded'
    blockchainStatus: 'online' | 'offline' | 'degraded'
    databaseStatus: 'online' | 'offline' | 'degraded'
  }
}