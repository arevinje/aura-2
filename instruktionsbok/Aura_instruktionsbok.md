# Aura – instruktionsbok

Den här guiden visar hur du ställer in Aura-dashboarden för ett nytt hem, med nya lampor, sensorer och enheter. **Allt du behöver ändra finns i ett och samma block: `mitt_hem` högst upp i `aura_dashboard.yaml`.** Motorn ligger i en egen fil, `motor.js`, som du aldrig behöver öppna.

---

## 1. Innan du börjar

1. **Installera button-card:** HACS → sök på *button-card* → Ladda ner. Kiosk-mode är valfritt; det döljer Home Assistants egen menyrad.
2. **Lägg motorn på plats:** kopiera `www/aura/motor.js` till mappen **`config/www/aura/`** i Home Assistant (med *File editor*, *Studio Code Server* eller *Samba*). Skapa mappen `aura` om den inte finns. Den nås då som `/local/aura/motor.js`.
3. **Lägg dina bilder** (rum, startsida, egna lampbilder) i **`config/www/aura/bilder/`**. Se 2 och 3.2.
4. **Skapa en ny dashboard:** Inställningar → Instrumentpaneler → Lägg till → *Ny instrumentpanel från början*.
5. **Klistra in filen:** öppna dashboarden → ⋮ → Redigera → ⋮ → *Raw-konfigurationsredigerare*. Markera allt, klistra in hela `aura_dashboard.yaml` och tryck Spara.
6. **Ändra inställningarna:** gör dina ändringar i `mitt_hem` (samma ställe) och spara.
7. **Ladda om:** ladda om sidan efter varje ändring.

> **Första gången** står det *Laddar Aura …* en kort stund. Står det *Aura hittar inte motorn* ligger `motor.js` inte i `config/www/aura/` – kontrollera mappen och stavningen. Har du precis skapat mappen `www` måste Home Assistant startas om en gång.

### 1.1 Uppdatera Aura

Det här är det fina med att motorn är en egen fil:

1. **Byt bara ut `config/www/aura/motor.js`** mot den nya filen.
2. **Ladda om sidan** – på surfplattan och mobilen räcker det att dra ner och släppa, eller stänga och öppna appen.

Du rör **inte** `aura_dashboard.yaml` – dina inställningar ligger kvar precis som de är. Kommer en uppdatering med nya inställningar står de beskrivna här i instruktionsboken, och du lägger bara till de rader du vill ha.

Under **Hushåll → Utseende** visar en liten knapp vilken version som körs (se 9.4).

**Snabbstart:** varje surfplatta och mobil sparar en kopia av motorn. Därför visas sidan direkt när du öppnar den, i stället för att först ladda ner hela motorn (ca 400 kB) – det märks mest på mobilen utanför hemmet. Samtidigt kollar Aura i bakgrunden om `motor.js` har ändrats; har den det byts motorn ut av sig själv efter en sekund eller två. Under *Diagnos* ser du hur lång tid starten tog och om den kom från den sparade kopian eller laddades ner.

### Så hittar du namnet på en enhet (entitets-id)

En entitet är det Home Assistant kallar en enskild lampa, sensor eller knapp. Aura behöver dess id, till exempel `light.koksbordet` eller `sensor.temp_vardagsrum_temperatur`. Du hittar det på två sätt:

- **Inställningar → Enheter och tjänster → Entiteter.** Sök på namnet och kopiera *Entitets-ID*.
- **Utvecklarverktyg → Tillstånd.** Här ser du alla entiteter och deras värden. Det är bra när du vill kontrollera att en sensor faktiskt har ett värde.

### Fem regler för att inte få fel

| Regel | Exempel |
|---|---|
| **Indraget är heligt.** Använd mellanslag, aldrig tab. Kopiera en befintlig rad och ändra den. | `      _plats: Borås` |
| **Tom text** skrivs med två apostrofer. | `_accent: ''` |
| **Tom lista** skrivs med hakparenteser. | `_fonster: []` |
| **Listor** har ett bindestreck per rad, indraget två steg mer än rubriken. | `        - binary_sensor.entredorr` |
| Allt efter **#** är en kommentar och ignoreras. | `_tema: mork   # mörkt tema` |

> **Tips:** saknar du en sak, till exempel solceller, larm eller kaffemaskin, lämnar du inställningen tom. Den delen av dashboarden döljs då automatiskt.

---

## 2. Utseende

```yaml
_hem_namn: Din_gata            # står stort i bilden på startsidan
_plats: Borås                  # rubrik på väderkortet
_tema: ljus                    # ljus = kräm och brons, mork = marinblått och indigo, noir = svart och champagne
_accent: ''                    # egen huvudfärg, t.ex. '#2F80ED'. Tomt = temats färg
_bakgrundsbild: hem.jpg        # stora bilden på startsidan. Tomt = mönster
```

**Egna bilder:** lägg alla bilder i mappen **`config/www/aura/bilder/`**. Då räcker det att skriva **filnamnet**, till exempel `hem.jpg` eller `vardagsrum.jpg` – Aura letar själv i `/local/aura/bilder/`. Vill du ha en bild någon annanstans skriver du hela sökvägen (`/local/…` eller `https://…`), så används den som den är.

---

## 3. Rum och lampor (det viktigaste)

Varje rum blir en ruta på startsidan och en egen rad med lampor på **Ljus**-sidan.

```yaml
_rum:
  - namn: Vardagsrum
    ikon: mdi:sofa-outline
    bild: ''                                  # valfri egen bild för rummet
    temp: sensor.vardagsrum_temperatur        # valfri
    fukt: sensor.vardagsrum_luftfuktighet     # valfri
    lampor:
      - entity: light.taklampa_vardagsrum
        namn: Taklampan
        ikon: mdi:ceiling-light
        typ: tak
      - entity: light.golvlampa
        namn: Golvlampa
        ikon: mdi:floor-lamp-outline
      - switch.julgran_uttag                  # kortform: bara entiteten
```

| Nyckel | Betyder |
|---|---|
| `namn` | Rummets namn |
| `ikon` | Liten ikon för rummet (se kapitel 11) |
| `bild` | Egen bild som visas överst när rummet är valt. Tomt = rummets ikon |
| `temp` / `fukt` | Temperatur- och fuktsensor. Visas på rummets kort. Kan utelämnas |
| `lampor` | En lista med lampor. Det fungerar med `light.` och med `switch.` (smarta uttag) |

För varje lampa:

| Nyckel | Betyder |
|---|---|
| `entity` | Lampans entitets-id. **Krävs** |
| `namn` | Namnet på rutan. Utelämnat = namnet från Home Assistant |
| `ikon` | Den **lilla runda ikonen** uppe till vänster på rutan |
| `typ` | Den **stora bilden** på rutan (se nästa avsnitt) |

> **Låt Aura hitta rummen själv:** skriver du `_rum: []` hämtas rummen och lamporna från dina *Områden* i Home Assistant (Inställningar → Områden). Det är det snabbaste sättet i ett nytt hem. Du kan alltid skriva egna rum senare.

### 3.1 Välja rätt bild på lampan (`typ`)

Det här är det som styr den stora produktbilden. Bilderna är ritade i koden, så du behöver inte ladda ner några bildfiler.

| `typ:` | Bilden föreställer | Passar till |
|---|---|---|
| `tak` | Taklampa – pendel med metallskärm | Taklampor, köksbord, pendlar |
| `pendel` | PH-pendel – vit skärm i tre lager | Pendlar över matbord, PH-lampor |
| `plafond` | Plafond – flat opalvit lampa i taket | Hall, badrum, sovrum, tvättstuga |
| `spot` | Spotlights – tre riktbara spottar på en skena | Spotskenor, takspottar, downlights |
| `klot` | Glaskula – opalvit klotlampa med kromad kåpa | Klotlampor, glaspendlar |
| `krona` | Takkrona – mässingskrona med armar och glödtrådslampor | Takkronor, "spindel"-lampor |
| `golv` | Golvlampa – hög fot med skärm | Golvlampor, läslampor |
| `bord` | Bordslampa – rund fot med skärm | Fönsterlampor, sänglampor, bordslampor |
| `skrivbord` | Arbetslampa – ledad arm med skärm | Skrivbord, läslampor, arkitektlampor |
| `vagg` | Vägglampa – vägglampett med arm och skärm | Vägglampor, sänglampetter |
| `glod` | Glödlampa | Allmänna lampor, "vet inte" |
| `led` | Ledlist – slinga med lysdioder som lyser i lampans färg | LED-lister, ljusslingor bakom tv, sängar och skåp |
| `stake` | Ljusbåge – adventsljusstake med ljuspunkter | Ljusstakar, ljusslingor, fönsterdekor |
| `gran` | Julgran – med blinkande ljus och stjärna | Julgranen, julbelysning på smarta uttag |
| `mane` | Månlampa | Månlampor, nattlampor |
| `uttag` | Smart uttag (stickpropp) | Smarta uttag som styr något annat än en lampa |
| `minbild.png` | **Din egen bild** i `config/www/aura/bilder/` (se 3.2) | Lampor som inte liknar någon av bilderna |

**När lampan är tänd** lyser bilden i lampans egen färg. Ändrar du färgen i färgpanelen ändras skenet också.

**Om du inte skriver `typ`** gissar Aura utifrån ikonen, namnet och entitets-id:t. Den letar efter orden nedan. Första regeln som stämmer vinner:

| Om ikon/namn/entitet innehåller … | blir bilden |
|---|---|
| `julgran`, `gran`, `christmas`, `pine-tree` | `gran` |
| `led`, `strip`, `list` (t.ex. *Ledlist*, `mdi:led-strip-variant`) | `led` |
| `switch.` / `uttag` / `power-plug` (+ *måne* → `mane`, + *fönster* → `stake`) | `uttag` |
| `mån`, `moon` | `mane` |
| `floor`, `golv` (t.ex. `mdi:floor-lamp`) | `golv` |
| `pendel`, `pendant`, `ph5` | `pendel` |
| `plafond`, `flush` | `plafond` |
| `vägg`, `wall`, `sconce` | `vagg` |
| `spot` | `spot` |
| `desk`, `skrivbord`, `arbets`, `läslampa` | `skrivbord` |
| `globe`, `klot`, `glob`, `opal` | `klot` |
| `chandelier`, `krona`, `spider` (t.ex. `mdi:chandelier`) | `krona` |
| `ceiling`, `taklampa`, `kök` | `tak` |
| `lamps`, `fönster`, `window`, `slinga`, `string` | `stake` |
| `lamp-outline`, `table`, `säng`, `soffa` | `bord` |
| inget av ovanstående | `glod` |

> **Säkrast:** skriv alltid `typ:`. Då blir det rätt bild oavsett vad lampan heter.

### 3.1.1 Rummets bild

Har ett rum `bild:` syns fotot stort överst på startsidan när du väljer rummet. Saknas en bild visas mönstret i stället för en svart ruta, med en liten knapp *Bilden hittas inte* som öppnar Diagnos.

### 3.2 Egen bild på en lampa

Om ingen av bilderna passar kan du använda ett eget foto av lampan:

1. **Hitta en bild.** Bäst blir en **PNG med genomskinlig bakgrund**, till exempel produktbilden från butikens webbplats. En bild med vit bakgrund fungerar också, men syns då som en ruta.
   - *Tips:* tjänster som remove.bg tar bort bakgrunden gratis.
2. **Spara bilden** i `config/www/aura/bilder/`, till exempel som `kloten.png`.
3. **Skriv filnamnet** som `typ:`

```yaml
      - entity: light.kokslampa
        namn: Köksbordet
        typ: kloten.png
```

Så ser den ut:
- **Tänd lampa:** bilden får ett sken i lampans färg bakom sig.
- **Släckt lampa:** bilden blir lite blekare.
- **Färgpanelen:** samma bild visas när du öppnar den.

### 3.3 Styra lamporna i dashboarden

- **Tryck** på rutan: tänd eller släck.
- **Dra fingret i sidled** på rutan: dimra (bara dimbara lampor).
- **Tryck på den lilla ikonen** (den har en färgprick) eller **håll inne** på rutan: färgpanelen öppnas med ljusstyrka, varm/kall ton och färg.

---

### 3.4 Startsidan i övrigt

- **Klimat:** stor temperatur för det valda rummet (eller `_temp_inne`) med **trend** senaste timmen (*Stiger +0,4°*, *Sjunker −0,3°* eller *Stabilt*) och luftfuktighet. Under den en kurva över **senaste dygnet** där det bekväma intervallet **20–23°** är markerat, med lägsta och högsta värde och klockslag. Kortet och kurvan färgas efter temperaturen – blått när det är kallt, guld när det är lagom och orange när det är varmt. Längst ner alla andra rum med temperatursensor – tryck på ett för att byta rum.
- **Sidbyten** tonar mjukt in.

## 4. Scener, släck allt och ljuseffekter

```yaml
_scener:
  - entity: scene.mys
    namn: Mys
    ikon: mdi:candle
    farg: '#FBBF24'               # färgen på scenens ikonbricka
_slack_allt: script.slack_allt_om_5_minuter   # valfritt
_slack_minuter: 5
```

- **`_scener: []`** visar alla scener du har.
- **`_slack_allt`** blir knappen *Släck allt om 5 min* på Ljus-sidan. Den visas bara om du har stängt av God natt-knappen (`_godnatt: false`), se 7.3.

**Ljuseffekter** (valfritt) kräver två saker i Home Assistant:

```yaml
_ljuseffekt: input_select.ljuseffekt          # visar vilken effekt som är på
_ljuseffekt_script: script.ljuseffekt_knapp   # körs med variabeln "effekt"
_ljuseffekter:
  - effekt: norrsken
    namn: Norrsken
    ikon: mdi:weather-night
```

Skriptet får värdet i `effekt`, till exempel `norrsken`, och bestämmer självt vad som ska hända. Vill du inte ha effekter skriver du `_ljuseffekter: []`.

**Partyläge** (knappen under Ljuseffekter):

```yaml
_party_script: script.partylage   # lägg in party_script.yaml som skript i Home Assistant
_party_lampor: []                 # tom = alla färglampor i dina rum
```

- **Färger:** lamporna byter färg i den takt du väljer (*Lugn*, *Medel* eller *Fest*). Färgerna hämtas från **skivomslaget** på låten som spelas, så en ny låt ger nya färger.
- **Slut:** när musiken pausas, eller när du trycker igen, blir lamporna som de var innan.
- **Takten följer inte trummorna exakt.** Det kräver något som lyssnar på ljudet, till exempel Philips Hue Sync eller WLED med mikrofon.

---

## 5. Media

```yaml
_mediaspelare:
  - media_player.vardagsrum_sonos
  - media_player.apple_tv_vardagsrum
_party_skarm: https://app.music-assistant.io/stable/#/party
_party_url: ''
```

- **Music Assistant-spelare** får sök, bibliotek, album, spellistor, kö och party.
- **Apple TV, Chromecast, smart-tv** får i stället en fjärrkontroll, en styrplatta och knappar för appar. Fjärrkontrollen (`remote.`) hittas automatiskt.
- **`_mediaspelare: []`** tar med alla spelare. Har du Music Assistant tas bara dess spelare med.
- **Byta spelare:** tryck på en spelare i raden under mediaspelaren. **Dubbeltrycker** du på en annan högtalare spelar den samma musik (gruppering).
- **`_party_url`:** fyll i gästlänken från Music Assistant. Då visas en QR-kod som gästerna kan skanna.

---

## 6. Energi (elpris)

```yaml
_elpris: sensor.tibber_prices
_el_prefix: din_Prefix     # början på dina Tibber-sensorer
_elomrade: SE3
_el_billig: 1                  # kr/kWh – under detta: grön stapel
_el_dyr: 2                     # kr/kWh – över detta: röd stapel
```

- **`_elpris`** ska vara en sensor som har timpriserna för idag och imorgon i sina attribut. Det fungerar med Tibber, Tibber Prices och Nordpool.
- **`_el_prefix`** används för att hitta månadskostnaden: `sensor.<prefix>_manadskostnad` eller `sensor.<prefix>_manatlig_kostnad`.
- Inget elpris och inga solceller? Lämna `_elpris: ''` så döljs Energi-sidan.

### 6.1 Solceller

Lämna allt tomt tills du har solceller. När du fyller i dem dyker ett **Solceller**-kort upp på Energi-sidan, bredvid nyckeltalen. Startsidans bild får också en etikett med vad panelerna ger just nu, till exempel "4,3 kW sol".

```yaml
_sol_effekt: sensor.solar_power              # effekt just nu (W eller kW)
_sol_idag: sensor.solar_energy_today         # producerat idag (kWh)
_sol_salt: sensor.solar_export_today         # sålt till nätet idag (kWh) – valfritt
_husets_effekt: sensor.house_power           # vad huset drar just nu (W) – valfritt
_sol_prognos: sensor.energy_production_today # Forecast.Solar, prognos idag – valfritt
_sol_max_kw: 10                              # anläggningens toppeffekt – valfritt
```

| Fyller du i … | visas |
|---|---|
| `_sol_effekt` | Stort tal "4,32 kW", en sol som lyser och etiketten *Producerar* eller *Vilar* |
| `_sol_max_kw` | En stapel som visar hur nära max du ligger |
| `_sol_idag` | *Producerat idag*, plus *Värde idag* (kWh × dagens snittpris) |
| `_sol_salt` | *Sålt idag* och *Eget bruk* i procent |
| `_husets_effekt` | "3,1 kW över till nätet" eller "Huset tar 0,8 kW från nätet" |
| `_sol_prognos` | *Prognos idag* (från integrationen Forecast.Solar) |

- **Enheter:** Aura räknar själv om W/kW och Wh/kWh, så det spelar ingen roll vilken enhet sensorn använder.
- **Var sensorerna finns:** de kommer oftast från växelriktarens integration, till exempel Huawei Solar, SolarEdge, Fronius eller Growatt, eller från din elmätare (Tibber Pulse, P1-mätare).
- **Bara en sensor räcker:** `_sol_effekt` eller `_sol_idag`.

### 6.2 Hembatteri

Har du ett batteri, med eller utan solceller, fyller du i de här. Lämna dem tomma annars, så syns inget.

```yaml
_batteri_niva: sensor.battery_state_of_charge   # laddnivå i %
_batteri_effekt: sensor.battery_power            # effekt in/ut (W eller kW)
_batteri_effekt_omvand: false                    # true om sensorn visar PLUS när batteriet laddar UR
_batteri_kapacitet: 10                           # storlek i kWh – valfritt
```

Så visas batteriet:
- **Med solceller:** solcellskortet byter namn till **Sol & batteri** och får ett batteri bredvid soleffekten. Det visar laddnivån, *Laddar 2,1 kW*, *Ger 1,4 kW* eller *Vilar*, och med `_batteri_kapacitet` även *Fullt om 1 h 10 min* eller *Räcker ca 5 h*.
- **Utan solceller:** kortet heter bara **Batteri** och visar även hur mycket som är lagrat just nu.
- **Startsidan:** bilden får en etikett med laddnivån.

### 6.2.1 Elbil

```yaml
_elbil:
  namn: Audi e-tron
  prefix: audi_e_tron        # början på bilens entiteter
  kapacitet: 86              # kWh
  laddeffekt: 11             # laddboxens kW
  farg: '#59606A'            # bilens färg på bilden
```

Med `prefix` letar Aura själv upp bilens sensorer, till exempel från integrationen **Audi Connect** (HACS). Den söker efter entiteter som börjar med prefixet och slutar på:

| Uppgift | Letar efter | Egen inställning |
|---|---|---|
| Laddnivå % | `state_of_charge`, `soc`, `battery_level` | `batteri:` |
| Räckvidd km | `range`, `electric_range` | `rackvidd:` |
| Laddar? | `charging_state` (*charging*) eller laddeffekt > 0 | `laddstatus:` |
| Laddeffekt kW | `charging_power` | `effekt:` |
| Kabeln i? | `plug_state` | `kabel:` |
| Klar om | `remaining_charging_time` | `tid_kvar:` |
| Mål % | `target_state_of_charge` (annars 80 %) | `mal:` |
| Förvärm | `switch/climate/button` med `climatisation` eller `preheater` | `klimat:` |
| Lås | `lock.` | `las:` |

Hittar Aura fel sensor skriver du den själv, till exempel `batteri: sensor.min_bil_batteri`.

**Kortet** ligger under *Just nu* på energisidan. Det visar en ritad elbil i bilens färg som lyser grönt vid laddluckan när den laddar och blått när kabeln sitter i. Det visar också laddnivå med en markering för målet, räckvidd i km, hur fort den laddar, när den är klar och, när den inte laddar, **de billigaste sammanhängande timmarna att ladda** med vad det kostar. Knappen **Förvärm** finns om bilen har det, och **Starta laddning** finns om du anger `laddbox:`. Vill du ha ett eget foto av bilen skriver du `bild: /local/bil.png`.

**På Hem** visas bilen också som en ruta under *Mina enheter*, med laddnivå och status, till exempel *Laddar · 46 %* eller *182 km · 28 %*. Rutan lyser grönt när bilen laddar. Har du angett `laddbox:` startar och stoppar reglaget laddningen, och trycker du på rutan kommer du till energisidan. Blir det fler än sex rutor visas de i fyra kolumner på surfplattan, så att allt får plats.

**Smart förslag:** på kvällen, när bilen har under 50 % och kabeln inte sitter i, kommer *"Audi e-tron har 32 % – sätt i laddkabeln ikväll. Billigast att ladda kl 01–05."* (stängs av med `_forslag_av: [elbil]`).

### 6.3 Förbrukning och "Vad kostar det?"

Energi-sidan visar nu också mer om elpriset:
- **Just nu-kortet:**
  - hur dagens pris står sig mot dagens snitt, i procent
  - **Huset drar nu**, i kW och i kr per timme
  - en prognos för hela månaden
- **Nyckeltalen:**
  - snitt idag och imorgon (grönt om morgondagen är billigare)
  - högst och lägst idag, med klockslag
  - förbrukat idag, kostnad idag, månadskostnad och prognos för månaden
- **Vad kostar det?:** ett eget kort under diagrammet. Där ser du vad det kostar att köra till exempel diskmaskinen *nu* jämfört med *bästa tid*, och hur mycket du sparar på att vänta.
- **Billigaste tider:** i Just nu-kortet. Visar de billigaste perioderna på 1, 3 och 6 timmar i rad, till exempel för en kort tvätt, diskmaskinen eller elbilen.
- **Diagrammets etikett:** visar om morgondagen blir billigare eller dyrare än idag.

```yaml
_el_effekt: ''              # vad huset drar just nu (W)
_el_forbrukning_idag: ''    # förbrukat idag (kWh)
_el_kostnad_idag: ''        # kostnad idag (kr)
_el_apparater:
  - namn: Diskmaskin
    ikon: mdi:dishwasher
    kwh: 1.1                # ungefär hur mycket en körning drar
    timmar: 2               # hur länge den går
  - namn: Elbil
    ikon: mdi:car-electric
    kwh: 20
    timmar: 6
```

- **Tibber Pulse:** effekten och förbrukningen hittas automatiskt via `_el_prefix`, så de tre första raderna kan vara tomma.
- **Utan förbrukningssensorer** visas bara de delar som går att räkna ut från elpriset.

---

## 7. Säkerhet

```yaml
_larm: alarm_control_panel.alarmo
_dorrar: [binary_sensor.entredorr_oppning, binary_sensor.altandorr_oppning]
_fonster: []
_las: [lock.ytterdorr]
_rorelse: [binary_sensor.rorelse_hall]
_larmgivare: [binary_sensor.brandvarnare_kok, binary_sensor.vattenlacka_tvatt]
_kameror: []          # tom = alla kameror (Frigate först)
```

- **Listorna** kan skrivas antingen på en rad med `[a, b]` eller som vanliga rader med bindestreck.
- **Larmkoden** knappas in i dashboardens egen knappsats.
- **Sidan döljs** om du saknar både larm, kameror och dörrar.

### Säkerhetssidan

Sidan har tre kolumner på surfplattan:

- **Larmet** med en checklista **Redo att larma**: en rad per sort – dörrar, fönster, lås, garage, rörelse, brand och vatten och kameror – som visar *3/3 stängda* i grönt eller *Entrédörr öppen* i gult. Tryck på en rad för att se varje givare och hur länge den varit i sitt läge; tryck på en givare för Home Assistants ruta. Överst står *Allt ok* eller hur många saker som är värda att se över.
- **Kamerorna**: en stor bild i liggande format och de andra som små bilder under – tryck på en liten för att byta. Den stora visar senaste Frigate-händelsen för kameran, och en gul prick på en liten bild betyder att den ser en person just nu. Valet sparas på enheten.
- **Händelser**: en stapel per timme för senaste dygnet överst, och listan under. Flera Frigate-händelser i rad vid samma kamera slås ihop (*Person ×5 · Vardagsrum 18:35–18:36* med bilderna staplade), och en dörr som öppnas och stängs inom tio minuter blir en rad (*Entrédörr öppnades och stängdes · Öppen 1 min*).

### 7.0 Larmet som ett riktigt larm

**På surfplattan (Aura):** med `_larm_skarm: true` visas en helskärmsvy på alla enheter som har Aura öppen:

| Läge | Visas |
|---|---|
| **Larmet slås på** | Nedräkning till larmet är på, och knappen *Avbryt* |
| **Någon kommer in** | "Larmet är på!", nedräkning och *Slå av larmet* (knappsatsen öppnas) |
| **Larmet går** | Blinkande röd vy, vilken dörr eller sensor som löste ut, och kamerabilder som uppdateras |

Med *Dölj* stänger du vyn för just den händelsen.

**Ljud och notiser (Home Assistant):** lägg in automationen i `larm_automation.yaml`. Den gör följande:
- **Larmet slås på:** säger "Larmet aktiveras om 60 sekunder…" och sedan "Tio sekunder kvar".
- **Larmet är på:** säger "Larmet är på" och skickar en notis.
- **Någon kommer in:** säger "Larmet är på. Ange koden…" tills koden anges, och skickar en notis.
- **Larmet går:** säger "Inbrottslarm!" på hög volym och skickar en notis till varje telefon med **kamerabild**. Notisen låter även i tyst läge, och ett tryck öppnar larmet.
- **Larmet slås av:** säger "Välkommen hem! Larmet är avstängt" och skickar en notis.
- **Du kommer hem medan larmet är på:** skickar en notis med en knapp till larmet.

### 7.0.2 Händelser – senaste dygnet

```yaml
_handelser: true      # false = ingen tidslinje
_frigate: frigate     # Frigate-instansens namn (standard frigate). false = inga Frigate-händelser
```

Till höger på säkerhetssidan finns en tidslinje över det senaste dygnet, nyast överst:

- **Larmet:** på (borta, hemma, natt, semester), av, inpassering och om det har gått. Står det *av Alex* vet du vem som larmade av. Namnet tas från personen i HA som är kopplad till användaren.
- **Dörrar, fönster och lås:** öppnades, stängdes, låstes, låstes upp.
- **Rörelse:** högst en rad per rörelsevakt var tionde minut, så att listan inte svämmar över.
- **Brand- och vattenlarm** i `_larmgivare`.
- **Frigate:** *Person vid Entré*, *Bil vid Entré* osv. med säkerhet i procent, zon och en liten bild. Tryck på raden så öppnas bilden stort och **videoklippet** spelas upp. Där finns också *Visa kameran live*.

Överst kan du filtrera: **Alla**, **Larm**, **Dörrar** och **Kameror**. Valet sparas på enheten. Tryck på en vanlig rad för att öppna givaren i Home Assistant.

Frigate-delen kräver integrationen **Frigate** (via HACS) med notiser påslagna, vilket är standard. Bilderna och klippen hämtas via `/api/frigate/notifications/…`. Har du döpt om Frigate-instansen skriver du namnet i `_frigate`.

### 7.0.3 Vem får se kamerorna?

```yaml
_kamera_anvandare: [Alex, Kim]     # bara de här användarna ser kamerorna
```

- Skriv **förnamnet** eller **hela namnet** på användaren i Home Assistant (*Inställningar → Personer → Användare*). `admin` betyder alla administratörer. Tom lista betyder alla användare.
- **En användare som inte finns med** ser inga kameror alls. Kamerakortet, kamerabilderna i larmvyn och Frigate-händelserna försvinner, och tidslinjen tar kamerornas plats.
- **Olika för olika kameror:** skriv kamerorna med `anvandare:`. Kameror utan egen lista följer `_kamera_anvandare`.

```yaml
_kameror:
  - entity: camera.entre
    anvandare: [Alex, Kim, Sam]
  - entity: camera.vardagsrum
    anvandare: [Alex, Kim]
```

> **Obs:** det här döljer kamerorna i Aura. Det är inget lås. Den som får se dem på Hem-sidan i Home Assistant eller i en annan dashboard kan fortfarande göra det. Vill du stänga ute någon helt gör du den användaren till *icke-admin* och ger den en egen dashboard utan kameror. Användare som inte är admin kommer inte åt utvecklarverktygen.

### 7.0.4 Vattenläcka, brand och gas

```yaml
_larmgivare: [binary_sensor.vattenlacka_tvatt, binary_sensor.brandvarnare_kok]
_vattenventil: valve.huvudkran      # valfritt – en ventil på huvudledningen
_givare_skarm: true                 # false = ingen helskärm
```

**I Aura:** så fort en givare i `_larmgivare` larmar täcks skärmen – på alla surfplattor och mobiler som har Aura öppen – av en blinkande varning, precis som inbrottslarmet:

- **💧 VATTENLÄCKA** (blå), **🔥 BRANDLARM**, **GASLARM** eller **KOLMONOXID** (röd) – Aura läser givarens *device_class* (`moisture`, `smoke`, `gas`, `carbon_monoxide`) eller namnet.
- Vilken givare det är och när den började larma.
- **Stäng huvudkranen** vid vattenläcka om du har `_vattenventil` – knappen blir grön med *Huvudkranen är stängd* när den är stängd.
- **Ring 112** vid brand och gas (fungerar på mobilen).
- **Dölj** gömmer varningen tills givaren larmar igen.

**Röst och notiser:** lägg in `givare_automation.yaml` (Automationer → Skapa ny → ⋮ → Redigera i YAML). Den gör att högtalaren säger *"Varning! Vatten har upptäckts – Vattenläcka tvättstugan"* var 30:e sekund tills givaren slutar larma, skickar en **kritisk notis** som hörs även i tyst läge och – om du vill – **stänger huvudkranen automatiskt** vid vattenläcka. När givaren slutat larma kommer en lugnande notis. Ändra raderna markerade *← ÄNDRA*, och skriv samma givare under `triggers:` som i `_larmgivare`.

### 7.0.1 Kontroll innan du larmar

När du trycker **Hemma**, **Natt**, **Borta** eller **Semester** kontrollerar Aura först:

- **dörrar och fönster** i `_dorrar` och `_fonster` som står öppna
- **lås** i `_las` som är olåsta
- **givare som inte svarar** (dörrar, fönster, lås, `_rorelse` och `_larmgivare` som är *unavailable*). De kan inte upptäcka intrång.

Hittar den något kommer en ruta med listan och två knappar: **Avbryt** eller **Larma ändå**. Väljer du *Larma ändå* fortsätter det som vanligt, med kodrutan om ditt larm kräver kod. Är allt stängt larmas det direkt, utan fråga.

Medan larmet är av visas också en gul rad under *Larmet är av* på säkerhetssidan, till exempel *Altandörr står öppen* eller *2 öppna · 1 svarar inte*. Tryck på den för att se listan.

**Högtalaren och telefonen** (`larm_automation.yaml` version 3) säger och skriver också vad som står öppet när larmet slås på, till exempel *"Larmet aktiveras om 30 sekunder. Observera: Altandörr står öppet."* Det fungerar även när du larmar på något annat sätt än via Aura, till exempel från Alarmo-panelen eller en automation. Automationen hittar själv alla dörr- och fönstergivare i Home Assistant.

> **Tips:** Alarmo kan själv vägra larma när något står öppet. Under *Alarmo → Sensorer → (givaren) → Tillåt öppen vid aktivering* väljer du om larmet ska stoppas eller tillåtas. Aura frågar dig hur som helst först.

### 7.0.5 Släck när du går, tänd när du kommer hem

**Larma borta:** är någon lampa tänd eller tv:n på, frågar Aura *Släcka allt?* innan larmet slås på. Rutan visar hur många lampor som lyser i varje rum.

- **Släck och larma** larmar som vanligt, med kodrutan om ditt larm kräver kod. Allt lyser under utpasseringstiden i Alarmo. När larmet är på tonas lamporna ner på 5 sekunder och släcks, och uttag och tv stängs av. Slår du av larmet under utpasseringstiden släcks ingenting.
- **Bara larma** låter allt vara som det är.
- **Avbryt** larmar inte.

Frågan kommer efter kontrollen av öppna dörrar (7.0.1). Är allt redan släckt larmas det direkt. Vill du inte ha frågan skriver du `_larm_borta_slack: false`.

Lägg gärna in skriptet [`borta_slack_script.yaml`](../skript/borta_slack_script.yaml) (`script.aura_borta_slack`). Då sköter Home Assistant släckningen, även om du larmade från mobilen och den somnar. Utan skriptet måste skärmen där du tryckte vara igång tills larmet är på.

**Larma av efter borta:** automationen [`valkommen_automation.yaml`](../automationer/valkommen_automation.yaml) tänder vardagsrummet och hallen när larmet slås av efter att ha varit på *Borta*, men bara när det är mörkt ute. Efter *Hemma* eller *Natt* tänds inget. Det fungerar oavsett om du slår av larmet i Aura, på knappsatsen eller i appen. Vilka lampor som tänds ändrar du överst i filen.

### 7.1 Smart förslag om öppna dörrar och fönster

```yaml
_forslag_oppen_minuter: 10
```

- **När förslaget visas:** när en dörr eller ett fönster i `_dorrar` eller `_fonster` har stått öppet så här länge, till exempel "Altandörr står öppen – den har varit öppen i 14 min". På kvällen och när larmet är på kommer förslaget direkt.
- **Ignorera:** tryck på **Ignorera** så kommer nästa förslag fram. Etiketten "1 av 3" visar hur många förslag som väntar. Öppnas dörren igen senare kommer förslaget tillbaka.

### 7.2 Smart förslag på morgonen: tänd ljuset och sätt på kaffet

```yaml
_morgon_fran: '04:30'
_morgon_till: '10:00'
_morgon_lampor: []      # tom = lamporna i vardagsrum, kök och hall
_morgon_kaffe: true
```

- **När det är mörkt ute mellan 04:30 och 10:00** och någon är hemma, föreslår Aura *"God morgon! Det är mörkt ute – tänd i vardagsrum, kök och hall innan du går ner?"*. Det räknas som mörkt när solen är under horisonten eller står lågt (och lite högre en mulen morgon).
- **Tryck *Ja, tänd*** så tänds alla morgonlampor som är släckta. Direkt efter kommer nästa förslag: *"Ska jag sätta på kaffemaskinen också?"*. Trycker du *Ja, sätt på kaffet* slås maskinen på och du väljer dryck under Hushåll.
- **Ignorera** gömmer förslaget resten av dagen. Förslaget visas inte om alla morgonlampor redan är tända, om ingen är hemma eller om larmet är på i borta-läge.
- Skriv tiderna inom citattecken (`'04:30'`), annars kan Home Assistant läsa dem som ett tal.

### 7.3 God natt-knappen och kvällsförslaget

**God natt-knappen** är den runda månen längst ner i menyn till vänster på surfplattan, och uppe till höger på mobilen. Den syns på alla sidor och lyser lite starkare efter kl 21.

- **Tryck på den** och välj när det ska släckas: *Nu, 2, 5, 10 eller 15 min*. 5 min är förvalt, så det räcker med ett tryck till.
- **Det här händer:** alla lampor och uttag i rummen släcks. Dessutom kan du välja:
  - **Stäng av tv:n:** visas om du har en tv bland `_mediaspelare`.
  - **Dimma först:** ljuset sänks till 15 % en halv minut innan, så att du hinner upp för trappan.
  - **Larma natt:** visas bara om larmet är av och inte kräver kod.

  Dina val sparas till nästa gång.
- **Under nedräkningen** fylls en ring runt månen och tiden som är kvar står under. Tryck igen för **+5 min**, **Släck nu** eller **Avbryt**.

```yaml
_godnatt_minuter: 5    # förvald tid (annars _kvall_minuter)
_godnatt: false        # tar bort knappen
```

**Låt Home Assistant räkna ner (rekommenderas).** Skapa timern och skriptet i [`godnatt_script.yaml`](../skript/godnatt_script.yaml): `timer.aura_godnatt` och `script.aura_godnatt`. Aura hittar dem själv. Då släcks allt även om surfplattan somnar eller om du startade från mobilen, och nedräkningen syns på alla skärmar. Utan dem räknar skärmen där du tryckte ner, och den måste då vara igång tills det släcks.

#### Kvällsförslaget

```yaml
_kvall_kl: 22          # från detta klockslag
_kvall_dagar: vardag   # vardag (mån–fre) eller alla
_kvall_minuter: 5      # nedräkning innan allt släcks
```

- **När förslaget visas:** efter kl 22 en vardag, om lampor är tända eller Apple TV:n är på. Förslaget lyder till exempel "Dags att runda av kvällen? 3 lampor och Apple TV är fortfarande på".
- **Släck om 5 min:** startar en nedräkning, som syns som "Godnatt-läge på – släcker allt om 4:32". Med **Avbryt** stoppar du den.
- **När tiden är ute:** alla lampor i dina rum släcks och tv-apparater bland `_mediaspelare` (Apple TV, Chromecast, smart-tv) stängs av.
- **Obs:** förslaget startar samma nedräkning som God natt-knappen, med dina senaste val. Utan skriptet ovan körs nedräkningen i dashboarden, och skärmen måste vara igång tills tiden är ute.

---

### 7.4 Alla smarta förslag

Smart förslag på startsidan visar det viktigaste först. Står det *1 av 4* finns fler – tryck **Ignorera** så kommer nästa. Ett ignorerat förslag kommer inte tillbaka förrän läget ändras (till exempel nästa dag eller nästa gång dörren öppnas).

| Namn | Förslaget | När det visas |
|---|---|---|
| `larma` | **Alla har gått hemifrån** – knapp *Larma borta* | Ingen är hemma sedan minst 3 min och larmet är av |
| `regnfonster` | **Regn på väg** – fönster står öppet | Regn inom 2 timmar (eller nu) och ett fönster i `_fonster` är öppet |
| `las` | **Ytterdörren är olåst** – knapp *Lås* | Ett lås i `_las` är olåst efter kl 22 eller när ingen är hemma |
| `smhi` | **SMHI varnar** | Det finns en vädervarning |
| `morgon`, `morgonkaffe` | **Tänd morgonljuset**, sedan **kaffet** | Se 7.2 |
| `kal` | **Om 40 min: Tandläkaren** | Något i kalendern börjar inom en timme |
| `buss` | **Linje 8 går 07:42 – gå om 6 min** – knapp *Påminn mig* | Vardagar 06–09 (startar röstpåminnelsen, se 9.1) |
| `hem` | **Välkommen hem!** – tänd i hallen och köket | Någon har just kommit hem och det är mörkt |
| `sol` | **Solen går ner om 15 min** – tänd mysbelysningen | Strax före solnedgången när någon är hemma |
| `kvall` | **Dags att runda av kvällen?** | Se 7.3 |
| `borta` | **Ingen är hemma** men lampor är tända | |
| `oppen` | **Dörren står öppen** | Se 7.1 |
| `vaxt` | **Växten behöver vatten** | |
| `varva`, `natt` | **Varva ner / God natt** | Kvällar med tända lampor |
| `stada` | **Passa på att dammsuga** | Ingen är hemma och dammsugaren står i laddstationen |
| `el` | **Billig el kl 02–05** | Normalpris just nu, billigare senare |
| `mediaborta` | **Musiken spelar / tv:n är på** fast ingen är hemma | |
| `kaffe` | **Kaffemaskinen står på** – knapp *Stäng av* | Påslagen längre än `_kaffe_timmar` (2 h) |
| `frost` | **Frost i natt** – skrapa bilen | Kvällar 17–23 när det blir minusgrader i natt |
| `dyrel` | **Elen är dyr just nu** – och när det är billigast | Dyrt pris mellan 06 och 22 |
| `norrsken` | **Chans för norrsken ikväll** | Kvällar med högt Kp-index och mestadels klart väder |
| `todo` | **3 saker att komma ihåg** | På morgonen 06–10 och när någon kommer hem |
| `batt` | **Byt batteri** | En sensor är under `_batteri_varning` (15 %) – mobiltelefoner räknas inte |
| `server` | **Servern** har full disk, är varm eller har slut på minne | |
| `garage` | **Garageporten står öppen** – knapp *Stäng* | Efter `_forslag_oppen_minuter`, sent på kvällen eller när ingen är hemma |
| `markis` | **Det börjar blåsa / regn väntas** – rulla in markisen | Blåst eller regn nu eller inom ett par timmar |
| `solskydd` | **Solen ligger på** – dra ner | 10–18, soligt och varmt |
| `portkvall` | **Det har blivit mörkt** – dra för | Efter solnedgången |
| `portmorgon` | **God morgon** – dra upp | 06–11 när någon är hemma |
| `elbil` | **Elbilen behöver laddas** – sätt i kabeln | Kvällar 17–23, under 50 % och ingen kabel i |

**Stänga av förslag du inte vill ha:**

```yaml
_forslag_av: [norrsken, batt]   # namnen från tabellen
_kaffe_timmar: 2
_batteri_varning: 15
```

## 7.6 Värme och klimat

Värmepumpar, golvvärme, element med smarta termostater och luftkonditionering är **`climate.`**-entiteter i Home Assistant. Lämnar du `_varme` tom tar Aura med alla (utom bilars klimat), och sidan **Värme** dyker upp i menyn.

```yaml
_varme:
  - entity: climate.vardagsrum
    namn: Värmepumpen
    typ: luft          # luft (luft/luft, inomhusdel), vp (utedel/bergvärme), golv, element
  - climate.golvvarme_badrum
_varme_sank: 2         # grader för "Sänk"
_varme_borta_min: 60   # minuter innan "sänk när ingen är hemma" föreslås
```

**Ett kort per termostat:**
- En **ritad bild** – inomhusdel som blåser varmt (orange) eller kallt (blått), utedel med snurrande fläkt, golv med värmeslingor eller element med värmeskimmer – som visar om den värmer just nu.
- **Temperaturen just nu** (och luftfuktighet om den finns) och **önskad temperatur** med − och +. Trycker du flera gånger skickas bara det sista värdet.
- **Lägen** som termostaten har: *Av, Värme, Kyla, Auto, Torka, Fläkt* – och **förinställningar** som *Eco, Komfort, Borta, Natt* om den har dem.
- Tryck på bilden för Home Assistants egen ruta (fläkthastighet m.m.).

**Överst:** knappen **Sänk 2°** sänker alla som värmer och **kommer ihåg** vad de stod på – sedan står det **Återställ** som höjer tillbaka exakt.

**Smart förslag** (även på startsidan):
- *Ingen hemma sedan 08:10 – sänk värmen 2° tills någon kommer hem?* (`varmeborta`)
- *Välkommen hem! Värmen är sänkt sedan 08:12 – höja tillbaka?* (`varmehem`)
- *Elen är dyr just nu, 2,40 kr/kWh till ca kl 19 – sänk värmen 2° så länge?* (`varmedyr`)
- *Elen är billigare igen – höja värmen tillbaka?* (`varmebillig`)

> Sänkningen kommer man ihåg på den enhet där man tryckte. Vill du att värmen sänks och höjs helt automatiskt även när ingen tittar på dashboarden är det en automation i Home Assistant – säg till så gör vi en.

## 7.5 Markiser, gardiner, rullgardiner och garage

De här styrs i Home Assistant nästan alltid som **`cover.`**-entiteter. Typen står i entitetens *device_class*: `awning` (markis), `curtain` (gardin), `blind`/`shade`/`shutter` (rullgardin, persienn) och `garage`/`gate` (garageport, grind). Aura läser *current_position*, där 0 betyder stängd eller inrullad och 100 betyder öppen eller utfälld.

**Automatiskt:** lämnar du listorna tomma hittar Aura alla cover-entiteter med rätt device_class. Saknas den gissar Aura utifrån namnet: *markis*, *rullgardin/persienn*, *gardin* eller *garage/grind*.

**Själv:** vill du välja vilka som syns, i vilken ordning och med vilka namn skriver du dem:

```yaml
_markiser:
  - entity: cover.markis_altan
    namn: Altanen
    farg: '#3E5C76'      # väven
    randig: true         # randig väv
_gardiner:
  - cover.gardin_vardagsrum
_rullgardiner:
  - entity: cover.rullgardin_kok
    namn: Köket
_garage:
  - entity: cover.garageport
    farg: '#E6E4DF'
```

**Sidan *Gardiner*** syns i menyn när du har minst en av dem. Har du bara garage heter den *Garage*. Den har ett kort per sort:

- **Ritade bilder som följer läget.** Markisen fälls ut, gardinerna dras isär, rullgardinen går upp och ner och garageporten öppnas, och då syns bilen därinne.
- **Knappar** för upp, stopp och ner på varje. Har du fler än en finns *Alla öppna/stäng* längst ner.
- **Garageporten öppnas först efter två tryck** ("Tryck igen"), så att den inte öppnas av misstag.
- **Tryck på bilden** så öppnas en panel med ett reglage för exakt läge, snabbval (25, 50 och 75 %), **färgval** och för markisen *Randig väv*.

**Färgen:** väljer du färg i panelen sparas den på den enheten, alltså surfplattan eller mobilen. Vill du ha samma färg överallt skriver du `farg:` i listan ovan.

**Lägen överst på sidan:** fyra knappar som styr allt på en gång.

| Läge | Vad som händer |
|---|---|
| **God morgon** | Alla gardiner och rullgardiner upp |
| **Solskydd** | Rullgardinerna ner till `_solskydd_lage` (30 %), gardinerna till 30 % och markisen ut om det inte blåser |
| **God natt** | Allt dras för och markisen rullas in |
| **Rulla in** | Markisen rullas in |

Garageporten påverkas aldrig av lägena. Vill du att en viss gardin eller rullgardin ska stå still, till exempel i ett barnrum, skriver du `lagen: false` på den:

```yaml
_rullgardiner:
  - entity: cover.rullgardin_melvin
    lagen: false
```

Bredvid knapparna visas **förslagen** som gäller just nu, med en knapp för att göra det och ett kryss för att ignorera. Samma förslag dyker också upp i *Smart förslag* på startsidan.

**Smart förslag och larm:**
- *Det börjar blåsa kl 15 – Altanen är utfälld, upp till 12 m/s* eller *Regn väntas kl 14*. Det kommer redan när blåst eller regn är **på väg**, inte först när det blåser. Gränsen ställs in med `_markis_vind` (9 m/s, eller byar som är ungefär en och en halv gång så starka). Knappen är **Rulla in**. (`markis` i `_forslag_av`)
- *Solen ligger på – 25° inne. Dra ner rullgardinerna?* Det visas mellan 10 och 18 när det är soligt och varmt inne (`_solskydd_temp`) eller över 20° ute, och något står mer än halvvägs uppe. Knappen är **Solskydd**. (`solskydd`)
- *Det har blivit mörkt – 3 gardiner och rullgardiner är fortfarande öppna. Dra för för natten?* Det visas efter solnedgången. Knappen är **God natt**. (`portkvall`)
- *God morgon! Solen är uppe – dra upp gardinerna?* Det visas mellan 06 och 11 när någon är hemma och det mesta är fördraget. Knappen är **God morgon**. (`portmorgon`)
- *Garageporten står öppen*, efter `_forslag_oppen_minuter`, direkt sent på kvällen eller när ingen är hemma, med knappen **Stäng**. (`garage` i `_forslag_av`)
- *Det blåser 12 m/s* eller *Regn på väg* när markisen är utfälld, med knappen **Rulla in**. (`markis` i `_forslag_av`)
- En öppen garageport kommer med i **kontrollen innan du larmar** (7.0.1).

## 8. Väder och dagen

```yaml
_vader: weather.forecast_hem          # vilken weather.-entitet som helst
_pollen_prefix: sensor.pollen_goteborg_
_pollen_plats: Göteborg
_temp_inne: sensor.vardagsrum_temperatur
_fukt_inne: ''                        # luftfuktighet inne för "Vädra" – tomt = fuktsensorn i samma rum som _temp_inne
_att_gora: todo.att_komma_ihag        # listan "Kom ihåg"
_kalendrar: []                        # tom = alla kalendrar
```

- **Antal dagar i prognosen:** standardvädret (Met.no) ger 5 dagar framåt. Då visas *Idag* som första ruta. SMHI ger fler dagar.
- **Pollen:** alla sensorer vars id börjar med `_pollen_prefix` tas med, till exempel från integrationen *Pollenprognos*. De visas längst ner i **Väderkoll**, och bara när det finns pollen i luften.

### 8.1 Mer väderinfo: SMHI, varningar och månen

```yaml
_smhi_prefix: sensor.smhi_odp_home_     # början på SMHI-sensorerna
_smhi_varning: sensor.smhi_alerts_vastra_gotalands_lan
_smhi_varning_aktiv: binary_sensor.smhi_alerts_active_vastra_gotalands_lan
_mane: sensor.moon_fas
```

Vädersidan har nu de här delarna:

- **Väderkoll:**
  - **SMHI-varningar** överst, i gult, orange eller rött efter nivå, med område, tid och början av texten. **Tryck på varningen** (eller på den röda pillen *1 varning*) så öppnas en popup med hela varningen: nivå, område, från och till, och hela SMHI-texten. Utan varningar står det *Inga varningar från SMHI*.
  - **En sammanfattning,** till exempel *"Ikväll: växlande molnighet, 8° just nu och ner mot 3° i natt."*
  - **Punkter om det som är på väg:** regn, snö, åska eller hagel med tid och mängd, uppehåll, frost och halka, blåst och byar, dimma, UV-index, hur morgondagen blir, helgens väder (måndag–torsdag) och veckans finaste dag.
  - **Närmaste dygnet i siffror:** högsta och lägsta temperatur med klockslag, regnmängd och starkaste byarna. Rutorna visas när det inte finns någon varning eller pollen, så att kortet aldrig behöver skrollas i onödan.
- **Just nu:** vind med riktning, fukt, tryck, UV, molnbas och nederbörd. Molnbasen och nederbörden kommer från SMHI.
- **Prognos** (längst ner, två flikar – valet sparas på enheten):
  - **48 timmar:** en graf med temperaturkurvan, blå staplar för regn (med mängden i mm över varje regnskur) och en streckad linje för vinden. Under grafen visas vindpil och m/s var tredje timme, och streckade linjer markerar midnatt. **Tryck var som helst i grafen** för att se just den timmen: väder, temperatur, regn och vind.
  - **10 dagar:** en kolumn per dag med väder, högsta och lägsta temperatur med färgad stapel, regn i mm (eller risk i %), vind och vindriktning. Lördag och söndag är markerade, och en stjärna visar veckans finaste dag.
- **Ute idag** (efter kl 19 *Ute imorgon*):
  - **En färgad tidslinje** över dagens timmar – grönt är bra väder att vara ute, gult okej och rött dåligt. Den bästa tiden är markerad.
  - **Bästa tiden för:** *promenad eller löprunda*, *torka tvätten ute* (tre torra timmar med låg luftfuktighet) och *grilla eller sitta ute* när det blir minst 12°, annars *cykla*. Finns inget bra läge står det *Inte idag* och varför, till exempel *Regn hela dagen* eller *För kallt för att sitta ute*.
  - **Vad ska man ha på sig?** Två rutor, till exempel *Morgon* och *Eftermiddag*, med hur kallt det känns (vindens avkylning inräknad) och klädtips som *Varm jacka och mössa + paraply*. Regnkläder, vattentäta skor, något vindtätt och solglasögon läggs till när det behövs.
- **Vädra** (rutan i himmelskortet): jämför hur mycket fukt luften ute och inne bär. *Bra nu* betyder att luften inne blir torrare om du vädrar, *Vänta* att den blir fuktigare. Tryck på rutan för en förklaring, till exempel *41 % → ungefär 30 %*. Rutan kräver en fuktsensor inne (`_fukt_inne`, eller `fukt:` i rummet som har `_temp_inne`).
- **Solen:** när den går upp eller ner, och hur mycket kortare eller längre dagarna blir.
- **Månen:** fas, hur stor del som är belyst, och nästa fullmåne och nymåne.
- **Vinden:** en kompass med vindens riktning, hastighet i m/s, SMHI:s benämning (svag, måttlig, frisk eller hård vind) och byar.

Vindsensorn i km/h räknas om till m/s automatiskt. En aktiv SMHI-varning visas också först i **Smart förslag** på startsidan.

### 8.2 Regnradar, natthimlen och himmelskortet

```yaml
_radar: false     # true = animerad regnradar överst i sidokortet (då behöver sidokortet skrollas)
_norrsken: true   # norrskensprognos (false = av)
```

- **Himmelskortet (Just nu):** bakgrunden följer vädret och tiden på dygnet. Den är solgul när det är soligt, gråblå vid regn och natthimmel med blinkande stjärnor när det är mörkt och klart. I mörka teman är färgerna djupare. Kortet visar också innetemperaturen bredvid utetemperaturen.
- **Regnradar:**
  - Visar de senaste radarbilderna som en animation på en karta runt hemmet. Kartan centreras med hjälp av hemmets position i Home Assistant.
  - Den pulserande pricken är ditt hem, och tidslinjen nedtill visar vilken bild som visas.
  - Radarn uppdateras var 10:e minut.
- **Natthimlen:**
  - månen i rätt fas
  - om det blir klart eller molnigt i natt
  - **norrskensprognos** med Kp-index från NOAA, bedömd för din breddgrad: *Liten chans*, *Kanske lågt mot norr* eller *Goda chanser – titta norrut!*
- **Solbågen:** på natten visar den månens väg fram till soluppgången.

**Om tjänsterna:** radarbilderna kommer från RainViewer, kartan från Esri och norrskensprognosen från NOAA. Webbläsaren hämtar kartbitar för området runt hemmet, alltså ett område på ungefär en kommuns storlek, inte din exakta adress.

---

## 9. Hushållet

```yaml
_kaffe: kaffemaskin
_kaffe_modell: Siemens EQ900
_dammsugare:                       # en eller flera robotar
  - entity: vacuum.robot_nere
    namn: Nedervåningen
    batteri: sensor.robot_nere_battery_level   # valfritt
  - entity: vacuum.robot_uppe
    namn: Övervåningen
_vaxter:
  - sensor: sensor.monstera_fuktighet
    namn: Monstera
    min: 30      # under detta: "behöver vatten" (Smart förslag)
    max: 60
```

**Flera robotdammsugare:** lägg till dem efter varandra i listan, som i exemplet ovan.
- **Startsidan:** varje robot får en egen ruta under *Mina enheter*. Trycker du på rutan öppnas just den roboten på Hushåll-sidan.
- **Hushåll-sidan:** robotkortet får flikar överst, en per robot. En pulserande prick visar vilken som städar just nu.
- **`batteri`** behövs bara om roboten inte själv rapporterar batterinivå.
- **`popup: '#dammsugare'`** gör att rutan, robotbilden och knappen *Karta* öppnar en egen pop-up i stället för "Mer info", till exempel bubble-card med Dreame-kartan. Pop-up-kortet läggs längst ner i filen under `views:`, bredvid Aura-kortet i samma `vertical-stack`. Dess `hash:` måste vara exakt samma som `popup:`.
- **Äldre format:** det fungerar fortfarande, alltså `_dammsugare: vacuum.x` tillsammans med `_dammsugare_namn` och `_dammsugare_batteri`.

**Kaffemaskin (Home Connect):** skriv bara *början* på entiteterna. Med `_kaffe: kaffemaskin` letar Aura efter:

- `switch.kaffemaskin_av_pa` (på/av)
- `sensor.kaffemaskin_driftstatus` (status)
- `select.kaffemaskin_aktivt_program` (välja dryck)

Har du ingen kaffemaskin, dammsugare eller växter lämnar du raden tom (`''` eller `[]`).

### 9.1 Bussen och röstpåminnelse

```yaml
_buss: sensor.mot_centrum      # t.ex. Västtrafik-sensorn
_buss_namn: Centrum            # visas som "Mot Centrum"
_buss_linje: 8                 # om sensorn inte själv anger linjen
_buss_forvarning: 10           # minuter innan avgång som högtalaren säger till
_buss_fonster: 30              # hur långt före önskad tid en buss räknas
_tts: ''                       # röst-tjänst, t.ex. tts.home_assistant_cloud (tomt = den första du har)
_tts_hogtalare: media_player.vardagsrum_3
```

- **Kortet:** visar linjen (8), riktningen, läget och nästa avgång stort, med "om 12 min".
- **Påminn om nästa buss:** ett tryck räcker. Högtalaren säger till 10 minuter innan nästa buss går.
- **Påminnelse om en senare buss:**
  1. Välj när du vill åka med **−** och **+** (en kvart i taget), till exempel 14:00, och tryck **Påminn**.
  2. Aura väljer den **sista bussen som går före 14:00**, upp till 30 minuter innan och högst 5 minuter efter. Det kan till exempel bli bussen 13:50.
  3. Kl 13:40 säger högtalaren: *"Dags att gå till bussen! Linje 8 mot Centrum går 13.50, om 10 minuter."*
  4. Västtrafik-sensorn känner bara till nästa avgång, så kortet visar "Väntar på en avgång strax före 14:00" tills den bussen är nästa på tur. Då visas "Bussen 13:50 · säger till 13:40".
- **Testa rösten:** länken *Testa rösten* läser upp nästa avgång direkt.
- **Obs:** påminnelsen sparas och körs i dashboarden. Ställ in den på surfplattan på väggen, som alltid har Aura öppen.

### 9.2 Servern

Kortet **Servern** hittar själv dina System Monitor-sensorer. Det visar:
- processor, minne och disk som ringar
- temperatur och upptid
- virtuellt minne
- vilken version av Home Assistant du kör
- hur många uppdateringar som väntar (tryck för att öppna uppdateringssidan)

Etiketten visar *Mår bra*, *Ansträngd* eller *Hög belastning*. Vill du dölja kortet skriver du `_server: false`.

### 9.3 Utseende: byt tema

Under **Hushåll → Utseende** byter du tema med ett tryck. Valet sparas i just den enheten, så surfplattan kan vara mörk medan mobilen är ljus.

| Tema | Färger |
|---|---|
| **Ljus** | Kräm och brons |
| **Mörk** | Marinblått och indigo |
| **Noir** | Djupt varmt svart och champagneguld, med jadegrönt för "allt bra" |

`_tema:` i `mitt_hem` (`ljus`, `mork` eller `noir`) bestämmer vad nya enheter startar med.

### 9.4 Diagnos

Uppe till höger i **Hushåll → Utseende** sitter en liten knapp. Den visar versionen (*v2.0.0*) – eller **"2 saknas"** i gult om något i `mitt_hem` pekar på en entitet som inte finns.

Tryck på den så visas:
- **Motorns version** och **varifrån den laddas** (`/local/aura/motor.js`).
- Home Assistants version och vem som är inloggad.
- **Varje inställning som inte hittas**, till exempel `_buss → sensor.mot_centrum` eller `_rum › 2 › lampor › 1 → light.melvins_sanglampa`. Prefix som `_smhi_prefix` kontrolleras också.

Rätta stavningen (kontrollera under *Utvecklarverktyg → Tillstånd*) eller ta bort raden. Det är första stället att titta på när ett kort är tomt.

---

### 9.5 Spabad

Har du ett spabad med Gecko (in.touch) dyker det upp av sig självt. Aura hittar det via väljaren *Watercare Mode*.

- **Hushåll:** ett stort kort med en ritad bild av badet.
- **Hem:** en egen ruta under *Mina enheter*. Reglaget slår på och av ett bad.

**Bilden följer badet:**

| Läge | Så ser det ut |
|---|---|
| Redo | Blått vatten och ånga, displayen visar temperaturen |
| Värmer | Displayen lyser orange och en stapel visar hur långt det är kvar |
| Energisnålt | Ett grönt löv i displayen |
| Någon badar | Två personer i vattnet, bubblor när pumpen går |
| Ljus på | Vattnet och skenet runt badet får lampans färg |
| Borta | Locket ligger på |

**Knappar på kortet:**
- **Bada nu** sätter på bubblorna och ljuset. **Avsluta bad** stänger av dem.
- **Bubblor** och **Ljus** styr pumpen och lampan var för sig. Kan lampan byta färg visas färgprickar.
- **− och +** ändrar måltemperaturen.
- **Lägena** är **Borta** och **Standard**. De byter Watercare-läge. Vill du ha fler skriver du till exempel `lagen: [borta, standard, snal]` under `_spa` (finns: borta, standard, snal, super, helg).

**När räknas det som att någon badar?** Gecko har ingen sådan givare, så det räknas som bad när bubblorna (Pump 1) är på. Har du en egen givare, till exempel en vibrationsgivare eller en `input_boolean`, skriver du den under `badar:`.

**Inställningar (valfritt):**

```yaml
_spa:
  namn: Spabad
  prefix: fridkulla        # början på entiteterna, t.ex. climate.fridkulla_thermostat_1
  forvarm: 2               # timmar före badet som värmen startar
  efter: 3                 # timmar efter badet innan det går tillbaka till lägsta temperatur
  farg: '#6E5642'          # träpanelens färg, t.ex. '#4A4D52' för grå
  badar: ''                # valfri givare för "någon badar"
```

Vill du inte ha kortet skriver du `_spa: false`.

#### Lägsta temperatur

Spabadets måltemperatur går aldrig under **lägsta temperatur**, som är 35° om du inte ändrar den.

- **Ändra gränsen:** tryck på **kugghjulet** uppe till höger på spakortet och välj med − och + i steg om 0,5°. Ställer du gränsen högre än nuvarande mål höjs målet direkt.
- **I Aura:** − på kortet stannar vid gränsen och blir nedtonat, och temperaturen i *Planera bad* kan inte väljas lägre.
- **Från andra håll:** med [`spa_automation.yaml`](../automationer/spa_automation.yaml) höjer Home Assistant målet direkt om någon sänker det under gränsen, till exempel i Gecko-appen.

För att kunna ändra gränsen behöver du hjälparen **Nummer** `input_number.spa_min_temp`: 20–40, steg 0,5, startvärde 35. Utan hjälparen gäller `min_temp` under `_spa`, eller 35°.

> **Obs:** gränsen gäller måltemperaturen. I läget *Borta* värmer Gecko själv mindre, så vattnet kan svalna under gränsen även om målet står på 35°.

#### Planera bad

Tryck **Planera bad** och välj idag eller imorgon, tid och temperatur. Slå på *Varje fredag* (eller den veckodag du valt) om badet ska upprepas varje vecka.

- Spabadet står på Standard och hålls på **lägsta temperatur** (35°) fram till **2 timmar innan**.
- Då värmer det till vald temperatur (står det på Borta byts det först till Standard).
- **3 timmar efter** badtiden går det tillbaka till lägsta temperatur.
- Kortet visar en tidslinje med *Börjar värma* och badtiden. Pennan ändrar planen och krysset tar bort den.

Planen körs av en automation i Home Assistant, så den fungerar även när surfplattan sover. Gör så här en gång:

1. **Skapa tre hjälpare** under **Inställningar → Enheter och tjänster → Hjälpare → Skapa hjälpare**:
   - **Datum och/eller tid** med namnet `Spa bad` och *Datum och tid* valt. Det blir `input_datetime.spa_bad`.
   - **Nummer** med namnet `Spa bad temp`, min 30, max 40, steg 0,5. Det blir `input_number.spa_bad_temp`.
   - **Växla** (engelska *Toggle*, ibland *Brytare*) med namnet `Spa bad varje vecka`. Det blir `input_boolean.spa_bad_varje_vecka`.
2. **Lägg in automationen** [`spa_automation.yaml`](../automationer/spa_automation.yaml): **Inställningar → Automationer och scener → Skapa automation → ⋮ → Redigera i YAML**, klistra in och spara.
3. **Kontrollera raderna under `variables:`** i automationen: termostaten, Watercare-väljaren och lägenas exakta namn (`Standard` och `Energy Saving`). Namnen ser du under **Utvecklarverktyg → Tillstånd**, i attributet `options` på `select.…_watercare_mode`.

Vill du ändra 2 timmar till 3: ändra `forvarm` **både** i automationen och under `_spa` i `mitt_hem`.

## 10. Bilder som väljs automatiskt

Utöver lamporna finns de här bilderna. De väljs av sig själva, du ställer inte in något:

| Bild | Används för |
|---|---|
| Robotdammsugare | `_dammsugare` (rör sig när den städar) |
| Högtalare | Mediaspelaren på startsidan |
| Kaffemaskin | `_kaffe` (ånga när den brygger) |
| Växt | `_vaxter` |

---

## 11. Ikoner du kan välja

Alla ikoner skrivs som `mdi:namn`. På **pictogrammers.com/library/mdi** kan du söka bland över 7 000 ikoner. Skriv in ett engelskt ord, till exempel *lamp*, och kopiera namnet.

**Lampor**

| Ikon | Passar till |
|---|---|
| `mdi:ceiling-light` / `mdi:ceiling-light-outline` | Taklampa |
| `mdi:chandelier` | Kristallkrona |
| `mdi:floor-lamp` / `mdi:floor-lamp-outline` | Golvlampa |
| `mdi:lamp` / `mdi:lamp-outline` | Bordslampa |
| `mdi:lamps` | Flera lampor, fönsterlampor |
| `mdi:desk-lamp` | Skrivbordslampa |
| `mdi:wall-sconce` | Vägglampa |
| `mdi:lightbulb` / `mdi:lightbulb-outline` | Glödlampa, allmänt |
| `mdi:led-strip-variant` | LED-list |
| `mdi:string-lights` | Ljusslinga |
| `mdi:candle` | Ljusstake |
| `mdi:moon-waning-crescent` | Månlampa |
| `mdi:power-socket-eu` | Uttag |
| `mdi:outdoor-lamp` | Utebelysning |
| `mdi:pine-tree` | Julgran |

**Rum**

| Ikon | Rum |
|---|---|
| `mdi:sofa-outline` | Vardagsrum |
| `mdi:silverware-fork-knife` | Kök |
| `mdi:bed-outline` / `mdi:bed-king-outline` | Sovrum |
| `mdi:human-baby-changing-table` / `mdi:teddy-bear` | Barnrum |
| `mdi:shower` / `mdi:bathtub-outline` | Badrum |
| `mdi:washing-machine` | Tvättstuga |
| `mdi:coat-rack` / `mdi:door` | Hall |
| `mdi:desk` | Kontor |
| `mdi:garage` | Garage |
| `mdi:flower-outline` / `mdi:grill` | Trädgård, altan |
| `mdi:stairs` | Trappa, övervåning |

**Scener**

| Ikon | Scen |
|---|---|
| `mdi:candle` | Mys |
| `mdi:movie-open-outline` | Film |
| `mdi:silverware-fork-knife` | Middag |
| `mdi:weather-night` | God natt |
| `mdi:weather-sunny` | Morgon |
| `mdi:party-popper` | Fest |
| `mdi:book-open-variant` | Läsa |

---

## 12. Felsökning

| Problem | Lösning |
|---|---|
| En ruta säger **"Hittas inte"** | Entitets-id:t är fel. Kontrollera stavningen i Utvecklarverktyg → Tillstånd. |
| **Ändringen syns inte** | Ladda om sidan, och gör det två gånger på surfplattan. Rensa appens cache i HA-appen om det inte hjälper. |
| **Röd text "Fel i …"** | Oftast fel indrag i YAML. Jämför med en rad som fungerar. |
| **En sida saknas i menyn** | Inställningen för den sidan är tom, till exempel `_elpris`, `_larm` eller `_vader`. |
| **Inget går att trycka på** | Kontrollera att button-card är installerat och uppdaterat. |
| **Fel bild på lampan** | Skriv `typ:` på lampan (kapitel 3.1). |
| **Elpriset eller sensorer visas inte efter en ny integration** | Starta om Home Assistant. |
