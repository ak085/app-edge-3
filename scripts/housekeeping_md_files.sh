#!/bin/bash
# MD File Housekeeping Automation
# Location: /home/ak101/BacPipes/scripts/housekeeping_md_files.sh

set -e

echo "🧹 BacPipes MD File Housekeeping"
echo "================================"

cd /home/ak101/BacPipes

# Step 1: Backup
echo "📦 Creating backup..."
tar czf trash/md_files_backup_$(date +%Y-%m-%d).tar.gz *.md doc/*.md doc/archive/*.md mosquitto/*.md 2>/dev/null || true
echo "✅ Backup created: trash/md_files_backup_$(date +%Y-%m-%d).tar.gz"

# Step 2: Delete Grafana docs
echo ""
echo "🗑️  Removing Grafana documentation..."
rm -f doc/GRAFANA_CLIENT_VIEWING.md
rm -f doc/GRAFANA_WRITE_CAPABILITIES.md
echo "✅ Grafana docs removed"

# Step 3: Create archive structure
echo ""
echo "📁 Creating archive subdirectories..."
mkdir -p doc/archive/releases
mkdir -p doc/archive/migrations
mkdir -p doc/archive/lessons
echo "✅ Archive structure created"

# Step 4: Archive releases
echo ""
echo "📦 Archiving old releases..."
[ -f RELEASE_SUMMARY_v0.6.2.md ] && mv RELEASE_SUMMARY_v0.6.2.md doc/archive/releases/ && echo "  ✓ RELEASE_SUMMARY_v0.6.2.md"
[ -f RELEASE_NOTES_v0.6.0.md ] && mv RELEASE_NOTES_v0.6.0.md doc/archive/releases/ && echo "  ✓ RELEASE_NOTES_v0.6.0.md"
echo "✅ Releases archived"

# Step 5: Archive migrations
echo ""
echo "📦 Archiving migration docs..."
[ -f MIGRATION_TO_CONTAINERIZED_MQTT.md ] && mv MIGRATION_TO_CONTAINERIZED_MQTT.md doc/archive/migrations/ && echo "  ✓ MIGRATION_TO_CONTAINERIZED_MQTT.md"
[ -f doc/REMOTE_DATABASE_QUICK_START.md ] && mv doc/REMOTE_DATABASE_QUICK_START.md doc/archive/migrations/ && echo "  ✓ REMOTE_DATABASE_QUICK_START.md"
echo "✅ Migrations archived"

# Step 6: Archive lessons
echo ""
echo "📦 Archiving lessons learned..."
[ -f BRIDGE_DEPLOYMENT_LESSONS.md ] && mv BRIDGE_DEPLOYMENT_LESSONS.md doc/archive/lessons/ && echo "  ✓ BRIDGE_DEPLOYMENT_LESSONS.md"
echo "✅ Lessons archived"

# Step 7: Verify
echo ""
echo "📊 Final Structure:"
echo "=================="
echo ""
echo "ROOT DIRECTORY (Essential docs):"
ls -1 *.md 2>/dev/null | sed 's/^/  ✓ /' || echo "  (no MD files)"
echo ""
echo "DOC DIRECTORY (Technical docs):"
ls -1 doc/*.md 2>/dev/null | sed 's/^/  ✓ /' || echo "  (no MD files)"
echo ""
echo "ARCHIVE (Historical docs):"
find doc/archive -name "*.md" -type f 2>/dev/null | sed 's/^/  ✓ /' || echo "  (no archived files)"

echo ""
echo "✅ Housekeeping complete!"
echo ""
echo "Backup location: trash/md_files_backup_$(date +%Y-%m-%d).tar.gz"
echo "Review doc/MD_FILE_HOUSEKEEPING.md for details"
