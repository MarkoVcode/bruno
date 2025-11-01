require('dotenv').config({ path: process.env.DOTENV_PATH });

// Support BrunoN branding for release builds
const isBrunoNRelease = process.env.BRUNON_RELEASE === 'true';
const productName = isBrunoNRelease ? 'BrunoN' : 'Bruno';

// Get version from BRUNON_GIT_TAG environment variable (set by build script)
// Format: v1.0.0 -> 1.0.0
const version = process.env.BRUNON_GIT_TAG
  ? process.env.BRUNON_GIT_TAG.replace(/^v/, '')
  : require('./package.json').version;

// macOS code signing configuration
// BrunoN builds are unsigned (no Apple Developer account)
// Bruno builds use proper code signing with notarization
const macConfig = {
  artifactName: '${productName}_${buildVersion}_${arch}_${os}.${ext}',
  category: 'public.app-category.developer-tools',
  target: [
    {
      target: 'dmg',
      arch: ['x64', 'arm64']
    },
    {
      target: 'zip',
      arch: ['x64', 'arm64']
    }
  ],
  icon: 'resources/icons/mac/icon.icns'
};

// Only add code signing configuration for official Bruno builds
if (!isBrunoNRelease) {
  macConfig.hardenedRuntime = true;
  macConfig.identity = 'Anoop MD (W7LPPWA48L)';
  macConfig.entitlements = 'resources/entitlements.mac.plist';
  macConfig.entitlementsInherit = 'resources/entitlements.mac.plist';
}

const config = {
  appId: 'com.usebruno.app',
  productName: productName,
  electronVersion: '37.6.1',
  buildVersion: version, // Use the git tag version
  directories: {
    buildResources: 'resources',
    output: 'out'
  },
  extraResources: [
    {
      from: 'resources/data/sample-collection.json',
      to: 'data/sample-collection.json'
    }
  ],
  files: ['**/*'],
  // Only enable notarization for official Bruno builds
  afterSign: isBrunoNRelease ? undefined : 'notarize.js',
  mac: macConfig,
  linux: {
    artifactName: '${productName}_${buildVersion}_${arch}_linux.${ext}',
    icon: 'resources/icons/png',
    target: ['AppImage', 'deb', 'snap', 'rpm']
  },
  deb: {
    // Docs: https://www.electron.build/configuration/linux#debian-package-options
    depends: [
      'libgtk-3-0',
      'libnotify4',
      'libnss3',
      'libxss1',
      'libxtst6',
      'xdg-utils',
      'libatspi2.0-0',
      'libuuid1',
      'libsecret-1-0',
      'libasound2' // #1036
    ]
  },
  win: {
    artifactName: '${productName}_${buildVersion}_${arch}_win.${ext}',
    icon: 'resources/icons/win/icon.ico',
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    sign: null,
    publisherName: 'Bruno Software Inc'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  }
};

module.exports = config;
