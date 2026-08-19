#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENTRY_DIR="${ROOT_DIR}/dshflow"

# 1. Build the visualization frontend (app -> plugin/web).
echo "[dshflow] build frontend"
pnpm -C "${ROOT_DIR}/app" run build

# 2. Build the host plugin (plugin/dist).
echo "[dshflow] build host plugin"
pnpm -C "${ROOT_DIR}/plugin" run build

# 3. Build the client bundle (client -> dshflow/lib/client.js).
echo "[dshflow] build client bundle"
pnpm -C "${ROOT_DIR}/client" run build

# 4. Assemble the publishable package under dshflow/.
echo "[dshflow] assemble ${ENTRY_DIR}"
rm -rf "${ENTRY_DIR}/plugin" "${ENTRY_DIR}/web"
mkdir -p "${ENTRY_DIR}/plugin" "${ENTRY_DIR}/web"

cp -R "${ROOT_DIR}/plugin/dist/." "${ENTRY_DIR}/plugin/"
cp -R "${ROOT_DIR}/plugin/web/." "${ENTRY_DIR}/web/"

cp "${ROOT_DIR}/cordis.patch.yml" "${ENTRY_DIR}/cordis.patch.yml"
cp "${ROOT_DIR}/README.md" "${ENTRY_DIR}/README.md"
cp "${ROOT_DIR}/LICENSE" "${ENTRY_DIR}/LICENSE"

echo "[dshflow] done: ${ENTRY_DIR}"
echo "[dshflow] publish: cd ${ENTRY_DIR} && npm pack --dry-run"
