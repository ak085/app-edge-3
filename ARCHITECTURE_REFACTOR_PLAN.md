# Architecture Refactor Plan

## Status: COMPLETED (2025-12-15)

This refactor has been successfully implemented.

---

## Summary of Changes

### What Was Done

1. **Separated Storage Stack**
   - Created `docker-compose-storage.yml` with TimescaleDB + Telegraf
   - Removed timescaledb and telegraf from main `docker-compose.yml`
   - Storage stack can be deployed independently

2. **Simplified Main Stack**
   - Main stack now contains only: PostgreSQL, Frontend, Worker
   - Removed all TimescaleDB dependencies from worker
   - Dashboard shows point values from PostgreSQL (lastValue field)

3. **Removed Monitoring Page**
   - Deleted monitoring page (SSE stream, export API)
   - Updated navigation to remove Monitoring link
   - Dashboard refresh now uses poll interval from settings

4. **Enhanced Polling**
   - Minute-aligned polling (starts at second :00)
   - Dashboard auto-refresh matches poll interval
   - All publishing points shown (not just top 10)

5. **Standalone Telegraf Support**
   - Telegraf can run without BacPipes config database
   - Uses environment variables when CONFIG_DB_HOST is empty

---

## Current Architecture

### Main Stack (docker-compose.yml)
```
- PostgreSQL (port 5434) - Configuration database
- Frontend (port 3001) - Next.js web UI
- BACnet Worker (host network) - Polling and MQTT publishing
```

### Storage Stack (docker-compose-storage.yml) - Optional
```
- TimescaleDB (port 5435) - Time-series storage
- Telegraf - MQTT to TimescaleDB bridge
```

---

## Deployment Options

1. **Edge-only**: `docker compose up -d`
   - No historical storage
   - Dashboard shows latest values from PostgreSQL

2. **With Storage**: Both stacks on same machine
   ```bash
   docker compose up -d
   docker compose -f docker-compose-storage.yml up -d
   ```

3. **Distributed**: Main on edge, Storage on central server
   - Deploy main stack on edge device
   - Deploy storage stack on separate server
   - Configure Telegraf with MQTT broker IP

---

## Files Changed

### Created
- `docker-compose-storage.yml`

### Modified
- `docker-compose.yml` - Removed timescaledb, telegraf
- `worker/mqtt_publisher.py` - Removed TimescaleDB writes, added minute-aligned polling
- `frontend/src/app/page.tsx` - Dynamic refresh interval, removed Monitoring card
- `frontend/src/app/api/dashboard/summary/route.ts` - Return all points
- `frontend/src/components/Navigation.tsx` - Removed Monitoring link
- `telegraf/mqtt_to_timescaledb.py` - Made CONFIG_DB optional

### Deleted
- `frontend/src/app/monitoring/` - Entire directory
- `frontend/src/app/api/monitoring/` - SSE stream API
- `frontend/src/app/api/timeseries/` - Export API

---

## Success Criteria (All Completed)

- [x] Dashboard shows recent values from PostgreSQL (not TimescaleDB)
- [x] Monitoring page is removed
- [x] Navigation has no Monitoring link
- [x] Worker minute-aligned polling (starts at :00)
- [x] Dashboard auto-refresh matches poll interval
- [x] Storage stack separated into docker-compose-storage.yml
- [x] CLAUDE.md updated
- [x] README.md updated
