require('dotenv').config({ path: process.env.DOTENV_PATH || '.env' });

// Product name is always BrunoN
const productName = 'BrunoN';

// Get version from environment variable (can be overridden by build script)
// Priority: BRUNON_VERSION env var > .env file > package.json
const version = (process.env.BRUNON_VERSION || require('./package.json').version).replace(/^v/, '');

// macOS configuration - BrunoN builds are unsigned (no Apple Developer account)
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
  // BrunoN builds are not notarized (no Apple Developer account)
  afterSign: undefined,
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
