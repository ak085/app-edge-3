import { NextResponse } from 'next/server'
import { queryTimescaleDB } from '@/lib/timescaledb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'long'

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate parameters are required' },
        { status: 400 }
      )
    }

    let csvContent = ''

    if (format === 'long') {
      // Long format: one row per reading
      const query = `
        SELECT
          time as timestamp,
          COALESCE(dis, haystack_name) as point_name,
          haystack_name,
          value,
          units,
          quality
        FROM sensor_readings
        WHERE time >= $1::timestamp
          AND time <= $2::timestamp
        ORDER BY time ASC, haystack_name ASC
      `

      const rows = await queryTimescaleDB(query, [startDate, endDate])

      // CSV header
      csvContent = 'timestamp,point_name,haystack_name,value,units,quality\n'

      // CSV rows
      for (const row of rows) {
        csvContent += `${row.timestamp},${row.point_name},"${row.haystack_name}",${row.value},${row.units || ''},${row.quality}\n`
      }
    } else {
      // Wide format: one column per point
      // First, get list of unique points
      const pointsQuery = `
        SELECT DISTINCT COALESCE(dis, haystack_name) as point_name
        FROM sensor_readings
        WHERE time >= $1::timestamp
          AND time <= $2::timestamp
        ORDER BY point_name
      `

      const points = await queryTimescaleDB(pointsQuery, [startDate, endDate])
      const pointNames = points.map((p: any) => p.point_name)

      // Get all data
      const dataQuery = `
        SELECT
          time as timestamp,
          COALESCE(dis, haystack_name) as point_name,
          value
        FROM sensor_readings
        WHERE time >= $1::timestamp
          AND time <= $2::timestamp
        ORDER BY time ASC
      `

      const rows = await queryTimescaleDB(dataQuery, [startDate, endDate])

      // Build time series map
      const timeSeriesMap: { [timestamp: string]: { [point: string]: number } } = {}

      for (const row of rows) {
        const ts = row.timestamp.toISOString()
        if (!timeSeriesMap[ts]) {
          timeSeriesMap[ts] = {}
        }
        timeSeriesMap[ts][row.point_name] = parseFloat(row.value)
      }

      // CSV header
      csvContent = 'timestamp,' + pointNames.join(',') + '\n'

      // CSV rows
      for (const [timestamp, values] of Object.entries(timeSeriesMap)) {
        const row = [timestamp]
        for (const pointName of pointNames) {
          row.push(values[pointName]?.toString() || '')
        }
        csvContent += row.join(',') + '\n'
      }
    }

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="bacpipes_export_${format}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting CSV:', error)
    return NextResponse.json(
      { error: 'Failed to export CSV', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
