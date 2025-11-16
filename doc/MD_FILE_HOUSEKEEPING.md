# BacPipes Documentation Housekeeping Plan

**Date**: 2025-11-16
**Purpose**: Organize, consolidate, and clean up MD documentation files

---

## Current MD File Inventory

### Root Directory (/)
1. **README.md** - ✅ Keep (main project documentation)
2. **CLAUDE.md** - ✅ Keep (Claude Code project context)
3. **CHANGELOG.md** - ✅ Keep (version history)
4. **GIT_BRANCH_STRUCTURE.md** - ✅ Keep (branch management guide)
5. **STRATEGIC_PLAN.md** - ❓ Review (may be outdated)
6. **MIGRATION_TO_CONTAINERIZED_MQTT.md** - ❓ Review (specific migration, archive?)
7. **BRIDGE_DEPLOYMENT_LESSONS.md** - ❓ Review (lessons learned, archive?)
8. **TIMESCALEDB_MAINTENANCE.md** - ✅ Keep (operational guide)
9. **PRE_RELEASE_CHECKLIST.md** - ✅ Keep (release process)
10. **RELEASE_SUMMARY_v0.6.2.md** - 🗑️ Archive (old release)
11. **RELEASE_NOTES_v0.6.0.md** - 🗑️ Archive (old release)

### /doc Directory
12. **doc/TIMESCALEDB_CLEANUP.md** - ✅ Keep (operational guide)
13. **doc/GRAFANA_CLIENT_VIEWING.md** - 🗑️ **DELETE** (Grafana being removed)
14. **doc/GRAFANA_WRITE_CAPABILITIES.md** - 🗑️ **DELETE** (Grafana being removed)
15. **doc/REMOTE_DATABASE_SETUP.md** - ✅ Keep (remote deployment guide)
16. **doc/REMOTE_DATABASE_QUICK_START.md** - ❓ Merge with REMOTE_DATABASE_SETUP.md?
17. **doc/IMPLEMENTATION_ROADMAP_FUTURE.md** - ✅ Keep (future planning)
18. **doc/CONTROL_LOCK_ARCHITECTURE_FUTURE.md** - ✅ Keep (future planning)
19. **doc/CONTROL_LOCK_ARCHITECTURE_MVP.md** - ✅ Keep (current implementation)
20. **doc/MVP_IMPLEMENTATION.md** - ❓ Review (may be completed)
21. **doc/MONITORING_DASHBOARD_PLAN.md** - ✅ **NEW** (this plan)
22. **doc/archive/MONITORING_PAGE_PLAN.md** - ✅ Already archived

### /mosquitto Directory
23. **mosquitto/README.md** - ✅ Keep (MQTT broker configuration)

---

## Housekeeping Actions

### Category 1: Delete (Remove Completely) 🗑️

**Reason**: Grafana is being removed from BacPipes

**Files**:
- `doc/GRAFANA_CLIENT_VIEWING.md`
- `doc/GRAFANA_WRITE_CAPABILITIES.md`

**Action**:
```bash
rm -f /home/ak101/BacPipes/doc/GRAFANA_CLIENT_VIEWING.md
rm -f /home/ak101/BacPipes/doc/GRAFANA_WRITE_CAPABILITIES.md
```

---

### Category 2: Archive (Move to /doc/archive) 📦

**Reason**: Historical reference only, not current operational docs

**Files**:
- `RELEASE_SUMMARY_v0.6.2.md` → `doc/archive/releases/RELEASE_SUMMARY_v0.6.2.md`
- `RELEASE_NOTES_v0.6.0.md` → `doc/archive/releases/RELEASE_NOTES_v0.6.0.md`
- `MIGRATION_TO_CONTAINERIZED_MQTT.md` → `doc/archive/migrations/MIGRATION_TO_CONTAINERIZED_MQTT.md`
- `BRIDGE_DEPLOYMENT_LESSONS.md` → `doc/archive/lessons/BRIDGE_DEPLOYMENT_LESSONS.md`

**Action**:
```bash
# Create archive subdirectories
mkdir -p /home/ak101/BacPipes/doc/archive/releases
mkdir -p /home/ak101/BacPipes/doc/archive/migrations
mkdir -p /home/ak101/BacPipes/doc/archive/lessons

# Move files
mv /home/ak101/BacPipes/RELEASE_SUMMARY_v0.6.2.md /home/ak101/BacPipes/doc/archive/releases/
mv /home/ak101/BacPipes/RELEASE_NOTES_v0.6.0.md /home/ak101/BacPipes/doc/archive/releases/
mv /home/ak101/BacPipes/MIGRATION_TO_CONTAINERIZED_MQTT.md /home/ak101/BacPipes/doc/archive/migrations/
mv /home/ak101/BacPipes/BRIDGE_DEPLOYMENT_LESSONS.md /home/ak101/BacPipes/doc/archive/lessons/
```

---

### Category 3: Consolidate (Merge Related Files) 🔗

**Files to Merge**:

**A. Remote Database Documentation**
- `doc/REMOTE_DATABASE_SETUP.md` (comprehensive guide)
- `doc/REMOTE_DATABASE_QUICK_START.md` (quick start)

**Action**: Merge quick start into main setup guide as "Quick Start" section

```bash
# Keep: doc/REMOTE_DATABASE_SETUP.md (add quick start section)
# Archive: doc/REMOTE_DATABASE_QUICK_START.md
mv /home/ak101/BacPipes/doc/REMOTE_DATABASE_QUICK_START.md /home/ak101/BacPipes/doc/archive/
```

---

### Category 4: Keep in Root Directory ✅

**Reason**: Essential project documentation, frequently accessed

**Files**:
1. **README.md** - Main project documentation (overview, quick start, architecture)
2. **CLAUDE.md** - Claude Code context (architecture, tech stack, current status)
3. **CHANGELOG.md** - Version history (keep up to date)
4. **GIT_BRANCH_STRUCTURE.md** - Branch management guide
5. **TIMESCALEDB_MAINTENANCE.md** - Operational maintenance guide
6. **PRE_RELEASE_CHECKLIST.md** - Release process checklist

**No Action Required** - Already in correct location

---

### Category 5: Keep in /doc Directory ✅

**Reason**: Detailed technical documentation, less frequently accessed

**Files**:
1. **doc/TIMESCALEDB_CLEANUP.md** - Database cleanup procedures
2. **doc/REMOTE_DATABASE_SETUP.md** - Remote deployment guide (consolidated)
3. **doc/IMPLEMENTATION_ROADMAP_FUTURE.md** - Future feature planning
4. **doc/CONTROL_LOCK_ARCHITECTURE_FUTURE.md** - Future control locking design
5. **doc/CONTROL_LOCK_ARCHITECTURE_MVP.md** - Current control locking implementation
6. **doc/MVP_IMPLEMENTATION.md** - MVP implementation details
7. **doc/MONITORING_DASHBOARD_PLAN.md** - NEW monitoring dashboard plan (replaces Grafana)

**No Action Required** - Already in correct location

---

### Category 6: Review & Update (Needs Content Review) 🔍

**Files Requiring Review**:

**A. STRATEGIC_PLAN.md**
- **Check**: Is this still current?
- **Action**: Review content, update or archive
- **Decision**: If outdated → archive, if current → update

**B. MVP_IMPLEMENTATION.md**
- **Check**: Has MVP been implemented?
- **Action**: If complete → archive, if in progress → update status

---

## Proposed Final Directory Structure

```
BacPipes/
│
├── README.md                           # Main project documentation
├── CLAUDE.md                           # Claude Code context
├── CHANGELOG.md                        # Version history
├── GIT_BRANCH_STRUCTURE.md             # Branch management
├── TIMESCALEDB_MAINTENANCE.md          # Database maintenance
├── PRE_RELEASE_CHECKLIST.md            # Release process
├── STRATEGIC_PLAN.md                   # Strategic planning (if current)
│
├── doc/                                # Detailed technical docs
│   ├── TIMESCALEDB_CLEANUP.md         # Database cleanup guide
│   ├── REMOTE_DATABASE_SETUP.md       # Remote deployment (consolidated)
│   ├── IMPLEMENTATION_ROADMAP_FUTURE.md  # Future roadmap
│   ├── CONTROL_LOCK_ARCHITECTURE_FUTURE.md  # Future control locking
│   ├── CONTROL_LOCK_ARCHITECTURE_MVP.md     # Current control locking
│   ├── MVP_IMPLEMENTATION.md          # MVP details (if in progress)
│   ├── MONITORING_DASHBOARD_PLAN.md   # NEW: Custom dashboard plan
│   ├── MD_FILE_HOUSEKEEPING.md        # NEW: This document
│   │
│   └── archive/                        # Historical documentation
│       ├── MONITORING_PAGE_PLAN.md    # Archived monitoring plan
│       ├── releases/
│       │   ├── RELEASE_SUMMARY_v0.6.2.md
│       │   └── RELEASE_NOTES_v0.6.0.md
│       ├── migrations/
│       │   ├── MIGRATION_TO_CONTAINERIZED_MQTT.md
│       │   └── REMOTE_DATABASE_QUICK_START.md
│       └── lessons/
│           └── BRIDGE_DEPLOYMENT_LESSONS.md
│
└── mosquitto/
    └── README.md                       # MQTT broker config
```

---

## Execution Plan

### Step 1: Backup Current Documentation

```bash
cd /home/ak101/BacPipes

# Create backup of all MD files
tar czf /home/ak101/BacPipes/trash/md_files_backup_2025-11-16.tar.gz \
  *.md doc/*.md doc/archive/*.md mosquitto/*.md

echo "Backup created: /home/ak101/BacPipes/trash/md_files_backup_2025-11-16.tar.gz"
```

### Step 2: Delete Grafana Documentation

```bash
# Remove Grafana-related docs
rm -f /home/ak101/BacPipes/doc/GRAFANA_CLIENT_VIEWING.md
rm -f /home/ak101/BacPipes/doc/GRAFANA_WRITE_CAPABILITIES.md

echo "Deleted Grafana documentation"
```

### Step 3: Create Archive Subdirectories

```bash
# Create organized archive structure
mkdir -p /home/ak101/BacPipes/doc/archive/releases
mkdir -p /home/ak101/BacPipes/doc/archive/migrations
mkdir -p /home/ak101/BacPipes/doc/archive/lessons

echo "Created archive subdirectories"
```

### Step 4: Archive Old Release Notes

```bash
# Move old releases
mv /home/ak101/BacPipes/RELEASE_SUMMARY_v0.6.2.md /home/ak101/BacPipes/doc/archive/releases/
mv /home/ak101/BacPipes/RELEASE_NOTES_v0.6.0.md /home/ak101/BacPipes/doc/archive/releases/

echo "Archived old release notes"
```

### Step 5: Archive Migration Documentation

```bash
# Move completed migration docs
mv /home/ak101/BacPipes/MIGRATION_TO_CONTAINERIZED_MQTT.md \
   /home/ak101/BacPipes/doc/archive/migrations/

# Move redundant quick start (consolidating with main guide)
mv /home/ak101/BacPipes/doc/REMOTE_DATABASE_QUICK_START.md \
   /home/ak101/BacPipes/doc/archive/migrations/

echo "Archived migration documentation"
```

### Step 6: Archive Lessons Learned

```bash
# Move lessons learned
mv /home/ak101/BacPipes/BRIDGE_DEPLOYMENT_LESSONS.md \
   /home/ak101/BacPipes/doc/archive/lessons/

echo "Archived lessons learned"
```

### Step 7: Review Strategic Plan

```bash
# Check STRATEGIC_PLAN.md content
head -30 /home/ak101/BacPipes/STRATEGIC_PLAN.md

# Decision:
# - If current → Keep in root
# - If outdated → Move to doc/archive/
```

### Step 8: Review MVP Implementation

```bash
# Check MVP_IMPLEMENTATION.md status
head -30 /home/ak101/BacPipes/doc/MVP_IMPLEMENTATION.md

# Decision:
# - If in progress → Keep in doc/
# - If complete → Move to doc/archive/
```

### Step 9: Consolidate Remote Database Docs

**Action**: Add Quick Start section to REMOTE_DATABASE_SETUP.md

```bash
# Manually edit /home/ak101/BacPipes/doc/REMOTE_DATABASE_SETUP.md
# Add "Quick Start" section at the top with essential commands
# Then archive the separate quick start guide (already moved in Step 5)
```

### Step 10: Verify Final Structure

```bash
# List all MD files in new structure
echo "=== ROOT DIRECTORY ==="
ls -1 /home/ak101/BacPipes/*.md

echo ""
echo "=== DOC DIRECTORY ==="
ls -1 /home/ak101/BacPipes/doc/*.md

echo ""
echo "=== ARCHIVE ==="
find /home/ak101/BacPipes/doc/archive -name "*.md" -type f

echo ""
echo "=== MOSQUITTO ==="
ls -1 /home/ak101/BacPipes/mosquitto/*.md
```

---

## Updated README.md Structure

### Proposed README.md Outline

```markdown
# BacPipes - BACnet-to-MQTT Data Pipeline

## Overview
[Brief description]

## Features
- BACnet device discovery
- Point configuration with Haystack tagging
- MQTT publishing
- TimescaleDB time-series storage
- Custom monitoring dashboard (replaces Grafana)

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Network access to BACnet devices

### Installation
```bash
git clone <repo>
cd BacPipes
docker compose up -d
```

### Access
- Frontend: http://localhost:3001
- Monitoring: http://localhost:3002

## Architecture
[Diagram and explanation]

## Documentation

### Essential Guides
- [Monitoring Dashboard](doc/MONITORING_DASHBOARD_PLAN.md) - Custom dashboard setup
- [TimescaleDB Maintenance](TIMESCALEDB_MAINTENANCE.md) - Database operations
- [Remote Database Setup](doc/REMOTE_DATABASE_SETUP.md) - Remote deployment

### Development
- [Git Branch Structure](GIT_BRANCH_STRUCTURE.md) - Branch management
- [Pre-Release Checklist](PRE_RELEASE_CHECKLIST.md) - Release process
- [CHANGELOG](CHANGELOG.md) - Version history

### Advanced Topics
- [Control Lock Architecture](doc/CONTROL_LOCK_ARCHITECTURE_MVP.md)
- [Implementation Roadmap](doc/IMPLEMENTATION_ROADMAP_FUTURE.md)
- [Archived Documentation](doc/archive/) - Historical reference

## Troubleshooting
[Common issues and solutions]

## Contributing
[Guidelines]

## License
[License information]
```

---

## Maintenance Guidelines

### Adding New Documentation

**Rule 1: Location**
- **Root Directory**: Only essential, frequently-accessed files
- **/doc Directory**: Detailed technical documentation
- **/doc/archive**: Historical/completed documentation

**Rule 2: Naming Convention**
- Use UPPERCASE for root-level docs: `README.md`, `CHANGELOG.md`
- Use Title Case for /doc: `Monitoring_Dashboard_Plan.md`
- Use descriptive names: `TIMESCALEDB_CLEANUP.md` (not `db_clean.md`)

**Rule 3: Cross-References**
- Always link related documents
- Use relative paths: `[Control Lock](doc/CONTROL_LOCK_ARCHITECTURE_MVP.md)`
- Maintain bidirectional links

**Rule 4: Archive Criteria**
- Documentation for completed features → archive
- Old release notes (> 2 versions old) → archive
- Superseded migration guides → archive
- Lessons learned (historical) → archive

### Quarterly Review

**Schedule**: Every 3 months
**Tasks**:
1. Review all /doc files for relevance
2. Archive outdated documentation
3. Update README.md table of contents
4. Check for broken links
5. Consolidate related documents if needed

---

## Appendix A: MD File Decision Matrix

| File | Keep | Archive | Delete | Action |
|------|------|---------|--------|--------|
| README.md | ✅ | | | Keep in root |
| CLAUDE.md | ✅ | | | Keep in root |
| CHANGELOG.md | ✅ | | | Keep in root |
| GIT_BRANCH_STRUCTURE.md | ✅ | | | Keep in root |
| TIMESCALEDB_MAINTENANCE.md | ✅ | | | Keep in root |
| PRE_RELEASE_CHECKLIST.md | ✅ | | | Keep in root |
| STRATEGIC_PLAN.md | ❓ | ❓ | | Review content |
| MIGRATION_TO_CONTAINERIZED_MQTT.md | | ✅ | | Archive (completed) |
| BRIDGE_DEPLOYMENT_LESSONS.md | | ✅ | | Archive (lessons) |
| RELEASE_SUMMARY_v0.6.2.md | | ✅ | | Archive (old release) |
| RELEASE_NOTES_v0.6.0.md | | ✅ | | Archive (old release) |
| doc/TIMESCALEDB_CLEANUP.md | ✅ | | | Keep in /doc |
| doc/GRAFANA_CLIENT_VIEWING.md | | | ✅ | Delete (Grafana removed) |
| doc/GRAFANA_WRITE_CAPABILITIES.md | | | ✅ | Delete (Grafana removed) |
| doc/REMOTE_DATABASE_SETUP.md | ✅ | | | Keep (consolidate) |
| doc/REMOTE_DATABASE_QUICK_START.md | | ✅ | | Archive (merged) |
| doc/IMPLEMENTATION_ROADMAP_FUTURE.md | ✅ | | | Keep in /doc |
| doc/CONTROL_LOCK_ARCHITECTURE_FUTURE.md | ✅ | | | Keep in /doc |
| doc/CONTROL_LOCK_ARCHITECTURE_MVP.md | ✅ | | | Keep in /doc |
| doc/MVP_IMPLEMENTATION.md | ❓ | ❓ | | Review status |
| doc/MONITORING_DASHBOARD_PLAN.md | ✅ | | | NEW - Keep in /doc |
| doc/MD_FILE_HOUSEKEEPING.md | ✅ | | | NEW - Keep in /doc |
| mosquitto/README.md | ✅ | | | Keep (MQTT config) |

---

## Appendix B: Quick Execution Script

```bash
#!/bin/bash
# MD File Housekeeping Automation
# Location: /home/ak101/BacPipes/scripts/housekeeping_md_files.sh

set -e

echo "🧹 BacPipes MD File Housekeeping"
echo "================================"

cd /home/ak101/BacPipes

# Step 1: Backup
echo "📦 Creating backup..."
tar czf trash/md_files_backup_$(date +%Y-%m-%d).tar.gz *.md doc/*.md doc/archive/*.md mosquitto/*.md
echo "✅ Backup created"

# Step 2: Delete Grafana docs
echo "🗑️  Removing Grafana documentation..."
rm -f doc/GRAFANA_CLIENT_VIEWING.md
rm -f doc/GRAFANA_WRITE_CAPABILITIES.md
echo "✅ Grafana docs removed"

# Step 3: Create archive structure
echo "📁 Creating archive subdirectories..."
mkdir -p doc/archive/releases
mkdir -p doc/archive/migrations
mkdir -p doc/archive/lessons
echo "✅ Archive structure created"

# Step 4: Archive releases
echo "📦 Archiving old releases..."
[ -f RELEASE_SUMMARY_v0.6.2.md ] && mv RELEASE_SUMMARY_v0.6.2.md doc/archive/releases/
[ -f RELEASE_NOTES_v0.6.0.md ] && mv RELEASE_NOTES_v0.6.0.md doc/archive/releases/
echo "✅ Releases archived"

# Step 5: Archive migrations
echo "📦 Archiving migration docs..."
[ -f MIGRATION_TO_CONTAINERIZED_MQTT.md ] && mv MIGRATION_TO_CONTAINERIZED_MQTT.md doc/archive/migrations/
[ -f doc/REMOTE_DATABASE_QUICK_START.md ] && mv doc/REMOTE_DATABASE_QUICK_START.md doc/archive/migrations/
echo "✅ Migrations archived"

# Step 6: Archive lessons
echo "📦 Archiving lessons learned..."
[ -f BRIDGE_DEPLOYMENT_LESSONS.md ] && mv BRIDGE_DEPLOYMENT_LESSONS.md doc/archive/lessons/
echo "✅ Lessons archived"

# Step 7: Verify
echo ""
echo "📊 Final Structure:"
echo "=================="
echo "ROOT:"
ls -1 *.md 2>/dev/null || echo "(no MD files)"
echo ""
echo "DOC:"
ls -1 doc/*.md 2>/dev/null || echo "(no MD files)"
echo ""
echo "ARCHIVE:"
find doc/archive -name "*.md" -type f 2>/dev/null || echo "(no archived files)"

echo ""
echo "✅ Housekeeping complete!"
echo "Backup location: trash/md_files_backup_$(date +%Y-%m-%d).tar.gz"
```

---

🤖 Generated with Claude Code
https://claude.com/claude-code

**Date**: 2025-11-16
**Author**: Claude (Anthropic)
**Project**: BacPipes - Documentation Organization
