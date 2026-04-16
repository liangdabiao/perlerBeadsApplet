import { buildFullPalette } from './src/utils/colorUtils';

console.log('Testing buildFullPalette...');

const systems = ['MARD', 'COCO', '漫漫', '盼盼', '咪小窝'] as const;

systems.forEach(system => {
  console.log(`\n=== ${system} ===`);
  const palette = buildFullPalette(system);
  console.log(`Total colors: ${palette.length}`);
  console.log('First 5 colors:');
  palette.slice(0, 5).forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.key} = ${c.hex}`);
  });
  console.log('Last 5 colors:');
  palette.slice(-5).forEach((c, i) => {
    console.log(`  ${palette.length - 4 + i}. ${c.key} = ${c.hex}`);
  });
});
