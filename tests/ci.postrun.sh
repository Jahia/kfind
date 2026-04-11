#!/usr/bin/env bash

# This script is executed after the run
source ./set-env.sh

set -euo pipefail

REPORTS_DIR="results/reports"
ARTIFACTS_REPORTS_DIR="artifacts/results/reports"

# Build aggregated Mochawesome report.json when raw per-spec reports exist.
if compgen -G "${REPORTS_DIR}/cypress_*.json" >/dev/null; then
	yarn --silent report:merge
fi

# Mirror reports where the CI summary step expects them.
mkdir -p "${ARTIFACTS_REPORTS_DIR}"
if [[ -f "${REPORTS_DIR}/report.json" ]]; then
	cp "${REPORTS_DIR}/report.json" "${ARTIFACTS_REPORTS_DIR}/report.json"
fi
