#!/bin/bash
# WASM Bundle Size Tracking Script
# Measures the size of the compiled WASM binary and reports against target

set -e

# Configuration
TARGET_SIZE_BYTES=$((1 * 1024 * 1024))  # 1MB target
WARNING_SIZE_BYTES=$((800 * 1024))      # 800KB warning threshold
WASM_FILE="pkg/wasm_bridge_bg.wasm"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Build WASM in release mode
echo "Building WASM bundle in release mode..."
cd packages/rust-core/wasm-bridge
wasm-pack build --target web --release --out-dir ../../../pkg

# Check if WASM file exists
cd ../../..
if [ ! -f "$WASM_FILE" ]; then
    echo -e "${RED}ERROR: WASM file not found at $WASM_FILE${NC}"
    exit 1
fi

# Get file size
SIZE=$(wc -c < "$WASM_FILE")
SIZE_KB=$((SIZE / 1024))
SIZE_MB=$(echo "scale=2; $SIZE / 1024 / 1024" | bc)
TARGET_KB=$((TARGET_SIZE_BYTES / 1024))
WARNING_KB=$((WARNING_SIZE_BYTES / 1024))

# Calculate percentage of target
PERCENT=$(echo "scale=1; $SIZE * 100 / $TARGET_SIZE_BYTES" | bc)

# Print results
echo ""
echo "============================================"
echo "WASM Bundle Size Report"
echo "============================================"
echo "File: $WASM_FILE"
echo "Size: ${SIZE} bytes (${SIZE_KB} KB / ${SIZE_MB} MB)"
echo "Target: ${TARGET_KB} KB"
echo "Usage: ${PERCENT}% of target"
echo ""

# Check against thresholds
if [ $SIZE -gt $TARGET_SIZE_BYTES ]; then
    echo -e "${RED}❌ FAILED: Bundle exceeds 1MB target!${NC}"
    echo -e "${RED}   Reduce bundle size by ${SIZE_KB} - ${TARGET_KB} = $((SIZE_KB - TARGET_KB)) KB${NC}"
    exit 1
elif [ $SIZE -gt $WARNING_SIZE_BYTES ]; then
    echo -e "${YELLOW}⚠️  WARNING: Bundle size approaching limit (>${WARNING_KB} KB)${NC}"
    echo -e "${YELLOW}   Consider optimizing dependencies or code${NC}"
    exit 0
else
    echo -e "${GREEN}✅ PASSED: Bundle size within target${NC}"
    HEADROOM_KB=$((TARGET_KB - SIZE_KB))
    echo -e "${GREEN}   Headroom: ${HEADROOM_KB} KB available${NC}"
    exit 0
fi
