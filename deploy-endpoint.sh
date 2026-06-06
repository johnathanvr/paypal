#!/usr/bin/env bash
# Deploy sneaky-imagen as a RunPod *Serverless* endpoint (REST API).
#
# Usage:
#   export RUNPOD_API_KEY=rpa_your_real_key      # from runpod.io -> Settings -> API Keys
#   ./deploy-endpoint.sh
#
# Finds the sneaky-imagen template already in your account and spins up a
# serverless endpoint from it, then prints the new Endpoint ID.

set -uo pipefail

API="${RUNPOD_API_KEY:?Set RUNPOD_API_KEY first:  export RUNPOD_API_KEY=...}"

# Guard against pasting the placeholder
case "$API" in
  your_runpod_api_key|your_key_here|rpa_XXXXXXXX...)
    echo "✗ RUNPOD_API_KEY is still the placeholder ('$API')."
    echo "  Set your REAL key:  export RUNPOD_API_KEY=rpa_..."
    exit 1 ;;
esac

BASE="https://rest.runpod.io/v1"
H_AUTH="Authorization: Bearer ${API}"
H_JSON="Content-Type: application/json"

# curl helper: prints "HTTP_CODE<newline>BODY"
req() { curl -sS -w $'\n%{http_code}' "$@"; }

# splits the req() output into $BODY and $CODE
split() { CODE="${1##*$'\n'}"; BODY="${1%$'\n'*}"; }

echo "→ Fetching your templates…"
RAW="$(req -H "$H_AUTH" "$BASE/templates")"; split "$RAW"

if [ "$CODE" != "200" ]; then
  echo "✗ Template list failed — HTTP $CODE"
  echo "  Response: $BODY"
  case "$CODE" in
    401|403) echo "  → That's an auth error. Double-check RUNPOD_API_KEY is your real key." ;;
  esac
  exit 1
fi

TID="$(printf '%s' "$BODY" | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
items = data if isinstance(data, list) else data.get("templates", data.get("data", []))
for t in items:
    if "sneaky" in json.dumps(t).lower() and "imagen" in json.dumps(t).lower():
        print(t.get("id") or t.get("templateId") or ""); break
')"

if [ -z "${TID:-}" ]; then
  echo "✗ No sneaky-imagen template found automatically. Your templates:"
  printf '%s' "$BODY" | python3 -c '
import sys, json
try: data = json.load(sys.stdin)
except Exception as e: print("  (could not parse response):", e); print(sys.stdin.read() if False else ""); sys.exit(0)
items = data if isinstance(data, list) else data.get("templates", data.get("data", []))
if not items: print("  (none)")
for t in items: print(" ", t.get("id") or t.get("templateId"), "—", t.get("name"))
'
  echo "  → Paste this list to Claude and I'll wire in the right template ID."
  exit 1
fi

echo "→ Found template: $TID"
echo "→ Creating serverless endpoint (L4, min 0 / max 1 workers)…"

RAW="$(req -X POST -H "$H_AUTH" -H "$H_JSON" "$BASE/endpoints" -d "{
  \"name\": \"sneaky-imagen\",
  \"templateId\": \"$TID\",
  \"computeType\": \"GPU\",
  \"gpuTypeIds\": [\"NVIDIA L4\"],
  \"workersMin\": 0,
  \"workersMax\": 1
}")"; split "$RAW"

EID="$(printf '%s' "$BODY" | python3 -c 'import sys,json
try: d=json.load(sys.stdin)
except Exception: sys.exit(0)
print(d.get("id") or d.get("endpointId") or "")' )"

if [ -z "${EID:-}" ]; then
  echo "✗ Endpoint creation failed — HTTP $CODE"
  echo "  Response: $BODY"
  echo "  → Paste that to Claude; likely a field-name or gpuTypeIds tweak."
  exit 1
fi

echo ""
echo "✅ Serverless endpoint created!"
echo "   Endpoint ID:  $EID"
echo ""
echo "Paste that into Imagen Studio → Settings → RunPod Endpoint ID → Save."
echo "Test URL: https://api.runpod.ai/v2/$EID/run"
