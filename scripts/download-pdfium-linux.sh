#!/bin/bash
#
# Downloads the PDFium shared library for Linux (x86_64) from bblanchon/pdfium-binaries
# This script is used for development and CI/CD testing environments only.
#
# The library is placed in a location that pdfium-render can find at runtime.

set -e

# Configuration
PDFIUM_VERSION="7543"  # Compatible with pdfium-render 0.8.37
DOWNLOAD_URL="https://github.com/bblanchon/pdfium-binaries/releases/download/chromium%2F${PDFIUM_VERSION}/pdfium-linux-x64.tgz"
TARGET_DIR="./lib"
LIB_NAME="libpdfium.so"

echo "📥 Downloading PDFium ${PDFIUM_VERSION} for Linux x86_64..."
echo "Source: ${DOWNLOAD_URL}"

# Create target directory if it doesn't exist
mkdir -p "${TARGET_DIR}"

# Download and extract
echo "⬇️  Downloading..."
curl -L "${DOWNLOAD_URL}" -o /tmp/pdfium-linux.tgz

echo "📦 Extracting..."
tar -xzf /tmp/pdfium-linux.tgz -C /tmp

# Copy the shared library to target directory
echo "📁 Installing to ${TARGET_DIR}/${LIB_NAME}..."
cp /tmp/lib/${LIB_NAME} "${TARGET_DIR}/${LIB_NAME}"

# Cleanup
rm -f /tmp/pdfium-linux.tgz
rm -rf /tmp/lib /tmp/include

# Verify installation
if [ -f "${TARGET_DIR}/${LIB_NAME}" ]; then
    echo "✅ PDFium library installed successfully!"
    echo "   Location: $(pwd)/${TARGET_DIR}/${LIB_NAME}"
    echo "   Size: $(du -h "${TARGET_DIR}/${LIB_NAME}" | cut -f1)"
    
    # Set LD_LIBRARY_PATH hint
    echo ""
    echo "💡 To use this library, ensure it's in your library path:"
    echo "   export LD_LIBRARY_PATH=$(pwd)/${TARGET_DIR}:\$LD_LIBRARY_PATH"
else
    echo "❌ Installation failed!"
    exit 1
fi
