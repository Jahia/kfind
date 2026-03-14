#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load credentials from .env (never committed)
if [[ -f "$SCRIPT_DIR/.env" ]]; then
  # shellcheck source=.env
  source "$SCRIPT_DIR/.env"
else
  echo "✗ .env file not found. Create it with JAHIA_URL, JAHIA_USER, JAHIA_PASS." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Build
# ---------------------------------------------------------------------------
echo "==> Building module..."
cd "$SCRIPT_DIR"
mvn clean install -q
echo "    Build complete."

# ---------------------------------------------------------------------------
# 2. Locate the JAR
# ---------------------------------------------------------------------------
JAR="$(ls "$SCRIPT_DIR"/target/augmented-authoring-*.jar 2>/dev/null | grep -v sources | head -1)"
if [[ -z "$JAR" ]]; then
  echo "✗ No JAR found in target/ after build." >&2
  exit 1
fi
echo "==> JAR: $(basename "$JAR") ($(du -h "$JAR" | cut -f1))"

# ---------------------------------------------------------------------------
# 3. Deploy via Jahia provisioning API
# ---------------------------------------------------------------------------
JAR_NAME="$(basename "$JAR")"
SCRIPT_JSON="[{\"installBundle\":\"$JAR_NAME\", \"autoStart\": true, \"forceUpdate\": true, \"uninstallPreviousVersion\": true}]"

echo "==> Sending provisioning request to $JAHIA_URL/modules/api/provisioning ..."
echo "    Script: $SCRIPT_JSON"
echo ""

HTTP_RESPONSE=$(curl \
  --silent \
  --show-error \
  --max-time 120 \
  --write-out "\nHTTP_STATUS:%{http_code}" \
  -u "$JAHIA_USER:$JAHIA_PASS" \
  -X POST \
  "$JAHIA_URL/modules/api/provisioning" \
  --form "script=$SCRIPT_JSON" \
  --form "file=@$JAR")

HTTP_BODY=$(echo "$HTTP_RESPONSE" | sed '/^HTTP_STATUS:/d')
HTTP_STATUS=$(echo "$HTTP_RESPONSE" | grep "^HTTP_STATUS:" | cut -d: -f2)

echo "==> Server response (HTTP $HTTP_STATUS):"
echo "$HTTP_BODY"
echo ""

if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
  echo "✓ Deployment succeeded (HTTP $HTTP_STATUS)"
else
  echo "✗ Deployment failed (HTTP $HTTP_STATUS)" >&2
  exit 1
fi
