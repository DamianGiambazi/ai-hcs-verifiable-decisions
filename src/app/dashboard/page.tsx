'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name?: string
  memberSince: string
}

interface DashboardData {
  user: User
  stats: {
    totalDecisions: number
    verifiedDecisions: number
    pendingVerifications: number
    avgProcessingTime: number
    recentDecisions: any[]
  }
  systemHealth: {
    aiServiceStatus: string
    blockchainStatus: string
    databaseStatus: string
  }
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/dashboard/overview', {
        headers: {
          'Authorization': 'Bearer ' + token,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token')
          router.push('/login')
          return
        }
        throw new Error('Failed to load dashboard')
      }

      const data = await response.json()
      setDashboardData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    router.push('/login')
  }

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiQuery.trim()) return

    setAiLoading(true)
    setAiResponse(null)

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ query: aiQuery }),
      })

      if (!response.ok) {
        throw new Error('Failed to process AI query')
      }

      const data = await response.json()
      setAiResponse(data.decision)
      setAiQuery('')
      
      // Reload dashboard to update stats
      loadDashboard()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI query failed')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              AI+HCS Verifiable Decisions
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {dashboardData?.user.email}
              </span>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData?.stats.totalDecisions || 0}
            </div>
            <div className="text-gray-600">Total Decisions</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {dashboardData?.stats.verifiedDecisions || 0}
            </div>
            <div className="text-gray-600">Verified</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardData?.stats.pendingVerifications || 0}
            </div>
            <div className="text-gray-600">Pending</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {dashboardData?.stats.avgProcessingTime || 0}ms
            </div>
            <div className="text-gray-600">Avg Processing</div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
              <span>AI Service: {dashboardData?.systemHealth.aiServiceStatus || 'online'}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2 bg-gray-500"></div>
              <span>Blockchain: {dashboardData?.systemHealth.blockchainStatus || 'offline'}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
              <span>Database: {dashboardData?.systemHealth.databaseStatus || 'online'}</span>
            </div>
          </div>
        </div>

        {/* AI Query Interface */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-4">AI Decision Processing</h2>
          <form onSubmit={handleAiQuery} className="mb-4">
            <div className="mb-4">
              <textarea
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Enter your AI query... (e.g., 'What are the benefits of blockchain verification for AI decisions?')"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                required
              />
            </div>
            <button
              type="submit"
              disabled={aiLoading || !aiQuery.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading ? 'Processing...' : 'Submit Query'}
            </button>
          </form>

          {aiResponse && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">AI Response</h4>
              <p className="text-gray-700 mb-3">{aiResponse.ai_response}</p>
              <div className="text-sm text-gray-500">
                <p>Decision Hash: <code className="bg-gray-200 px-1 rounded">{aiResponse.decision_hash?.substring(0, 16)}...</code></p>
                <p>Processing Time: {aiResponse.processing_time}ms</p>
                <p>Status: {aiResponse.verified ? 'Verified' : 'Pending Verification'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Decisions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Decisions</h2>
          {dashboardData?.stats.recentDecisions && dashboardData.stats.recentDecisions.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.stats.recentDecisions.map((decision: any) => (
                <div key={decision.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 flex-1">
                      {decision.query.length > 100 
                        ? decision.query.substring(0, 100) + '...' 
                        : decision.query
                      }
                    </h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    {decision.aiResponse.length > 200 
                      ? decision.aiResponse.substring(0, 200) + '...' 
                      : decision.aiResponse
                    }
                  </p>
                  <div className="text-xs text-gray-500">
                    {new Date(decision.timestamp).toLocaleString()} • 
                    {decision.processingTime}ms
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No decisions yet. Submit your first AI query above!
            </p>
          )}
        </div>

        {/* Phase Status */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Development Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-100 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900">Phase 1: AI Foundation</h4>
              <p className="text-green-700">✅ Complete</p>
              <p className="text-sm text-green-600">Authentication, AI integration, database</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-900">Phase 2: Blockchain</h4>
              <p className="text-yellow-700">🚧 Next</p>
              <p className="text-sm text-yellow-600">Hedera HCS integration</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900">Phase 3: Enhancement</h4>
              <p className="text-gray-700">📋 Future</p>
              <p className="text-sm text-gray-600">Advanced analytics</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}