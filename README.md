# Aura 2.0 – en premium-dashboard för Home Assistant

> *A modern, animated Home Assistant dashboard in Swedish. One engine file you can update in seconds, one settings block for your home. Fits a landscape tablet without scrolling and works great on phones.*

Aura är en komplett dashboard för Home Assistant med ett modernt, animerat utseende i stil med en köpt app. Hela gränssnittet drivs av **en motor**, och ditt hem beskrivs i **ett enda inställningsblock** (`mitt_hem`).

<p align="center">
  <img src="skarmbilder/aura-startsida.webp" alt="Aura på surfplatta och iPhone – växlar mellan temana Ljus, Mörk och Noir" width="100%">
</p>

---

## 🚀 Det här är nytt i 2.0

**Den stora skillnaden: Aura är nu en motor som går att uppdatera.**

| | Förut | Aura 2.0 |
|---|---|---|
| **Koden** | Allt i en enda YAML-fil på över 400 kB | En motor (`motor.js`) och en liten dashboardfil |
| **Uppdatera** | Klistra in hela dashboarden igen | Byt `motor.js` och ladda om sidan |
| **Dina inställningar** | Låg blandade med koden | Ligger för sig och rörs inte vid uppdatering |
| **Felsökning** | Leta själv i YAML | **Diagnos** visar version och vilka inställningar som pekar fel |

**Nya funktioner**

- 🛁 **Spabad:** ritad bild med bubblor, ljus, lock och badande. **Planera bad** värmer i tid, och en lägsta temperatur går att ställa in.
- 🪟 **Gardiner och portar:** markis, gardin, rullgardin och garage rör sig live på skärmen, med valfri färg och randig väv.
- 🔥 **Värme:** värmepump, golvvärme, element och AC med ritade bilder.
- 🚗 **Elbilen:** laddning och räckvidd på energisidan, i bilens egen färg.
- 🌙 **God natt-knappen:** ett tryck, en nedräkning, och lamporna tonas ner och släcks.
- 🔒 **Släck och larma:** lamporna lyser tills borta-larmet är på och släcks sedan. När du larmar av efter borta kan vardagsrum och hall tändas.

## 🎬 Se det i rörelse

*Filmerna är inspelade på en testsida med låtsasdata.*

| Gardiner och portar | Elbil och energi |
|---|---|
| ![Gardiner, markis och garage rör sig live](skarmbilder/film-gardiner.webp) | ![Elbilen laddar på energisidan](skarmbilder/film-energi.webp) |

| Spabadet | Ett dygn på vädersidan |
|---|---|
| ![Spabadet med bubblor, ljus och planerat bad](skarmbilder/film-spabad.webp) | ![Snabbspolning av ett dygn med väder, sol och måne](skarmbilder/film-vader.webp) |

| God natt | Rundtur |
|---|---|
| ![Nedräkning och lamporna släcks](skarmbilder/film-godnatt.webp) | ![Rundtur genom alla sidor](skarmbilder/film-rundtur.webp) |

## ✨ Höjdpunkter

- **Får plats på en surfplatta i liggande läge.** Ingen skrollning, och på mobilen staplas korten snyggt.
- **Tre teman:** *Ljus* (kräm och brons), *Mörk* (marin och indigo) och *Noir* (svart och champagne). Temat kan bytas per enhet direkt i dashboarden.
- **Ritade bilder** som tänds, lyser i lampans färg och rör sig. Du kan också använda egna bilder.
- **Smarta förslag** som går att ignorera, till exempel om en dörr har stått öppen, om ingen är hemma men lampor är tända, om en växt behöver vatten, när elen är billig eller om SMHI varnar.
- **Svenskt fokus:** Tibber och Nordpool, SMHI, Västtrafik, pollenprognos och norrsken.

## 📱 Sidorna

| Sida | Innehåll |
|---|---|
| **Hem** | Bild för hemmet eller rummet, klimat, smart förslag, spelas nu, mina enheter, väder, hushållet och elpris |
| **Ljus** | Scener, ljuseffekter, **Partyläge** och alla lampor per rum. Dra för att dimma, tryck på ikonen för färgpanelen |
| **Gardiner** | Markiser, gardiner, rullgardiner och garageport, ritade så att de följer läget, med egen färg och randig markisväv |
| **Värme** | Värmepump, golvvärme, element och AC med önskad temperatur och lägen, och förslag när ingen är hemma eller elen är dyr |
| **Media** | Music Assistant med sök, bibliotek, album, spellistor, kö och party-QR. Apple TV och smart-tv får fjärrkontroll och appar |
| **Energi** | Elpris per timme, billigaste tider, *Vad kostar det?* för dina maskiner, månadsprognos, förbrukning, solceller, hembatteri och elbil |
| **Säkerhet** | Larm med egen knappsats, dörrar, fönster, lås, rörelse, larmgivare, kameror och händelser |
| **Väder** | Himmelskort som följer vädret och dygnet, *Väderkoll* med SMHI-varningar, *Ute idag*, *Vädra eller inte*, prognos, sol och måne, natthimmel med norrsken och kompass |
| **Hushåll** | Spabad (Gecko), kaffemaskin (Home Connect), robotdammsugare, växter, buss med röstpåminnelse, kalender, att göra, server, tema och batterier |

**God natt-knappen** finns på alla sidor: längst ner i menyn på surfplattan och uppe till höger på mobilen.

## 📸 Skärmbilder

**Tre teman – samma hem**

| Ljus | Mörk | Noir |
|---|---|---|
| ![Hem – ljust tema](skarmbilder/hem-ljus.png) | ![Hem – mörkt tema](skarmbilder/hem-mork.png) | ![Hem – Noir](skarmbilder/hem-noir.png) |

**Sidorna**

| | |
|---|---|
| ![Ljus](skarmbilder/ljus.png) | ![Media](skarmbilder/media.png) |
| ![Energi](skarmbilder/energi.png) | ![Väder](skarmbilder/vader.png) |
| ![Gardiner och portar](skarmbilder/portar.png) | ![Säkerhet](skarmbilder/sakerhet.png) |
| ![Hushåll](skarmbilder/hushall.png) | |

**På mobilen**

<p align="center"><img src="skarmbilder/mobil.png" alt="Aura på iPhone" width="320"></p>

## 🎨 Det här finns ritat

Allt är ritat i koden, så du behöver inga bildfiler. Bilderna tänds, rör sig och följer läget på dina enheter.

**Lampor** – 16 sorter, välj med `typ:` (tänd och släckt)

![Alla lampor](skarmbilder/katalog/lampor.png)

**Bilen** – valfri färg med `farg:` under `_elbil`

![Bilen i olika färger och lägen](skarmbilder/katalog/bilar.png)

**Gardiner, markiser och portar** – bilden följer hur långt öppen den är

![Gardiner, markiser och portar](skarmbilder/katalog/gardiner.png)

**Värme och klimat**

![Värme och klimat](skarmbilder/katalog/varme.png)

**Hushåll och spabad**

![Hushåll och spabad](skarmbilder/katalog/hushall.png)

---

## 🧩 Krav

| Krävs | Valfritt |
|---|---|
| [button-card](https://github.com/custom-cards/button-card) (HACS) | [kiosk-mode](https://github.com/NemesisRE/kiosk-mode) – döljer Home Assistants menyrad |
| Home Assistant 2024.10 eller senare | Music Assistant, Alarmo, Tibber / Tibber Prices / Nordpool, SMHI, Västtrafik, Pollenprognos, System Monitor, Home Connect, Gecko, bubble-card |

Allt valfritt döljs automatiskt om det saknas. Har du till exempel inget larm syns ingen säkerhetssida.

## 📦 Installation

1. Installera **button-card** via HACS.
2. Kopiera [`www/aura/motor.js`](www/aura/motor.js) till **`config/www/aura/`** i Home Assistant. Lägg dina egna bilder i **`config/www/aura/bilder/`**.
3. Skapa en ny dashboard: **Inställningar → Instrumentpaneler → Lägg till → Ny instrumentpanel från början**.
4. Öppna den och välj **⋮ → Redigera → ⋮ → Raw-konfigurationsredigerare**.
5. Klistra in hela [`aura_dashboard.yaml`](dashboard/aura_dashboard.yaml) och spara.
6. Ändra inställningarna i blocket `mitt_hem` högst upp, så att de passar ditt hem.

## 🔄 Uppdatera

1. Byt ut `config/www/aura/motor.js` mot den nya filen.
2. Ladda om sidan.

Klart. Dina inställningar rör du inte. Vilken version du kör ser du under **Hushåll → Utseende**.

## ⚙️ Inställningar

Allt du ändrar finns i `button_card_templates → mitt_hem → variables`. Ett litet urval:

```yaml
_hem_namn: Mitt hem
_plats: Göteborg
_tema: noir                       # ljus, mork eller noir
_bakgrundsbild: oversikt.jpg      # i config/www/aura/bilder/

_rum:
  - namn: Vardagsrum
    bild: vardagsrum.jpg
    temp: sensor.vardagsrum_temperatur
    lampor:
      - entity: light.taklampa
        namn: Taklampan
        typ: krona                # tak, pendel, plafond, klot, krona, spot, golv, bord, skrivbord, vagg, glod, led, stake, gran, mane, uttag – eller egen.png

_mediaspelare: [media_player.vardagsrum]
_elpris: sensor.tibber_prices
_vader: weather.hem
_larm: alarm_control_panel.alarmo
_buss: sensor.mot_centrum
```

Med `_rum: []` hämtas rummen och lamporna automatiskt från dina områden i Home Assistant.

📖 **Den fullständiga guiden**, med alla inställningar, lampbilder, ikoner och felsökning, finns i [`Aura_instruktionsbok.md`](instruktionsbok/Aura_instruktionsbok.md).

## 📁 Så ligger filerna

| Katalog | Innehåll |
|---|---|
| [`dashboard/`](dashboard) | `aura_dashboard.yaml` – dashboarden och alla inställningar |
| [`www/aura/`](www/aura) | `motor.js` och `bilder/` – kopieras till `config/www/aura/` i Home Assistant |
| [`automationer/`](automationer) | Automationer att klistra in i Home Assistant |
| [`skript/`](skript) | Skript att klistra in i Home Assistant |
| [`instruktionsbok/`](instruktionsbok) | Den fullständiga guiden |
| [`skarmbilder/`](skarmbilder) | Bilderna och filmerna i den här filen |
| [`skisser/`](skisser) | Klickbara skisser av kort och knappar |

## 🧰 Automationer och skript

Allt här är valfritt. De läggs in under **Inställningar → Automationer och scener** (fliken Automationer respektive Skript) via **⋮ → Redigera i YAML**.

| Fil | Vad den gör |
|---|---|
| [`larm_automation.yaml`](automationer/larm_automation.yaml) | Får Alarmo att bete sig som ett riktigt larm. Högtalaren säger till när larmet slås på, när någon kommer in och när det slås av. Om larmet går skickas notiser med **kamerabild** till telefonerna. |
| [`givare_automation.yaml`](automationer/givare_automation.yaml) | Vattenläcka, brand och gas: rösten varnar tills givaren tystnar, kritiska notiser och huvudkranen stängs automatiskt. |
| [`valkommen_automation.yaml`](automationer/valkommen_automation.yaml) | **Välkommen hem**: tänder vardagsrum och hall när borta-larmet slås av och det är mörkt ute. |
| [`spa_automation.yaml`](automationer/spa_automation.yaml) | **Planera bad**: spabadet hålls på lägsta temperatur (35°), börjar värma 2 timmar före badtiden och går tillbaka till 35° efteråt. Kan upprepas varje vecka. |
| [`godnatt_script.yaml`](skript/godnatt_script.yaml) | **God natt-knappen**: Home Assistant räknar ner, så att det släcks även om surfplattan somnar. Utan skriptet räknar skärmen ner själv. |
| [`borta_slack_script.yaml`](skript/borta_slack_script.yaml) | **Släck och larma**: lamporna tonas ner och släcks när borta-larmet är på. |
| [`party_script.yaml`](skript/party_script.yaml) | Skriptet bakom **Partyläge**. Färglamporna byter färg i vald takt, med färger från **skivomslaget** på låten som spelas. |

## 🔧 Så fungerar det

- **En motor:** hela gränssnittet är en JavaScript-motor i `www/aura/motor.js`. Dashboarden innehåller bara en liten laddare och dina inställningar.
- **Snabbstart:** en kopia av motorn sparas i enheten, så sidan visas direkt. Nya versioner hämtas i bakgrunden.
- **Smarta uppdateringar:** när en entitet ändras uppdateras bara den del av sidan som påverkas. Animationer och inmatning störs därför inte.
- **Inga bildfiler behövs:** produktbilder och vädersymboler är ritade som SVG i koden.

## 🌐 Externa tjänster

Alla är valfria och går att stänga av:

| Funktion | Tjänst | Stäng av med |
|---|---|---|
| Norrskensprognos | NOAA SWPC (Kp-index) | `_norrsken: false` |
| Regnradar (avstängd som standard) | RainViewer och Esri | `_radar: false` |

Inga personuppgifter skickas. Radarn hämtar kartbitar för området runt hemmet, inte en exakt adress.

## ⚠️ Innan du delar din egen konfiguration

`aura_dashboard.yaml` innehåller dina egna inställningar. Byt ut sådant du inte vill visa innan du laddar upp filen, till exempel:

- `_hem_namn`, `_plats` och adresser (Tibber-prefixet kan innehålla gatuadressen)
- `_bakgrundsbild` och bildsökvägar
- namn på personer, telefoner (`notify.mobile_app_…`) och kameror i `larm_automation.yaml`

## 📝 Licens

[MIT](LICENSE). Använd, ändra och dela fritt.

## 🙏 Tack

Bygger på [button-card](https://github.com/custom-cards/button-card) av RomRider och ikonerna från [Material Design Icons](https://pictogrammers.com/library/mdi/).
