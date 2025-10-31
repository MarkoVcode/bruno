#!/usr/bin/env node

/**
 * Apply BrunoN branding to UI files for release builds
 *
 * This script patches UI files to display "BrunoN" branding.
 * It only runs when BRUNON_RELEASE=true environment variable is set.
 *
 * Changes are temporary and applied at build time to minimize
 * conflicts when merging from upstream Bruno repository.
 */

const fs = require('fs');
const path = require('path');

// Only run if explicitly building for BrunoN release
if (process.env.BRUNON_RELEASE !== 'true') {
  console.log('Skipping BrunoN branding (BRUNON_RELEASE not set)');
  process.exit(0);
}

const GIT_TAG = (process.env.BRUNON_GIT_TAG || '').trim();

console.log('Applying BrunoN branding...');
if (GIT_TAG) {
  console.log(`  Version tag: ${GIT_TAG}`);
}

/**
 * Update a file with a transformation function
 */
function patchFile(filePath, transform) {
  const fullPath = path.resolve(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const original = fs.readFileSync(fullPath, 'utf8');
  const updated = transform(original);

  if (original === updated) {
    console.log(`  ✓ ${filePath} (no changes needed)`);
    return;
  }

  fs.writeFileSync(fullPath, updated, 'utf8');
  console.log(`  ✓ ${filePath} (patched)`);
}

try {
  // Patch 1: Sidebar title (line 88: "bruno" -> "BrunoN")
  patchFile('packages/bruno-app/src/components/Sidebar/TitleBar/index.js', (content) => {
    if (content.includes('BrunoN')) {
      return content;
    }
    // Looking for the text node after the Bruno logo component
    const marker = '          bruno';
    if (!content.includes(marker)) {
      throw new Error('Unable to find sidebar branding text');
    }
    return content.replace(marker, '          BrunoN');
  });

  // Patch 2: About window (Electron)
  patchFile('packages/bruno-electron/src/app/about-bruno.js', (content) => {
    if (content.includes('BrunoN')) {
      return content;
    }
    // This is inside a template literal, so we need to match the exact string
    // The ${version} in the file is a template expression, not plain text
    const marker = 'Bruno ${version}';
    if (!content.includes(marker)) {
      throw new Error('Unable to find about window title');
    }
    // Replace just "Bruno" with "BrunoN" in the title
    let updated = content.replace(
      '<h2 class="title">Bruno ${version}</h2>',
      '<h2 class="title">BrunoN ${version}</h2>'
    );
    // Add edition note after the title
    updated = updated.replace(
      '<h2 class="title">BrunoN ${version}</h2>',
      '<h2 class="title">BrunoN ${version}</h2>\n      <div class="description">BrunoN edition</div>'
    );
    return updated;
  });

  // Patch 3: Status bar with git tag version only
  patchFile('packages/bruno-app/src/components/StatusBar/index.js', (content) => {
    // Check if already patched
    if (content.includes('const brunonReleaseTag =')) {
      return content;
    }

    const anchor = '  const { version } = useApp();';
    if (!content.includes(anchor)) {
      throw new Error('Unable to find StatusBar version hook');
    }

    const newline = content.includes('\r\n') ? '\r\n' : '\n';

    // Add release tag constant
    let updated = content.replace(
      anchor,
      `${anchor}${newline}  const brunonReleaseTag = ${JSON.stringify(GIT_TAG)};`
    );

    // Replace version display to show only git tag (or fallback to package version)
    const versionBlockPattern = /([ \t]*)<div className="status-bar-version">\r?\n\1  v\{version\}\r?\n\1<\/div>/;
    if (!versionBlockPattern.test(updated)) {
      throw new Error('Unable to find StatusBar version markup');
    }

    updated = updated.replace(versionBlockPattern, (_, indent) => {
      return [
        `${indent}<div className="status-bar-version">`,
        `${indent}  {brunonReleaseTag || \`v\${version}\`}`,
        `${indent}</div>`
      ].join(newline);
    });

    return updated;
  });

  console.log('\n✓ BrunoN branding applied successfully');

  if (!GIT_TAG) {
    console.warn('\nWarning: BRUNON_GIT_TAG not set. Status bar will only show package version.');
  }

} catch (error) {
  console.error('\n✗ Failed to apply BrunoN branding:', error.message);
  process.exit(1);
}
