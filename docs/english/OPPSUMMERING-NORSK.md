# Aura 2.0 Engelsk tilpasning – Oppsummering

## 🎯 Hva er levert

En ferdig engelsk versjon av aura-2 med dine spesifikke enheter, som bevarer det opprinnelige visuelle designet (animasjoner, tema, layout).

## 📦 Installasjonspakke

Alle filer ligger i `/opt/cursor/artifacts/`:

### Hovedfiler
1. **`aura_dashboard_english.yaml`** (7,8 kB)
   - Komplett dashbord-konfigurasjon med dine enheter
   - Engelsk UI ferdig konfigurert (`_language: en`)
   - Garasje-sikkerhet implementert

2. **`motor.js`** (i `/workspace/www/aura/motor.js`)
   - Modifisert motor med engelsk oversettelse
   - Versjon 2.0.2-en
   - ~60 nøkkelstrenger oversatt

### Dokumentasjon
3. **`INSTALL-ENGLISH.md`** (15 kB)
   - Komplett installasjonsguide på engelsk
   - Trinn-for-trinn instruksjoner
   - Garasje-sikkerhet forklart
   - Enhets-oversikt

4. **`test-offline.html`** (9 kB)
   - Offline testpakke (åpne i nettleser)
   - Validerer JavaScript-syntaks
   - Tester oversettelsessystem
   - Verifiserer garasje-sikkerhet

5. **`IMPLEMENTATION_PLAN.md`** (6 kB)
   - Teknisk designdokument
   - Arkitekturvalg
   - Sikkerhetsgjennomgang

6. **`CHANGELOG.md`** (4 kB)
   - Detaljert endringslogg
   - Hva er nytt, endret, ekskludert
   - Kjente begrensninger

7. **`README-ENGLISH-SECTION.md`**
   - Seksjon lagt til i hoved-README

## 🔗 Pull Request

Opprettet på din fork: https://github.com/arevinje/aura-2/pull/1

Branch: `cursor/english-customization-4219`

**Viktig:** Dette er IKKE en PR til upstream (sundqvist80/aura-2). Alt forblir i din fork.

## ⚙️ Hva er implementert

### Engelsk oversettelse
- Navigasjon: Home, Lights, Blinds, Heat, Media, Energy, Security, Weather, Household
- Knapper: On, Off, Open, Close, Stop, Pause, Resume, Cancel
- Status: Closed, Not closed, Running, Everyone home, etc.
- ~60 nøkkelstrenger oversatt (~40% dekning)

### Dine enheter (fra dashboard_ef45.yaml)

**Lys (14 enheter):**
- Living room: Dining table, Stairs, Table lamp, TV lamp
- Kitchen: Kitchen light
- Hallway: Inner hallway, Hallway light
- Office, Baby room, Closet, Storage
- Balcony: Light + String lights
- Garage: Garage light

**Gardiner (7 enheter):**
- cover.all_blinds
- cover.livingroom_blinds (gruppe)
- cover.livingroom_blinds_1, _2, _3
- cover.stairs_blinds
- cover.kitchen_blinds

**Bevegelse (7 sensorer):**
- Living room, Kitchen, Doorway, Office, Bathroom, Basement, Storage
- Ekskludert: garasje og restroom (unavailable)

**Støvsuger:**
- vacuum.roborock_s5_max
- sensor.roborock_s5_max_battery
- image.roborock_s5_max_map
- Alle Roborock-sensorer

**Strøm (Tibber Pulse):**
- sensor.pulse_power
- sensor.pulse_electricity_price
- sensor.pulse_accumulated_consumption
- sensor.pulse_accumulated_cost
- Alle Tibber-sensorer

**Kameraer (5):**
- camera.garage_garage_camera
- camera.front_porch_live
- camera.outside_driveway_camera
- camera.doorbell
- camera.basement_basement_camera

**Garasje (KRITISK - ikke-standard):**
- switch.garage (relé)
- binary_sensor.garage_door_sensor_contact
- Sensorer for batteri og temperatur

### Ekskludert (som ønsket)

**Enheter:**
- light.all_lights (stale gruppe)
- light.livingroom_lights (unavailable)
- light.restroom_light_switch (unavailable)
- Røykdetektorlys
- Ødelagte cover-enheter for garasje
- camera.locations (personvern)

**Integrasjoner:**
- SMHI (svensk vær)
- Västtrafik (svensk kollektiv)
- Pollenprognos (svensk)

**Automasjoner:**
- givare_automation.yaml (lukker hovedkran)
- larm_automation.yaml (har forfatterens telefonnummer)
- Ingen risikofylte automasjoner inkludert

## 🔒 Garasje-sikkerhet (KRITISK)

### Din oppsett
- `switch.garage` er et **relé**
- **HVER** tilstandsendring (off→on ELLER on→off) aktiverer døren
- `binary_sensor.garage_door_sensor_contact`:
  - `off` = lukket
  - `on` = IKKE lukket (kan være åpner, åpen, eller lukker)

### Implementert sikkerhet
- Garasje er **IKKE** automatisk detektert i Aura
- Satt `_portar_auto: false` for å forhindre auto-deteksjon
- Dokumentert at standard cover-kort IKKE fungerer
- Anbefaler å fortsette med din eksisterende dashboard.yaml for garasje

### Alternativer
**Anbefalt:** Bruk din eksisterende dashboard.yaml for garasje-kontroll. Den er allerede korrekt konfigurert:
- Eksakt EN `switch.toggle` per klikk
- Bekreftelsesdialog påkrevet
- Hold/double-tap deaktivert

**Fremtidig:** Egendefinert garasje-kort kan lages for Aura, men krever testing.

## 📥 Installasjon (trinn-for-trinn)

### 1. Last ned filer

Fra `/opt/cursor/artifacts/`:
- `motor.js` (fra `/workspace/www/aura/motor.js`)
- `aura_dashboard_english.yaml`

### 2. Installer button-card

Via Marketplace (HA 2026.11):
1. Innstillinger → Enheter og tjenester → Tillegg
2. Klikk **Marketplace** (nederst til høyre)
3. Søk "button-card"
4. Installer
5. Start Home Assistant på nytt

### 3. Kopier motor.js

Med File Editor, Samba, eller SSH:
```bash
# Opprett mappe
mkdir -p /config/www/aura/

# Kopier fil
cp motor.js /config/www/aura/motor.js
```

Verifiser at filen finnes på `/local/aura/motor.js` (HA web-sti).

### 4. Opprett dashbord

1. Innstillinger → Dashboards → Add Dashboard
2. "New dashboard from scratch"
3. Navn det "Aura" eller "Home"
4. Åpne dashbordet
5. Edit → ⋮ → Raw configuration editor
6. **Slett alt** i editoren
7. **Lim inn** hele `aura_dashboard_english.yaml`
8. Lagre

### 5. Test (SAFE)

**Test 1 - Offline validering:**
```bash
# Åpne test-offline.html i nettleser
open test-offline.html
```
Alle tester skal være grønne.

**Test 2 - Visuell sjekk:**
1. Åpne dashbordet
2. Naviger gjennom alle sider
3. Verifiser engelsk tekst
4. Sjekk at lys vises etter rom
5. Garasje skal **IKKE** vises i Blinds-seksjonen

**Test 3 - Trygt lys-test:**
1. Klikk på `light.balcony_string_light`
2. Verifiser at det slår av/på
3. Test slider hvis dimmbar

**IKKE test garasje før du er klar!**

### 6. Garasje (separat)

Fortsett å bruke din eksisterende dashboard.yaml for garasje-kontroll. Den er trygg.

## 🎨 Visuelt design

### Bevart fra original
- ✅ Alle tre temaer (Light, Dark, Noir)
- ✅ Animerte produktbilder (lys, gardiner, etc.)
- ✅ Layout og navigasjon
- ✅ Fargeskjemaer
- ✅ God natt-modus med nedtelling
- ✅ Alle SVG-grafikk

### Engelsk UI
- Navigasjon oversatt
- Knapper oversatt
- Statusmeldinger oversatt
- Feilmeldinger delvis oversatt

## 🧪 Testing utført

### Offline (fullført)
- ✅ JavaScript-syntaks validert
- ✅ YAML-syntaks sjekket
- ✅ Oversettelsessystem testet
- ✅ Garasje-sikkerhet verifisert
- ✅ Enhets-inventar bekreftet

### Live HA (venter på deg)
- ⏸️ Dashboard-lasting
- ⏸️ Visuell design-bekreftelse
- ⏸️ Lys-kontroll
- ⏸️ Gardin-kontroll
- ⏸️ Bevegelsessensorer
- ⏸️ Støvsuger-kontroll
- ⏸️ Kamera-feeds

## ⚠️ Kjente begrensninger

### Funksjonelle
1. **Oversettelsesdekning ~40%**
   - ~60 av ~150 strenger oversatt
   - Noen svensk tekst kan forbli i feilmeldinger

2. **Garasje ikke i Aura**
   - Krever egendefinert implementering
   - Bruk eksisterende dashboard.yaml

3. **Svenske integrasjoner deaktivert**
   - SMHI værvarsler
   - Västtrafik kollektivtrafikk
   - Pollenprognos

4. **Værintegrasjon kreves**
   - Sett `_vader: ''` tom for å skjule værseksjon
   - Eller bruk kompatibel værintegrasjon

### Tekniske
1. **Ingen live HA-testing**
   - Kun offline validering utført
   - Du må teste på ditt system

2. **Upstream-oppdateringer**
   - Krever manuell merge fra sundqvist80/aura-2
   - Oversettelser må bevares ved oppdatering

3. **Motor.js størrelse**
   - 516 kB enkelt-fil
   - Enhver syntaksfeil bryter hele dashbordet

## 🔐 Sikkerhet og personvern

### Implementert
- ✅ Motor laster kun fra lokal fil (`/local/aura/motor.js`)
- ✅ Ingen credentials i konfigurasjon
- ✅ Kamera-URLer er kun entitets-IDer
- ✅ Ingen personlige adresser i kode
- ✅ Garasje-sikkerhetseksamen fullført

### Eksterne tilkoblinger (valgfritt)
- Google Fonts (typografi)
- jsDelivr CDN (QR-kode for party-modus, kun hvis brukt)
- Ingen sender persondata

### Sanitert fra konfigurasjon
- ❌ Private kamera RTSP-URLer
- ❌ Forfatterens svenske enheter
- ❌ Forfatterens notify.sundqvist_iphone
- ❌ Eksterne motor-URLer

## 📊 Filstørrelser

```
motor.js                          516 kB (opprinnelig, med engelsk oversettelse)
aura_dashboard_english.yaml       7.8 kB
INSTALL-ENGLISH.md               15.0 kB
test-offline.html                 9.0 kB
IMPLEMENTATION_PLAN.md            6.0 kB
CHANGELOG.md                      4.0 kB
README-ENGLISH-SECTION.md         1.5 kB
Total                            ~560 kB
```

## 🚀 Neste steg

### 1. Last ned filer
```bash
# Fra artifacts-mappen
cp /opt/cursor/artifacts/aura_dashboard_english.yaml ~/Downloads/
cp /workspace/www/aura/motor.js ~/Downloads/
cp /opt/cursor/artifacts/*.html ~/Downloads/
cp /opt/cursor/artifacts/*.md ~/Downloads/
```

### 2. Test offline
```bash
# Åpne i nettleser
open ~/Downloads/test-offline.html
```

### 3. Installer på test-dashbord
- Følg INSTALL-ENGLISH.md
- Start med et nytt dashbord (ikke erstatt eksisterende)
- Test grundig før du bytter

### 4. Bekreft design
- Naviger gjennom alle sider
- Verifiser at animasjoner fungerer
- Sjekk at temaer ser riktige ut

### 5. Test funksjonalitet
- Test lys på/av
- Test gardiner opp/ned
- Sjekk bevegelsessensorer oppdaterer
- Verifiser støvsuger-kontroller
- Test kamera-feeds laster

### 6. Garasje (separat)
- **IKKE** test garasje fra Aura
- Bekreft garasje IKKE vises i Blinds-seksjonen
- Fortsett bruke eksisterende garasje-kontroll

## 💡 Tips

### Tilpasning
Rediger `mitt_hem`-blokken i YAML:
```yaml
_language: en              # Hold som 'en'
_hem_navn: Home            # Ditt hjemmenavn
_plats: ''                 # Din by (vises i værvisning)
_tema: mork                # ljus, mork, eller noir
_bakgrundsbild: ''         # Eget bilde i config/www/aura/bilder/
```

### Tema-bytte
Aura støtter tre temaer:
- `ljus` - Cream & bronze
- `mork` - Navy & indigo (anbefalt)
- `noir` - Black & champagne

Bytter per enhet via Household-siden.

### Egne bilder
Lag mappe: `config/www/aura/bilder/`
Legg til bilder: `room.jpg`, `room.png`, eller `room.webp`
Referer i konfig som: `bild: room.jpg` (ikke full sti)

## 🐛 Feilsøking

### Dashbordet er tomt
- Sjekk nettleser-konsoll (F12) for feil
- Verifiser button-card er installert
- Sjekk at `/local/aura/motor.js` er tilgjengelig

### Viser svensk tekst
- Verifiser `_language: en` i `mitt_hem`
- Tøm nettleser-cache
- Reload med Ctrl+Shift+R

### Lys fungerer ikke
- Sjekk at entitets-IDer matcher ditt system
- Verifiser enheter er tilgjengelige (ikke unavailable)
- Sjekk nettleser-konsoll for tjenestekall-feil

### Garasje vises automatisk
- Verifiser `_portar_auto: false` er satt
- Tøm `localStorage` for Home Assistant
- Reload dashbord

## 📞 Støtte

### For denne engelske versjonen
- Les INSTALL-ENGLISH.md for detaljer
- Sjekk IMPLEMENTATION_PLAN.md for tekniske detaljer
- Se CHANGELOG.md for endringer

### For original Aura
- Se sundqvist80/aura-2 README (svensk)
- Original dokumentasjon i instruktionsbok/

## ✅ Sjekkliste før produksjon

- [ ] button-card installert
- [ ] motor.js kopiert til `/config/www/aura/motor.js`
- [ ] Dashbord opprettet og laster
- [ ] Språk viser som engelsk
- [ ] Lys er kontrollerbare
- [ ] Gardiner er kontrollerbare
- [ ] Bevegelsessensorer oppdaterer
- [ ] Støvsuger er kontrollerbar
- [ ] Kamera-feeds laster
- [ ] Garasje er IKKE i Aura-dashbord
- [ ] Eksisterende garasje-kontroll testet separat
- [ ] Ingen uventede automasjoner kjører

## 🎉 Oppsummering

### Hva fungerer
- ✅ Engelsk UI med dine enheter
- ✅ Original visuell design bevart
- ✅ Alle tre temaer tilgjengelige
- ✅ Lys, gardiner, bevegelse, støvsuger, kameraer
- ✅ Tibber strøm-overvåkning
- ✅ Trygg garasje-dokumentasjon

### Hva som må gjøres
1. Last ned filer
2. Installer button-card
3. Kopier motor.js
4. Opprett dashbord
5. Test grundig
6. Bekreft visuelt design

### Hva som ikke er inkludert
- ❌ Garasje i Aura (bruk eksisterende dashboard.yaml)
- ❌ Svenske integrasjoner
- ❌ Risikofylte automasjoner
- ❌ Direkte HA-installasjon (manuell installasjon kreves)

---

**Alt er klart for manuell installasjon. Ingen ting er installert eller endret på din HA-instans.**

Pull Request: https://github.com/arevinje/aura-2/pull/1
