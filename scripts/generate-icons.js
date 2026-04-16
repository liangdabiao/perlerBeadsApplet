const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const iconsDir = path.join(__dirname, '../src/assets/icons');

const icons = [
  { name: 'home', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="81" height="81"><path fill="#999999" d="M24 4.1L3 20.6V44h15V32h12v12h15V20.6z"/></svg>` },
  { name: 'home-active', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="81" height="81"><path fill="#FF6B6B" d="M24 4.1L3 20.6V44h15V32h12v12h15V20.6z"/></svg>` },
  { name: 'editor', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="81" height="81"><circle cx="24" cy="24" r="20" fill="none" stroke="#999999" stroke-width="3"/><line x1="24" y1="14" x2="24" y2="34" stroke="#999999" stroke-width="3" stroke-linecap="round"/><line x1="14" y1="24" x2="34" y2="24" stroke="#999999" stroke-width="3" stroke-linecap="round"/></svg>` },
  { name: 'editor-active', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="81" height="81"><circle cx="24" cy="24" r="20" fill="none" stroke="#FF6B6B" stroke-width="3"/><line x1="24" y1="14" x2="24" y2="34" stroke="#FF6B6B" stroke-width="3" stroke-linecap="round"/><line x1="14" y1="24" x2="34" y2="24" stroke="#FF6B6B" stroke-width="3" stroke-linecap="round"/></svg>` },
  { name: 'profile', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="81" height="81"><circle cx="24" cy="16" r="10" fill="none" stroke="#999999" stroke-width="3"/><path d="M8 44c0-10 7-16 16-16s16 6 16 16" fill="none" stroke="#999999" stroke-width="3" stroke-linecap="round"/></svg>` },
  { name: 'profile-active', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="81" height="81"><circle cx="24" cy="16" r="10" fill="none" stroke="#FF6B6B" stroke-width="3"/><path d="M8 44c0-10 7-16 16-16s16 6 16 16" fill="none" stroke="#FF6B6B" stroke-width="3" stroke-linecap="round"/></svg>` },
];

async function generateIcons() {
  for (const icon of icons) {
    const outputPath = path.join(iconsDir, `${icon.name}.png`);
    await sharp(Buffer.from(icon.svg))
      .resize(81, 81)
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${outputPath}`);
  }
  console.log('All icons generated!');
}

generateIcons().catch(console.error);
