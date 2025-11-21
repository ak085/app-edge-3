import { NextResponse } from 'next/server'
import { queryTimescaleDB } from '@/lib/timescaledb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const point = searchParams.get('point')
    const range = searchParams.get('range') || '1h'

    if (!point) {
      return NextResponse.json(
        { error: 'Point parameter is required' },
        { status: 400 }
      )
    }

    // Calculate time range
    const intervals: { [key: string]: string } = {
      '1h': '1 hour',
      '6h': '6 hours',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days'
    }

    const interval = intervals[range] || '1 hour'

    const query = `
      SELECT
        time as timestamp,
        value::float as value
      FROM sensor_readings
      WHERE haystack_name = $1
        AND time > NOW() - INTERVAL '${interval}'
      ORDER BY time ASC
    `

    const rows = await queryTimescaleDB(query, [point])

    return NextResponse.json({
      point,
      range,
      data: rows,
      count: rows.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching trend data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trend data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
