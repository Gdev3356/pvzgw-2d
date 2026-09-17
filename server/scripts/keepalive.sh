#!/usr/bin/env bash
# keepalive.sh — burns one core for a fixed duration, purely to keep Oracle's
# Always Free idle-reclaim check (7-day CPU 95th-percentile) above 20%.
# Usage: keepalive.sh [seconds]   (default 480 = 8 minutes)
#
# Cron entry (crontab -e), runs every 2 hours for 8 minutes — roughly
# 12 * 8 = 96 min/day = ~11.2 hours/week, comfortably over the ~8.4 hours/week
# (5% of the 7-day window) needed to clear the 95th-percentile threshold:
#
#   0 */2 * * * /home/ubuntu/keepalive.sh >/dev/null 2>&1
#
# Adjust the interval/duration after checking actual measured usage in
# OCI Console → Instance → Metrics — the exact sampling Oracle uses isn't
# publicly documented, so treat the numbers above as a starting point, not
# a guarantee.

DURATION="${1:-480}"
END=$((SECONDS + DURATION))
while [ $SECONDS -lt $END ]; do :; done