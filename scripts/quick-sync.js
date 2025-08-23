#!/usr/bin/env node

/**
 * Quick Sync Script
 * Directly copies components from packages to web app based on registry files
 * Usage: node scripts/quick-sync.js
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function logInfo(message) {
  log(colors.blue, 'INFO', message);
}

function logSuccess(message) {
  log(colors.green, 'SUCCESS', message);
}

function logWarning(message) {
  log(colors.yellow, 'WARNING', message);
}

function logError(message) {
  log(colors.red, 'ERROR', message);
}

// Ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Copy file with error handling
function copyFile(sourcePath, destPath) {
  try {
    ensureDir(path.dirname(destPath));
    fs.copyFileSync(sourcePath, destPath);
    return true;
  } catch (error) {
    logError(`Failed to copy ${sourcePath} to ${destPath}: ${error.message}`);
    return false;
  }
}

// Process registry file
function processRegistry(registryPath, sourceBase, destBase) {
  if (!fs.existsSync(registryPath)) {
    logWarning(`Registry not found: ${registryPath}`);
    return 0;
  }

  logInfo(`Processing registry: ${registryPath}`);

  const registryContent = fs.readFileSync(registryPath, 'utf8');
  const registry = JSON.parse(registryContent);

  let copiedCount = 0;

  // Handle different registry formats
  const files = registry.files || (registry.items && registry.items[0] && registry.items[0].files) || [];
  
  if (Array.isArray(files)) {
    files.forEach(file => {
      if (file.path) {
        // Remove the leading "src/" from the file path since sourceBase already includes it
        const relativePath = file.path.startsWith('src/') ? file.path.substring(4) : file.path;
        const sourcePath = path.join(sourceBase, relativePath);
        const destPath = path.join(destBase, relativePath);

        if (fs.existsSync(sourcePath)) {
          if (copyFile(sourcePath, destPath)) {
            logInfo(`Copied: ${relativePath}`);
            copiedCount++;
          }
        } else {
          logWarning(`Source file not found: ${sourcePath}`);
        }
      }
    });
  }

  return copiedCount;
}

function main() {
  console.log('🚀 Formedible Quick Sync');
  console.log('========================');

  // Check if we're in the project root
  if (!fs.existsSync('package.json')) {
    logError('package.json not found. Please run this script from the project root.');
    process.exit(1);
  }

  const webDestBase = 'apps/web/src';
  const aiBuilderDestBase = 'packages/ai-builder/src';
  let totalCopied = 0;

  // Process formedible registry -> web app
  const formedibleRegistry = 'packages/formedible/public/r/use-formedible.json';
  const formedibleSourceBase = 'packages/formedible/src';
  totalCopied += processRegistry(formedibleRegistry, formedibleSourceBase, webDestBase);

  // Process formedible registry -> ai-builder
  totalCopied += processRegistry(formedibleRegistry, formedibleSourceBase, aiBuilderDestBase);

  // Process builder registry -> web app  
  const builderRegistry = 'packages/builder/public/r/form-builder.json';
  const builderSourceBase = 'packages/builder/src';
  totalCopied += processRegistry(builderRegistry, builderSourceBase, webDestBase);

  // Process builder registry -> ai-builder
  totalCopied += processRegistry(builderRegistry, builderSourceBase, aiBuilderDestBase);

  // Process ai-builder registry -> web app
  const aiBuilderRegistry = 'packages/ai-builder/registry.json';
  const aiBuilderSourceBase = 'packages/ai-builder/src';
  totalCopied += processRegistry(aiBuilderRegistry, aiBuilderSourceBase, webDestBase);

  // Process parser registry -> web app
  const parserRegistry = 'packages/formedible-parser/public/r/formedible-parser.json';
  const parserSourceBase = 'packages/formedible-parser/src'; 
  totalCopied += processRegistry(parserRegistry, parserSourceBase, webDestBase);

  // Process parser registry -> ai-builder  
  totalCopied += processRegistry(parserRegistry, parserSourceBase, aiBuilderDestBase);

  // Process parser registry -> builder
  const builderDestBase = 'packages/builder/src';
  totalCopied += processRegistry(parserRegistry, parserSourceBase, builderDestBase);

  // Process formedible registry -> formedible-parser (so parser can use real types)
  const parserDestBase = 'packages/formedible-parser/src';
  totalCopied += processRegistry(formedibleRegistry, formedibleSourceBase, parserDestBase);

  logSuccess(`Quick sync complete! ${totalCopied} files copied. 🎉`);
}

// Run the script
main();