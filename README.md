# Expo Weather

Eine deutschsprachige Wetter-App für iOS, Android, Expo Go und Web. Sie zeigt aktuelles Wetter, eine Fünf-Tage-Prognose, gespeicherte Orte, GPS-Standortsuche und einen animierten Niederschlagsradar.

![App-Screenshot](./_Project/Screenshot.png)

## Expo Snack

Die Demo ist unter [github.com/peterruler/weather-app auf Expo Snack](https://snack.expo.dev/@petethegreat/github.com-peterruler-weather-app?sdkVersion=57.0.0) erreichbar. Der Link fordert SDK 57 an; der zuletzt geprüfte Online-Snack verwendet SDK 55, und Snack kann bei fehlender SDK-57-Unterstützung auf eine andere Version zurückfallen (siehe unten). Ein gespeicherter Snack übernimmt lokale Repository-Änderungen nicht automatisch; nach einem Push muss die GitHub-Version dort erneut importiert beziehungsweise gespeichert werden.

**SDK-57-Migration am 09.10.2026:** Die lokale App und der Ordner `snack` verwenden SDK 57 (`sdkVersion: 57.0.0`, npm-Paket `expo@57.0.27`), React Native 0.86.3 und React 19.2.3. Die drei Tabs liegen weiterhin direkt im `NavigationContainer`; der überflüssige Native-Stack und `react-native-screens` bleiben entfernt. Wetter, Prognose, Radar, rechtliche Hinweise und die lokale CARTO-Konfiguration bleiben erhalten.

**Gehostete Snack-Laufzeit:** Der gespeicherte Online-Snack wurde zuvor auf SDK 55 geprüft. Die letzte Prüfung von `https://snack.expo.dev/?sdkVersion=57.0.0` am 09.10.2026 meldete „The requested Expo version is not yet supported“ und fiel auf SDK 54 zurück; im Wähler standen nur SDK 50–55. Der Demo-Link fordert SDK 57 an, stellt aber keine fehlende Laufzeit bereit. Die lokale Migration veröffentlicht den gespeicherten Snack nicht automatisch. SDK-57-Abhängigkeiten erst dann in der gehosteten Vorschau speichern, wenn dort eine tatsächliche SDK-57-Laufzeit angeboten wird. Bis dahin die lokale SDK-57-Vorschau verwenden.

Unten in der Snack-Statusleiste lässt sich neben **Expo** eine angebotene Version wählen. Laut [offizieller Konfiguration](https://github.com/expo/snack/blob/main/website/src/client/configs/sdk.tsx) kann `?sdkVersion=…` bereits bereitgestellte, ausgeblendete Vorschauversionen anfordern. Neue SDKs benötigen laut [Maintainer-Anleitung](https://github.com/expo/snack/blob/main/docs/expo-sdk-upgrade.md) Expo-seitige Änderungen und Deployments an Laufzeit, SDK-Unterstützung und Website.

Für ein Telefon eine **SDK-57-kompatible Expo-Go-Version** oder einen neu gebauten SDK-57-Development-Build verwenden. Passende Clients stehen unter [Expo Go](https://expo.dev/go). Expo Go nach einem SDK-Wechsel vollständig schließen, erneut öffnen und den lokalen QR-Code scannen:

```bash
./run.sh start --go --lan --port 8082
```

Computer und Telefon müssen im selben WLAN sein. Der localhost-Webserver auf Port 8081 ist vom Telefon aus nicht erreichbar. Auf einem physischen iPhone gegebenenfalls Expo CLI und Expo Go mit demselben Expo-Konto anmelden; siehe [Expo: App auf dem Gerät öffnen](https://docs.expo.dev/get-started/start-developing/). Physische Geräte sind gesondert zu testen.

Der direkte Root-Import traf einen Asset-Weiterleitungsfehler im Expo-Importserver (`Failed to upload file asset`). Die assetfreie Importansicht liegt daher im Ordner `snack`, verwendet inhaltsadressierte Expo-Bild-URLs, `sdkVersion: 57.0.0`, deaktivierte Laufzeit-Updates und SDK-57-Abhängigkeiten. `snack/index.js` erlaubt eine isolierte lokale Web-Prüfung.

Sobald Snack SDK 57 unterstützt: **Import git repository** öffnen, Repository URL `https://github.com/peterruler/weather-app` eingeben, unter **Show advanced options** Folder path `snack` und Branch name `main` setzen, importieren, tatsächlich **v57.0.0** auswählen und speichern. Der reine Node-CLI-Helfer `scripts/upgrade-expo.js` gehört nur ins lokale Repository und nicht in den Online-Snack.

**Validierung am 09.10.2026:** Saubere Installation mit `npm ci`, vollständige Peer-Prüfung, Typecheck, Lint, alle 32 UI-Tests, die 16 Standard-Unit-Tests, SDK-Ausrichtung, Expo-Abhängigkeitsprüfung und alle 21 Expo-Doctor-Prüfungen bestanden. Web-, iOS- und Android-JavaScript-Bundles sowie der separate Snack-Webexport wurden erfolgreich erstellt. Im Browser wurden Zürich-Ortssuche, Wetterwerte, fünf Prognosetage, Tab-Wechsel, Radarframe-Wechsel, CARTO-Grundkarte und Öffnen/Schließen der rechtlichen Hinweise geprüft. Web läuft auf `http://localhost:8081`; der LAN-Server auf Port 8082 meldet `sdkVersion: 57.0.0` und `runtimeVersion: exposdk:57.0.0`. Dies bestätigt keine nativen Binär-Builds oder Ausführung auf einem physischen Telefon.

## Technischer Stand

- Expo SDK 57.0.27
- React Native 0.86.3 / React 19.2.3
- TypeScript 6.0
- Open-Meteo für Ortssuche, Wetter und Vorhersage – ohne API-Key
- RainViewer Weather Maps API für Radarframes
- CARTO mit OpenStreetMap-Daten für die Radar-Grundkarte
- npm mit reproduzierbarer Installation über `package-lock.json`

## Voraussetzungen

- Node.js 22.13.0 oder neuer
- npm (wird mit Node.js installiert)
- Für ein echtes Gerät: eine Expo-Go-Version mit SDK-57-Unterstützung und Gerät/Computer im selben Netzwerk
- Für native iOS-Builds: Xcode 26.4 oder neuer; iOS 16.4 oder neuer auf dem Gerät
- Für native Android-Builds: Android SDK 36; Android 7 oder neuer auf dem Gerät

Eine globale Expo-CLI ist nicht nötig. Alle Befehle verwenden die lokale CLI über `npx expo`.

## Installation

```bash
git clone <repository-url>
cd weather-app
chmod +x install.sh run.sh
./install.sh
```

Ortssuche, aktuelle Werte und Prognose verwenden die öffentlichen Open-Meteo-Endpunkte und benötigen keinen Wetter-API-Key. Für die CARTO-Grundkarte im Radar ist dagegen ein eigener Basemap-API-Key erforderlich.

Den Schlüssel bei [CARTO Basemaps](https://carto.com/basemaps/apikey/) anfordern und lokal konfigurieren:

```bash
cp .env.example .env.local
```

In der von Git ignorierten `.env.local` den Wert für `EXPO_PUBLIC_CARTO_API_KEY` eintragen. Danach den Expo-Server neu starten, die App vollständig neu laden und Produktions-Bundles neu exportieren. Expo liest diese Variable beim Bundeln; native Release-Builds benötigen ebenfalls einen neuen Build. Ohne Schlüssel zeigt die App weiter die RainViewer-Radardaten, fordert aber keine CARTO-Tiles an.

`EXPO_PUBLIC_*`-Werte sind im Web- und nativen Bundle sichtbar. Dafür ausschließlich einen eigenen CARTO-Basemap-Schlüssel verwenden, passende Website-/App-Beschränkungen im CARTO-Dashboard konfigurieren und den Schlüssel weder im Quellcode noch in Git speichern. Bei Website-Beschränkungen lokale Vorschau und spätere Hosting-Domain berücksichtigen; reine Referer-Beschränkungen können native Apps ausschließen. Der Schlüssel wird nur an CARTO gesendet, nicht an Open-Meteo oder RainViewer. Die Platzhalterdatei `.env.example` enthält keine Zugangsdaten.

Die Open-Meteo-Daten stehen unter CC BY 4.0. Die App zeigt deshalb bei allen Wetterdaten eine anklickbare Quellenangabe; bei einer Weiterverwendung muss diese Attribution erhalten bleiben.

`install.sh` prüft die Node-Version, installiert exakt den Lockfile-Stand mit `npm ci` und kontrolliert die Expo-SDK-Kompatibilität.

Die lokalen Expo-Pakete und nativen Bibliotheken sind exakt auf die von SDK 57.0.27 freigegebenen Versionen gesetzt. `.npmrc` erzwingt auch bei späteren Installationen exakte Versionen. Eine pauschale Aktualisierung kann Expo Go oder den Snack inkompatibel machen.

Die Tests verwenden `jest-expo@57.0.5`, `babel-preset-expo@57.0.14`, `@react-native/jest-preset@0.86.3` und den zu React passenden `react-test-renderer@19.2.3`. Der optionale Test-Peer `react-server-dom-webpack@19.1.9` bleibt als kompatible gepatchte Version erhalten. Expos Empfehlung `~19.2.4` setzt eine neuere React-Patchversion voraus; deshalb bleibt ausschließlich dieses Testpaket von `expo install --check` ausgenommen.

Die aus dem referenzierten Frontend-Snack abgeleitete Upgrade-Hilfe ändert standardmäßig nichts:

```bash
npm run expo:align        # nur Abweichungen anzeigen
npm run expo:align:write  # SDK-57-Pins bewusst in package.json eintragen
npm install
npm run doctor
```

`expo:align:write` nur für eine beabsichtigte Wiederherstellung dieses SDK-Stands verwenden. Ein Wechsel auf ein neueres Expo SDK erfordert eine Anpassung des Skripts und der Dokumentation sowie einen vollständigen Validierungslauf.

Die Migration von SDK 55 auf 57 aktualisiert auch die nativen Gesten-, Pager-, Animations- und Safe-Area-Bibliotheken sowie TypeScript und Jest/Babel. Vorhandene Development Builds müssen neu gebaut werden. Dieses Repository enthält keine eingecheckten `ios/`- oder `android/`-Projekte; `npm run ios` beziehungsweise `npm run android` erzeugt sie mit der aktuellen Expo-Konfiguration. SDK 57 verwendet ausschließlich die New Architecture. Bereits generierte native Projekte nach Sicherung eigener Änderungen mit der SDK-57-Konfiguration neu erzeugen. Die Hermes-v1-Option bleibt ungesetzt. Siehe [Expo SDK 57](https://expo.dev/changelog/sdk-57) und die [SDK-57-Kompatibilitätstabelle](https://docs.expo.dev/versions/v57.0.0/).

## Update-Verhalten

In `app.json` sind Expo Updates deaktiviert (`enabled: false`) und automatische Prüfungen auf `NEVER` gesetzt. Native Release-Builds verwenden dadurch ausschließlich das eingebettete JavaScript-Bundle und laden keine OTA-Aktualisierungen.

Das friert jedoch weder die Expo-Go-App noch die von Expo betriebene Snack-Laufzeit ein. Expo Go unterstützt jeweils nur ausgewählte aktuelle SDKs. Wenn SDK 57 dort künftig nicht mehr angeboten wird, ist ein eigener Development Build der reproduzierbare Weg.

## App starten

```bash
./run.sh
```

Der Expo-Entwicklungsserver zeigt einen QR-Code. Diesen mit Expo Go scannen; unter iOS erfolgt das über die Kamera-App, unter Android direkt in Expo Go. Beim ersten Zugriff die Standortberechtigung erlauben.

Weitere Startmodi:

```bash
./run.sh web          # Web-Entwicklung im Browser
./run.sh android      # Android-Gerät/Emulator über Expo
./run.sh ios          # iOS-Simulator über Expo (nur macOS)
./run.sh clear        # Metro-Cache leeren und neu starten
./run.sh web-export   # Produktions-Web-Bundle nach dist/ exportieren
```

Zusätzliche Expo-Optionen werden weitergereicht, zum Beispiel `./run.sh start --tunnel`, falls das lokale Netzwerk den QR-Code-Zugriff blockiert.

Für einen erneuten Web-Build und anschließenden lokalen Start mit geleertem Metro-Cache:

```bash
npm run web:export -- --clear
./run.sh web --clear --localhost --port 8081
```

Der Produktions-Build liegt in `dist/`; der Entwicklungsserver ist unter [localhost:8081](http://localhost:8081) erreichbar und übernimmt weitere Codeänderungen automatisch. Den Server mit `Ctrl+C` im zugehörigen Terminal beenden. Falls Port 8081 bereits belegt ist, einen freien Port über `--port` wählen.

Expo Go ist eine Entwicklungs- und Vorschauumgebung, kein Deployment-Ziel. Für eine veröffentlichte native App und für dauerhaft reproduzierbare SDK-57-Tests sollte ein Development Build beziehungsweise EAS Build konfiguriert werden. Der Produktions-Web-Export liegt nach `./run.sh web-export` in `dist/` und kann bei einem statischen Hosting-Anbieter veröffentlicht werden.

## Bedienung

1. Im Tab **Wetter** einen Ort suchen oder **Meinen Standort** wählen.
2. Optional bis zu fünf Orte speichern; `✕` entfernt einen Eintrag.
3. Im Prognose-Tab die nächsten fünf Tage ansehen.
4. Im Tab **Niederschlagsradar** die Radarframes manuell wechseln oder animieren.

Der rote Punkt markiert den gewählten Ort. Ohne vorherige Wetterabfrage öffnet der Radar direkt mit Zürich als Standardposition. Eine Ortssuche oder GPS-Auswahl ersetzt die Standardposition. Der Radar zeigt Messungen und – falls RainViewer sie liefert – Nowcast-Prognosen. Die Grundkarte ist bewusst nicht verschiebbar, damit dieselbe Implementierung ohne eigene native Map-Abhängigkeit in Expo Go und Web funktioniert.

## Qualität prüfen

```bash
npm run typecheck
npm test -- --runInBand
npm run lint
npm run doctor
npm run web:export
```

Alle wesentlichen Prüfungen zusammen:

```bash
npm run validate
```

Der ausführlichere UI-Testlauf verwendet das Expo-Jest-Preset:

```bash
npm run test:expo -- --runInBand
```

## Änderungen und Agentenarbeit

Bei jeder angeforderten Projektänderung müssen `CLAUDE.md` und `README.md` im selben Änderungssatz aktualisiert werden, auch bei reinen Dokumentationsaufgaben. `CLAUDE.md` hält den aktuellen Projektstand und die verbindlichen Wartungsregeln fest; diese README beschreibt die dazu passenden Funktionen, Voraussetzungen und Befehle. Sichtbare und betriebliche Änderungen gehören zusätzlich unter `Unreleased` in `CHANGELOG.md`.

Bestehende Tests bleiben erhalten. Änderungen an Verhalten oder Logik benötigen passende neue oder angepasste Tests; Tests dürfen nicht zum Bestehen einer Änderung entfernt, übersprungen oder abgeschwächt werden. Bei SDK-/Abhängigkeitsmigrationen und UI-Änderungen zusätzlich `npm run test:expo -- --runInBand` ausführen, da der Standardlauf die optionalen UI-Tests überspringt. Reine Dokumentationsänderungen werden mit `git diff --check` und einem Abgleich mit dem aktuellen Projektstand geprüft. Nicht ausgeführte oder fehlgeschlagene Prüfungen beim Abschluss ausdrücklich nennen.

## Fehlerbehebung

### Standortbestimmung schlägt fehl

In den Geräte-Einstellungen die Standortberechtigung für Expo Go beziehungsweise den Development Build erlauben und die Ortungsdienste einschalten. Die App versucht vorübergehend unbekannte iOS-CoreLocation-Positionen dreimal. Wetterdaten werden anschließend ohne API-Key über Open-Meteo abgerufen; ein 401-Authentifizierungsfehler ist daher nicht mehr möglich.

### Expo Go meldet eine inkompatible SDK-Version

Die lokale App benötigt SDK-57-kompatibles Expo Go oder einen SDK-57-Development-Build. Den QR-Code des lokalen LAN-Servers auf Port 8082 verwenden. Der gespeicherte Online-Snack hat eine getrennte Laufzeit: Der URL-Parameter allein garantiert SDK 57 nicht. Im Wähler die tatsächlich angebotene und ausgewählte Version prüfen; fehlt SDK 57, die lokale Vorschau verwenden. Nach einem SDK-Wechsel Expo Go vollständig schließen und den neuen QR-Code scannen.

Bei lokalen Versionsabweichungen `./install.sh` erneut ausführen, mit `npm run expo:align` die exakten Versionen prüfen und danach `./run.sh clear` starten. Dieses Projekt ist bewusst auf SDK 57 ausgerichtet. Deaktivierte OTA-Updates können die Expo-Go-Kompatibilität nicht erzwingen.

### Gerät erreicht den lokalen Entwicklungsserver nicht

Beide Geräte müssen normalerweise im selben Netzwerk sein. VPN oder Firewall testweise deaktivieren oder `./run.sh start --tunnel` verwenden.

### Radar lädt nicht

Eine Internetverbindung ist erforderlich. Die App bietet **Erneut versuchen** und zeigt eine verständliche Fehlermeldung, wenn RainViewer nicht erreichbar ist. Browser-Content-Blocker müssen Zugriffe auf `api.rainviewer.com`, `tilecache.rainviewer.com` und `basemaps.cartocdn.com` zulassen.

Falls nur die Grundkarte fehlt oder alte Tiles noch „API key required“ zeigen, `EXPO_PUBLIC_CARTO_API_KEY` in `.env.local` sowie die Schlüsselbeschränkungen im CARTO-Dashboard prüfen. Anschließend den Server mit `./run.sh web --clear --localhost --port 8081` neu starten und den Browser vollständig neu laden. Die authentifizierten Tile-URLs verwenden CARTOs `rastertiles/light_all`-Endpunkt mit `?key=…`, wodurch die früheren unautorisierten Cache-Einträge nicht wiederverwendet werden.

### `npm audit` meldet Probleme

Das Projekt hält Metro-PostCSS per Override auf der gepatchten Version 8.5.26. Der SDK-57-Lockfile wurde mit `npm ci` und vollständiger Peer-Prüfung validiert. `npm audit` meldet 61 Befunde (49 hoch, 12 moderat, keine kritischen). Der Audit meldet weiterhin hohe und moderate Befunde in den Werkzeug-Abhängigkeiten von Expo, Metro und Jest; kritische Befunde sind behoben. Die verbleibenden Ursachen sind `braces`, `node-forge`, `sprintf-js` und `uuid`. Weitere Meldungen mit `npm audit` prüfen. `npm audit fix --force` nicht verwenden, weil dies die geprüften SDK-57-Versionen ungeplant verändern kann. Expo-Versionen nur über den dokumentierten, vollständigen Upgrade-Weg aktualisieren.

## Projektstruktur

```text
weather-app/
├── App.tsx                    # Zustand, APIs und Navigation
├── src/
│   ├── components/
│   │   └── RadarViewer.tsx    # Plattformübergreifende Radar-Karte
│   ├── lib/
│   │   ├── radarComposite.ts  # RainViewer-Timeline und Tile-Geometrie
│   │   └── weatherApi.ts      # Open-Meteo-Ortssuche und Wetterdaten
│   ├── screens/               # Wetter, Prognose und Radar
│   └── utils.ts
├── __tests__/                 # Jest-Tests
├── .npmrc                     # Exakte npm-Versionen statt Bereichsangaben
├── scripts/
│   └── upgrade-expo.js        # Explizite SDK-57-Ausrichtung
├── snack/                     # Assetfreie, SDK-57-fixierte Snack-Importansicht
├── install.sh                 # Reproduzierbare Installation
├── run.sh                     # Einheitlicher Start/Export
├── CLAUDE.md                  # Wartungs- und Agentenleitfaden
└── CHANGELOG.md               # Laufende Änderungen
```

## Datenquellen und Lizenz

- Verantwortlicher für die Bildungsdemonstration: **Peter Stroessler**, [peter.stroessler@bluewin.ch](mailto:peter.stroessler@bluewin.ch). Die App zeigt auf allen Tabs einen Copyright- und Schlüsselhinweis; über **Rechtliche Hinweise · Haftung & Kontakt** ist der vollständige Text erreichbar.
- [Rechtliche Hinweise und Haftungsbeschränkung](./LEGAL.md): ausschließlich Lern- und Demonstrationszwecke, keine Gewährleistung im gesetzlich zulässigen Umfang, Haftungsvorbehalte insbesondere für Vorsatz, grobe Fahrlässigkeit und zwingende gesetzliche Ansprüche. Die App ersetzt keine amtlichen Wetterwarnungen.
- Der CARTO-API-Schlüssel dieser konkreten Demo darf weder weitergegeben noch außerhalb dieser Demo wiederverwendet werden. Für Forks, eigene Deployments und andere Projekte einen eigenen Schlüssel verwenden. Die MIT-Lizenz des Quellcodes erteilt keine Rechte an API-Schlüsseln oder externen Diensten; die Bildungsbeschreibung ändert die MIT-Quellcode-Rechte nicht.
- Ein Rechtstext verhindert technisch keine Übernahme eines im Client sichtbaren Schlüssels. Schlüsselbeschränkungen und Nutzungskontrolle im CARTO-Dashboard bleiben erforderlich. Der Text ist ein Entwurf; die Wirksamkeit im konkreten Einsatz sollte rechtlich geprüft werden.
- Wetter- und Prognosedaten: [Open-Meteo](https://open-meteo.com/)
- Ortsdaten der Open-Meteo-Geocodierung: [GeoNames](https://www.geonames.org/)
- Radardaten: [RainViewer](https://www.rainviewer.com/)
- Grundkarte: [© OpenStreetMap-Mitwirkende und © CARTO](https://carto.com/attributions)
- Quellcode: [MIT-Lizenz](./LICENSE)

Beachte für produktive beziehungsweise kommerzielle Nutzung zusätzlich die Nutzungsbedingungen, Limits und Attributionspflichten aller Datenanbieter.
