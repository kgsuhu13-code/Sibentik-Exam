#!/bin/bash
API_KEY="AIzaSyB5gSkZkRF7N3HUcztSPCIWgtBaFu8Kkm0"
# Mencoba model gemini-2.0-flash-exp
curl -s -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Test connection"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=$API_KEY"
