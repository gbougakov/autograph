#!/bin/bash

# Autograph Python Signer Build Script
# Uses uv and Nuitka to create a standalone distribution

set -e

echo "Building Autograph Python Signer..."

# Check if we're in the signing-tool directory
if [ ! -f "main.py" ]; then
    echo "Error: main.py not found. Please run this script from the signing-tool directory."
    exit 1
fi

# Clean up any previous build artifacts
echo "Cleaning up previous builds..."
rm -rf main.dist main.build 2>/dev/null || true
rm -rf ../python-dist 2>/dev/null || true

# Install dependencies with uv
echo "Installing dependencies with uv..."
if ! command -v uv &> /dev/null; then
    echo "Error: uv is not installed. Please install uv first."
    echo "Visit: https://github.com/astral-sh/uv"
    exit 1
fi

# Sync dependencies
uv sync

# Install Nuitka in the virtual environment
echo "Installing Nuitka..."
uv pip install nuitka

# Build with Nuitka
echo "Compiling with Nuitka..."
uv run python3 -m nuitka \
    --follow-imports \
    --assume-yes-for-downloads \
    --include-package=fontTools \
    --mode=standalone \
    main.py

# Copy font files to the distribution
echo "Copying font files..."
cp -v *.ttf main.dist/ 2>/dev/null || true
cp -v *.otf main.dist/ 2>/dev/null || true

# Create python-dist directory and move the distribution
echo "Moving distribution to python-dist..."
mkdir -p ../python-dist
mv main.dist ../python-dist/autograph-signer

# Make the binary executable
chmod +x ../python-dist/autograph-signer/main.bin

echo "Build complete!"
echo "Binary available at: ../python-dist/autograph-signer/main.bin"
echo ""
echo "To test the binary:"
echo "  echo '{\"pdf_path\": \"document.pdf\", \"output_path\": \"/tmp/test-signed.pdf\", \"page\": 0, \"x\": 100, \"y\": 100, \"width\": 200, \"height\": 60}' | ../python-dist/autograph-signer/main.bin"