import { NextResponse } from 'next/server'
import { queryTimescaleDB } from '@/lib/timescaledb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '100')

    // Get latest value for each unique point (much faster than scanning 1 day of data)
    const query = `
      SELECT DISTINCT ON (haystack_name)
        COALESCE(dis, haystack_name) as point_name,
        haystack_name,
        value,
        units,
        quality,
        time,
        EXTRACT(EPOCH FROM (NOW() - time)) as age_seconds
      FROM sensor_readings
      WHERE
        time > NOW() - INTERVAL '1 hour'
        AND ($1 = '' OR COALESCE(dis, haystack_name) ILIKE $1)
      ORDER BY haystack_name, time DESC
      LIMIT $2
    `

    const rows = await queryTimescaleDB(query, [
      search ? `%${search}%` : '',
      limit
    ])

    const points = rows.map((row: any) => ({
      pointName: row.point_name,
      haystackName: row.haystack_name,
      value: parseFloat(row.value),
      units: row.units,
      quality: row.quality,
      timestamp: row.time,
      ageSeconds: parseFloat(row.age_seconds),
      freshnessStatus:
        row.age_seconds < 60 ? 'fresh' :
        row.age_seconds < 300 ? 'recent' : 'stale'
    }))

    return NextResponse.json({
      points,
      total: points.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching points:', error)
    return NextResponse.json(
      { error: 'Failed to fetch points', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
