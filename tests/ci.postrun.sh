#!/usr/bin/env bash

# This script is executed after the run
source ./set-env.sh

# Jahia integration-tests reporter expects tests/artifacts/results/reports/report.json
mkdir -p artifacts/results/reports

if compgen -G "artifacts/results/reports/cypress_*.json" >/dev/null; then
    yarn --silent mochawesome-merge artifacts/results/reports/cypress_*.json > artifacts/results/reports/report.json
elif compgen -G "results/reports/cypress_*.json" >/dev/null; then
    yarn --silent mochawesome-merge results/reports/cypress_*.json > artifacts/results/reports/report.json
elif [[ -f "results/reports/report.json" ]]; then
    cp results/reports/report.json artifacts/results/reports/report.json
elif [[ -f "artifacts/results/reports/report.json" ]]; then
    echo "report.json already present in artifacts/results/reports"
else
    echo "No Cypress report inputs found for merge." >&2
fi
