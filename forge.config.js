const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
require('dotenv').config();

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
    icon: './icons/icon',
    ignore: [
      // Development and source files
      /^\/src$/,
      /^\/signing-tool$/,
      /^\/python-dist$/,  // Handled by extraResource
      
      // Build artifacts and caches
      /^\/out$/,
      /^\/\.vite$/,
      /^\/.git$/,
      
      // Config files not needed in production
      /^\/\.env/,
      /^\/\.gitignore$/,
      /^\/\.DS_Store$/,
      /^\/vite\.config\.js$/,
      /^\/tailwind\.config\.js$/,
      /^\/tsconfig.*\.json$/,
      /^\/postcss\.config\.js$/,
      /^\/components\.json$/,
      /^\/package-lock\.json$/,
      
      // Documentation (except required legal files)
      /^\/README\.md$/,
      /^\/CLAUDE\.md$/,
      
      // Development scripts
      /^\/main\.js$/,  // Source version (using dist-electron/main.js)
      /^\/preload\.js$/,  // Source version (using dist-electron/preload.js)
      /^\/index\.html$/,  // Source version (using dist/index.html)
      
      // Test files
      /\.test\./,
      /\.spec\./,
      /__tests__/,
      
      // macOS specific
      /\.DS_Store$/,
      /Thumbs\.db$/
    ],
    osxSign: process.env.CI ? {
       optionsForFile: (filePath) => {
        // Here, we keep it simple and return a single entitlements.plist file.
        // You can use this callback to map different sets of entitlements
        // to specific files in your packaged app.
        return {
          entitlements: 'entitlements.plist'
        };
      }
    } : undefined,
    osxNotarize: process.env.APPLE_API_KEY ? {
      tool: 'notarytool',
      appleApiKey: process.env.APPLE_API_KEY,
      appleApiKeyId: process.env.APPLE_API_KEY_ID,
      appleApiIssuer: process.env.APPLE_API_ISSUER
    } : undefined
  },
  rebuildConfig: {
    // Ensure native modules are rebuilt for the target platform
    onlyModules: ['graphene-pk11']
  },
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
