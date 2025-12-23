import { generateMermaid, parseMermaid } from '@ayatori/core';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { dirname, join, parse } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const examplesDir = join(__dirname, '../examples');
const outDir = join(__dirname, '../out');

console.log(`Scanning examples in: ${examplesDir}\n`);

// Ensure base out directory exists
try {
  mkdirSync(outDir, { recursive: true });
} catch (e) {
  // ignore
}

try {
  // .generated.mmd Files to ignore (to prevent loops if running repeatedly)
  const files = readdirSync(examplesDir).filter(f => f.endsWith('.mmd') && !f.endsWith('.generated.mmd'));

  if (files.length === 0) {
    console.log('No .mmd files found.');
  }

  for (const file of files) {
    console.log(`\n========================================`);
    console.log(`Processing: ${file}`);
    console.log(`========================================`);

    const filePath = join(examplesDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const fileBaseName = parse(file).name;
    
    // Create specific output directory for this file
    const fileOutDir = join(outDir, fileBaseName);
    mkdirSync(fileOutDir, { recursive: true });

    try {
      // Parse
      console.log('Parsing...');
      const ast = parseMermaid(content);
      
      const astFilePath = join(fileOutDir, `${fileBaseName}.ast.json`);
      writeFileSync(astFilePath, JSON.stringify(ast, null, 2));
      console.log(`✓ Wrote AST to: ${astFilePath}`);

      // Regenerate
      console.log('Regenerating...');
      const regenerated = generateMermaid(ast);
      
      const generatedFilePath = join(fileOutDir, `${fileBaseName}.re.mmd`);
      writeFileSync(generatedFilePath, regenerated);
      console.log(`✓ Wrote Mermaid to: ${generatedFilePath}`);

    } catch (parseError) {
      console.error(`\nFailed to process ${file}:`, parseError);
    }
  }

} catch (err) {
  console.error('Error reading examples directory:', err);
}
