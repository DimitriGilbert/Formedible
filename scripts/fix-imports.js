#!/usr/bin/env node

/**
 * Fix import paths after shadcn CLI installation
 * 
 * The shadcn CLI strips @ symbols from imports when installing from local registry files.
 * This script restores the @ symbols to make imports compatible with TypeScript/Next.js aliases.
 * 
 * Usage: node scripts/fix-imports.js <directory>
 * Example: node scripts/fix-imports.js apps/prout/src/components/formedible
 */

const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace imports that start with '/components/', '/lib/', '/hooks/' etc. with '@/' prefix
    const fixedContent = content
      .replace(/from ['"]\/components\//g, 'from "@/components/')
      .replace(/from ['"]\/lib\//g, 'from "@/lib/')
      .replace(/from ['"]\/hooks\//g, 'from "@/hooks/')
      .replace(/from ['"]\/utils\//g, 'from "@/utils/')
      .replace(/from ['"]\/types\//g, 'from "@/types/')
      .replace(/import ['"]\/components\//g, 'import "@/components/')
      .replace(/import ['"]\/lib\//g, 'import "@/lib/')
      .replace(/import ['"]\/hooks\//g, 'import "@/hooks/')
      .replace(/import ['"]\/utils\//g, 'import "@/utils/')
      .replace(/import ['"]\/types\//g, 'import "@/types/');
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf-8');
      console.log(`✅ Fixed imports in: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No imports to fix in: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function fixImportsInDirectory(dirPath) {
  let filesFixed = 0;
  let totalFiles = 0;
  
  function processDirectory(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        processDirectory(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js')) {
        totalFiles++;
        if (fixImportsInFile(fullPath)) {
          filesFixed++;
        }
      }
    }
  }
  
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ Directory does not exist: ${dirPath}`);
    process.exit(1);
  }
  
  console.log(`🔧 Fixing imports in: ${dirPath}`);
  processDirectory(dirPath);
  
  console.log(`\n📊 Summary:`);
  console.log(`   - Files processed: ${totalFiles}`);
  console.log(`   - Files fixed: ${filesFixed}`);
  console.log(`   - Files unchanged: ${totalFiles - filesFixed}`);
  
  if (filesFixed > 0) {
    console.log(`\n✅ Successfully fixed import paths in ${filesFixed} file(s)!`);
  } else {
    console.log(`\n✨ All files already have correct import paths.`);
  }
}

// Get directory from command line argument
const targetDirectory = process.argv[2];

if (!targetDirectory) {
  console.error('❌ Error: Please provide a directory path');
  console.log('Usage: node scripts/fix-imports.js <directory>');
  console.log('Example: node scripts/fix-imports.js apps/prout/src/components/formedible');
  process.exit(1);
}

// Convert relative path to absolute if needed
const absolutePath = path.isAbsolute(targetDirectory) 
  ? targetDirectory 
  : path.resolve(process.cwd(), targetDirectory);

fixImportsInDirectory(absolutePath);