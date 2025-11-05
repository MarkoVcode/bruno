# macOS Installation Guide for BrunoN

## Overview

BrunoN builds for macOS are **unsigned and unnotarized** because they don't use an Apple Developer certificate. This means macOS Gatekeeper will show security warnings when you first open the application.

**This is normal and expected for unsigned apps.** BrunoN is safe to use - it's the same codebase as official Bruno, just without Apple's code signing.

---

## Installation Steps

### 1. Download the DMG

Download the latest BrunoN DMG file for your Mac architecture:
- **Intel Macs (x64)**: `BrunoN_<version>_x64_mac.dmg`
- **Apple Silicon (M1/M2/M3)**: `BrunoN_<version>_arm64_mac.dmg`

### 2. Open the DMG

Double-click the downloaded DMG file to mount it. A window will appear with the BrunoN app icon.

### 3. Drag to Applications

Drag the **BrunoN.app** icon to the **Applications** folder.

### 4. First Launch (Bypassing Gatekeeper)

When you try to open BrunoN for the first time, macOS will block it with this message:

> **"BrunoN.app" cannot be opened because the developer cannot be verified.**

**DO NOT** click "Move to Trash"! Instead, follow these steps:

#### Method 1: Right-Click to Open (Recommended)

1. Open **Finder** and go to your **Applications** folder
2. Find **BrunoN.app**
3. **Right-click** (or Control-click) on BrunoN.app
4. Select **"Open"** from the menu
5. A new dialog will appear with an **"Open"** button
6. Click **"Open"** to launch BrunoN

**This only needs to be done once.** After the first launch, you can open BrunoN normally from Launchpad or Applications.

#### Method 2: Terminal Command (Advanced)

If right-clicking doesn't work, you can remove the quarantine attribute via Terminal:

```bash
xattr -cr /Applications/BrunoN.app
```

Then open BrunoN normally from Applications.

---

## Why Are BrunoN Builds Unsigned?

**Apple Developer Program Requirements:**
- Costs $99 USD per year
- Requires Apple Developer account
- Takes several days for approval
- BrunoN is a community fork without official Apple signing

**Official Bruno vs. BrunoN:**
- **Official Bruno**: Signed and notarized (no warnings)
- **BrunoN**: Unsigned (Gatekeeper warnings on first launch)
- **Both**: Same features, same security, same codebase

---

## Troubleshooting

### "App is Damaged" Error

If you see a message that the app is "damaged and can't be opened":

1. **Move the app to Trash** (don't worry, we'll fix it)
2. **Empty the Trash**
3. **Re-download** the DMG (previous download may have been corrupted)
4. **Repeat installation steps** above

### Permission Errors

If BrunoN can't save files or access the network:

1. Go to **System Settings → Privacy & Security**
2. Under **Files and Folders**, ensure BrunoN has access
3. Under **Network**, ensure BrunoN has access
4. Restart BrunoN

### Still Not Working?

1. Check you downloaded the correct architecture (x64 vs arm64)
2. Ensure your macOS version is 10.15 or later
3. Try removing quarantine: `xattr -cr /Applications/BrunoN.app`
4. Check [GitHub Issues](https://github.com/MarkoVcode/bruno/issues) for known problems

---

## Security Note

Unsigned apps trigger macOS security warnings, but this **does not mean the app is unsafe**. It only means:

- Apple hasn't verified the developer's identity
- The app hasn't gone through Apple's notarization process

**BrunoN is open source.** You can:
- Review the source code on GitHub
- Build from source yourself
- Verify checksums of releases (SHA-256 provided)

If you prefer signed applications, consider using the official Bruno builds at [usebruno.com](https://www.usebruno.com).

---

## System Requirements

- **macOS Version**: 10.15 (Catalina) or later
- **Architecture**:
  - Intel Macs: x64 build
  - Apple Silicon (M1/M2/M3): arm64 build (recommended)
- **Disk Space**: ~200 MB
- **RAM**: 4 GB minimum, 8 GB recommended

---

## SHA-256 Checksums

You can verify the integrity of your download by checking the SHA-256 checksum:

```bash
# For DMG files
shasum -a 256 BrunoN_*.dmg

# Compare with checksums published in GitHub release notes
```

---

## Additional Resources

- [BrunoN GitHub Repository](https://github.com/MarkoVcode/bruno)
- [Official Bruno Documentation](https://docs.usebruno.com)
- [GitHub Issues](https://github.com/MarkoVcode/bruno/issues)
- [Discussions](https://github.com/MarkoVcode/bruno/discussions)

---

**Last Updated**: November 2025
**Version**: 1.0.3
