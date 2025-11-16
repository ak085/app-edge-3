# BacPipes Monitoring Dashboard Plan

**Date**: 2025-11-16
**Status**: Planning Phase
**Decision**: Remove Grafana, Build Separate Standalone Monitoring Application

---

## Executive Summary

### Problem Statement

Grafana has proven fragile and unsuitable for BacPipes monitoring needs:
- Breaks after database maintenance operations (TRUNCATE)
- Requires days of configuration
- Configuration not reliably persistent
- Overkill for simple monitoring requirements
- Adds unnecessary complexity

### Solution

Build a **separate standalone Next.js monitoring dashboard** that:
- Queries TimescaleDB directly for live values and trends
- Provides simple, reliable data visualization
- Runs independently from main BacPipes frontend (port 3002)
- Zero risk to existing BACnet discovery/configuration operations
- Easy to maintain, modify, and enhance

---

## Architectural Decision: Separate Standalone Application ⭐

### Recommendation: Option B - Separate Application

**Architecture**:
```
BacPipes Ecosystem
│
├── Port 3001: Frontend (BACnet Operations)
│   ├── Discovery & Device Management
│   ├── Point Configuration & Haystack Tagging
│   ├── MQTT Control & Write Commands
│   └── Settings & Export/Import
│
├── Port 3002: Monitoring Dashboard (NEW - Standalone)
│   ├── Live Values Display
│   ├── Trend Charts & Gauges
│   ├── CSV Export
│   └── Database Health Monitoring
│
├── PostgreSQL (5434): Configuration Database
│   └── Devices, Points, MQTT Config
│
└── TimescaleDB (5432): Time-Series Database
    └── sensor_readings table (polled values)
```

### Why Separate Application?

**1. Risk Elimination** 🛡️
- Existing frontend handles critical BACnet operations (discovery, configuration, MQTT publishing)
- Any bugs in monitoring code could break production operations
- Separation guarantees **zero risk** to existing functionality
- "i do not want to indenger what done" - your exact concern addressed

**2. Development Independence** 🚀
- Work on monitoring dashboard without fear of breaking BACnet operations
- Restart, rebuild, experiment freely
- Isolated debugging (separate logs, separate processes)
- Faster iteration cycles

**3. Operational Resilience** 💪
- Monitoring is read-only (queries TimescaleDB)
- If monitoring crashes, BACnet operations continue unaffected
- Different restart/update cycles for each concern
- Can test monitoring on local machine while production runs remotely

**4. Aligned with Docker Philosophy** 🐳
- Single-responsibility containers
- Each service does one thing well
- Easier to scale, replace, or improve independently
- Already proven pattern: worker, database, MQTT are separate services

**5. Future Flexibility** 🔮
- Different monitoring needs may require different approaches:
  - WebSocket for real-time updates
  - Different charting library
  - Mobile app integration
  - External API for third-party tools
- Easier to implement in isolated app

**6. Simplified Deployment** 📦
- Can deploy monitoring dashboard separately
- Test monitoring on dev machine before production
- Rollback monitoring without affecting main app
- Clean separation of concerns

### Comparison: Integrated vs. Separate

| Aspect | Integrated (Option A) | Separate (Option B) ✅ |
|--------|----------------------|----------------------|
| **Risk to existing features** | High - shared codebase | Zero - isolated |
| **Development speed** | Slower - must test all pages | Faster - isolated testing |
| **Debugging complexity** | High - intertwined code | Low - clear boundaries |
| **Restart impact** | Affects all features | Only monitoring |
| **Codebase size** | Large monolith | Two focused apps |
| **Port management** | 1 port | 2 ports (minimal overhead) |
| **Docker services** | 1 frontend | 2 frontends (negligible resources) |
| **Future modifications** | Risky - might break other pages | Safe - isolated changes |

---

## Phase 1: Remove Grafana

### Step 1.1: Backup Grafana Configuration

**Purpose**: Preserve dashboard design for reference

**Actions**:
```bash
# Create backup directory
mkdir -p /home/ak101/BacPipes/trash/grafana_backup_2025-11-16

# Backup Grafana volume data
docker run --rm -v bacpipes_grafana_data:/data -v /home/ak101/BacPipes/trash/grafana_backup_2025-11-16:/backup alpine tar czf /backup/grafana_data.tar.gz -C /data .

# Copy dashboard JSON files
cp -r /home/ak101/BacPipes/grafana/provisioning/dashboards /home/ak101/BacPipes/trash/grafana_backup_2025-11-16/

# Document current dashboard structure
cat > /home/ak101/BacPipes/trash/grafana_backup_2025-11-16/DASHBOARD_PANELS.md << 'EOF'
# Grafana Dashboard Panels (Reference)

## BacPipes Local Monitoring Dashboard

### Panel 1: Total Readings (24h)
- Type: Stat
- Query: `SELECT COALESCE(COUNT(*), 0) FROM sensor_readings WHERE time > NOW() - INTERVAL '24 hours'`
- Color: Blue
- Purpose: Show total data points in last 24 hours

### Panel 2: Active Points (5min)
- Type: Stat
- Query: `SELECT COUNT(DISTINCT COALESCE(dis, haystack_name)) FROM sensor_readings WHERE time > NOW() - INTERVAL '5 minutes'`
- Color: Green
- Purpose: Show number of unique points with recent data

### Panel 3: Ingestion Rate
- Type: Stat
- Query: `SELECT COUNT(*)::float / 60 FROM sensor_readings WHERE time > NOW() - INTERVAL '1 minute'`
- Units: reqps (readings per second)
- Color: Purple
- Purpose: Show data ingestion rate

### Panel 4: Good Readings % (1h)
- Type: Stat
- Query: `SELECT COALESCE((COUNT(*) FILTER (WHERE quality = 'good')::float / NULLIF(COUNT(*), 0) * 100), 0) FROM sensor_readings WHERE time > NOW() - INTERVAL '1 hour'`
- Units: Percent
- Color: Green (>99%), Yellow (>95%), Red (<95%)
- Purpose: Data quality indicator

### Panel 5: Timeline Trend
- Type: Time Series
- Query: `SELECT time, value, COALESCE(dis, haystack_name) as metric FROM sensor_readings WHERE $__timeFilter(time) ORDER BY time`
- Purpose: Show all points over time
- Features: Multi-line chart, legend with stats (last, min, max, mean)

EOF
```

### Step 1.2: Stop Grafana Service

**Actions**:
```bash
cd /home/ak101/BacPipes

# Stop Grafana container
docker compose stop grafana

# Verify stopped
docker compose ps grafana
```

### Step 1.3: Remove Grafana from Docker Compose

**File**: `/home/ak101/BacPipes/docker-compose.yml`

**Change**: Comment out or remove Grafana service:

```yaml
# grafana:
#   image: grafana/grafana-oss:latest
#   container_name: bacpipes-grafana
#   ports:
#     - "3002:3000"
#   environment:
#     - GF_SECURITY_ADMIN_USER=admin
#     - GF_SECURITY_ADMIN_PASSWORD=admin
#     - GF_AUTH_ANONYMOUS_ENABLED=true
#     - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
#     - TZ=Asia/Kuala_Lumpur
#   volumes:
#     - grafana_data:/var/lib/grafana
#     - ./grafana/provisioning:/etc/grafana/provisioning
#   depends_on:
#     - timescaledb
#   networks:
#     - bacnet-network
#   restart: unless-stopped
```

### Step 1.4: Clean Up Grafana Files

**Actions**:
```bash
# Move Grafana configuration to archive
mv /home/ak101/BacPipes/grafana /home/ak101/BacPipes/trash/grafana_config_archived

# Remove Grafana volume (optional - only after monitoring dashboard is working)
# docker volume rm bacpipes_grafana_data
```

### Step 1.5: Update Documentation

**Files to Update**:
- README.md: Remove Grafana references
- docker-compose.yml: Remove Grafana service
- .env: Remove Grafana environment variables

**Actions**:
```bash
# Remove Grafana documentation
rm -f /home/ak101/BacPipes/doc/GRAFANA_CLIENT_VIEWING.md
rm -f /home/ak101/BacPipes/doc/GRAFANA_WRITE_CAPABILITIES.md
```

---

## Phase 2: Build Monitoring Dashboard (Standalone Application)

### Architecture

```
monitoring-dashboard/
├── Dockerfile
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── .env
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Live values dashboard
│   │   ├── trends/
│   │   │   └── page.tsx        # Historical charts
│   │   ├── export/
│   │   │   └── page.tsx        # CSV export
│   │   ├── health/
│   │   │   └── page.tsx        # Database health
│   │   └── api/
│   │       ├── points/
│   │       │   └── route.ts    # Get all points with latest values
│   │       ├── trends/
│   │       │   └── route.ts    # Get historical data for charts
│   │       ├── export/
│   │       │   └── route.ts    # Export CSV
│   │       └── health/
│   │           └── route.ts    # Database health stats
│   ├── components/
│   │   ├── PointsTable.tsx     # Live values table
│   │   ├── TrendChart.tsx      # Time-series chart
│   │   ├── StatCard.tsx        # Summary statistics
│   │   ├── Gauge.tsx           # Gauge visualization
│   │   └── ui/                 # Shadcn components
│   └── lib/
│       ├── timescaledb.ts      # TimescaleDB connection
│       └── utils.ts
└── public/
```

### Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn/ui (Slate theme)
- **Charts**: Recharts or Chart.js
- **Icons**: Lucide React
- **Database**: Direct TimescaleDB connection via `pg` (node-postgres)
- **Deployment**: Docker Compose (port 3002)

**Note**: NO Prisma ORM needed - simple read-only queries to TimescaleDB

### Database Connection Pattern

```typescript
// lib/timescaledb.ts
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.TIMESCALEDB_HOST || 'localhost',
  port: parseInt(process.env.TIMESCALEDB_PORT || '5432'),
  database: process.env.TIMESCALEDB_DATABASE || 'timescaledb',
  user: process.env.TIMESCALEDB_USER || 'anatoli',
  password: process.env.TIMESCALEDB_PASSWORD || '',
  max: 5, // Small pool for read-only queries
})

export async function queryTimescaleDB(sql: string, params: any[] = []) {
  const client = await pool.connect()
  try {
    const result = await client.query(sql, params)
    return result.rows
  } finally {
    client.release()
  }
}

export default pool
```

---

## Phase 3: Dashboard Features (MVP)

### Feature 1: Live Values Dashboard (Home Page)

**URL**: http://192.168.1.35:3002

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  BacPipes Monitoring Dashboard                          │
├─────────────────────────────────────────────────────────┤
│  [Live] [Trends] [Export] [Health]                      │
├─────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ Total      │  │ Active     │  │ Quality    │       │
│  │ Readings   │  │ Points     │  │ 99.5%      │       │
│  │ 58,243     │  │ 25         │  │ Good       │       │
│  └────────────┘  └────────────┘  └────────────┘       │
├─────────────────────────────────────────────────────────┤
│  Live Point Values                    🔄 Auto-refresh  │
│  ┌─────────────────────────────────────────────────────┤
│  │ Point Name            │ Value  │ Units │ Updated   │
│  ├─────────────────────────────────────────────────────┤
│  │ Supply Air Temp       │ 22.5   │ °C    │ 5s ago 🟢│
│  │ Return Air Temp       │ 24.0   │ °C    │ 5s ago 🟢│
│  │ Cooling Valve Pos     │ 45%    │ %     │ 5s ago 🟢│
│  │ Fan Speed Command     │ 75%    │ %     │ 5s ago 🟢│
│  │ Mixed Air Temp        │ 23.2   │ °C    │ 3m ago 🟡│
│  └─────────────────────────────────────────────────────┘
│  📊 Search: [________] Filter: [All Points ▼]          │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Auto-refresh every 10 seconds (configurable)
- Color-coded freshness:
  - 🟢 Green: < 1 minute
  - 🟡 Yellow: 1-5 minutes
  - 🔴 Red: > 5 minutes (stale)
- Search/filter by point name
- Filter by device (dropdown)
- Sort by any column
- Pagination (50 rows per page)

**API Endpoint**:
```typescript
// app/api/points/route.ts
import { queryTimescaleDB } from '@/lib/timescaledb'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const query = `
    WITH latest_values AS (
      SELECT DISTINCT ON (COALESCE(dis, haystack_name))
        COALESCE(dis, haystack_name) as point_name,
        haystack_name,
        value,
        units,
        quality,
        time,
        NOW() - time as age
      FROM sensor_readings
      WHERE
        ($1 = '' OR COALESCE(dis, haystack_name) ILIKE $1)
      ORDER BY COALESCE(dis, haystack_name), time DESC
    )
    SELECT
      point_name,
      haystack_name,
      value,
      units,
      quality,
      time,
      EXTRACT(EPOCH FROM age) as age_seconds
    FROM latest_values
    ORDER BY age ASC
    LIMIT $2 OFFSET $3
  `

  const rows = await queryTimescaleDB(query, [
    search ? `%${search}%` : '',
    limit,
    offset
  ])

  return Response.json({
    points: rows.map(row => ({
      pointName: row.point_name,
      haystackName: row.haystack_name,
      value: row.value,
      units: row.units,
      quality: row.quality,
      timestamp: row.time,
      ageSeconds: parseFloat(row.age_seconds),
      freshnessStatus:
        row.age_seconds < 60 ? 'fresh' :
        row.age_seconds < 300 ? 'recent' : 'stale'
    })),
    total: rows.length
  })
}
```

### Feature 2: Trend Charts

**URL**: http://192.168.1.35:3002/trends

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Historical Trends                                      │
├─────────────────────────────────────────────────────────┤
│  Point: [Supply Air Temp ▼]                            │
│  Period: [Last 1 Hour ▼] [Last 6 Hours] [Last 24 Hours]│
│  ┌─────────────────────────────────────────────────────┐│
│  │         Supply Air Temperature (°C)                 ││
│  │  24 ┤                                ╭──────╮       ││
│  │     │                       ╭────────╯      │       ││
│  │  23 ┤              ╭────────╯               │       ││
│  │     │     ╭────────╯                        │       ││
│  │  22 ┼─────╯                                 ╰───────┤│
│  │     └───────┬────────┬────────┬────────┬────────────┘│
│  │          10:00    10:15    10:30    10:45    11:00  ││
│  └─────────────────────────────────────────────────────┘│
│  Stats: Min: 22.1°C  Max: 24.3°C  Avg: 23.2°C          │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Select point from dropdown
- Time period selection (1h, 6h, 24h, custom)
- Interactive chart (zoom, pan, tooltip)
- Min/Max/Average statistics
- Export chart as image

**API Endpoint**:
```typescript
// app/api/trends/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pointName = searchParams.get('point')
  const period = searchParams.get('period') || '1h' // 1h, 6h, 24h

  const intervalMap = {
    '1h': '1 hour',
    '6h': '6 hours',
    '24h': '24 hours',
    '7d': '7 days',
  }

  const query = `
    SELECT
      time_bucket('1 minute', time) as bucket,
      AVG(value) as value,
      MIN(value) as min_value,
      MAX(value) as max_value,
      COALESCE(dis, haystack_name) as point_name,
      units
    FROM sensor_readings
    WHERE
      COALESCE(dis, haystack_name) = $1
      AND time > NOW() - INTERVAL '${intervalMap[period as keyof typeof intervalMap]}'
    GROUP BY bucket, point_name, units
    ORDER BY bucket ASC
  `

  const rows = await queryTimescaleDB(query, [pointName])

  return Response.json({
    pointName,
    period,
    data: rows.map(row => ({
      timestamp: row.bucket,
      value: parseFloat(row.value),
      min: parseFloat(row.min_value),
      max: parseFloat(row.max_value),
    })),
    units: rows[0]?.units || '',
    stats: {
      min: Math.min(...rows.map((r: any) => parseFloat(r.min_value))),
      max: Math.max(...rows.map((r: any) => parseFloat(r.max_value))),
      avg: rows.reduce((sum: number, r: any) => sum + parseFloat(r.value), 0) / rows.length,
    }
  })
}
```

### Feature 3: CSV Export

**URL**: http://192.168.1.35:3002/export

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Export Data to CSV                                     │
├─────────────────────────────────────────────────────────┤
│  ┌─ Export Options ───────────────────────────────────┐ │
│  │                                                     │ │
│  │  Time Period:                                       │ │
│  │  ○ Last 1 Hour                                      │ │
│  │  ○ Last 6 Hours                                     │ │
│  │  ○ Last 24 Hours                                    │ │
│  │  ● Custom Range                                     │ │
│  │    From: [2025-11-16 10:00] To: [2025-11-16 11:00] │ │
│  │                                                     │ │
│  │  Points to Export:                                  │ │
│  │  ☑ All Points (25)                                  │ │
│  │  ☐ Select Specific Points                          │ │
│  │                                                     │ │
│  │  Format:                                            │ │
│  │  ● Wide Format (one column per point)              │ │
│  │  ○ Long Format (timestamp, point, value)           │ │
│  │                                                     │ │
│  │  [Export CSV]                                       │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  Preview (first 10 rows):                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │ timestamp           │ point       │ value  │ units │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ 2025-11-16 10:00:00│ Supply Temp │ 22.5   │ °C    │ │
│  │ 2025-11-16 10:01:00│ Supply Temp │ 22.6   │ °C    │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Custom time range selection
- Select specific points or all
- Wide format (columns: timestamp, point1, point2, ...) or Long format (rows)
- Preview before download
- Filename: `bacpipes_export_2025-11-16_10-00.csv`

**API Endpoint**:
```typescript
// app/api/export/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startTime = searchParams.get('start')
  const endTime = searchParams.get('end')
  const format = searchParams.get('format') || 'long' // long | wide

  const query = `
    SELECT
      time,
      COALESCE(dis, haystack_name) as point_name,
      value,
      units,
      quality
    FROM sensor_readings
    WHERE
      time >= $1::timestamp
      AND time <= $2::timestamp
    ORDER BY time ASC, point_name ASC
  `

  const rows = await queryTimescaleDB(query, [startTime, endTime])

  if (format === 'long') {
    // Long format: timestamp,point,value,units,quality
    const csv = [
      'timestamp,point,value,units,quality',
      ...rows.map((r: any) =>
        `${r.time},${r.point_name},${r.value},${r.units},${r.quality}`
      )
    ].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="bacpipes_export_${new Date().toISOString().slice(0, 16)}.csv"`
      }
    })
  } else {
    // Wide format: pivot to columns
    // (Implementation more complex - pivot points into columns)
  }
}
```

### Feature 4: Database Health

**URL**: http://192.168.1.35:3002/health

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Database Health & Statistics                           │
├─────────────────────────────────────────────────────────┤
│  ┌─ TimescaleDB Status ──────────────────────────────┐ │
│  │ Status: 🟢 Healthy                                 │ │
│  │ Version: TimescaleDB 2.14.0 on PostgreSQL 15.3    │ │
│  │ Uptime: 5 days 3 hours                             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─ Data Statistics ─────────────────────────────────┐ │
│  │ Total Rows: 58,243                                 │ │
│  │ Oldest Data: 2025-11-16 00:00:00                   │ │
│  │ Newest Data: 2025-11-16 11:30:00                   │ │
│  │ Active Points: 25                                  │ │
│  │ Data Quality (24h): 99.5% Good                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─ Storage ─────────────────────────────────────────┐ │
│  │ Table Size: 12.5 MB                                │ │
│  │ Index Size: 3.2 MB                                 │ │
│  │ Total Size: 15.7 MB                                │ │
│  │ Retention Policy: 30 days                          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─ Ingestion Rate ──────────────────────────────────┐ │
│  │ Last Minute: 25 readings                           │ │
│  │ Last Hour: 1,500 readings                          │ │
│  │ Last 24 Hours: 36,000 readings                     │ │
│  │ Average Rate: 0.42 readings/second                 │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**API Endpoint**:
```typescript
// app/api/health/route.ts
export async function GET() {
  // Database version
  const versionQuery = 'SELECT version()'
  const version = await queryTimescaleDB(versionQuery)

  // Data statistics
  const statsQuery = `
    SELECT
      COUNT(*) as total_rows,
      MIN(time) as oldest_data,
      MAX(time) as newest_data,
      COUNT(DISTINCT COALESCE(dis, haystack_name)) as active_points,
      pg_size_pretty(pg_total_relation_size('sensor_readings')) as table_size
    FROM sensor_readings
  `
  const stats = await queryTimescaleDB(statsQuery)

  // Quality statistics
  const qualityQuery = `
    SELECT
      COUNT(*) FILTER (WHERE quality = 'good')::float / COUNT(*) * 100 as good_percentage
    FROM sensor_readings
    WHERE time > NOW() - INTERVAL '24 hours'
  `
  const quality = await queryTimescaleDB(qualityQuery)

  // Ingestion rates
  const ingestionQuery = `
    SELECT
      COUNT(*) FILTER (WHERE time > NOW() - INTERVAL '1 minute') as last_minute,
      COUNT(*) FILTER (WHERE time > NOW() - INTERVAL '1 hour') as last_hour,
      COUNT(*) FILTER (WHERE time > NOW() - INTERVAL '24 hours') as last_24h
    FROM sensor_readings
  `
  const ingestion = await queryTimescaleDB(ingestionQuery)

  return Response.json({
    database: {
      version: version[0].version,
      status: 'healthy',
    },
    data: stats[0],
    quality: quality[0],
    ingestion: ingestion[0],
  })
}
```

---

## Phase 4: Docker Compose Integration

### Add Monitoring Service to docker-compose.yml

```yaml
services:
  # ... existing services (postgres, frontend, bacnet-worker, timescaledb, etc.)

  monitoring:
    build: ./monitoring-dashboard
    container_name: bacpipes-monitoring
    ports:
      - "3002:3000"  # Use port 3002 (same as old Grafana)
    environment:
      - TIMESCALEDB_HOST=timescaledb
      - TIMESCALEDB_PORT=5432
      - TIMESCALEDB_DATABASE=timescaledb
      - TIMESCALEDB_USER=anatoli
      - TIMESCALEDB_PASSWORD=${TIMESCALEDB_PASSWORD:-}
      - TZ=Asia/Kuala_Lumpur
    depends_on:
      - timescaledb
    networks:
      - bacnet-network
    restart: unless-stopped
    volumes:
      - ./monitoring-dashboard:/app
      - /app/node_modules
      - /app/.next
```

### Dockerfile for Monitoring Dashboard

```dockerfile
# monitoring-dashboard/Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

---

## Phase 5: Testing & Validation

### Test Plan

**Test 1: Basic Functionality**
```bash
# Start services
cd /home/ak101/BacPipes
docker compose up -d

# Verify monitoring dashboard is running
docker compose ps monitoring
# Should show: Up

# Access dashboard
curl -I http://localhost:3002
# Should return: HTTP/1.1 200 OK

# Open in browser
# http://192.168.1.35:3002
# Should show live values dashboard
```

**Test 2: Data Display**
```bash
# Verify points are displayed
# 1. Open http://192.168.1.35:3002
# 2. Should see table with all 25+ points
# 3. Values should auto-refresh every 10 seconds
# 4. Color coding should work (green for recent data)
```

**Test 3: Trend Charts**
```bash
# 1. Navigate to /trends page
# 2. Select a point from dropdown
# 3. Select time period (1h, 6h, 24h)
# 4. Verify chart displays correctly
# 5. Verify stats (min, max, avg) are accurate
```

**Test 4: CSV Export**
```bash
# 1. Navigate to /export page
# 2. Select time range
# 3. Click "Export CSV"
# 4. Verify file downloads
# 5. Open CSV - verify data is correct
```

**Test 5: Database Health**
```bash
# 1. Navigate to /health page
# 2. Verify all statistics are displayed
# 3. Verify database version shows correctly
# 4. Verify storage sizes are reasonable
```

**Test 6: Resilience**
```bash
# Test monitoring restart doesn't affect main app
docker compose restart monitoring

# Main BacPipes should continue:
# - BACnet discovery should work
# - MQTT publishing should continue
# - Points should still be polled

# Monitoring should come back up
curl http://localhost:3002
# Should return 200 OK
```

---

## Phase 6: Documentation Updates

### Files to Update

**1. README.md**
- Remove Grafana references
- Add monitoring dashboard section
- Update port reference (3002 = monitoring)

**2. docker-compose.yml**
- Remove Grafana service
- Add monitoring service
- Update comments

**3. .env**
- Remove Grafana variables
- Add TimescaleDB connection variables for monitoring

**4. New Documentation**
- Create `/home/ak101/BacPipes/doc/MONITORING_DASHBOARD.md`
- Document all features
- API reference
- Troubleshooting guide

---

## Implementation Timeline

### Estimated Time: 8-12 hours

**Phase 1: Remove Grafana** - 30 minutes
- Backup configuration ✓
- Stop service ✓
- Remove from docker-compose ✓
- Archive files ✓

**Phase 2: Build Monitoring App** - 4-6 hours
- Set up Next.js project (1h)
- Build live values page (2h)
- Build trends page (1.5h)
- Build export page (1h)
- Build health page (0.5h)

**Phase 3: Docker Integration** - 1 hour
- Write Dockerfile
- Update docker-compose.yml
- Test deployment

**Phase 4: Testing** - 1-2 hours
- Functional testing
- UI/UX refinement
- Performance testing

**Phase 5: Documentation** - 1 hour
- Update README
- Write monitoring guide
- API documentation

**Phase 6: Polish** - 1-2 hours
- UI improvements
- Error handling
- Loading states
- Responsive design

---

## Risks & Mitigation

### Risk 1: TimescaleDB Query Performance
**Impact**: Slow dashboard if database is large
**Mitigation**:
- Use TimescaleDB time_bucket for aggregations
- Add database indexes if needed
- Limit query time ranges
- Implement pagination

### Risk 2: Auto-Refresh Impact
**Impact**: High database load from frequent queries
**Mitigation**:
- Configurable refresh interval (default: 10s)
- Only query visible data (lazy loading)
- Use database connection pooling
- Cache recent queries (5-10 seconds)

### Risk 3: Chart Library Performance
**Impact**: Slow rendering with large datasets
**Mitigation**:
- Downsample data for long time ranges
- Use lightweight chart library (Recharts)
- Lazy load charts (only when visible)
- Limit data points (max 1000 per chart)

---

## Success Criteria

### Must Have ✅
- [ ] Live values dashboard displays all points
- [ ] Auto-refresh works (10 second intervals)
- [ ] Color-coded freshness indicators work
- [ ] Trend charts display historical data correctly
- [ ] CSV export works for custom time ranges
- [ ] Database health page shows accurate statistics
- [ ] Monitoring app runs on port 3002
- [ ] Independent restart (doesn't affect main BacPipes)
- [ ] No Grafana references remain in codebase

### Nice to Have 🎁
- [ ] Responsive design (works on mobile/tablet)
- [ ] Dark theme toggle
- [ ] Gauge visualizations for key points
- [ ] Alert thresholds (future)
- [ ] User preferences (save favorite points)
- [ ] Real-time WebSocket updates (instead of polling)

---

## Post-Implementation

### Maintenance
- Monitor dashboard performance
- Collect user feedback
- Iterate on UI/UX improvements
- Add features as needed (alerts, custom views, etc.)

### Future Enhancements
- Real-time updates via WebSocket
- Custom dashboard layouts
- Point comparison charts
- Anomaly detection visualization
- Mobile app integration
- API for third-party tools

---

## Appendix A: Comparison - Grafana vs Custom Dashboard

| Feature | Grafana | Custom Dashboard |
|---------|---------|-----------------|
| **Setup Time** | Hours/Days of configuration | Built for exact use case |
| **Reliability** | Breaks on data changes | Designed for resilience |
| **Customization** | Limited to Grafana capabilities | Full control over features |
| **Learning Curve** | Steep (requires Grafana expertise) | Familiar (Next.js/React) |
| **Maintenance** | Complex (versioning, plugins) | Simple (standard web app) |
| **Data Export** | Limited formats | Custom CSV with any structure |
| **Performance** | Heavy (Grafana overhead) | Lightweight (direct queries) |
| **Deployment** | Separate container + volume | Single container, simple |
| **Future Changes** | Risky (might break dashboards) | Easy (full code control) |

---

## Appendix B: MD File Housekeeping Plan

See separate section: [MD File Housekeeping](#md-file-housekeeping)

---

🤖 Generated with Claude Code
https://claude.com/claude-code

**Date**: 2025-11-16
**Author**: Claude (Anthropic)
**Project**: BacPipes - BACnet-to-MQTT Data Pipeline
