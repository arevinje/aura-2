# Aura 2.0 English Customization - Implementation Plan

## Objective
Adapt sundqvist80/aura-2 for English-speaking user with custom entity inventory while preserving original visual design, animations, and layout.

## Key Requirements
1. **English UI labels** - all user-facing text translated
2. **User's actual entities** from dashboard_ef45.yaml
3. **Garage safety** - exactly ONE switch.toggle per confirmed button press
4. **Preserve visual design** - keep original animations, theme, layout
5. **No HA instance access** - static/offline testing only
6. **Minimal changes** - config-first approach where possible

## Technical Approach

### 1. Translation Strategy (motor.js)
**Decision: Minimal engine modification with language parameter**

Add `_language: 'en'` config parameter:
- Default 'sv' (Swedish) preserves original behavior
- 'en' activates English translations
- Translation object at top of motor.js
- ~150 strings to translate (navigation, buttons, status messages)

**Why not separate file**: Keep single-file architecture, easier updates from upstream

### 2. Configuration Customization (aura_dashboard.yaml)
Create user-specific `mitt_hem` block:
- Rooms: Living room, Kitchen, Hallway, Office, Baby room, Closet, Storage, Balcony
- Lights: 11 entities from attachment (excluding stale group, unavailable, smoke)
- Blinds: cover.all_blinds, livingroom (1-3), stairs, kitchen
- Garage: CRITICAL SAFETY - custom handling required
- Motion: 7 sensors (exclude unavailable restroom/garage)
- Vacuum: Roborock S5 Max with map
- Power: Tibber Pulse entities
- Camera: RTSP garage camera (sanitize URL)

### 3. Garage Safety Implementation
**CRITICAL: No standard cover entity - relay-based activation**

User's setup:
```
switch.garage - ANY state change activates door
binary_sensor.garage_door_sensor_contact:
  off = closed
  on = NOT closed (cannot tell if opening/open/closing)
```

**Implementation**:
- Custom garage card (not using standard cover template)
- Status display: "Closed" / "Not closed" / "Unknown"
- Single button → switch.toggle with confirmation
- Disable hold_action/double_tap to prevent accidental double-activation
- NO assumptions about door direction or position

### 4. Entity Exclusions
**Do NOT include** (per requirements):
- light.all_lights (stale group members)
- light.livingroom_lights (unavailable)
- light.restroom_light_switch (unavailable)
- Smoke detector lights
- Individual hallway LEDs
- light.hallway_lights_2
- light.balcony_light_power_balcony_light_switch_3 (duplicate)
- binary_sensor.garage_motion_sensor_occupancy (unavailable)
- binary_sensor.restroom_motion_sensor_occupancy (unavailable)
- alarm_motion_sensors, all_motion_sensors* groups (broken)
- cover.cover_garage_door, cover.garage_door* (broken)
- camera.locations (privacy)
- camera.front_porch_cam (unavailable in snapshot)

### 5. Sanitization Requirements
**Remove from public fork**:
- Author's Swedish entity names (sundqvist entities)
- Private camera URLs (RTSP credentials)
- Personal addresses/coordinates
- Author's notify.sundqvist_iphone
- External motor URLs in comments

### 6. Testing Strategy
**NO live HA access permitted**

Phase 1 - Static validation:
```bash
# JavaScript syntax check
node --check www/aura/motor.js

# YAML syntax check
python3 -c "import yaml; yaml.safe_load(open('dashboard/aura_dashboard.yaml'))"
```

Phase 2 - Offline mock:
- Create minimal HTML test harness
- Mock hass object with user's entities
- Verify English strings render
- Verify garage button generates correct call
- Check no Swedish strings leak through

Phase 3 - User validation:
- User installs on test dashboard
- Confirms visual design preserved
- Tests garage activation (with confirmation dialog)

## File Changes

### Modified Files
1. `www/aura/motor.js` - English translations added (~200 lines)
2. `dashboard/aura_dashboard.yaml` - User's mitt_hem configuration
3. `README.md` - Add English installation section

### New Files
1. `/opt/cursor/artifacts/install-bundle/` - Ready-to-install package
2. `/opt/cursor/artifacts/INSTALL-ENGLISH.md` - English install guide
3. `/opt/cursor/artifacts/test-harness.html` - Offline testing
4. `/opt/cursor/artifacts/CHANGELOG.md` - Changes from upstream

### Optional Automation Files (NOT included by default)
Do NOT include risky automations:
- ❌ givare_automation.yaml (closes main water valve)
- ❌ larm_automation.yaml (has author's phone number)
- ✅ Keep as reference only, not in install bundle

## Dependencies Verification

### Required (from upstream README)
- button-card via Marketplace (HA 2026.11) or HACS
- Home Assistant 2024.10+ (tested on 2026.11.0)

### Optional (check actual usage in motor.js)
- Music Assistant (iframe party mode)
- Alarmo (security panel)
- Tibber/Nordpool (power prices) ✓ User has Tibber
- SMHI (Swedish weather) ❌ Not relevant for English user
- Västtrafik (Swedish transit) ❌ Not relevant
- kiosk-mode (optional)

**Decision**: Strip Swedish-specific integration references in English config

## Implementation Sequence
1. ✅ Create branch cursor/english-customization-4219
2. Add English translations to motor.js
3. Create customized aura_dashboard.yaml
4. Implement garage safety card
5. Create install bundle and documentation
6. Static validation tests
7. Create offline test harness
8. Commit, push, create PR on arevinje/aura-2
9. Generate artifact links for user

## Open Design Decisions
- Theme preference: Keep all three themes or suggest one for English?
  → **Keep all three, user can choose**
- Home image: Suggest placeholder or require user to add?
  → **Include placeholder, document how to customize**
- Weather integration: Suggest alternative to SMHI for non-Swedish?
  → **Document that SMHI is Swedish only, hide if unavailable**

## Security & Privacy Review
✅ No external motor URL (local only)
✅ Sanitize camera RTSP URLs
✅ Remove author's personal entities
✅ No credentials in config
✅ Garage safety requirements met
✅ No risky automations included
✅ jsDelivr QR script (low risk, user can disable party mode)

## Honest Limitations
1. **No live testing possible** - user must validate functionality
2. **Swedish integration features** - SMHI weather warnings, Västtrafik, Pollenprognos won't work outside Sweden
3. **Incomplete translations** - Some Swedish text may remain in error messages from upstream libraries
4. **Garage position ambiguity** - Contact sensor limitation documented
5. **No upstream PR** - Changes stay in user's fork
6. **Motor.js size** - 516KB single file, any syntax error breaks entire dashboard
7. **Update complexity** - Upstream updates require manual merge with translations
