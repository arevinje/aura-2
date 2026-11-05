# English Installation Section

Add this to the main README.md after the Swedish installation section:

---

## 🇬🇧 English Installation

An English translation is available with customized entity configuration. This version preserves the original visual design, animations, and themes while translating all user-facing text.

### Features
- ✅ Full English UI (navigation, buttons, status messages)
- ✅ All three themes (Light, Dark, Noir)
- ✅ Original visual design preserved
- ✅ Pre-configured entity inventory
- ✅ Safety-validated garage handling

### Installation

1. **Requirements**
   - Home Assistant 2024.10 or later
   - [button-card](https://github.com/custom-cards/button-card) from HACS

2. **Quick Start**
   ```bash
   # Copy motor.js to your Home Assistant
   cp www/aura/motor.js /config/www/aura/motor.js
   
   # Create new dashboard with provided YAML
   # See INSTALL-ENGLISH.md for detailed steps
   ```

3. **Configuration**
   - Set `_language: en` in `mitt_hem` block
   - Customize entity IDs for your home
   - See [INSTALL-ENGLISH.md](INSTALL-ENGLISH.md) for full guide

### Documentation
- 📖 [English Installation Guide](INSTALL-ENGLISH.md) - Complete setup instructions
- 🧪 [Offline Test Suite](test-offline.html) - Validate before deploying
- 📋 [Implementation Plan](IMPLEMENTATION_PLAN.md) - Technical details

### Safety Note
If you have non-standard hardware (like relay-based garage doors), review the safety documentation carefully before installation.

### Support
This English version is a community customization. For the original Swedish version and official support, see the main repository documentation above.

---

