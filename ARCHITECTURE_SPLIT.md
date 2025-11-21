# BacPipes Architecture Split (2025-11-20)

## Problem Statement

The monolithic docker-compose.yml was causing resource contention issues:
- 8 services competing for CPU/RAM/I/O
- 3 PostgreSQL instances in one compose
- TimescaleDB growing unbounded (millions of records)
- Constant connection timeouts and failures
- Cannot restart monitoring without affecting BACnet polling

## Solution: Split into Two Docker Composes

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  docker-compose.yml (CORE)                   │
│                  Critical 24/7 Services                       │
├─────────────────────────────────────────────────────────────┤
│  postgres        │ BacPipes configuration database           │
│  mqtt-broker     │ Local MQTT broker (port 1883)            │
│  mqtt-remote     │ Remote MQTT broker simulation (port 1884)│
│  frontend        │ BacPipes GUI (port 3001)                 │
│  bacnet-worker   │ BACnet polling & MQTT publishing         │
└─────────────────────────────────────────────────────────────┘
                              ↓ (MQTT via network)
┌─────────────────────────────────────────────────────────────┐
│           docker-compose-monitoring.yml (MONITORING)         │
│                  Heavy Lifting Services                       │
├─────────────────────────────────────────────────────────────┤
│  timescaledb          │ Historical time-series data (port 5435)│
│  telegraf             │ MQTT → TimescaleDB pipeline           │
│  monitoring-dashboard │ Live values dashboard (port 3003)     │
└─────────────────────────────────────────────────────────────┘
```

## Core Services (docker-compose.yml)

**Purpose**: Mission-critical BACnet polling and MQTT publishing
**Uptime**: Must run 24/7
**Resource Usage**: ~500MB RAM

### Services

1. **postgres** (port 5434)
   - Stores BacPipes configuration
   - Device definitions, point mappings, Haystack tags
   - Small database (~50MB)
   - Low I/O

2. **mqtt-broker** (port 1883)
   - Receives BACnet data from bacnet-worker
   - Routes to monitoring stack
   - Optional bridge to remote broker
   - Lightweight (~20MB RAM)

3. **mqtt-remote** (port 1884)
   - Simulates remote cloud broker
   - Used for testing MQTT bridge
   - Can be disabled if not needed

4. **frontend** (port 3001)
   - BacPipes web UI
   - Device discovery and configuration
   - Point tagging interface
   - Next.js 15 application

5. **bacnet-worker** (host networking)
   - Polls BACnet devices on local network
   - Publishes to MQTT broker
   - Handles BACnet write commands
   - Critical for data collection

**Network**: Shared `bacpipes-network` bridge

## Monitoring Services (docker-compose-monitoring.yml)

**Purpose**: Historical data storage and visualization
**Uptime**: Can be restarted anytime without data loss
**Resource Usage**: ~2GB RAM (mostly TimescaleDB)

### Services

1. **timescaledb** (port 5435)
   - PostgreSQL 15 + TimescaleDB extension
   - Stores historical sensor readings
   - Heavy I/O and CPU usage
   - Can grow to GB/TB of data
   - **ISOLATED** from core services

2. **telegraf** (custom Python bridge)
   - Subscribes to MQTT broker (port 1883)
   - Writes to TimescaleDB
   - Runs continuously
   - Can handle backlog if restarted

3. **monitoring-dashboard** (NEW - port 3003)
   - Next.js 15 dashboard
   - Live values table with auto-refresh
   - Trend charts (time series)
   - CSV export functionality
   - Database health stats

**Network**: Uses external `bacpipes-network` to connect to mqtt-broker

## Key Design Decisions

### Why MQTT Broker Stays in Core

**Decision**: Keep mqtt-broker in docker-compose.yml (core)

**Reasoning**:
- bacnet-worker publishes to broker (same network, low latency)
- Monitoring stack subscribes (different compose, but can tolerate lag)
- MQTT is lightweight and stable
- Broker restart would only affect monitoring, not data collection

### Why TimescaleDB is Separated

**Decision**: Move timescaledb to docker-compose-monitoring.yml

**Reasoning**:
- Resource hog (~1.5GB RAM minimum)
- Heavy I/O operations
- Can be restarted for maintenance without affecting BACnet polling
- Data retention/cleanup doesn't impact core
- Query timeouts don't block worker

### Communication Between Composes

**MQTT Topic Flow**:
```
bacnet-worker → mqtt-broker (core) → telegraf (monitoring) → timescaledb
                      ↑
                      └── monitoring-dashboard (reads latest values)
```

**Network Strategy**:
- Core: Creates `bacpipes-network` as default bridge network
- Monitoring: Connects to existing `bacpipes-network` as external
- Services can communicate via container names across composes

## Migration Plan

### Step 1: Backup Current Data
```bash
# Backup PostgreSQL (config)
docker exec bacpipes-postgres pg_dump -U anatoli bacpipes > backup_postgres.sql

# Backup TimescaleDB (monitoring)
docker exec bacpipes-timescaledb pg_dump -U anatoli timescaledb > backup_timescaledb.sql
```

### Step 2: Stop Current Stack
```bash
docker compose down
```

### Step 3: Deploy Core Stack
```bash
docker compose up -d
# Verify: postgres, mqtt-broker, frontend, bacnet-worker all running
```

### Step 4: Deploy Monitoring Stack
```bash
docker compose -f docker-compose-monitoring.yml up -d
# Verify: timescaledb, telegraf, monitoring-dashboard all running
```

### Step 5: Verify Communication
```bash
# Check MQTT messages flowing
mosquitto_sub -h localhost -t "bacnet/#" -v

# Check TimescaleDB receiving data
docker exec bacpipes-timescaledb psql -U anatoli -d timescaledb -c "
  SELECT COUNT(*) FROM sensor_readings WHERE time > NOW() - INTERVAL '5 minutes';
"

# Check monitoring dashboard
curl http://localhost:3003/api/points
```

## Management Commands

### Core Services (Always Running)
```bash
# Start core
docker compose up -d

# Stop core (CAUTION: stops BACnet polling)
docker compose down

# View logs
docker compose logs -f bacnet-worker

# Restart only frontend
docker compose restart frontend
```

### Monitoring Services (Safe to Restart)
```bash
# Start monitoring
docker compose -f docker-compose-monitoring.yml up -d

# Stop monitoring (BACnet polling continues)
docker compose -f docker-compose-monitoring.yml down

# View logs
docker compose -f docker-compose-monitoring.yml logs -f telegraf

# Restart dashboard
docker compose -f docker-compose-monitoring.yml restart monitoring-dashboard
```

### Maintenance Operations

**Clean TimescaleDB (while keeping core running)**:
```bash
# Stop monitoring stack
docker compose -f docker-compose-monitoring.yml down

# Delete old data
docker exec bacpipes-timescaledb psql -U anatoli -d timescaledb -c "
  DELETE FROM sensor_readings WHERE time < NOW() - INTERVAL '7 days';
  VACUUM FULL sensor_readings;
"

# Restart monitoring
docker compose -f docker-compose-monitoring.yml up -d
```

**Restart Everything**:
```bash
# Graceful restart (preserves data)
docker compose down && docker compose up -d
docker compose -f docker-compose-monitoring.yml down && docker compose -f docker-compose-monitoring.yml up -d
```

## Resource Allocation

### Before Split (Single Compose)
- Total RAM: ~3GB
- CPU contention: High
- I/O contention: Very high
- Failure impact: Everything stops

### After Split

**Core Compose**:
- RAM: ~500MB
- CPU: Low (mostly idle, bursts during polling)
- I/O: Low
- Failure: Critical (BACnet polling stops)

**Monitoring Compose**:
- RAM: ~2GB
- CPU: Medium (TimescaleDB queries)
- I/O: High (continuous writes)
- Failure: Non-critical (historical data only)

## Benefits

1. **Resource Isolation**
   - TimescaleDB can't starve bacnet-worker
   - CPU/RAM allocated independently
   - I/O contention eliminated

2. **Independent Lifecycle**
   - Restart monitoring without losing BACnet data collection
   - Upgrade dashboard without touching worker
   - Clean TimescaleDB without affecting core

3. **Easier Debugging**
   - Smaller log files per stack
   - Clear service boundaries
   - Can test monitoring stack separately

4. **Scalability**
   - Add more monitoring dashboards easily
   - Move monitoring to different machine if needed
   - Core stays simple and stable

## Port Mapping Summary

### Core Services
- 1883: MQTT broker
- 1884: MQTT remote broker
- 3001: BacPipes frontend
- 5434: PostgreSQL (config)

### Monitoring Services
- 3003: Monitoring dashboard
- 5435: TimescaleDB

### External Dependencies
- 192.168.1.x: BACnet devices
- 10.0.60.2: Remote MQTT broker (optional)
- 10.0.60.5: Remote InfluxDB (future)

## Troubleshooting

### Issue: Monitoring can't connect to MQTT
**Check**: Ensure core compose is running
```bash
docker compose ps mqtt-broker
mosquitto_sub -h localhost -t '$SYS/#' -v
```

### Issue: Dashboard shows "Loading..." forever
**Check**: TimescaleDB query performance
```bash
docker exec bacpipes-timescaledb psql -U anatoli -d timescaledb -c "
  SELECT COUNT(*) FROM sensor_readings;
"
# If > 10 million, run cleanup
```

### Issue: Telegraf not writing to TimescaleDB
**Check**: Network connectivity
```bash
docker compose -f docker-compose-monitoring.yml logs telegraf
docker exec bacpipes-timescaledb psql -U anatoli -d timescaledb -c "\dt"
```

## Next Steps

1. **Immediate**: Implement split as documented
2. **Week 1**: Monitor resource usage, verify stability
3. **Week 2**: Add retention policy to TimescaleDB
4. **Month 1**: Consider moving monitoring to separate LXC container

## Rollback Plan

If split causes issues:
```bash
# Stop both stacks
docker compose down
docker compose -f docker-compose-monitoring.yml down

# Restore monolithic compose
git checkout main -- docker-compose.yml

# Start monolithic stack
docker compose up -d
```

## References

- Original monolithic docker-compose.yml
- /home/ak101/BacPipes/CLAUDE.md (development plan)
- /home/ak101/BacPipes/monitoring-dashboard/ (dashboard code)
