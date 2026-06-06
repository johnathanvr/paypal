#!/usr/bin/env bash
# Backup deployer: create a sneaky-imagen *Serverless* endpoint via RunPod's
# GraphQL API (the canonical, most stable RunPod API surface).
#
# Usage:
#   export RUNPOD_API_KEY=your_key_here
#   ./deploy-endpoint-graphql.sh
#
# Finds the sneaky-imagen template already in your account and spins up a
# serverless endpoint from it, then prints the new Endpoint ID.

set -euo pipefail

API="${RUNPOD_API_KEY:?Set RUNPOD_API_KEY first:  export RUNPOD_API_KEY=...}"
GQL="https://api.runpod.io/graphql?api_key=${API}"
H_JSON="Content-Type: application/json"

gql() {
  # $1 = JSON-escaped GraphQL query string
  curl -sS -X POST -H "$H_JSON" "$GQL" -d "{\"query\":$1}"
}

echo "→ Fetching your templates…"
TPL_JSON="$(gql '"query { myself { podTemplates { id name imageName isServerless } } }"')"

TID="$(printf '%s' "$TPL_JSON" | python3 -c '
import sys, json
d = json.load(sys.stdin)
tpls = (d.get("data") or {}).get("myself", {}).get("podTemplates") or []
for t in tpls:
    blob = json.dumps(t).lower()
    if "sneaky" in blob and "imagen" in blob:
        print(t.get("id","")); break
')"

if [ -z "${TID:-}" ]; then
  echo "✗ No sneaky-imagen template found. Your templates:"
  printf '%s' "$TPL_JSON" | python3 -c '
import sys, json
d = json.load(sys.stdin)
tpls = (d.get("data") or {}).get("myself", {}).get("podTemplates") or []
if not tpls:
    print("  (none returned — raw response below)"); print(json.dumps(d, indent=2)); sys.exit(0)
for t in tpls:
    print(" ", t.get("id"), "—", t.get("name"), "—", t.get("imageName"))
'
  exit 1
fi

echo "→ Found template: $TID"
echo "→ Creating serverless endpoint (L4, min 0 / max 1, 5s idle)…"

# Build the saveEndpoint mutation. gpuIds "NVIDIA L4" targets L4; adjust if needed.
READ_MUTATION="mutation { saveEndpoint(input: { name: \\\"sneaky-imagen\\\", templateId: \\\"$TID\\\", gpuIds: \\\"NVIDIA L4\\\", workersMin: 0, workersMax: 1, idleTimeout: 5, scalerType: \\\"QUEUE_DELAY\\\", scalerValue: 4 }) { id name } }"

RESP="$(gql "\"$READ_MUTATION\"")"

EID="$(printf '%s' "$RESP" | python3 -c '
import sys, json
d = json.load(sys.stdin)
ep = (d.get("data") or {}).get("saveEndpoint") or {}
print(ep.get("id",""))
' 2>/dev/null || true)"

if [ -z "${EID:-}" ]; then
  echo "✗ Endpoint creation failed. Raw response:"
  printf '%s\n' "$RESP"
  echo ""
  echo "If it mentions an invalid gpuIds value, run this to list valid GPU IDs:"
  echo "  curl -sS -X POST -H '$H_JSON' '$GQL' -d '{\"query\":\"query { gpuTypes { id displayName } }\"}'"
  exit 1
fi

echo ""
echo "✅ Serverless endpoint created!"
echo "   Endpoint ID:  $EID"
echo ""
echo "Paste that into Imagen Studio → Settings → RunPod Endpoint ID → Save."
echo "Test URL: https://api.runpod.ai/v2/$EID/run"
