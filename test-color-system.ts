import { buildFullPalette, colorSystemOptions } from './colorUtils';

console.log('Testing color system...');
console.log('Available color systems:', colorSystemOptions.map(opt => opt.key));

// Test MARD system
const mardPalette = buildFullPalette('MARD');
console.log('MARD palette size:', mardPalette.length);
console.log('First 5 MARD colors:', mardPalette.slice(0, 5));

// Test 盼盼 system
const panpanPalette = buildFullPalette('盼盼');
console.log('盼盼 palette size:', panpanPalette.length);
console.log('First 5 盼盼 colors:', panpanPalette.slice(0, 5));

console.log('Test completed successfully!');