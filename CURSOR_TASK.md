# Task: Downloadable Installers (#16)

## Overview
Configure electron-builder to create installers for Windows, macOS, and Linux.

## Build Targets

### Windows
- NSIS installer (.exe)
- Portable (.zip)

### macOS  
- DMG installer

### Linux
- AppImage
- .deb package

## Implementation

### 1. Update package.json build config
```json
{
  "build": {
    "appId": "com.inno8.openworship",
    "productName": "Open Worship",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "dist-electron/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": ["nsis", "zip"],
      "icon": "build/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "installerIcon": "build/icon.ico",
      "uninstallerIcon": "build/icon.ico",
      "installerHeaderIcon": "build/icon.ico"
    },
    "mac": {
      "target": ["dmg"],
      "icon": "build/icon.icns",
      "category": "public.app-category.utilities"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "build/icons",
      "category": "Utility"
    },
    "publish": {
      "provider": "github",
      "owner": "inno8",
      "repo": "open-worship"
    }
  }
}
```

### 2. Create App Icons
Create placeholder icons in desktop/build/:
- icon.ico (Windows) - 256x256
- icon.icns (macOS)
- icons/ folder with PNGs for Linux (16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512)

For now, create a simple placeholder or use a text-based icon generator.

### 3. Create GitHub Actions Workflow
Create .github/workflows/release.yml:
- Trigger on push to 'release' branch or tag
- Build for all platforms (using matrix)
- Upload artifacts to GitHub Releases

### 4. Fix Current Build Issues
The current Windows build fails on symlink errors. 
- Add to package.json scripts: "dist": "vite build && electron-builder --win --mac --linux"
- Or separate: "dist:win", "dist:mac", "dist:linux"

## Files to Create/Modify
- desktop/package.json - build config
- desktop/build/icon.ico - Windows icon
- desktop/build/icon.icns - macOS icon  
- desktop/build/icons/ - Linux icons
- .github/workflows/release.yml - CI/CD

## Acceptance Criteria
- [ ] electron-builder config complete
- [ ] App icons created (placeholder OK)
- [ ] Windows NSIS build works
- [ ] macOS DMG build config ready
- [ ] Linux AppImage/deb config ready
- [ ] GitHub Actions workflow created
