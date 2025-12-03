// Script to generate large TSX files for SIZE error testing
// Usage: node generate-large-file.js <size-in-mb>

const fs = require('fs');
const path = require('path');

const sizeInMB = parseInt(process.argv[2] || '5');
const outputFile = path.join(__dirname, `large-file-${sizeInMB}mb.tsx`);

console.log(`Generating ${sizeInMB}MB TSX file...`);

const header = `// TEST FILE: SIZE ERROR - ${sizeInMB}MB file
// Expected: SIZE error category, "CV is too large to process"

const CV = () => (
  <div className="cv-container">
    <h1>Large CV for Testing</h1>
`;

const footer = `  </div>
);

export default CV;
`;

// Calculate bytes needed
const targetBytes = sizeInMB * 1024 * 1024;
const headerBytes = Buffer.byteLength(header);
const footerBytes = Buffer.byteLength(footer);
const contentBytes = targetBytes - headerBytes - footerBytes;

// Generate repetitive content
const repeatUnit =
  '    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>\n';
const repeatUnitBytes = Buffer.byteLength(repeatUnit);
const repeatCount = Math.floor(contentBytes / repeatUnitBytes);

console.log(`Writing ${repeatCount} repeated paragraphs...`);

// Write file in chunks to avoid memory issues
const writeStream = fs.createWriteStream(outputFile);
writeStream.write(header);

for (let i = 0; i < repeatCount; i++) {
  writeStream.write(repeatUnit);
  if (i % 10000 === 0) {
    console.log(`Progress: ${Math.floor((i / repeatCount) * 100)}%`);
  }
}

writeStream.write(footer);
writeStream.end();

writeStream.on('finish', () => {
  const stats = fs.statSync(outputFile);
  const actualMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`✓ File generated: ${outputFile}`);
  console.log(`✓ Actual size: ${actualMB} MB (${stats.size} bytes)`);
});
