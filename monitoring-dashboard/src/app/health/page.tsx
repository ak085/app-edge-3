'use client'

import { useState, useEffect } from 'react'
import { formatTimestamp } from '@/lib/utils'

interface HealthStats {
  totalRecords: number
  uniquePoints: number
  oldestTimestamp: string
  newestTimestamp: string
  databaseSize: string
  tableSize: string
  indexSize: string
  dataRate: number
  pointStats: Array<{
    pointName: string
    haystackName: string
    count: number
    firstReading: string
    lastReading: string
    avgValue: number
  }>
}

export default function HealthPage() {
  const [stats, setStats] = useState<HealthStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealthStats = async () => {
    try {
      const response = await fetch('/api/health')
      if (!response.ok) throw new Error('Failed to fetch health stats')
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthStats()

    if (autoRefresh) {
      const interval = setInterval(fetchHealthStats, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Database Health</h2>
          <p className="text-muted-foreground">TimescaleDB monitoring and statistics</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Auto-refresh (30s)</span>
          </label>
          <button
            onClick={fetchHealthStats}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading health stats...</p>
        </div>
      )}

      {/* Health Statistics */}
      {!loading && stats && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border rounded-lg p-4 shadow">
              <div className="text-sm text-muted-foreground">Total Records</div>
              <div className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</div>
            </div>

            <div className="bg-card border rounded-lg p-4 shadow">
              <div className="text-sm text-muted-foreground">Unique Points</div>
              <div className="text-2xl font-bold">{stats.uniquePoints}</div>
            </div>

            <div className="bg-card border rounded-lg p-4 shadow">
              <div className="text-sm text-muted-foreground">Database Size</div>
              <div className="text-2xl font-bold">{stats.databaseSize}</div>
            </div>

            <div className="bg-card border rounded-lg p-4 shadow">
              <div className="text-sm text-muted-foreground">Data Rate</div>
              <div className="text-2xl font-bold">{stats.dataRate.toFixed(1)} records/min</div>
            </div>
          </div>

          {/* Storage Details */}
          <div className="bg-card border rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Storage Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Table Size</div>
                <div className="text-3xl font-bold">{stats.tableSize}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Index Size</div>
                <div className="text-3xl font-bold">{stats.indexSize}</div>
              </div>
            </div>
          </div>

          {/* Time Range */}
          <div className="bg-card border rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Data Time Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Oldest Record</div>
                <div className="text-lg font-semibold">{formatTimestamp(stats.oldestTimestamp)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Newest Record</div>
                <div className="text-lg font-semibold">{formatTimestamp(stats.newestTimestamp)}</div>
              </div>
            </div>
          </div>

          {/* Per-Point Statistics */}
          <div className="bg-card border rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Top 20 Points by Record Count</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Point Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Haystack Name</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Records</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Avg Value</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">First Reading</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Last Reading</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.pointStats.map((point, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{point.pointName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{point.haystackName}</td>
                      <td className="px-4 py-3 text-right font-mono">{point.count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono">{point.avgValue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">{formatTimestamp(point.firstReading)}</td>
                      <td className="px-4 py-3 text-sm">{formatTimestamp(point.lastReading)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Health Indicators */}
          <div className="bg-card border rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Health Indicators</h3>
            <div className="space-y-4">
              {/* Data freshness */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Data Freshness</span>
                  <span className={`text-sm font-semibold ${
                    new Date().getTime() - new Date(stats.newestTimestamp).getTime() < 120000
                      ? 'text-green-600'
                      : 'text-yellow-600'
                  }`}>
                    {new Date().getTime() - new Date(stats.newestTimestamp).getTime() < 120000
                      ? '✓ Fresh'
                      : '⚠ Stale'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Last data received: {formatTimestamp(stats.newestTimestamp)}
                </div>
              </div>

              {/* Data rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Data Rate</span>
                  <span className={`text-sm font-semibold ${
                    stats.dataRate > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.dataRate > 0 ? '✓ Active' : '✗ No Data'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {stats.dataRate.toFixed(1)} records per minute (last hour)
                </div>
              </div>

              {/* Point coverage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Point Coverage</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {stats.uniquePoints} points
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total unique points being monitored
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
