#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

if [[ ! -d node_modules ]]; then
  echo "Abhängigkeiten fehlen. Führe zuerst ./install.sh aus." >&2
  exit 1
fi

MODE="${1:-start}"
shift || true

case "$MODE" in
  start)
    exec npx expo start "$@"
    ;;
  clear)
    exec npx expo start --clear "$@"
    ;;
  web)
    exec npx expo start --web "$@"
    ;;
  web-export)
    exec npx expo export --platform web "$@"
    ;;
  android)
    exec npx expo start --android "$@"
    ;;
  ios)
    exec npx expo start --ios "$@"
    ;;
  *)
    echo "Unbekannter Modus: $MODE" >&2
    echo "Verwendung: ./run.sh [start|clear|web|web-export|android|ios] [weitere Expo-Optionen]" >&2
    exit 2
    ;;
esac
