
import { ParserFactory } from '@polagram/core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const inputDir = path.join(__dirname, 'input');
  const outputDir = path.join(__dirname, 'output');
  
  if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
  }

  const mmdPath = path.join(inputDir, 'complex.mmd');
  const mmdContent = fs.readFileSync(mmdPath, 'utf-8');

  console.log(`Parsing input from: ${mmdPath}`);

  // 1. Parse
  const parser = ParserFactory.getParser('mermaid');
  const ast = parser.parse(mmdContent);

  // 2. Dump AST
  const inputBaseName = path.basename(mmdPath, path.extname(mmdPath));
  const outputPath = path.join(outputDir, `${inputBaseName}.ast.json`);
  fs.writeFileSync(outputPath, JSON.stringify(ast, null, 2));

  console.log(`Dumped AST to ${outputPath}`);
}

main().catch(console.error);
