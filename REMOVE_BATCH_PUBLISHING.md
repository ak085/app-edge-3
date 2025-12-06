# How to Remove Batch Publishing Feature

**Date**: 2025-12-06
**Purpose**: Remove unused "Enable Equipment Batch Publishing" feature from BacPipes
**Estimated Time**: 15 minutes
**Difficulty**: Easy (code removal only, no database changes)

---

## Overview

The batch publishing feature publishes redundant equipment-level batch topics (`{site}/{equip}/batch`) in addition to individual point topics. This feature was designed for ML/AI applications but is never used and creates unnecessary MQTT traffic.

### What Will Be Removed
- ✅ Settings page UI toggle (~35 lines)
- ✅ Frontend TypeScript interfaces
- ✅ API route handlers
- ✅ Worker Python batch publishing logic (~120 lines)
- ✅ Documentation references

### What Will NOT Be Removed
- ❌ Database column `enableBatchPublishing` in `MqttConfig` table (leave it - harmless)
- ❌ Database migrations (DO NOT create new migrations)

---

## CRITICAL LESSON LEARNED ⚠️

**NEVER try to remove the database column or create migrations!**

Previous attempt spent 1 hour struggling with:
- Prisma migration deadlocks
- PostgreSQL advisory locks
- Frontend container crashes

**Solution**: Just remove the code. The database column can stay - no code will reference it, so it's harmless.

---

## Prerequisites

1. Clean working directory: `git status` should show no uncommitted changes
2. All services running: `docker compose ps` shows all healthy
3. Backup created: Current state committed to git

---

## Step-by-Step Instructions

### 1. Update Prisma Schema (No Migration!)

**File**: `frontend/prisma/schema.prisma`

**Find** (around line 115-120):
```prisma
  // Topics
  writeCommandTopic String    @default("bacnet/write/command")
  writeResultTopic  String    @default("bacnet/write/result")

  // Publishing Options
  enableBatchPublishing Boolean @default(false)  // Publish equipment-level batch topics (for ML/AI)

  // Remote Control
```

**Replace with**:
```prisma
  // Topics
  writeCommandTopic String    @default("bacnet/write/command")
  writeResultTopic  String    @default("bacnet/write/result")

  // Remote Control
```

**What changed**: Removed 3 lines (blank line + comment + field)

---

### 2. Update Settings Page TypeScript Interface

**File**: `frontend/src/app/settings/page.tsx`

**Find** (around line 6-15):
```typescript
interface Settings {
  bacnetIp: string;
  bacnetPort: number;
  mqttBroker: string;
  mqttPort: number;
  enableBatchPublishing: boolean;
  allowRemoteControl: boolean;
  timezone: string;
  defaultPollInterval: number;
}
```

**Replace with**:
```typescript
interface Settings {
  bacnetIp: string;
  bacnetPort: number;
  mqttBroker: string;
  mqttPort: number;
  allowRemoteControl: boolean;
  timezone: string;
  defaultPollInterval: number;
}
```

**What changed**: Removed `enableBatchPublishing: boolean;` line

---

### 3. Update Settings State Initialization

**File**: `frontend/src/app/settings/page.tsx`

**Find** (around line 17-27):
```typescript
  const [settings, setSettings] = useState<Settings>({
    bacnetIp: "",
    bacnetPort: 47808,
    mqttBroker: "",
    mqttPort: 1883,
    enableBatchPublishing: false,
    allowRemoteControl: false,
    timezone: "Asia/Kuala_Lumpur",
    defaultPollInterval: 60,
  });
```

**Replace with**:
```typescript
  const [settings, setSettings] = useState<Settings>({
    bacnetIp: "",
    bacnetPort: 47808,
    mqttBroker: "",
    mqttPort: 1883,
    allowRemoteControl: false,
    timezone: "Asia/Kuala_Lumpur",
    defaultPollInterval: 60,
  });
```

**What changed**: Removed `enableBatchPublishing: false,` line

---

### 4. Update Settings Load Function

**File**: `frontend/src/app/settings/page.tsx`

**Find** (around line 56-66):
```typescript
        const loadedSettings = {
          bacnetIp: data.settings.bacnetIp || "",
          bacnetPort: data.settings.bacnetPort || 47808,
          mqttBroker: data.settings.mqttBroker || "",
          mqttPort: data.settings.mqttPort || 1883,
          enableBatchPublishing: data.settings.enableBatchPublishing || false,
          allowRemoteControl: data.settings.allowRemoteControl || false,
          timezone: data.settings.timezone || "Asia/Kuala_Lumpur",
          defaultPollInterval: data.settings.defaultPollInterval || 60,
        };
```

**Replace with**:
```typescript
        const loadedSettings = {
          bacnetIp: data.settings.bacnetIp || "",
          bacnetPort: data.settings.bacnetPort || 47808,
          mqttBroker: data.settings.mqttBroker || "",
          mqttPort: data.settings.mqttPort || 1883,
          allowRemoteControl: data.settings.allowRemoteControl || false,
          timezone: data.settings.timezone || "Asia/Kuala_Lumpur",
          defaultPollInterval: data.settings.defaultPollInterval || 60,
        };
```

**What changed**: Removed `enableBatchPublishing: data.settings.enableBatchPublishing || false,` line

---

### 5. Remove Batch Publishing UI Section

**File**: `frontend/src/app/settings/page.tsx`

**Find** (around line 259-298):
```typescript
            {/* Batch Publishing Toggle */}
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold mb-3">Publishing Options</h3>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <input
                  type="checkbox"
                  id="enableBatchPublishing"
                  checked={settings.enableBatchPublishing}
                  onChange={(e) => setSettings({ ...settings, enableBatchPublishing: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <div className="flex-1">
                  <label htmlFor="enableBatchPublishing" className="block font-medium cursor-pointer">
                    Enable Equipment Batch Publishing
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Publish aggregated equipment-level batch topics (e.g., <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">macau-casino/ahu_301/batch</code>).
                    When enabled, each equipment publishes both individual point topics AND one batch topic containing all points with synchronized timestamps.
                  </p>
                  <div className="mt-2 text-sm">
                    <p className="font-medium text-orange-600">⚠️ Note: Data Redundancy</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      With batch publishing enabled, the same sensor reading is sent twice: once as an individual topic and once in the batch.
                      Make sure your MQTT subscribers handle this appropriately to avoid duplicate data storage.
                    </p>
                  </div>
                  <div className="mt-2 text-sm">
                    <p className="font-medium text-blue-600">💡 Use Case</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Batch topics are designed for ML/AI applications that require synchronized timestamps and complete feature vectors.
                      For standard BMS/SCADA applications, keep this disabled.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Remote Control Toggle */}
```

**Replace with**:
```typescript
            {/* Remote Control Toggle */}
```

**What changed**: Removed entire ~40 line batch publishing UI section

---

### 6. Update API Settings Route (GET handler)

**File**: `frontend/src/app/api/settings/route.ts`

**Find** (around line 33-42):
```typescript
    // Combine into single response
    const settings = {
      bacnetIp: systemSettings.bacnetIp,
      bacnetPort: systemSettings.bacnetPort,
      mqttBroker: mqttConfig.broker,
      mqttPort: mqttConfig.port,
      enableBatchPublishing: mqttConfig.enableBatchPublishing,
      allowRemoteControl: mqttConfig.allowRemoteControl,
      timezone: systemSettings.timezone,
      defaultPollInterval: systemSettings.defaultPollInterval,
    };
```

**Replace with**:
```typescript
    // Combine into single response
    const settings = {
      bacnetIp: systemSettings.bacnetIp,
      bacnetPort: systemSettings.bacnetPort,
      mqttBroker: mqttConfig.broker,
      mqttPort: mqttConfig.port,
      allowRemoteControl: mqttConfig.allowRemoteControl,
      timezone: systemSettings.timezone,
      defaultPollInterval: systemSettings.defaultPollInterval,
    };
```

**What changed**: Removed `enableBatchPublishing: mqttConfig.enableBatchPublishing,` line

---

### 7. Update API Settings Route (PUT handler - Update)

**File**: `frontend/src/app/api/settings/route.ts`

**Find** (around line 93-102):
```typescript
    if (mqttConfig) {
      await prisma.mqttConfig.update({
        where: { id: mqttConfig.id },
        data: {
          broker: body.mqttBroker,
          port: body.mqttPort,
          enableBatchPublishing: body.enableBatchPublishing !== undefined ? body.enableBatchPublishing : mqttConfig.enableBatchPublishing,
          allowRemoteControl: body.allowRemoteControl !== undefined ? body.allowRemoteControl : mqttConfig.allowRemoteControl,
        },
      });
    }
```

**Replace with**:
```typescript
    if (mqttConfig) {
      await prisma.mqttConfig.update({
        where: { id: mqttConfig.id },
        data: {
          broker: body.mqttBroker,
          port: body.mqttPort,
          allowRemoteControl: body.allowRemoteControl !== undefined ? body.allowRemoteControl : mqttConfig.allowRemoteControl,
        },
      });
    }
```

**What changed**: Removed `enableBatchPublishing` line from update data

---

### 8. Update API Settings Route (PUT handler - Create)

**File**: `frontend/src/app/api/settings/route.ts`

**Find** (around line 103-113):
```typescript
    } else {
      await prisma.mqttConfig.create({
        data: {
          broker: body.mqttBroker,
          port: body.mqttPort,
          clientId: "bacpipes_worker",
          enableBatchPublishing: body.enableBatchPublishing || false,
          allowRemoteControl: body.allowRemoteControl || false,
        },
      });
    }
```

**Replace with**:
```typescript
    } else {
      await prisma.mqttConfig.create({
        data: {
          broker: body.mqttBroker,
          port: body.mqttPort,
          clientId: "bacpipes_worker",
          allowRemoteControl: body.allowRemoteControl || false,
        },
      });
    }
```

**What changed**: Removed `enableBatchPublishing: body.enableBatchPublishing || false,` line

---

### 9. Update Dashboard Summary API

**File**: `frontend/src/app/api/dashboard/summary/route.ts`

**Find** (around line 146-153):
```typescript
          mqtt: {
            broker: mqttConfig?.broker || 'Not configured',
            port: mqttConfig?.port || 1883,
            connected: mqttConnected,
            configured: isMqttConfigured,
            enableBatchPublishing: mqttConfig?.enableBatchPublishing || false,
            allowRemoteControl: mqttConfig?.allowRemoteControl || false,
          },
```

**Replace with**:
```typescript
          mqtt: {
            broker: mqttConfig?.broker || 'Not configured',
            port: mqttConfig?.port || 1883,
            connected: mqttConnected,
            configured: isMqttConfigured,
            allowRemoteControl: mqttConfig?.allowRemoteControl || false,
          },
```

**What changed**: Removed `enableBatchPublishing` line

---

### 10. Update Dashboard Page Interface

**File**: `frontend/src/app/page.tsx`

**Find** (around line 22-29):
```typescript
    mqtt: {
      broker: string
      port: number
      connected: boolean
      configured: boolean
      enableBatchPublishing: boolean
      allowRemoteControl: boolean
    }
```

**Replace with**:
```typescript
    mqtt: {
      broker: string
      port: number
      connected: boolean
      configured: boolean
      allowRemoteControl: boolean
    }
```

**What changed**: Removed `enableBatchPublishing: boolean` line

---

### 11. Update Worker MQTT Publisher (Header Comment)

**File**: `worker/mqtt_publisher.py`

**Find** (lines 1-9):
```python
#!/usr/bin/env python3
"""
BacPipes MQTT Publisher - M4 Implementation (BACpypes3)
Publishes BACnet data to MQTT broker using hybrid strategy:
- Individual topics: {site}/{equipment}/{point}/presentValue
- Batch topics: {site}/{equipment}/batch

Based on proven working implementation from scripts/05_production_mqtt.py
"""
```

**Replace with**:
```python
#!/usr/bin/env python3
"""
BacPipes MQTT Publisher - M4 Implementation (BACpypes3)
Publishes BACnet data to MQTT broker:
- Individual topics: {site}/{equipment}/{point}/presentValue

Based on proven working implementation from scripts/05_production_mqtt.py
"""
```

**What changed**: Removed batch topics line from docstring

---

### 12. Remove Batch Publishing State Variable

**File**: `worker/mqtt_publisher.py`

**Find** (around line 89-98):
```python
        # State
        self.db_conn = None
        self.mqtt_client = None
        self.mqtt_connected = False
        self.poll_cycle = 0
        self.bacnet_app = None  # Will be initialized after event loop starts
        self.enable_batch_publishing = False  # Loaded from database
        self.point_last_poll = {}  # Track last poll time per point ID
        self.pending_write_commands = []  # Queue for MQTT write commands (processed in main loop)
```

**Replace with**:
```python
        # State
        self.db_conn = None
        self.mqtt_client = None
        self.mqtt_connected = False
        self.poll_cycle = 0
        self.bacnet_app = None  # Will be initialized after event loop starts
        self.point_last_poll = {}  # Track last poll time per point ID
        self.pending_write_commands = []  # Queue for MQTT write commands (processed in main loop)
```

**What changed**: Removed `self.enable_batch_publishing` line

---

### 13. Update load_mqtt_config Function

**File**: `worker/mqtt_publisher.py`

**Find** (around line 168-194):
```python
    def load_mqtt_config(self):
        """Load MQTT configuration from database"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute('SELECT broker, port, "clientId", "enableBatchPublishing" FROM "MqttConfig" LIMIT 1')
            result = cursor.fetchone()
            cursor.close()

            if result:
                # Override with database settings (Settings GUI is source of truth)
                self.mqtt_broker = result['broker']
                self.mqtt_port = result['port']
                self.mqtt_client_id = result['clientId'] or self.mqtt_client_id
                self.enable_batch_publishing = result['enableBatchPublishing']

                logger.info(f"📋 MQTT Broker from database: {self.mqtt_broker}:{self.mqtt_port}")
                logger.info(f"📋 Batch Publishing: {'ENABLED' if self.enable_batch_publishing else 'DISABLED'}")
            else:
                logger.warning("⚠️  No MQTT config found in database, using environment defaults")
                self.enable_batch_publishing = False

            return True
        except Exception as e:
            logger.error(f"❌ Failed to load MQTT config: {e}")
            logger.warning("⚠️  Using environment defaults")
            self.enable_batch_publishing = False
            return False
```

**Replace with**:
```python
    def load_mqtt_config(self):
        """Load MQTT configuration from database"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute('SELECT broker, port, "clientId" FROM "MqttConfig" LIMIT 1')
            result = cursor.fetchone()
            cursor.close()

            if result:
                # Override with database settings (Settings GUI is source of truth)
                self.mqtt_broker = result['broker']
                self.mqtt_port = result['port']
                self.mqtt_client_id = result['clientId'] or self.mqtt_client_id

                logger.info(f"📋 MQTT Broker from database: {self.mqtt_broker}:{self.mqtt_port}")
            else:
                logger.warning("⚠️  No MQTT config found in database, using environment defaults")

            return True
        except Exception as e:
            logger.error(f"❌ Failed to load MQTT config: {e}")
            logger.warning("⚠️  Using environment defaults")
            return False
```

**What changed**:
- Removed `"enableBatchPublishing"` from SQL query
- Removed `self.enable_batch_publishing` assignment lines (3 places)
- Removed batch publishing log line

---

### 14. Remove publish_equipment_batch Function

**File**: `worker/mqtt_publisher.py`

**Find** (around line 736-776):
```python
    def publish_equipment_batch(self, site_id: str, equipment_type: str, equipment_id: str,
                                 points_data: List[Dict], timestamp: str, poll_stats: Dict):
        """Publish equipment-level batch"""
        if not self.mqtt_connected:
            return False

        try:
            # Normalize to lowercase to match individual topic format
            site_normalized = site_id.lower().replace(' ', '_')
            equipment_type_normalized = equipment_type.lower()
            equipment_name = f"{equipment_type_normalized}_{equipment_id}"
            batch_topic = f"{site_normalized}/{equipment_name}/batch"

            payload = {
                "timestamp": timestamp,
                "site": site_id,
                "equipment": equipment_name,
                "equipmentType": equipment_type,
                "equipmentId": equipment_id,
                "points": points_data,
                "metadata": {
                    "pollCycle": self.poll_cycle,
                    "totalPoints": poll_stats['total'],
                    "successfulReads": poll_stats['success'],
                    "failedReads": poll_stats['failed'],
                    "pollDuration": poll_stats['duration']
                }
            }

            self.mqtt_client.publish(
                topic=batch_topic,
                payload=json.dumps(payload),
                qos=1,
                retain=False
            )

            logger.info(f"📦 Published batch: {batch_topic} ({len(points_data)} points)")
            return True
        except Exception as e:
            logger.error(f"Failed to publish equipment batch: {e}")
            return False
```

**Replace with**: (delete entire function - nothing to replace with)

**What changed**: Removed entire 41-line function

---

### 15. Remove Equipment Groups and Batch Stats

**File**: `worker/mqtt_publisher.py`

**Find** (around line 790-803):
```python
        # Calculate next minute boundary for minute-aligned polling
        next_minute = math.ceil(current_time / 60) * 60
        next_minute_time = datetime.fromtimestamp(next_minute, self.timezone).strftime('%H:%M:%S')

        # Group points by equipment
        equipment_groups = defaultdict(list)

        # Statistics
        total_reads = 0
        successful_reads = 0
        failed_reads = 0
        skipped_reads = 0
        individual_publishes = 0
        batch_publishes = 0
```

**Replace with**:
```python
        # Calculate next minute boundary for minute-aligned polling
        next_minute = math.ceil(current_time / 60) * 60
        next_minute_time = datetime.fromtimestamp(next_minute, self.timezone).strftime('%H:%M:%S')

        # Statistics
        total_reads = 0
        successful_reads = 0
        failed_reads = 0
        skipped_reads = 0
        individual_publishes = 0
```

**What changed**: Removed `equipment_groups` and `batch_publishes` variables

---

### 16. Remove Batch Data Preparation

**File**: `worker/mqtt_publisher.py`

**Find** (around line 805-820):
```python
                # Publish individual topic
                if self.publish_individual_topic(point, value, timestamp):
                    individual_publishes += 1

                # Prepare for batch
                if point['siteId'] and point['equipmentType'] and point['equipmentId']:
                    equipment_key = (point['siteId'], point['equipmentType'], point['equipmentId'])

                    point_data = {
                        "name": f"{point['objectType']}{point['objectInstance']}",
                        "dis": point['dis'],
                        "haystackName": point['haystackPointName'],
                        "value": float(value) if isinstance(value, (int, float)) else value,
                        "units": point['units'],
                        "quality": "good",
                        "objectType": point['objectType'],
                        "objectInstance": point['objectInstance']
                    }

                    equipment_groups[equipment_key].append(point_data)

                # Update database
```

**Replace with**:
```python
                # Publish individual topic
                if self.publish_individual_topic(point, value, timestamp):
                    individual_publishes += 1

                # Update database
```

**What changed**: Removed 16 lines of batch data preparation code

---

### 17. Remove Batch Publishing Loop

**File**: `worker/mqtt_publisher.py`

**Find** (around line 836-850):
```python
        # Publish equipment batches (only if enabled in settings)
        cycle_duration = time.time() - cycle_start

        if self.enable_batch_publishing:
            for (site_id, equipment_type, equipment_id), points_data in equipment_groups.items():
                poll_stats = {
                    'total': len(points_data),
                    'success': len(points_data),
                    'failed': 0,
                    'duration': round(cycle_duration, 2)
                }

                if self.publish_equipment_batch(site_id, equipment_type, equipment_id, points_data, timestamp, poll_stats):
                    batch_publishes += 1

        # Log summary (only if we actually polled something)
```

**Replace with**:
```python
        # Log summary (only if we actually polled something)
        cycle_duration = time.time() - cycle_start
```

**What changed**: Removed batch publishing loop, moved cycle_duration calculation

---

### 18. Update Poll Summary Logging

**File**: `worker/mqtt_publisher.py`

**Find** (around line 852-859):
```python
        if total_reads > 0:
            self.poll_cycle += 1
            logger.info(f"✅ Poll Cycle #{self.poll_cycle} complete:")
            logger.info(f"   - Points checked: {len(points)} ({total_reads} polled, {skipped_reads} skipped)")
            logger.info(f"   - Reads: {successful_reads}/{total_reads} successful")
            logger.info(f"   - Individual topics: {individual_publishes} published")
            logger.info(f"   - Batch topics: {batch_publishes} published")
            logger.info(f"   - Duration: {cycle_duration:.2f}s")
```

**Replace with**:
```python
        if total_reads > 0:
            self.poll_cycle += 1
            logger.info(f"✅ Poll Cycle #{self.poll_cycle} complete:")
            logger.info(f"   - Points checked: {len(points)} ({total_reads} polled, {skipped_reads} skipped)")
            logger.info(f"   - Reads: {successful_reads}/{total_reads} successful")
            logger.info(f"   - Topics published: {individual_publishes}")
            logger.info(f"   - Duration: {cycle_duration:.2f}s")
```

**What changed**: Removed batch topics log line, simplified individual topics log

---

### 19. Remove defaultdict Import

**File**: `worker/mqtt_publisher.py`

**Find** (around line 20-22):
```python
from datetime import datetime
from typing import Dict, List, Optional, Any
from collections import defaultdict

import paho.mqtt.client as mqtt
```

**Replace with**:
```python
from datetime import datetime
from typing import Dict, List, Optional, Any

import paho.mqtt.client as mqtt
```

**What changed**: Removed `from collections import defaultdict` line

---

### 20. Update Documentation (CLAUDE.md)

**File**: `CLAUDE.md`

**Find** (around line 381-384):
```markdown
**MQTT Publish Patterns:**
- Worker → `{site}/{equip}/{point}/presentValue` (individual points)
- Worker → `{site}/{equip}/batch` (batch topics, if enabled)
- Worker → `bacnet/write/result` (write command responses)
```

**Replace with**:
```markdown
**MQTT Publish Patterns:**
- Worker → `{site}/{equip}/{point}/presentValue` (individual points)
- Worker → `bacnet/write/result` (write command responses)
```

**What changed**: Removed batch topics line

---

## Rebuild and Test

### Step 1: Rebuild Frontend
```bash
docker compose build frontend --no-cache
docker compose restart frontend
```

**Expected**: Build completes without errors (~30 seconds)

### Step 2: Rebuild Worker
```bash
docker compose build bacnet-worker --no-cache
docker compose restart bacnet-worker
```

**Expected**: Build completes without errors (~10 seconds)

### Step 3: Verify Services
```bash
docker compose ps
```

**Expected**: All services show "Up" and "(healthy)" status

### Step 4: Test Frontend
```bash
curl -s http://localhost:3001/settings | grep -i "batch publishing"
```

**Expected**: NO output (batch publishing section removed)

### Step 5: Test Worker Logs
```bash
docker compose logs bacnet-worker --tail 20 | grep -i batch
```

**Expected**: NO output (no batch publishing references)

### Step 6: Test MQTT Publishing
```bash
mosquitto_sub -h 10.0.60.3 -t "#" -v -C 10
```

**Expected**: Only individual point topics, NO batch topics

---

## Verification Checklist

- [ ] Frontend builds without errors
- [ ] Worker builds without errors
- [ ] Settings page loads without "Enable Equipment Batch Publishing" toggle
- [ ] Worker logs show NO "Batch Publishing: ENABLED/DISABLED" message
- [ ] Worker logs show NO "Batch topics: X published" message
- [ ] MQTT broker receives NO topics matching `{site}/{equip}/batch` pattern
- [ ] Application functionality unchanged (discovery, points, monitoring work)

---

## Rollback Procedure

If something goes wrong:

```bash
# 1. Revert all changes
git checkout .

# 2. Rebuild from clean source
docker compose build frontend bacnet-worker --no-cache

# 3. Restart services
docker compose restart frontend bacnet-worker

# 4. Verify
docker compose ps
curl http://localhost:3001/settings | grep -i "batch publishing"
```

**Expected**: Batch publishing feature restored

---

## Summary of Changes

| Component | Lines Removed | Files Modified |
|-----------|---------------|----------------|
| Frontend UI | ~40 | 1 (settings/page.tsx) |
| Frontend Types | 7 | 3 (page.tsx, settings/page.tsx, dashboard API) |
| API Routes | 5 | 1 (api/settings/route.ts) |
| Worker Logic | ~120 | 1 (mqtt_publisher.py) |
| Database Schema | 3 | 1 (schema.prisma) |
| Documentation | 2 | 1 (CLAUDE.md) |
| **Total** | **~177 lines** | **8 files** |

---

## Time Estimate

- Code changes: 10 minutes
- Rebuild + test: 5 minutes
- **Total**: 15 minutes

---

## Success Criteria

✅ All code changes applied without errors
✅ All services rebuild successfully
✅ Settings page loads without batch publishing option
✅ Worker publishes ONLY individual topics
✅ No MQTT traffic increase (batch topics eliminated)
✅ Application functionality unchanged

---

**End of Guide**
