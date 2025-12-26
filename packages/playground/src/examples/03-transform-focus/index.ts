
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

  // 0. Original
  const original = Polagram.init(mmdContent).toMermaid();
  fs.writeFileSync(path.join(outputDir, `${inputBaseName}.00-original.mmd`), original);

  // Scenario 1: Focus on Payment
  console.log('Processing Scenario 1: Focus on "PaymentService"...');
  const payment = Polagram.init(mmdContent)
    .focus('PaymentService')
    .toMermaid();
  fs.writeFileSync(path.join(outputDir, `${inputBaseName}.01-focus-payment.mmd`), payment);

  // Scenario 2: Focus on Inventory
  console.log('Processing Scenario 2: Focus on "InventoryService"...');
  const inventory = Polagram.init(mmdContent)
    .focus('InventoryService')
    .toMermaid();
  fs.writeFileSync(path.join(outputDir, `${inputBaseName}.02-focus-inventory.mmd`), inventory);

  // Scenario 3: Focus on Frontend
  console.log('Processing Scenario 3: Focus on "Frontend"...');
  const frontend = Polagram.init(mmdContent)
    .focus('Frontend')
    .toMermaid();
  fs.writeFileSync(path.join(outputDir, `${inputBaseName}.03-focus-frontend.mmd`), frontend);

  console.log(`Done. Check ${outputDir} for results.`);
}

main().catch(console.error);
