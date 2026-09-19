#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
npm install
pm2 restart ecosystem.config.cjs --update-env