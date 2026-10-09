#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Fehler: Node.js fehlt. Installiere Node.js 22.13 oder neuer." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Fehler: npm fehlt. Installiere eine aktuelle Node.js-Version inklusive npm." >&2
  exit 1
fi

node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 13)) { console.error(`Fehler: Node.js ${process.versions.node} ist zu alt. Erforderlich ist >=22.13.0.`); process.exit(1); }'

echo "Installiere exakt die in package-lock.json festgelegten Abhängigkeiten ..."
npm ci

echo "Prüfe Expo-SDK-Kompatibilität ..."
npx expo install --check

echo "Installation abgeschlossen. Starte die App danach mit ./run.sh."
