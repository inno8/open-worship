#!/usr/bin/env node
'use strict'

// Run electron-rebuild for grandiose when the optional dependency is installed.
// This script is safe to fail - NDI is optional functionality.

try {
  require.resolve('grandiose')
} catch {
  console.log('grandiose not installed, skipping NDI rebuild (NDI will be disabled)')
  process.exit(0)
}

const { execSync } = require('child_process')

try {
  console.log('Rebuilding grandiose for Electron...')
  execSync('npx electron-rebuild -f -w grandiose', { stdio: 'inherit' })
  console.log('grandiose rebuilt successfully')
} catch (error) {
  console.warn('Warning: Failed to rebuild grandiose. NDI output will be disabled.')
  console.warn('This is normal on CI or systems without NDI SDK.')
  console.warn('The app will still work, but without NDI functionality.')
  // Don't exit with error - NDI is optional
  process.exit(0)
}
