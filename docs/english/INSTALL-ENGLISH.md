# Aura 2.0 English Installation Guide

**⚠️ READ FIRST: This is a customized English version with your specific entities**

This installation includes safety-critical garage door handling. Read the entire guide before installing.

## Prerequisites

### Required
1. **Home Assistant 2024.10 or later** (tested on 2026.11.0)
2. **button-card** from Marketplace
   - Settings → Devices & services → Add-ons
   - Click **Marketplace** (bottom right)
   - Search for "button-card"
   - Install and restart

### Optional
- **kiosk-mode** – Hides Home Assistant header bar (recommended for tablets)
- **Music Assistant** – Advanced music library features
- **Alarmo** – Security panel integration

## Installation Steps

### 1. Install button-card

If you don't already have it:

1. Go to **Settings** → **Devices & services** → **Add-ons**
2. Click **Marketplace** (bottom right corner)
3. Search for **"Lovelace Button card"** by RomRider
4. Click **Install**
5. **Restart Home Assistant**

### 2. Copy motor.js

1. Download `motor.js` from this installation
2. Using File Editor, Samba share, or SSH:
   - Create folder: `config/www/aura/`
   - Copy `motor.js` to `config/www/aura/motor.js`
3. Verify the file exists at `/local/aura/motor.js` (HA web path)

**Security note:** The motor.js URL in the config is `/local/aura/motor.js` (local only). Never change this to an external URL.

### 3. Optional: Add custom images

If you want custom room or background images:
- Create folder: `config/www/aura/bilder/`
- Add your images (JPG, PNG, or WebP)
- Reference them in config as `roomname.jpg` (not `/local/...`)

### 4. Create dashboard

1. **Settings** → **Dashboards** → **Add Dashboard**
2. Click **Add** (three dots menu)
3. Choose **"New dashboard from scratch"**
4. Name it "Aura" or "Home"
5. Click **Open Dashboard**
6. Click **Edit** (pencil icon)
7. Click **⋮** (three dots) → **Raw configuration editor**
8. **Delete everything** in the editor
9. **Paste** the entire contents of `aura_dashboard_english.yaml`
10. Click **Save**

### 5. Customize for your home

The dashboard loads but shows Swedish entity names. Edit the `mitt_hem` section:

1. Dashboard → Edit → ⋮ → Raw configuration editor
2. Find the `mitt_hem:` block (line ~11)
3. Update these critical settings:
   ```yaml
   _language: en              # Keep this as 'en'
   _hem_namn: Home            # Your home name
   _tema: mork                # ljus, mork, or noir
   ```
4. Verify your entity IDs match (they should – configured for your entities)
5. Save

## Garage Door Configuration (CRITICAL)

**⚠️ YOUR GARAGE SETUP IS NON-STANDARD**

Your garage uses a relay (`switch.garage`) where **ANY state change activates the door**. This is different from standard garage openers and requires special handling.

### Current Setup (DO NOT CHANGE)
```yaml
_garage: []                 # Empty – custom implementation required
_portar_auto: false         # Disabled to prevent auto-detection
```

### Entities
- `switch.garage` – Relay that activates door on ANY state change
- `binary_sensor.garage_door_sensor_contact`:
  - `off` = Door is **closed**
  - `on` = Door is **NOT closed** (opening, open, or closing)

### Safety Requirements
1. **Exactly ONE** `switch.toggle` call per button press
2. **Confirmation dialog required** before activation
3. **NO** open/close/stop buttons (direction unknown)
4. **NO** double-toggle or pulse scripts
5. **Disable** hold_action and double_tap_action

### Implementation Options

**Option A: Use native HA dashboard for garage** (Recommended)

Keep using your existing `dashboard.yaml` for garage control. It's already configured correctly:

```yaml
- type: button
  name: Activate garage door
  icon: mdi:garage-alert
  entity: switch.garage
  tap_action:
    action: perform-action
    perform_action: switch.toggle
    target:
      entity_id: switch.garage
    confirmation:
      text: Activate the garage door now? Every switch change moves the door.
  hold_action:
    action: none
  double_tap_action:
    action: none
```

**Option B: Add garage to Aura dashboard**

Aura's automatic cover detection is DISABLED for your safety. To add garage manually, you would need to:

1. Modify `www/aura/motor.js` to add custom garage card
2. This requires JavaScript knowledge and testing
3. **NOT recommended** without thorough validation

**Recommended approach:** Keep garage control in your native HA dashboard until Option B can be properly tested.

## Testing Before Use

### 1. Syntax validation

Before loading the dashboard:

```bash
# If you have Node.js installed
node --check /config/www/aura/motor.js

# If you have Python installed
python3 -c "import yaml; yaml.safe_load(open('/config/aura_dashboard_english.yaml'))"
```

### 2. Visual test

1. Open the dashboard
2. Navigate through all pages:
   - Home – Should show in English
   - Lights – Should list your lights by room
   - Blinds – Should show only blinds (NO garage)
   - Security – Should show motion sensors and door
3. **DO NOT click garage-related buttons**

### 3. Light test (safe)

Test a non-critical light:
1. Click on `light.balcony_string_light`
2. Verify it toggles
3. Check slider works if dimmable

### 4. Garage verification (read-only)

Check garage status display:
1. Look at Security page or badge
2. Verify sensor shows:
   - "Closed" when `binary_sensor.garage_door_sensor_contact` is `off`
   - "Not closed" when sensor is `on`
3. **DO NOT** test activation until you're ready

## Updating

When a new version is released:

1. Replace `config/www/aura/motor.js` with new version
2. Reload dashboard page (Ctrl+Shift+R or Cmd+Shift+R)
3. Your settings in `mitt_hem` are preserved

## Troubleshooting

### Dashboard is blank
- Check browser console (F12) for errors
- Verify button-card is installed
- Check `/local/aura/motor.js` is accessible

### Shows Swedish text
- Verify `_language: en` in `mitt_hem`
- Clear browser cache
- Reload with Ctrl+Shift+R

### Lights don't work
- Check entity IDs match your system
- Verify entities are available (not unavailable/unknown)
- Check browser console for service call errors

### Garage shows up automatically
- Verify `_portar_auto: false` is set
- Clear `localStorage` for Home Assistant
- Reload dashboard

## Entity Reference

Your configured entities (already in config):

### Lights (11 main lights)
- `light.dining_table_light_switch`
- `light.stairs_light_switch`
- `light.livingroom_table_light`
- `light.tv_lamp_switch`
- `light.kitchen_table`
- `light.hallway_lights`
- `light.hallway_light_switch`
- `light.office_light_switch`
- `light.babyroom_light_switch`
- `light.closet_light_switch`
- `light.storage`
- `light.balcony_light_power_balcony_light_switch_2`
- `light.balcony_string_light`
- `light.garage_light_switch`

### Blinds (6 cover entities)
- `cover.all_blinds` (group)
- `cover.livingroom_blinds` (group)
- `cover.livingroom_blinds_1`
- `cover.livingroom_blinds_2`
- `cover.livingroom_blinds_3`
- `cover.stairs_blinds`
- `cover.kitchen_blinds`

### Motion Sensors (7 working sensors)
- `binary_sensor.livingroom_motion_sensor_occupancy`
- `binary_sensor.kitchen_motion_sensor_occupancy`
- `binary_sensor.doorway_motion_sensor_occupancy`
- `binary_sensor.office_motion_sensor_occupancy`
- `binary_sensor.bathroom_motion_sensor`
- `binary_sensor.basement_motion_sensor_occupancy`
- `binary_sensor.storage_motion_sensor_occupancy`

### Vacuum
- `vacuum.roborock_s5_max` (main entity)
- `sensor.roborock_s5_max_battery`
- `image.roborock_s5_max_map`
- Plus all Roborock status/control entities

### Power (Tibber Pulse)
- `sensor.pulse_power` (current W)
- `sensor.pulse_electricity_price` (kr/kWh)
- `sensor.pulse_accumulated_consumption` (today kWh)
- `sensor.pulse_accumulated_cost` (today kr)
- Plus other Tibber sensors

### Cameras (5 cameras)
- `camera.garage_garage_camera` (RTSP)
- `camera.front_porch_live`
- `camera.outside_driveway_camera`
- `camera.doorbell`
- `camera.basement_basement_camera`

### Garage (NON-STANDARD)
- `switch.garage` – ⚠️ RELAY (not cover)
- `binary_sensor.garage_door_sensor_contact`
- `sensor.garage_door_sensor_battery`
- `sensor.garage_door_sensor_device_temperature`

### Excluded (unavailable or problematic)
- `light.all_lights` (stale group)
- `light.livingroom_lights` (unavailable)
- `light.restroom_light_switch` (unavailable)
- Smoke detector lights
- `binary_sensor.garage_motion_sensor_occupancy` (unavailable)
- `binary_sensor.restroom_motion_sensor_occupancy` (unavailable)
- `cover.garage_door*` entities (broken)

## Support & Limitations

### Supported Features
- ✅ English UI (navigation, buttons, status)
- ✅ All three themes (Light, Dark, Noir)
- ✅ Your specific light entities
- ✅ Blinds with all controls
- ✅ Motion sensor monitoring
- ✅ Roborock vacuum control & map
- ✅ Tibber power monitoring
- ✅ Camera viewing
- ✅ Theme switching per device

### Known Limitations
- ❌ Garage door NOT in Aura (use native HA dashboard)
- ❌ Some Swedish text may remain in error messages
- ❌ Swedish integrations (SMHI, Västtrafik) disabled
- ❌ Music Assistant features require separate install
- ❌ No alarm integration (no alarm system configured)
- ❌ Weather requires compatible integration

### Not Included (Per Your Requirements)
- No smart power automations
- No alarm automations
- No water valve automation
- No external motor URLs
- No Swedish household integrations

## Safety Checklist

Before going live:

- [ ] button-card installed
- [ ] motor.js copied to `/config/www/aura/motor.js`
- [ ] Dashboard created and loads
- [ ] Language shows as English
- [ ] Lights are controllable
- [ ] Blinds are controllable
- [ ] Motion sensors update
- [ ] Vacuum is controllable
- [ ] Camera feeds load
- [ ] Garage is NOT in Aura dashboard
- [ ] Native HA garage control tested separately
- [ ] No unexpected automations running

## Getting Help

1. Check browser console (F12) for JavaScript errors
2. Verify entity IDs in Home Assistant (Developer Tools → States)
3. Test entities individually in native HA first
4. Check motor.js version matches dashboard config

## Privacy & Security

Your installation:
- ✅ Motor loads from local file only
- ✅ No external URLs in config
- ✅ No credentials in dashboard YAML
- ✅ Camera URLs are entity IDs (HA handles streaming)
- ✅ No personal addresses in config

External connections (optional features):
- Google Fonts (typography)
- jsDelivr CDN (QR code library for party mode, only if used)
- None of these send personal data

## Version Information

- Aura: 2.0.2-en (English fork)
- Base: sundqvist80/aura-2 commit d8259b4
- Customization: English UI + specific entity inventory
- Fork: arevinje/aura-2
