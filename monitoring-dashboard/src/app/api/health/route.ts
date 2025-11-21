import { NextResponse } from 'next/server'
import { queryTimescaleDB } from '@/lib/timescaledb'

export async function GET() {
  try {
    // Use approximate row count for speed (much faster than COUNT(*))
    const approxCountQuery = `
      SELECT n_live_tup::bigint as approximate_count
      FROM pg_stat_user_tables
      WHERE relname = 'sensor_readings'
    `
    const approxResult = await queryTimescaleDB(approxCountQuery)
    const totalRecords = parseInt(approxResult[0]?.approximate_count || '0')

    // Combine multiple stats into single query for efficiency (last 1 day only for speed)
    const combinedStatsQuery = `
      SELECT
        COUNT(DISTINCT haystack_name) as unique_points,
        MIN(time) as oldest,
        MAX(time) as newest,
        COUNT(*) FILTER (WHERE time > NOW() - INTERVAL '1 hour') as recent_count,
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        pg_size_pretty(pg_total_relation_size('sensor_readings')) as table_size,
        pg_size_pretty(pg_indexes_size('sensor_readings')) as index_size
      FROM sensor_readings
      WHERE time > NOW() - INTERVAL '1 day'
    `
    const stats = await queryTimescaleDB(combinedStatsQuery)

    const uniquePoints = parseInt(stats[0]?.unique_points || '0')
    const oldestTimestamp = stats[0]?.oldest || new Date().toISOString()
    const newestTimestamp = stats[0]?.newest || new Date().toISOString()
    const recentCount = parseInt(stats[0]?.recent_count || '0')
    const dataRate = recentCount / 60 // records per minute
    const databaseSize = stats[0]?.database_size || 'Unknown'
    const tableSize = stats[0]?.table_size || 'Unknown'
    const indexSize = stats[0]?.index_size || 'Unknown'

    // Get per-point statistics (top 20 by record count, last 1 day only for speed)
    const pointStatsQuery = `
      SELECT
        COALESCE(dis, haystack_name) as point_name,
        haystack_name,
        COUNT(*) as count,
        MIN(time) as first_reading,
        MAX(time) as last_reading,
        AVG(value::float) as avg_value
      FROM sensor_readings
      WHERE time > NOW() - INTERVAL '1 day'
      GROUP BY haystack_name, dis
      ORDER BY count DESC
      LIMIT 20
    `
    const pointStats = await queryTimescaleDB(pointStatsQuery)

    return NextResponse.json({
      totalRecords,
      uniquePoints,
      oldestTimestamp,
      newestTimestamp,
      databaseSize,
      tableSize,
      indexSize,
      dataRate,
      pointStats: pointStats.map((row: any) => ({
        pointName: row.point_name,
        haystackName: row.haystack_name,
        count: parseInt(row.count),
        firstReading: row.first_reading,
        lastReading: row.last_reading,
        avgValue: parseFloat(row.avg_value)
      })),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching health stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
