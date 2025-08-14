#!/bin/bash

# Import Apple Developer Certificate for Code Signing
# This script is used by GitHub Actions to set up code signing

set -e

# Check required environment variables
if [ -z "$APPLE_CERTIFICATE_BASE64" ]; then
    echo "Error: APPLE_CERTIFICATE_BASE64 is not set"
    exit 1
fi

if [ -z "$APPLE_CERTIFICATE_PASSWORD" ]; then
    echo "Error: APPLE_CERTIFICATE_PASSWORD is not set"
    exit 1
fi

echo "Setting up code signing certificate..."

# Create variables
CERTIFICATE_PATH=$RUNNER_TEMP/certificate.p12
KEYCHAIN_PATH=$RUNNER_TEMP/app-signing.keychain-db
KEYCHAIN_PASSWORD=$(openssl rand -base64 32)

# Decode certificate from base64
echo "$APPLE_CERTIFICATE_BASE64" | base64 --decode > $CERTIFICATE_PATH

# Create temporary keychain
security create-keychain -p "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH
security set-keychain-settings -lut 21600 $KEYCHAIN_PATH
security unlock-keychain -p "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH

# Import certificate to keychain
security import $CERTIFICATE_PATH -P "$APPLE_CERTIFICATE_PASSWORD" -A -t cert -f pkcs12 -k $KEYCHAIN_PATH
security set-key-partition-list -S apple-tool:,apple: -k "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH

# Make the keychain the default
security list-keychain -d user -s $KEYCHAIN_PATH

# Verify certificate was imported
echo "Verifying certificate import..."
security find-identity -v -p codesigning $KEYCHAIN_PATH

# Clean up certificate file (keep keychain for signing)
rm $CERTIFICATE_PATH

echo "Certificate successfully imported to keychain: $KEYCHAIN_PATH"
echo "KEYCHAIN_PATH=$KEYCHAIN_PATH" >> $GITHUB_ENV