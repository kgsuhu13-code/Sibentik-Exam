#!/bin/bash
API_KEY="AIzaSyB5gSkZkRF7N3HUcztSPCIWgtBaFu8Kkm0"
curl -s -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Jawab test dengan satu kata: Connected"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$API_KEY"
