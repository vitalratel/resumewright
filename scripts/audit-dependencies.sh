#!/bin/bash
# Dependency audit script for ResumeWright Rust workspace

set -e

echo "🔍 ResumeWright Dependency Audit"
echo "================================"
echo ""

cd "$(dirname "$0")/.."

# 1. Security audit
echo "1️⃣ Security Audit (cargo audit)"
echo "-------------------------------"
if cargo audit; then
    echo "✅ No known security vulnerabilities"
else
    echo "❌ Security vulnerabilities found!"
    exit 1
fi
echo ""

# 2. Outdated dependencies
echo "2️⃣ Outdated Dependencies (cargo outdated)"
echo "-----------------------------------------"
cargo outdated --root-deps-only --workspace
echo ""

# 3. Duplicate dependencies
echo "3️⃣ Duplicate Dependencies (cargo tree -d)"
echo "------------------------------------------"
DUPLICATES=$(cargo tree -d 2>&1 | head -50)
if [ -z "$DUPLICATES" ]; then
    echo "✅ No duplicate dependencies"
else
    echo "$DUPLICATES"
fi
echo ""

# 4. Summary
echo "📊 Summary"
echo "----------"
echo "Workspace crates: $(ls -d packages/rust-core/*/ 2>/dev/null | wc -l)"
echo "Total dependencies: $(cargo tree --depth 1 2>&1 | grep -v "^[[:space:]]" | wc -l)"
echo ""

echo "✅ Audit complete!"
