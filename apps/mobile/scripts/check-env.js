const fs = require('fs');
const path = require('path');

// Extract variables from .env.example
const examplePath = path.resolve(process.cwd(), '.env.example');

if (!fs.existsSync(examplePath)) {
  console.error('❌ .env.example not found');
  process.exit(1);
}

const exampleContent = fs.readFileSync(examplePath, 'utf-8');

const requiredEnvVars = exampleContent
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => line.split('=')[0]);

// Check presence
const missing = requiredEnvVars.filter(
  (v) => process.env[v] === undefined || process.env[v] === '',
);

if (missing.length > 0) {
  console.error('❌ Missing variables:');
  missing.forEach((v) => console.error(`   - ${v}`));
  process.exit(1);
}

console.log('✅ Environment variables checked');
