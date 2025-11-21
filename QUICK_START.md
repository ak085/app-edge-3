# BacPipes Quick Start Guide

## Architecture (2 Docker Composes)

```
CORE (docker-compose.yml)          MONITORING (docker-compose-monitoring.yml)
├─ postgres (port 5434)             ├─ timescaledb (port 5435)
├─ mqtt-broker (port 1883)          ├─ telegraf
├─ frontend (port 3001)             └─ monitoring-dashboard (port 3003)
└─ bacnet-worker
```

## Starting the System

### Option 1: Start Both (Recommended)
```bash
cd /home/ak101/BacPipes

# Start core services
docker compose up -d

# Start monitoring services
docker compose -f docker-compose-monitoring.yml up -d

# Verify everything is running
docker compose ps
docker compose -f docker-compose-monitoring.yml ps
```

### Option 2: Start Core Only (BACnet polling without monitoring)
```bash
cd /home/ak101/BacPipes
docker compose up -d
```

### Option 3: Start Monitoring Only (if core already running)
```bash
cd /home/ak101/BacPipes
docker compose -f docker-compose-monitoring.yml up -d
```

## Accessing Services

| Service | URL | Description |
|---------|-----|-------------|
| BacPipes GUI | http://192.168.1.35:3001 | Device discovery, point configuration |
| Monitoring Dashboard | http://192.168.1.35:3003 | Live values, trend charts |
| PostgreSQL | localhost:5434 | Config database |
| TimescaleDB | localhost:5435 | Historical data |
| MQTT Broker | localhost:1883 | Message broker |

## Common Operations

### View Logs
```bash
# Core logs
docker compose logs -f bacnet-worker
docker compose logs -f frontend

# Monitoring logs
docker compose -f docker-compose-monitoring.yml logs -f telegraf
docker compose -f docker-compose-monitoring.yml logs -f monitoring-dashboard
```

### Restart Services

**Restart Monitoring (safe, doesn't affect BACnet polling)**:
```bash
docker compose -f docker-compose-monitoring.yml restart
```

**Restart Core (CAUTION: stops BACnet polling)**:
```bash
docker compose restart
```

**Restart Single Service**:
```bash
# Core
docker compose restart frontend
docker compose restart bacnet-worker

# Monitoring
docker compose -f docker-compose-monitoring.yml restart monitoring-dashboard
```

### Stop Services

**Stop Monitoring Only**:
```bash
docker compose -f docker-compose-monitoring.yml down
```

**Stop Everything**:
```bash
docker compose down
docker compose -f docker-compose-monitoring.yml down
```

## Troubleshooting

### Dashboard Shows "Loading..." Forever

**Check TimescaleDB data size**:
```bash
docker exec bacpipes-timescaledb psql -U anatoli -d timescaledb -c "
  SELECT COUNT(*) as total_records FROM sensor_readings;
"
```

If > 10 million records, clean up old data:
```bash
# Stop monitoring first
docker compose -f docker-compose-monitoring.yml down

# Clean old data
docker exec bacpipes-timescaledb psql -U anatoli -d timescaledb -c "
  DELETE FROM sensor_readings WHERE time < NOW() - INTERVAL '7 days';
  VACUUM FULL sensor_readings;
"

# Restart monitoring
docker compose -f docker-compose-monitoring.yml up -d
```

### BACnet Worker Not Publishing to MQTT

**Check worker logs**:
```bash
docker compose logs -f bacnet-worker | grep -E "ERROR|Publishing|MQTT"
```

**Check MQTT broker**:
```bash
docker compose logs mqtt-broker

# Test MQTT manually
mosquitto_sub -h localhost -t "bacnet/#" -v
```

### Monitoring Dashboard Can't Connect to TimescaleDB

**Verify TimescaleDB is running**:
```bash
docker compose -f docker-compose-monitoring.yml ps timescaledb
```

**Check connectivity**:
```bash
nc -zv localhost 5435
```

### Out of Memory / Slow Performance

**Check resource usage**:
```bash
docker stats

# If timescaledb using > 2GB:
docker compose -f docker-compose-monitoring.yml restart timescaledb
```

## Maintenance

### Weekly: Check Data Growth
```bash
docker exec bacpipes-timescaledb psql -U anatoli -d timescaledb -c "
  SELECT
    pg_size_pretty(pg_database_size('timescaledb')) as db_size,
    COUNT(*) as total_records
  FROM sensor_readings;
"
```

### Monthly: Clean Old Data
```bash
# Stop monitoring
docker compose -f docker-compose-monitoring.yml down

# Cleanup (keeps last 30 days)
docker exec bacpipes-timescaledb psql -U anatoli -d timescaledb -c "
  DELETE FROM sensor_readings WHERE time < NOW() - INTERVAL '30 days';
  VACUUM FULL sensor_readings;
"

# Restart
docker compose -f docker-compose-monitoring.yml up -d
```

### Backup Data
```bash
# Backup configuration database
docker exec bacpipes-postgres pg_dump -U anatoli bacpipes > backup_config_$(date +%Y%m%d).sql

# Backup monitoring database
docker exec bacpipes-timescaledb pg_dump -U anatoli timescaledb > backup_timescale_$(date +%Y%m%d).sql
```

## Key Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Core services definition |
| `docker-compose-monitoring.yml` | Monitoring services definition |
| `.env` | Environment variables |
| `ARCHITECTURE_SPLIT.md` | Detailed architecture documentation |

## Emergency Recovery

### If Everything is Broken
```bash
# Stop all services
docker compose down
docker compose -f docker-compose-monitoring.yml down

# Check what's running
docker ps -a

# Start fresh
docker compose up -d
docker compose -f docker-compose-monitoring.yml up -d
```

### If Only Monitoring is Broken (BACnet still working)
```bash
# Stop monitoring
docker compose -f docker-compose-monitoring.yml down

# Remove TimescaleDB data (CAUTION: loses historical data)
docker volume rm bacpipes_timescaledb_data

# Restart monitoring
docker compose -f docker-compose-monitoring.yml up -d
```

## Support

See detailed documentation:
- `ARCHITECTURE_SPLIT.md` - Full architecture explanation
- `CLAUDE.md` - Development documentation
- `monitoring-dashboard/README.md` - Dashboard documentation
