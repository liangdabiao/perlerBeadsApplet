import { ColorSystem, ColorMapping, colorSystemMapping } from './colorData';

export type { ColorSystem, ColorMapping };

export interface PaletteColor {
  key: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
}

export const colorSystemOptions = [
  { key: 'MARD', name: 'MARD（进口色）', description: '美版Perler beads色号' },
  { key: 'COCO', name: 'COCO（可乐色）', description: '国产COCO品牌色号' },
  { key: '漫漫', name: '漫漫优品', description: '漫漫拼豆色号' },
  { key: '盼盼', name: '盼盼拼拼', description: '盼盼品牌色号（纯数字）' },
  { key: '咪小窝', name: '咪小窝', description: '咪小窝品牌色号（纯数字）' },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

export function getAllHexValues(): string[] {
  return Object.keys(colorSystemMapping);
}

export function getColorMappingByHex(hex: string): ColorMapping | undefined {
  const normalizedHex = hex.toUpperCase();
  return colorSystemMapping[normalizedHex];
}

export function getColorKeyByHex(hex: string, colorSystem: ColorSystem): string {
  const mapping = getColorMappingByHex(hex);
  if (mapping && mapping[colorSystem]) {
    return mapping[colorSystem];
  }
  return '?';
}

export function getHexByColorKey(colorKey: string, colorSystem: ColorSystem): string | undefined {
  const normalizedKey = colorKey.toUpperCase();
  for (const hex in colorSystemMapping) {
    if (colorSystemMapping.hasOwnProperty(hex)) {
      const mapping = colorSystemMapping[hex];
      if (mapping[colorSystem] && mapping[colorSystem].toUpperCase() === normalizedKey) {
        return hex;
      }
    }
  }
  return undefined;
}

export function buildFullPalette(colorSystem: ColorSystem): PaletteColor[] {
  const palette: PaletteColor[] = [];

  for (const hex in colorSystemMapping) {
    if (colorSystemMapping.hasOwnProperty(hex)) {
      const mapping = colorSystemMapping[hex];
      const colorKey = mapping[colorSystem];
      if (colorKey) {
        const rgb = hexToRgb(hex);
        if (rgb) {
          palette.push({
            key: colorKey,
            hex: hex.toUpperCase(),
            rgb
          });
        }
      }
    }
  }

  palette.sort((a, b) => {
    if (colorSystem === '盼盼' || colorSystem === '咪小窝') {
      const numA = parseInt(a.key, 10) || 0;
      const numB = parseInt(b.key, 10) || 0;
      return numA - numB;
    } else {
      const numA = parseInt(a.key.replace(/^[A-Z]+/, ''), 10) || 0;
      const numB = parseInt(b.key.replace(/^[A-Z]+/, ''), 10) || 0;
      const prefixA = a.key.match(/^[A-Z]+/)?.[0] || '';
      const prefixB = b.key.match(/^[A-Z]+/)?.[0] || '';
      if (prefixA !== prefixB) {
        return prefixA.localeCompare(prefixB);
      }
      return numA - numB;
    }
  });

  return palette;
}

export function groupColorsByPrefix(colors: PaletteColor[], colorSystem: ColorSystem): Record<string, PaletteColor[]> {
  const groups: Record<string, PaletteColor[]> = {};

  colors.forEach(color => {
    let prefix: string;

    if (colorSystem === '盼盼' || colorSystem === '咪小窝') {
      const num = parseInt(color.key, 10);
      if (!isNaN(num)) {
        if (num <= 20) {
          prefix = '1-20';
        } else if (num <= 50) {
          prefix = '21-50';
        } else if (num <= 100) {
          prefix = '51-100';
        } else if (num <= 200) {
          prefix = '101-200';
        } else {
          prefix = '200+';
        }
      } else {
        prefix = '其他';
      }
    } else {
      prefix = color.key.match(/^[A-Z]+/)?.[0] || '其他';
    }

    if (!groups[prefix]) {
      groups[prefix] = [];
    }
    groups[prefix].push(color);
  });

  Object.keys(groups).forEach(prefix => {
    groups[prefix].sort((a, b) => {
      if (colorSystem === '盼盼' || colorSystem === '咪小窝') {
        const numA = parseInt(a.key, 10) || 0;
        const numB = parseInt(b.key, 10) || 0;
        return numA - numB;
      } else {
        const numA = parseInt(a.key.replace(/^[A-Z]+/, ''), 10) || 0;
        const numB = parseInt(b.key.replace(/^[A-Z]+/, ''), 10) || 0;
        return numA - numB;
      }
    });
  });

  return groups;
}

export function searchColors(keyword: string, colorSystem: ColorSystem): PaletteColor[] {
  const fullPalette = buildFullPalette(colorSystem);
  const lowerKeyword = keyword.toLowerCase();

  return fullPalette.filter(color => {
    const keyMatch = color.key.toLowerCase().indexOf(lowerKeyword) !== -1;
    const hexMatch = color.hex.toLowerCase().indexOf(lowerKeyword) !== -1;
    return keyMatch || hexMatch;
  });
}