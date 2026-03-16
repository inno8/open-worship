#!/usr/bin/env node
'use strict'
// Run electron-rebuild for grandiose when the optional dependency is installed.
try {
  require.resolve('grandiose')
} catch {
  process.exit(0)
}
const { execSync } = require('child_process')
execSync('npx electron-rebuild -f -w grandiose', { stdio: 'inherit' })
