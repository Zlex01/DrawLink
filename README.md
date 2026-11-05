# DrawLink

Eine gemeinsame Zeichenfläche mit HTML Canvas, JavaScript und WebSockets.
Kein React, kein Vite, keine Datenbank. Node.js liefert die Seite aus und
verteilt die Zeichenbewegungen über das Paket `ws` an alle verbundenen Browser.

## Lokal starten

Im Projektordner:

```bash
npm ci
npm start
```

Öffne http://localhost:3000 in zwei Browserfenstern.
Für ein Handy im selben WLAN: http://DEINE-LOKALE-IP:3000.

## Auf Uberspace installieren

1. Lade den entpackten Ordner `drawlink` mit SFTP in dein Home-Verzeichnis,
   sodass er auf dem Server unter `~/drawlink` liegt. `node_modules` nicht hochladen.
2. Melde dich per SSH auf deinem Uberspace an. Führe aus:

```bash
cd ~/drawlink
npm ci --omit=dev
npm start
```

Das Terminal meldet „DrawLink läuft auf Port 3000“. Beende diesen Test mit Strg+C.
Falls Port 3000 bereits verwendet wird, wähle einen anderen freien Port und
passe ihn in der Service-Datei UND beim Web-Backend an.

3. Richte den dauerhaften Dienst ein. Diesen Block vollständig im SSH-Terminal ausführen:

```bash
mkdir -p ~/etc/services.d
cat > ~/etc/services.d/drawlink.ini <<EOF_SERVICE
[program:drawlink]
directory=$HOME/drawlink
command=npm start
autostart=true
autorestart=true
environment=NODE_ENV="production",PORT="3000"
EOF_SERVICE
supervisorctl reread
supervisorctl update
supervisorctl status drawlink
```

4. Verbinde NUR den Pfad `/drawlink` mit diesem Server:

```bash
uberspace web backend set /drawlink --http --port 3000
uberspace web backend list
```

5. Öffne `https://DEINE-UBERSPACE-DOMAIN/drawlink/` auf Rechner und Handy.
   Ersetze DEINE-UBERSPACE-DOMAIN durch deine tatsächliche Domain.
   Die WebSocket-Adresse wird automatisch aus der Seitenadresse gebildet.
   Unter HTTPS verwendet die Seite automatisch `wss://`.

## Prüfen

- Beide Geräte zeigen „Verbunden · 2 online“.
- Zeichne auf einem Gerät: Die Linie erscheint auf beiden Geräten.
- Wähle eine andere Farbe und zeichne auf dem anderen Gerät.
- Lade eine Seite neu: Die bisherige Zeichnung erscheint wieder.
- „Alles löschen“ löscht nach Bestätigung die Zeichnung für alle.

Bei Problemen:

```bash
supervisorctl status drawlink
supervisorctl tail drawlink stderr
uberspace web backend list
```

Nach Änderungen am Code:

```bash
supervisorctl restart drawlink
```

## Bewusst einfach

Alle Besucher teilen dieselbe Fläche; auch Löschen gilt für alle.
Die Zeichnung liegt nur im Arbeitsspeicher des Servers. Ein Serverneustart
löscht sie. Maximal 50.000 Liniensegmente; danach die Fläche leeren.
Zeichnen ist nur mit aktiver Verbindung möglich. Der Server bestätigt und
verteilt jede Linie, damit alle Geräte dieselbe Reihenfolge sehen.
Ein Ping alle 30 Sekunden hält die WebSocket-Verbindung aktiv.

## Offizielle Uberspace-Dokumentation

- https://manual.uberspace.de/web-backends/
- https://manual.uberspace.de/lang-nodejs/

Die Installation auf deinem Konto muss noch ausgeführt werden;
dieses Paket ist nicht bereits auf deinem Uberspace veröffentlicht.
