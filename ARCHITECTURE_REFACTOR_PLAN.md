# BacPipes Architecture Simplification Plan

## Overview

This plan documents the agreed changes to simplify the BacPipes architecture by decoupling time-series storage and removing the monitoring page.

**Date**: December 2025
**Status**: Approved - Ready for Implementation

---

## Goals

1. **Decouple TimescaleDB** - Move time-series storage to separate "Storage App"
2. **Remove Monitoring Page** - Moves to Storage App with its own UI
3. **Add Configurable Settings** - Client ID and Topic Prefix
4. **Simplify Dashboard** - Show recent values from PostgreSQL, not TimescaleDB
5. **Clean Documentation** - Remove obsolete files, update CLAUDE.md and README.md

---

## Files to Create/Modify/Delete

### Files to DELETE (Obsolete)
| File | Reason |
|------|--------|
| `IMPLEMENTATION_PLAN.md` | Describes completed work (MQTT TLS) |
| `MIGRATION_GUIDE.md` | Describes completed migration |

### Files to CREATE
| File | Purpose |
|------|---------|
| `ARCHITECTURE_REFACTOR_PLAN.md` | This detailed plan |

### Files to UPDATE
| File | Changes |
|------|---------|
| `CLAUDE.md` | Reflect current state, remove obsolete info |
| `README.md` | Simplify, single docker command, current architecture |

---

## Page-by-Page Changes

### Page 1: Settings (`/settings`)

#### Section: BACnet Network Configuration
| Item | Action |
|------|--------|
| BACnet Interface IP | KEEP |
| BACnet Port | KEEP |
| BACnet Device ID | KEEP |

#### Section: MQTT Broker Configuration
| Item | Action |
|------|--------|
| Broker IP/Host | KEEP |
| Port | KEEP |
| **Client ID / Device Name** | **ADD** - User-configurable name instead of hardcoded "bacpipes_worker" |

#### Section: MQTT Authentication
| Item | Action |
|------|--------|
| Username | KEEP |
| Password | KEEP |

#### Section: TLS Security
| Item | Action |
|------|--------|
| Enable TLS | KEEP |
| Skip Certificate Verification | KEEP |
| CA Certificate Upload | KEEP |

#### Section: MQTT Subscription (Setpoints)
| Item | Action |
|------|--------|
| Enable Subscription | KEEP |
| Topic Pattern | KEEP |
| QoS | KEEP |

#### Section: Point Publishing Settings
| Item | Action |
|------|--------|
| Default Poll Interval | KEEP |
| Bulk Poll Interval | KEEP |
| **Topic Prefix** | **ADD** - Configurable prefix (default: "bacnet/") |

**Files to modify:**
- `frontend/src/app/settings/page.tsx`
- `frontend/src/app/api/settings/route.ts`
- `frontend/prisma/schema.prisma` (add clientId, topicPrefix fields to MqttConfig/SystemSettings)
- `worker/mqtt_publisher.py` (use configurable client ID and topic prefix)

---

### Page 2: Monitoring (`/monitoring`)

| Action | Details |
|--------|---------|
| **REMOVE ENTIRE PAGE** | Monitoring moves to separate Storage App |

**Files to DELETE:**
- `frontend/src/app/monitoring/page.tsx`
- `frontend/src/app/api/monitoring/stream/route.ts`
- `frontend/src/app/api/timeseries/export/route.ts`

**Navigation to update:**
- Remove "Monitoring" from navigation menu

---

### Page 3: Points (`/points`)

| Action | Details |
|--------|---------|
| **KEEP EVERYTHING** | No changes needed |

---

### Page 4: Discovery (`/discovery`)

| Action | Details |
|--------|---------|
| **KEEP EVERYTHING** | No changes needed |

---

### Page 5: Dashboard (`/`)

#### Section: System Status
| Item | Action |
|------|--------|
| "Operational" label | **CHANGE** to show separate status: "BACnet: OK", "MQTT: Connected" |
| Network Configuration indicator | KEEP |
| MQTT Broker indicator | KEEP |
| System Settings indicator | KEEP |

#### Section: Device Stats
| Item | Action |
|------|--------|
| Total Devices | KEEP |
| Total Points | KEEP |
| Publishing Points | KEEP |

#### Section: Publishing Statistics
| Item | Action |
|------|--------|
| Poll Interval Range | KEEP |

#### Section: Recent Point Values
| Item | Action |
|------|--------|
| Current: Query TimescaleDB | **CHANGE** |
| New: Query last polled value from PostgreSQL | Store `lastValue` and `lastPolledAt` in Point table |

#### Section: Bottom Navigation Buttons
| Item | Action |
|------|--------|
| "Run Discovery" button | **REMOVE** (redundant with top nav) |
| "View Monitoring" button | **REMOVE** (page removed) |
| "Settings" button | **REMOVE** (redundant with top nav) |

**Files to modify:**
- `frontend/src/app/page.tsx`
- `frontend/src/app/api/dashboard/summary/route.ts`
- `frontend/prisma/schema.prisma` (add lastValue, lastPolledAt to Point)
- `worker/mqtt_publisher.py` (update lastValue/lastPolledAt after each poll)

---

## Backend Changes

### Database Schema Changes (`frontend/prisma/schema.prisma`)

```prisma
model Point {
  // ... existing fields ...

  // ADD: Last polled value (for dashboard display)
  lastValue     Float?
  lastPolledAt  DateTime?
}

model MqttConfig {
  // ... existing fields ...

  // ADD: Custom MQTT client ID
  clientId      String    @default("bacpipes_worker")
}

model SystemSettings {
  // ... existing fields ...

  // ADD: Topic prefix for publishing
  topicPrefix   String    @default("bacnet/")
}
```

### Worker Changes (`worker/mqtt_publisher.py`)

1. **Use configurable client ID:**
   ```python
   self.mqtt_client_id = config.get('clientId') or 'bacpipes_worker'
   ```

2. **Use configurable topic prefix:**
   ```python
   topic = f"{self.topic_prefix}{haystack_topic}"
   ```

3. **Update lastValue/lastPolledAt after each poll:**
   ```python
   cursor.execute('''
       UPDATE "Point"
       SET "lastValue" = %s, "lastPolledAt" = NOW()
       WHERE id = %s
   ''', (value, point_id))
   ```

4. **Remove TimescaleDB connection and writes** (optional - can keep for backward compatibility)

### Containers to Keep

| Container | Purpose | Action |
|-----------|---------|--------|
| `bacpipes-postgres` | Configuration database | KEEP |
| `bacpipes-frontend` | Web GUI | KEEP |
| `bacpipes-worker` | BACnet polling, MQTT publishing | KEEP |

### Containers to Remove (from main docker-compose.yml)

| Container | Reason |
|-----------|--------|
| None | TimescaleDB and Telegraf are already in separate docker-compose-monitoring.yml |

**Note:** The user will deploy TimescaleDB + Telegraf as a separate "Storage App" with its own monitoring UI.

---

## Implementation Order

1. **Phase 1: Database Schema**
   - Add `lastValue`, `lastPolledAt` to Point model
   - Add `clientId` to MqttConfig
   - Add `topicPrefix` to SystemSettings
   - Run migration

2. **Phase 2: Worker Updates**
   - Use configurable client ID
   - Use configurable topic prefix
   - Update lastValue/lastPolledAt after polling

3. **Phase 3: Dashboard Updates**
   - Change system status to show separate BACnet/MQTT status
   - Recent values from Point.lastValue instead of TimescaleDB
   - Remove bottom navigation buttons

4. **Phase 4: Settings Updates**
   - Add Client ID field
   - Add Topic Prefix field

5. **Phase 5: Remove Monitoring Page**
   - Delete monitoring page files
   - Delete SSE stream API
   - Delete timeseries export API
   - Update navigation

6. **Phase 6: Documentation Updates**
   - Delete obsolete IMPLEMENTATION_PLAN.md
   - Delete obsolete MIGRATION_GUIDE.md
   - Update CLAUDE.md
   - Update README.md

---

## Documentation Updates

### CLAUDE.md Updates
- Remove completed feature descriptions (MQTT TLS already done)
- Update architecture diagram (remove monitoring page)
- Update current status
- Simplify - remove historical changelog entries older than 1 month

### README.md Updates
- Single `docker compose up -d` command (remove 3-command startup)
- Remove references to monitoring page
- Simplify architecture description
- Update port list (remove TimescaleDB/Telegraf if not in main compose)
- Current, accurate quick start guide

---

## Files Summary

### To Delete
```
IMPLEMENTATION_PLAN.md
MIGRATION_GUIDE.md
frontend/src/app/monitoring/page.tsx
frontend/src/app/api/monitoring/stream/route.ts
frontend/src/app/api/timeseries/export/route.ts
```

### To Create
```
ARCHITECTURE_REFACTOR_PLAN.md (this document, placed in repo root)
```

### To Modify
```
frontend/prisma/schema.prisma
frontend/src/app/page.tsx (dashboard)
frontend/src/app/api/dashboard/summary/route.ts
frontend/src/app/settings/page.tsx
frontend/src/app/api/settings/route.ts
worker/mqtt_publisher.py
CLAUDE.md
README.md
Navigation component (remove Monitoring link)
```

---

## Success Criteria

- [ ] Settings page has Client ID and Topic Prefix fields
- [ ] Dashboard shows separate BACnet/MQTT status
- [ ] Dashboard shows recent values from PostgreSQL (not TimescaleDB)
- [ ] Dashboard has no bottom navigation buttons
- [ ] Monitoring page is removed
- [ ] Navigation has no Monitoring link
- [ ] Worker uses configurable client ID
- [ ] Worker uses configurable topic prefix
- [ ] CLAUDE.md is updated and concise
- [ ] README.md has single docker command startup
- [ ] Obsolete documentation files deleted
