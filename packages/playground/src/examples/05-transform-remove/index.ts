
import { Polagram } from '@polagram/core';
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

  const mmdPath = path.join(inputDir, 'ecommerce.mmd');
  const mmdContent = fs.readFileSync(mmdPath, 'utf-8');
  const inputBaseName = path.basename(mmdPath, path.extname(mmdPath));

  console.log(`Reading input from: ${mmdPath}`);

  // Scenario 1: Remove "Error" messages
  console.log('Processing Scenario 1: Remove "Error" messages...');
  const removeErrors = Polagram.init(mmdContent)
    .transform({
      action: 'hideParticipant',
      selector: { kind: 'message', text: /Error/ }
    })
    .toMermaid();
  fs.writeFileSync(path.join(outputDir, `${inputBaseName}.01-remove-errors.mmd`), removeErrors);

  console.log(`Done. Check ${outputDir} for results.`);
}

main().catch(console.error);
