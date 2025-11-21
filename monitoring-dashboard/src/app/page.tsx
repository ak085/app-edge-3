'use client'

import { useState, useEffect } from 'react'
import { formatTimestamp, formatAgeSeconds, getFreshnessColor, getFreshnessIndicator } from '@/lib/utils'

interface Point {
  pointName: string
  haystackName: string
  value: number
  units: string
  quality: string
  timestamp: string
  ageSeconds: number
  freshnessStatus: string
}

export default function Home() {
  const [points, setPoints] = useState<Point[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchPoints = async () => {
    try {
      const response = await fetch('/api/points')
      if (!response.ok) throw new Error('Failed to fetch points')
      const data = await response.json()
      setPoints(data.points || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching points:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPoints()

    if (autoRefresh) {
      const interval = setInterval(fetchPoints, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const filteredPoints = points.filter(point =>
    point.pointName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    point.haystackName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Live Point Values</h2>
          <p className="text-muted-foreground">Real-time sensor data from TimescaleDB</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Auto-refresh (10s)</span>
          </label>
          <button
            onClick={fetchPoints}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4 shadow">
          <div className="text-sm text-muted-foreground">Total Points</div>
          <div className="text-2xl font-bold">{points.length}</div>
        </div>
        <div className="bg-card border rounded-lg p-4 shadow">
          <div className="text-sm text-muted-foreground">Fresh Data (&lt;1min)</div>
          <div className="text-2xl font-bold text-green-600">
            {points.filter(p => p.ageSeconds < 60).length}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 shadow">
          <div className="text-sm text-muted-foreground">Stale Data (&gt;5min)</div>
          <div className="text-2xl font-bold text-red-600">
            {points.filter(p => p.ageSeconds > 300).length}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search point name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
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
          <p className="mt-4 text-muted-foreground">Loading points...</p>
        </div>
      )}

      {/* Points Table */}
      {!loading && filteredPoints.length > 0 && (
        <div className="bg-card border rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Point Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Units</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Quality</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Last Updated</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPoints.map((point, index) => (
                  <tr key={index} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-center">{getFreshnessIndicator(point.ageSeconds)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{point.pointName}</div>
                      <div className="text-xs text-muted-foreground">{point.haystackName}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">
                      {typeof point.value === 'number' ? point.value.toFixed(2) : point.value}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{point.units || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        point.quality === 'good' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {point.quality}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatTimestamp(point.timestamp)}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${getFreshnessColor(point.ageSeconds)}`}>
                      {formatAgeSeconds(point.ageSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && filteredPoints.length === 0 && points.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No points match your search.
        </div>
      )}

      {/* No Data */}
      {!loading && points.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No point data available. Check TimescaleDB connection.
        </div>
      )}
    </div>
  )
}
