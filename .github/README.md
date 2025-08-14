# GitHub Actions Setup for Autograph

This directory contains the CI/CD pipeline for building and releasing Autograph.

## Workflow: build-and-release.yml

The main workflow handles:
- Building the Electron app with Vite
- Compiling the Python signer with Nuitka
- Code signing and notarization for macOS
- Creating DMG and ZIP distributables
- Uploading artifacts
- Creating GitHub releases (on version tags)

### Triggers

- **Push to main**: Builds and signs the app
- **Pull requests**: Builds without signing
- **Version tags** (v*.*.*): Builds, signs, and creates a release
- **Manual dispatch**: Can optionally create a release

## Required Secrets

Before the workflow can run successfully, you need to configure these GitHub secrets:

### For Code Signing (Required for main branch and releases)

1. **APPLE_CERTIFICATE_BASE64**
   ```bash
   # Export your Developer ID Application certificate as .p12
   # Then encode it:
   base64 -i certificate.p12 | pbcopy
   ```

2. **APPLE_CERTIFICATE_PASSWORD**
   - The password you used when exporting the .p12 certificate

### For Notarization (Required for distribution)

3. **APPLE_API_KEY_BASE64**
   ```bash
   # Download your API key from App Store Connect (.p8 file)
   # Then encode it:
   base64 -i AuthKey_XXXXXXXXXX.p8 | pbcopy
   ```

4. **APPLE_API_KEY_ID**
   - The key ID from App Store Connect (e.g., "XXXXXXXXXX")

5. **APPLE_API_ISSUER**
   - Your issuer ID from App Store Connect (UUID format)

## Setting Up Secrets

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret" for each secret above
4. Paste the appropriate value

## Local Testing

To test the build process locally:

```bash
# Install dependencies
npm ci

# Build the app
npm run build:all

# Package without code signing
npm run package

# Or with code signing (requires certificates)
npm run make
```

## Troubleshooting

### Certificate Issues
- Ensure your certificate is a "Developer ID Application" certificate
- The certificate must be valid and not expired
- Include intermediate certificates in the .p12 export

### Notarization Issues
- API key must have the correct permissions
- The app bundle ID must match your Apple Developer account
- Ensure all binaries in the app are properly signed

### Python Build Issues
- The workflow uses `uv` for fast Python dependency management
- Nuitka compilation requires all dependencies to be available
- Font files are copied to the distribution automatically

## Manual Release Process

If you need to create a release manually:

1. Go to Actions tab
2. Select "Build and Release" workflow
3. Click "Run workflow"
4. Check "Create a release" option
5. Click "Run workflow" button

This will create a draft release that you can edit before publishing.