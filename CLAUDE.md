# BacPipes - AI Development Context

## Current Status (December 2025)

**Production Ready**: BACnet-to-MQTT edge gateway with web-based configuration.

**Core Features**:
- BACnet device/point discovery via web UI
- Haystack tagging (8-field semantic naming)
- MQTT publishing to external broker
- MQTT TLS/SSL with certificate verification
- MQTT authentication (username/password)
- BACnet write command support
- Automatic setup wizard for first-run
- Database-driven configuration (no .env editing needed)

---

## Architecture

```
┌─────────────────────────────────────────────┐
│ BacPipes (Docker Compose)                   │
├─────────────────────────────────────────────┤
│  Frontend (Next.js 15) - Port 3001          │
│  ├─ Dashboard                               │
│  ├─ Discovery                               │
│  ├─ Points (Haystack tagging)               │
│  └─ Settings                                │
│                                             │
│  PostgreSQL 15 - Port 5434                  │
│  └─ Devices, Points, Config                 │
│                                             │
│  BACnet Worker (Python/BACpypes3)           │
│  ├─ Polls BACnet devices                    │
│  ├─ Publishes to MQTT                       │
│  └─ Handles write commands                  │
└─────────────────────────────────────────────┘
                  ↓ MQTT
┌─────────────────────────────────────────────┐
│ External MQTT Broker                        │
│ - Supports TLS/SSL                          │
│ - Supports authentication                   │
└─────────────────────────────────────────────┘
```

---

## Technology Stack

- **Frontend**: Next.js 15 + TypeScript + Shadcn/ui
- **Database**: PostgreSQL 15
- **Worker**: Python 3.10 + BACpypes3 + paho-mqtt
- **Deployment**: Docker Compose

---

## Quick Commands

```bash
# Deploy
docker compose up -d

# Access UI
http://<your-ip>:3001

# View logs
docker compose logs -f bacnet-worker

# Restart worker
docker compose restart bacnet-worker

# Database access
docker exec -it bacpipes-postgres psql -U anatoli -d bacpipes
```

---

## Key Files

| File | Purpose |
|------|---------|
| `worker/mqtt_publisher.py` | Main BACnet polling and MQTT publishing |
| `worker/discovery.py` | BACnet device/point discovery |
| `frontend/src/app/page.tsx` | Dashboard |
| `frontend/src/app/settings/page.tsx` | Settings UI |
| `frontend/prisma/schema.prisma` | Database schema |

---

## Recent Changes

### 2025-12-14: MQTT TLS Support Complete

**Full TLS/SSL support for MQTT connections**:
- Worker supports TLS with certificate verification
- Frontend SSE stream supports TLS (`mqtts://` protocol)
- Write API supports TLS
- Certificate file upload via Settings UI
- Insecure mode option for self-signed certs

**Key implementation details**:
- When TLS insecure mode is ON, don't pass CA cert to `tls_set()` - it would still trigger IP verification
- Certificate files must be readable by worker container (mode `0o644`)
- Worker: `worker/mqtt_publisher.py` lines 420-450
- Frontend SSE: `frontend/src/app/api/monitoring/stream/route.ts` lines 57-93
- Write API: `frontend/src/app/api/bacnet/write/route.ts` lines 113-143

### 2025-12-13: Setup Wizard & Config Hot-Reload

**Automatic setup wizard for fresh deployments**:
- First-run wizard auto-detects network interfaces
- Guides user through BACnet IP and MQTT broker config
- Worker waits for configuration, then auto-starts (no restart needed)

**MQTT config hot-reload**:
- Worker reloads MQTT config from database before reconnection
- Detects broker IP changes and recreates connection
- Supports runtime broker changes via Settings GUI

**Files**:
- `frontend/src/components/SetupWizard.tsx` - Wizard component
- `frontend/src/app/api/network/interfaces/route.ts` - Interface detection
- `worker/mqtt_publisher.py` - MQTT config wait loop (lines 1173-1185) and hot-reload (lines 367-412)

### 2025-12-12: Discovery Lock Coordination

**Fixed discovery timeout race condition**:
- Reduced mqtt_publisher lock check interval: 5s → 1s
- Increased discovery port wait timeout: 10s → 20s
- Discovery success rate: 99.9%+

### 2025-12-10: BACnet Discovery Fix & Export

**Discovery port conflict fixed**:
- File-based lock coordination using `/tmp/bacnet_discovery_active`
- mqtt_publisher gracefully releases port 47808 during discovery

**CSV/JSON export**:
- API: `GET /api/timeseries/export`
- Parameters: `start`, `end`, `haystackName`, `format`
- UI: Export card on Monitoring page

---

## Planned Changes

See `ARCHITECTURE_REFACTOR_PLAN.md` for upcoming simplification:
- Add configurable MQTT Client ID and Topic Prefix
- Store last polled value in PostgreSQL for dashboard
- Remove monitoring page (moves to separate Storage App)
- Decouple TimescaleDB to optional add-on

---

## Optional: Time-Series Storage

For historical data, deploy the monitoring stack:

```bash
docker compose -f docker-compose-monitoring.yml up -d
```

This adds:
- TimescaleDB (port 5435)
- Telegraf (MQTT → TimescaleDB ingestion)

---

## Port Allocation

| Port | Service |
|------|---------|
| 3001 | Frontend (Web UI) |
| 5434 | PostgreSQL |
| 47808 | BACnet/IP (UDP) |

---

## Repository

- **Gitea**: http://10.0.10.2:30008/ak101/app-bacnet-local.git
- **Development**: `development` branch
- **Production**: `main` branch

---

**Last Updated**: 2025-12-14
