# Aura 2.0 English - Download & Installation Guide

## 📦 Complete Installation Package

All files are ready in `/opt/cursor/artifacts/` and `/workspace/www/aura/`

## Quick Download Commands

### From artifacts folder
```bash
# Navigate to artifacts
cd /opt/cursor/artifacts/

# List all files
ls -lh

# Files available:
# - aura_dashboard_english.yaml (7.8 KB) - Main dashboard config
# - INSTALL-ENGLISH.md (15 KB) - Complete installation guide
# - test-offline.html (9 KB) - Offline test suite
# - IMPLEMENTATION_PLAN.md (6 KB) - Technical design
# - CHANGELOG.md (4 KB) - Detailed changelog
# - OPPSUMMERING-NORSK.md (12 KB) - Norwegian summary
# - README-ENGLISH-SECTION.md (1.5 KB) - README addition
```

### From workspace
```bash
# Navigate to motor.js location
cd /workspace/www/aura/

# File available:
# - motor.js (516 KB) - Modified engine with English translation
```

## Installation Order

### Phase 1: Download & Prepare (5 minutes)
1. Download all files from artifacts folder
2. Download motor.js from workspace
3. Open test-offline.html in browser to verify offline

### Phase 2: Install button-card (3 minutes)
1. Open Home Assistant
2. HACS → Frontend
3. Search "button-card"
4. Install
5. Restart Home Assistant

### Phase 3: Copy Files (2 minutes)
1. Using File Editor, Samba, or SSH
2. Create folder: `config/www/aura/`
3. Copy motor.js to: `config/www/aura/motor.js`
4. Verify accessible at: `/local/aura/motor.js`

### Phase 4: Create Dashboard (5 minutes)
1. Settings → Dashboards → Add Dashboard
2. Choose "New dashboard from scratch"
3. Name it "Aura Test"
4. Open → Edit → ⋮ → Raw configuration editor
5. Delete all content
6. Paste entire aura_dashboard_english.yaml
7. Save

### Phase 5: Test (10 minutes)
1. Navigate through all pages
2. Verify English text
3. Test one light (balcony string light - safe)
4. Check motion sensors update
5. Verify camera feeds load
6. **DO NOT** test garage yet

Total time: ~25 minutes

## File Reference

### Essential Files (MUST HAVE)

| File | Size | Purpose | Location |
|------|------|---------|----------|
| `motor.js` | 516 KB | Engine with English translation | `/workspace/www/aura/` |
| `aura_dashboard_english.yaml` | 7.8 KB | Dashboard configuration | `/opt/cursor/artifacts/` |

### Documentation Files (RECOMMENDED)

| File | Size | Purpose | Location |
|------|------|---------|----------|
| `INSTALL-ENGLISH.md` | 15 KB | Complete installation guide | `/opt/cursor/artifacts/` |
| `test-offline.html` | 9 KB | Offline validation suite | `/opt/cursor/artifacts/` |
| `OPPSUMMERING-NORSK.md` | 12 KB | Norwegian summary | `/opt/cursor/artifacts/` |

### Technical Files (OPTIONAL)

| File | Size | Purpose | Location |
|------|------|---------|----------|
| `IMPLEMENTATION_PLAN.md` | 6 KB | Technical design doc | `/opt/cursor/artifacts/` |
| `CHANGELOG.md` | 4 KB | Detailed changelog | `/opt/cursor/artifacts/` |
| `README-ENGLISH-SECTION.md` | 1.5 KB | README addition | `/opt/cursor/artifacts/` |

## Git & PR Reference

### Repository
- **Your fork:** https://github.com/arevinje/aura-2
- **Upstream:** https://github.com/sundqvist80/aura-2 (original)
- **Branch:** `cursor/english-customization-4219`

### Pull Request
- **URL:** https://github.com/arevinje/aura-2/pull/1
- **Status:** Open (ready for your review)
- **Changes:** 2 files (motor.js, README.md)
- **Additions:** 115 lines
- **Deletions:** 4 lines

### Commit
- **SHA:** 700a27d
- **Message:** "Add English translation and customized configuration"
- **Date:** 2026-11-05
- **Files:** motor.js, README.md

## Verification Checklist

### Pre-Installation
- [ ] Downloaded motor.js (516 KB)
- [ ] Downloaded aura_dashboard_english.yaml (7.8 KB)
- [ ] Downloaded INSTALL-ENGLISH.md
- [ ] Downloaded test-offline.html
- [ ] Opened test-offline.html - all tests pass

### Installation
- [ ] button-card installed via HACS
- [ ] Home Assistant restarted
- [ ] motor.js copied to /config/www/aura/motor.js
- [ ] Verified /local/aura/motor.js accessible
- [ ] New dashboard created
- [ ] YAML pasted and saved
- [ ] Dashboard loads without errors

### Testing
- [ ] Dashboard displays in English
- [ ] Navigation works (Home, Lights, Blinds, etc.)
- [ ] Lights section shows your lights by room
- [ ] Blinds section shows your blinds (NO garage)
- [ ] Motion sensors display and update
- [ ] Vacuum section shows Roborock
- [ ] Power section shows Tibber data
- [ ] Camera section shows 5 cameras
- [ ] One light tested (balcony string light)
- [ ] Themes can be switched (Light/Dark/Noir)

### Safety
- [ ] Garage NOT in Aura dashboard
- [ ] Garage NOT in Blinds section
- [ ] _portar_auto: false in config
- [ ] Existing garage dashboard.yaml still works
- [ ] No unexpected automations triggered

## Quick Configuration Reference

### Language Settings
```yaml
_language: en              # 'en' = English, 'sv' = Swedish
_hem_namn: Home            # Your home name
_plats: ''                 # Your city (for weather)
```

### Theme Settings
```yaml
_tema: mork                # ljus (cream), mork (navy), noir (black)
_accent: ''                # Empty = theme default, or '#7568FF'
_bakgrundsbild: ''         # Header image (empty = pattern)
```

### Entity Configuration
Your entities are pre-configured:
- ✅ 14 lights across 9 rooms
- ✅ 7 blinds/covers
- ✅ 7 motion sensors
- ✅ Roborock S5 Max vacuum
- ✅ Tibber Pulse power monitoring
- ✅ 5 cameras

**DO NOT** need to change unless entity IDs are wrong.

### Garage Configuration (CRITICAL)
```yaml
_garage: []                # Empty - do NOT add garage
_portar_auto: false        # Disabled - do NOT change
```

## Troubleshooting Quick Reference

### Dashboard is blank
1. Check browser console (F12)
2. Verify button-card installed
3. Check /local/aura/motor.js exists
4. Try hard refresh (Ctrl+Shift+R)

### Shows Swedish text
1. Verify `_language: en` in mitt_hem block
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R)
4. Check browser console for errors

### Entities missing/wrong
1. Go to Developer Tools → States
2. Search for entity (e.g. "dining_table")
3. Copy exact entity_id
4. Update in mitt_hem block
5. Save and refresh

### Garage appears automatically
1. Edit dashboard YAML
2. Find `_portar_auto` - set to `false`
3. Find `_garage` - set to `[]` (empty)
4. Save
5. Clear localStorage (F12 → Application → Storage)
6. Refresh

## Support Resources

### English Version
- Full guide: INSTALL-ENGLISH.md
- Norwegian summary: OPPSUMMERING-NORSK.md
- Technical docs: IMPLEMENTATION_PLAN.md
- Test suite: test-offline.html

### Original Aura (Swedish)
- Main README: /workspace/README.md
- Full manual: /workspace/instruktionsbok/Aura_instruktionsbok.md

### Pull Request
- Review changes: https://github.com/arevinje/aura-2/pull/1
- See commit: https://github.com/arevinje/aura-2/commit/700a27d

## What's Next?

### Immediate (Now)
1. Download files from artifacts
2. Run offline test (test-offline.html)
3. Read INSTALL-ENGLISH.md

### Short-term (Today)
1. Install button-card via HACS
2. Copy motor.js to HA
3. Create test dashboard
4. Verify functionality

### Medium-term (This week)
1. Test all features
2. Confirm visual design
3. Customize entity labels if needed
4. Add custom images if desired

### Long-term (Future)
1. Merge PR if satisfied
2. Consider garage integration (custom implementation)
3. Watch for upstream updates
4. Contribute translations if desired

## Safety Reminders

### ⚠️ CRITICAL - Garage
- Garage door is **RELAY-BASED** (non-standard)
- `switch.garage` activates on **ANY** state change
- **DO NOT** test garage from Aura
- Use existing dashboard.yaml for garage
- Single toggle per confirmed button press only

### ✅ Safe to Test
- All lights (start with balcony string light)
- All blinds/covers
- Motion sensor viewing (read-only)
- Vacuum controls
- Camera viewing
- Power monitoring
- Theme switching

### ❌ Not Safe to Test
- Garage door activation
- Any automation that affects garage
- Any script that toggles switch.garage multiple times

## File Integrity

### Checksums (for verification)
If you want to verify file integrity:

```bash
# Check motor.js size
ls -lh /workspace/www/aura/motor.js
# Expected: ~516 KB (528,384 bytes)

# Check YAML size
ls -lh /opt/cursor/artifacts/aura_dashboard_english.yaml
# Expected: ~7.8 KB (7,987 bytes)

# Verify syntax
node --check /workspace/www/aura/motor.js
# Expected: No output (success)

python3 -c "import yaml; yaml.safe_load(open('/opt/cursor/artifacts/aura_dashboard_english.yaml'))"
# Expected: No output (success)
```

## Summary

### What You Get
- ✅ Full English UI
- ✅ Your specific entities
- ✅ Original visual design
- ✅ All three themes
- ✅ Complete documentation
- ✅ Offline testing
- ✅ Safety validation

### What You Do
1. Download 2 essential files
2. Install button-card
3. Copy motor.js
4. Create dashboard
5. Test carefully

### What to Avoid
- ❌ Don't test garage from Aura
- ❌ Don't merge PR until validated
- ❌ Don't skip offline testing
- ❌ Don't modify _portar_auto or _garage settings

## Questions?

1. Read INSTALL-ENGLISH.md first (comprehensive)
2. Check OPPSUMMERING-NORSK.md (Norwegian summary)
3. Review PR: https://github.com/arevinje/aura-2/pull/1
4. Test offline: test-offline.html

---

**Everything is ready. No changes made to your HA instance. Manual installation required.**

Last updated: 2026-11-05
Version: 2.0.2-en
