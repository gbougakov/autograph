const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    appBundleId: 'be.werknaam.autograph',
    appCategoryType: 'public.app-category.productivity',
    platform: 'darwin',
    arch: ['arm64'],
    extraResource: [
      './python-dist'
    ],
    ignore: ['signing-tool'],
    osxSign: {
      identity: process.env.CODESIGN_IDENTITY,
      optionsForFile: (filePath) => {
        // This returns the per-file signing options
        const fileName = path.basename(filePath);
        const entitlementsPath = path.resolve(__dirname, 'entitlements.plist');
        
        console.log(`Signing ${fileName} with entitlements: ${entitlementsPath}`);
        
        return {
          hardenedRuntime: true,
          entitlements: entitlementsPath,
          // For helper apps, you might want different entitlements
          // but for BEID, use the same for all
          'entitlements-inherit': entitlementsPath,
        };
      }
    },
    osxNotarize: {
      tool: 'notarytool',
      appleApiKey: process.env.APPLE_API_KEY,
      appleApiKeyId: process.env.APPLE_API_KEY_ID,
      appleApiIssuer: process.env.APPLE_API_ISSUER
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
