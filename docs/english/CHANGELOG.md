# Changelog - English Customization

## Version 2.0.2-en (2026-11-05)

### Added
- **English translation system** with `_language: 'en'` configuration parameter
- Translation object with ~60 key user-facing strings
- `t()` function for dynamic text translation
- English-ready configuration template with user's specific entities
- Comprehensive installation guide (INSTALL-ENGLISH.md)
- Offline test suite (test-offline.html) for pre-deployment validation
- Implementation documentation and technical notes

### Changed
- Version identifier: `2.0.2` → `2.0.2-en`
- Navigation translations applied to A.SIDOR array
- Language parameter added to A.konf configuration reader
- Dashboard YAML configured with English labels and custom entities

### Configuration
- **Lights**: 14 entities from 9 rooms (excluding unavailable/stale groups)
- **Blinds**: 7 cover entities (all_blinds + 6 individual)
- **Motion**: 7 sensors (excluding unavailable garage/restroom)
- **Vacuum**: Roborock S5 Max with full entity set
- **Power**: Tibber Pulse integration
- **Cameras**: 5 cameras (excluding privacy/unavailable)
- **Garage**: Custom safety implementation (relay-based, not standard cover)

### Safety
- Garage door relay handling documented (switch.garage activation on ANY state change)
- Confirmation dialog required for garage activation
- Hold/double-tap actions disabled on garage control
- Auto-detection disabled for garage entities (`_portar_auto: false`)

### Excluded
- Swedish-specific integrations (SMHI, Västtrafik, Pollenprognos)
- Risky automations (water valve closure, alarm scripts)
- Unavailable/stale entity groups
- Original author's personal entities and credentials

### Documentation
- INSTALL-ENGLISH.md - Full installation and configuration guide
- test-offline.html - JavaScript/translation/safety validation
- IMPLEMENTATION_PLAN.md - Technical approach and decisions
- README-ENGLISH-SECTION.md - Addition for main README

### Technical Notes
- Base: sundqvist80/aura-2 commit d8259b4 (2026-11-03)
- Fork: arevinje/aura-2
- Translation approach: Minimal engine modification, config-first
- Testing: Offline validation only (no live HA access)
- Preservation: Original visual design, animations, themes intact

### Known Limitations
- Incomplete translation coverage (~60 strings vs ~150 total)
- Some Swedish text may remain in error messages
- Swedish weather integrations non-functional
- Garage door NOT integrated into Aura dashboard (use native HA)
- No calendar time estimates (autonomous agent requirement)
- Manual merge required for upstream updates

### Migration from Upstream
If updating from original sundqvist80/aura-2:
1. Back up your current `mitt_hem` configuration
2. Replace `motor.js` with English version
3. Add `_language: en` to your `mitt_hem` block
4. Verify entity IDs match your system
5. Test garage safety implementation separately

### Security Review
- ✅ No external motor URLs (local only)
- ✅ No credentials in configuration
- ✅ Camera URLs are entity IDs (HA handles streaming)
- ✅ No personal addresses/coordinates in code
- ✅ Garage safety requirements met
- ✅ Optional external dependencies documented (Google Fonts, jsDelivr QR for party mode)

### Testing Status
- ✅ JavaScript syntax validated
- ✅ Translation function tested
- ✅ Entity inventory verified
- ✅ Garage safety logic validated
- ⏸️ Live HA deployment - user validation pending
- ⏸️ Visual design preservation - user confirmation pending

### Future Enhancements
Potential improvements for future versions:
- Expand translation coverage to remaining ~90 strings
- Add weather integration recommendations for non-Swedish users
- Custom garage door card for Aura dashboard integration
- Automated testing suite with mock hass object
- Translation contributions for additional languages

### Credits
- Base design: sundqvist80 (original aura-2)
- English customization: Cloud Agent implementation
- Entity inventory: User-provided configuration snapshot
- Safety requirements: User-specified garage door handling

### Support
For issues specific to English customization, refer to the fork repository.
For original Aura features and Swedish version, see sundqvist80/aura-2.
