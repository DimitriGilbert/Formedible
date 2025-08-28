#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const AI_BUILDER_ROOT = path.resolve(__dirname, '..');
const FORMEDIBLE_SANDBOX_PATH = '/tmp/formedible-sandbox';
const FORMEDIBLE_PACKAGE_PATH = path.resolve(PROJECT_ROOT, 'packages/formedible');
const OUTPUT_PATH = path.resolve(AI_BUILDER_ROOT, 'src/lib/sandbox-templates.json');

console.log('🚀 Generating sandbox templates...');

// Read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Failed to read ${filePath}:`, error.message);
    return null;
  }
}

// Get all files in directory recursively
function getAllFiles(dir, baseDir = dir) {
  const files = {};
  
  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return files;
  }
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.match(/\.(tsx?|css|json)$/)) {
        const relativePath = path.relative(baseDir, fullPath);
        const sandboxPath = '/' + relativePath.replace(/\\/g, '/');
        const content = readFile(fullPath);
        
        if (content !== null) {
          files[sandboxPath] = content;
        }
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

// Generate sandbox templates
const sandboxTemplates = {};

// 1. Build/Config files from formedible-sandbox
console.log('📁 Reading formedible-sandbox config files...');
const configFiles = [
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json', 
  'tsconfig.node.json',
  'index.html'
];

for (const file of configFiles) {
  const content = readFile(path.join(FORMEDIBLE_SANDBOX_PATH, file));
  if (content) {
    sandboxTemplates[`/${file}`] = content;
  }
}

// Main entry files
const mainFiles = [
  'src/main.tsx',
  'src/vite-env.d.ts'
];

for (const file of mainFiles) {
  const content = readFile(path.join(FORMEDIBLE_SANDBOX_PATH, file));
  if (content) {
    sandboxTemplates[`/${file}`] = content;
  }
}

// 2. Formedible files from packages/formedible/src
console.log('📦 Reading formedible package files...');
const formedibleSrcPath = path.join(FORMEDIBLE_PACKAGE_PATH, 'src');
const formedibleFiles = getAllFiles(formedibleSrcPath);

for (const [filePath, content] of Object.entries(formedibleFiles)) {
  sandboxTemplates[`/src${filePath}`] = content;
}

// 3. UI components from current ai-builder package
console.log('🎨 Reading UI components...');
const uiComponentsPath = path.join(AI_BUILDER_ROOT, 'src/components/ui');
const uiFiles = getAllFiles(uiComponentsPath);

for (const [filePath, content] of Object.entries(uiFiles)) {
  sandboxTemplates[`/src/components/ui${filePath}`] = content;
}

// 4. Utils from current package
console.log('🔧 Reading utils...');
const utilsContent = readFile(path.join(AI_BUILDER_ROOT, 'src/lib/utils.ts'));
if (utilsContent) {
  sandboxTemplates['/src/lib/utils.ts'] = utilsContent;
}

// 5. Add default App.tsx and CSS
console.log('📄 Adding default templates...');
sandboxTemplates['/src/App.tsx'] = `import "./App.css";
import { GeneratedFormComponent } from "./GeneratedFormComponent";

function App() {
  return (
    <>
      <GeneratedFormComponent />
    </>
  );
}

export default App;`;

sandboxTemplates['/src/App.css'] = `#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}`;

// Write output
console.log('💾 Writing sandbox templates...');
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sandboxTemplates, null, 2));

console.log(`✅ Generated ${Object.keys(sandboxTemplates).length} sandbox template files`);
console.log(`📍 Output: ${OUTPUT_PATH}`);