#!/bin/bash
# MyDay iOS App — Live Log Monitor
# Usage: ./watch-logs.sh
echo "🔍 Watching MyDay logs on simulator... (Ctrl+C to stop)"
echo "---"
xcrun simctl spawn booted log stream \
  --predicate 'process == "MyDay" OR (processImagePath CONTAINS "MyDay")' \
  --style compact \
  --level debug 2>/dev/null | while read -r line; do
    # Color-code by severity
    if echo "$line" | grep -qiE "error|fault|crash|exception"; then
        echo "❌ $line"
    elif echo "$line" | grep -qiE "warning"; then
        echo "⚠️  $line"
    else
        echo "   $line"
    fi
done
