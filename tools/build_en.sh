#!/bin/sh
# Gera a versão inglesa (js_en/). uso: sh tools/build_en.sh [pasta dos dados 3D]
D=${1:-/home/claude/ihsl/mmo/data}
cd "$(dirname "$0")/.." && mkdir -p js_en && python3 tools/port_data3d.py "$D" en > js_en/data3d.js && node tools/build_en.js
