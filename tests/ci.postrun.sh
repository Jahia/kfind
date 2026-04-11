#!/usr/bin/env bash

# This script is executed after the run
source ./set-env.sh

# Jahia integration-tests reporter expects tests/artifacts/results/reports/report.json
if compgen -G "artifacts/results/reports/cypress_*.json" >/dev/null; then
    yarn --silent mochawesome-merge artifacts/results/reports/cypress_*.json > artifacts/results/reports/report.json
elif compgen -G "results/reports/cypress_*.json" >/dev/null; then
    mkdir -p artifacts/results/reports
    yarn --silent mochawesome-merge results/reports/cypress_*.json > results/reports/report.json
    cp results/reports/report.json artifacts/results/reports/report.json
fi
