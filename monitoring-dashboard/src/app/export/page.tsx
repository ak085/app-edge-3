'use client'

import { useState } from 'react'
import { formatTimestamp } from '@/lib/utils'

export default function ExportPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [format, setFormat] = useState<'long' | 'wide'>('long')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        format
      })

      const response = await fetch(`/api/export?${params}`)
      if (!response.ok) throw new Error('Export failed')

      // Download the CSV file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bacpipes_export_${startDate}_to_${endDate}_${format}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const setQuickRange = (hours: number) => {
    const now = new Date()
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000)
    setEndDate(now.toISOString().slice(0, 16))
    setStartDate(start.toISOString().slice(0, 16))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Export CSV</h2>
        <p className="text-muted-foreground">Download historical data in CSV format</p>
      </div>

      {/* Export Form */}
      <div className="bg-card border rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Export Configuration</h3>

        {/* Quick Range Buttons */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Quick Ranges</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQuickRange(1)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
            >
              Last 1 Hour
            </button>
            <button
              onClick={() => setQuickRange(6)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
            >
              Last 6 Hours
            </button>
            <button
              onClick={() => setQuickRange(24)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
            >
              Last 24 Hours
            </button>
            <button
              onClick={() => setQuickRange(168)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
            >
              Last 7 Days
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date & Time</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date & Time</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Output Format</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="format"
                value="long"
                checked={format === 'long'}
                onChange={(e) => setFormat(e.target.value as 'long' | 'wide')}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">Long Format (Normalized)</div>
                <div className="text-sm text-muted-foreground">
                  One row per reading: timestamp, point_name, value, units, quality
                </div>
              </div>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="format"
                value="wide"
                checked={format === 'wide'}
                onChange={(e) => setFormat(e.target.value as 'long' | 'wide')}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">Wide Format (Time Series)</div>
                <div className="text-sm text-muted-foreground">
                  One column per point: timestamp, point1, point2, point3, ...
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={!startDate || !endDate || loading}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Exporting...' : 'Export CSV'}
        </button>

        {/* Success Message */}
        {success && (
          <div className="mt-4 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded">
            <strong>Success:</strong> CSV file downloaded successfully
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Format Examples */}
      <div className="bg-card border rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Format Examples</h3>

        <div className="space-y-6">
          {/* Long Format Example */}
          <div>
            <h4 className="font-semibold mb-2">Long Format (Normalized)</h4>
            <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto">
              <pre>
timestamp,point_name,haystack_name,value,units,quality
2025-11-17 10:00:00,Supply Air Temp,klcc.ahu.12...,22.5,degreesCelsius,good
2025-11-17 10:00:00,Return Air Temp,klcc.ahu.12...,24.0,degreesCelsius,good
2025-11-17 10:01:00,Supply Air Temp,klcc.ahu.12...,22.6,degreesCelsius,good
              </pre>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Best for: Data analysis, database import, long-term storage
            </p>
          </div>

          {/* Wide Format Example */}
          <div>
            <h4 className="font-semibold mb-2">Wide Format (Time Series)</h4>
            <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto">
              <pre>
timestamp,Supply Air Temp,Return Air Temp,Cooling Valve
2025-11-17 10:00:00,22.5,24.0,45.0
2025-11-17 10:01:00,22.6,24.1,46.0
2025-11-17 10:02:00,22.7,24.2,47.0
              </pre>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Best for: Excel analysis, plotting, quick visualization
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-card border rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Tips</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>Large date ranges may take several minutes to export</li>
          <li>Wide format works best for smaller datasets (&lt;100 points)</li>
          <li>Long format is more efficient for large datasets</li>
          <li>CSV files can be opened in Excel, Google Sheets, or imported into databases</li>
          <li>Timestamps are in server timezone (Asia/Kuala_Lumpur)</li>
        </ul>
      </div>
    </div>
  )
}
