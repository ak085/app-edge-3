'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatTimestamp } from '@/lib/utils'

interface Point {
  pointName: string
  haystackName: string
}

interface TrendData {
  timestamp: string
  value: number
}

export default function TrendsPage() {
  const [points, setPoints] = useState<Point[]>([])
  const [selectedPoint, setSelectedPoint] = useState<string>('')
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<string>('1h')

  // Fetch available points
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const response = await fetch('/api/points')
        if (!response.ok) throw new Error('Failed to fetch points')
        const data = await response.json()
        setPoints(data.points || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }
    fetchPoints()
  }, [])

  // Fetch trend data when point or time range changes
  useEffect(() => {
    if (!selectedPoint) return

    const fetchTrendData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/trends?point=${encodeURIComponent(selectedPoint)}&range=${timeRange}`)
        if (!response.ok) throw new Error('Failed to fetch trend data')
        const data = await response.json()
        setTrendData(data.data || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchTrendData()
  }, [selectedPoint, timeRange])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Trend Charts</h2>
        <p className="text-muted-foreground">Historical time-series data visualization</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Point</label>
          <select
            value={selectedPoint}
            onChange={(e) => setSelectedPoint(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">-- Select a point --</option>
            {points.map((point, index) => (
              <option key={index} value={point.haystackName}>
                {point.pointName} ({point.haystackName})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Time Range</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="1h">Last 1 Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
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
          <p className="mt-4 text-muted-foreground">Loading trend data...</p>
        </div>
      )}

      {/* Chart */}
      {!loading && selectedPoint && trendData.length > 0 && (
        <div className="bg-card border rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">
            {points.find(p => p.haystackName === selectedPoint)?.pointName || selectedPoint}
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })
                }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => formatTimestamp(value)}
                formatter={(value: number) => [value.toFixed(2), 'Value']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                name="Value"
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Data Points</div>
              <div className="text-2xl font-bold">{trendData.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Min Value</div>
              <div className="text-2xl font-bold">
                {Math.min(...trendData.map(d => d.value)).toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Max Value</div>
              <div className="text-2xl font-bold">
                {Math.max(...trendData.map(d => d.value)).toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Average</div>
              <div className="text-2xl font-bold">
                {(trendData.reduce((sum, d) => sum + d.value, 0) / trendData.length).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Selection */}
      {!selectedPoint && (
        <div className="text-center py-12 text-muted-foreground">
          Please select a point to view trend data.
        </div>
      )}

      {/* No Data */}
      {!loading && selectedPoint && trendData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No trend data available for the selected time range.
        </div>
      )}
    </div>
  )
}
