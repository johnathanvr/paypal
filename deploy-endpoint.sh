#!/usr/bin/env bash
# Deploy sneaky-imagen as a RunPod *Serverless* endpoint.
#
# Usage:
#   export RUNPOD_API_KEY=your_key_here
#   ./deploy-endpoint.sh
#
# It finds the sneaky-imagen template already in your account (created when you
# deployed it from the Hub) and spins up a serverless endpoint from it, then
# prints the new Endpoint ID to paste into Imagen Studio.

set -euo pipefail

API="${RUNPOD_API_KEY:?Set RUNPOD_API_KEY first:  export RUNPOD_API_KEY=...}"
BASE="https://rest.runpod.io/v1"
H_AUTH="Authorization: Bearer ${API}"
H_JSON="Content-Type: application/json"

echo "→ Looking for a sneaky-imagen template in your account…"
TEMPLATES="$(curl -sS -H "$H_AUTH" "$BASE/templates")"

# Pick the first template whose name or image mentions sneaky-imagen
TID="$(printf '%s' "$TEMPLATES" | python3 -c '
import sys, json
data = json.load(sys.stdin)
items = data if isinstance(data, list) else data.get("templates", data.get("data", []))
for t in items:
    blob = json.dumps(t).lower()
    if "sneaky" in blob and "imagen" in blob:
        print(t.get("id") or t.get("templateId") or "")
        break
')"

if [ -z "${TID:-}" ]; then
  echo "✗ Could not find a sneaky-imagen template automatically."
  echo "  Here are your templates (id + name) — tell Claude which one is sneaky-imagen:"
  printf '%s' "$TEMPLATES" | python3 -c '
import sys, json
data = json.load(sys.stdin)
items = data if isinstance(data, list) else data.get("templates", data.get("data", []))
for t in items:
    print(" ", t.get("id") or t.get("templateId"), "—", t.get("name"))
'
  exit 1
fi

echo "→ Found template: $TID"
echo "→ Creating serverless endpoint (L4, min 0 / max 1 workers)…"

RESP="$(curl -sS -X POST -H "$H_AUTH" -H "$H_JSON" "$BASE/endpoints" -d "{
  \"name\": \"sneaky-imagen\",
  \"templateId\": \"$TID\",
  \"computeType\": \"GPU\",
  \"gpuTypeIds\": [\"NVIDIA L4\"],
  \"workersMin\": 0,
  \"workersMax\": 1
}")"

EID="$(printf '%s' "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("id") or d.get("endpointId") or "")' 2>/dev/null || true)"

if [ -z "${EID:-}" ]; then
  echo "✗ Endpoint creation did not return an ID. Raw response:"
  printf '%s\n' "$RESP"
  exit 1
fi

echo ""
echo "✅ Serverless endpoint created!"
echo "   Endpoint ID:  $EID"
echo ""
echo "Paste that into Imagen Studio → Settings → RunPod Endpoint ID → Save."
echo "Test URL: https://api.runpod.ai/v2/$EID/run"
