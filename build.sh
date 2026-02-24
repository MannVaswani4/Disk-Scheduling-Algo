#!/bin/bash
# build.sh - Compile C disk scheduling algorithms to WebAssembly
# Usage: ./build.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="$SCRIPT_DIR/src/algorithms"
OUT_DIR="$SCRIPT_DIR/src/wasm"

echo "=== Building Disk Scheduling WASM Module ==="
echo "Source: $SRC_DIR"
echo "Output: $OUT_DIR"

# Create output directory
mkdir -p "$OUT_DIR"

# Compile all C files together into a single WASM module
# SINGLE_FILE=1 embeds the .wasm binary as base64 inside the JS file
# so Vite can import it as a normal ES module from src/
emcc \
    "$SRC_DIR/fcfs.c" \
    "$SRC_DIR/sstf.c" \
    "$SRC_DIR/scan.c" \
    "$SRC_DIR/look.c" \
    "$SRC_DIR/cscan.c" \
    "$SRC_DIR/clook.c" \
    "$SRC_DIR/fscan.c" \
    "$SRC_DIR/nstep_scan.c" \
    "$SRC_DIR/wasm_bridge.c" \
    -o "$OUT_DIR/scheduler.mjs" \
    -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","getValue","setValue","HEAP32"]' \
    -s EXPORTED_FUNCTIONS='["_get_request_buffer","_get_steps_buffer","_get_num_steps","_get_total_seek","_run_fcfs","_run_sstf","_run_scan","_run_look","_run_cscan","_run_clook","_run_fscan","_run_nstep_scan","_malloc","_free"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -s EXPORT_NAME="createSchedulerModule" \
    -s ENVIRONMENT='web' \
    -s SINGLE_FILE=1 \
    -O2

echo ""
echo "=== Build Complete ==="
echo "Output file:"
ls -lh "$OUT_DIR"/scheduler.mjs
echo ""
echo "Single-file WASM module ready at: $OUT_DIR/scheduler.mjs"
