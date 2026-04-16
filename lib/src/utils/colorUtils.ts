import {
  ColorSystem,
  ColorMapping,
  PaletteColor,
  colorSystemMapping,
  colorSystemOptions,
  getColorMappingByHex,
  getColorKeyByHex,
  getHexByColorKey,
  hexToRgb,
  rgbToHex,
  colorDistance,
  findClosestPaletteColor,
  buildFullPalette,
  groupColorsByPrefix,
  getAllHexValues
} from '../data/colorData';

export {
  ColorSystem,
  ColorMapping,
  PaletteColor,
  colorSystemMapping,
  colorSystemOptions,
  getColorMappingByHex,
  getColorKeyByHex,
  getHexByColorKey,
  hexToRgb,
  rgbToHex,
  colorDistance,
  findClosestPaletteColor,
  buildFullPalette,
  groupColorsByPrefix,
  getAllHexValues
};

export function searchColors(keyword: string, colorSystem: ColorSystem): PaletteColor[] {
  const fullPalette = buildFullPalette(colorSystem);
  const lowerKeyword = keyword.toLowerCase();
  
  return fullPalette.filter(color => {
    const keyMatch = color.key.toLowerCase().includes(lowerKeyword);
    const hexMatch = color.hex.toLowerCase().includes(lowerKeyword);
    return keyMatch || hexMatch;
  });
}

export function filterColorsByHue(colors: PaletteColor[]): PaletteColor[] {
  return colors.slice().sort((a, b) => {
    const hslA = hexToHsl(a.hex);
    const hslB = hexToHsl(b.hex);
    
    if (Math.abs(hslA.h - hslB.h) > 5) {
      return hslA.h - hslB.h;
    }
    
    if (Math.abs(hslA.l - hslB.l) > 3) {
      return hslB.l - hslA.l;
    }
    
    return hslB.s - hslA.s;
  });
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function getColorInfo(hex: string): {
  hex: string;
  rgb: { r: number; g: number; b: number };
  mapping: ColorMapping | undefined;
  displayKeys: Record<ColorSystem, string>;
} {
  const normalizedHex = hex.toUpperCase();
  const rgb = hexToRgb(normalizedHex);
  const mapping = getColorMappingByHex(normalizedHex);
  
  const displayKeys: Record<ColorSystem, string> = {
    'MARD': mapping?.MARD || '?',
    'COCO': mapping?.COCO || '?',
    '漫漫': mapping?.漫漫 || '?',
    '盼盼': mapping?.盼盼 || '?',
    '咪小窝': mapping?.咪小窝 || '?'
  };
  
  return {
    hex: normalizedHex,
    rgb: rgb || { r: 0, g: 0, b: 0 },
    mapping,
    displayKeys
  };
}

export const presetPalettes = [
  {
    id: 'full',
    name: '全部颜色',
    description: '完整拼豆色板（推荐）',
    getColors: (system: ColorSystem) => buildFullPalette(system)
  },
  {
    id: 'basic',
    name: '基础色板',
    description: '最常用的基础颜色',
    getColors: (system: ColorSystem) => {
      const full = buildFullPalette(system);
      const basicPrefixes = ['A', 'B', 'C', 'F', 'G', 'H'];
      if (system === '盼盼' || system === '咪小窝') {
        return full.filter(c => {
          const num = parseInt(c.key, 10);
          return num >= 1 && num <= 50;
        });
      }
      return full.filter(c => basicPrefixes.some(p => c.key.startsWith(p)));
    }
  },
  {
    id: 'warm',
    name: '暖色系',
    description: '红、橙、黄色系',
    getColors: (system: ColorSystem) => {
      const full = buildFullPalette(system);
      if (system === '盼盼' || system === '咪小窝') {
        return full.filter(c => {
          const num = parseInt(c.key, 10);
          return (num >= 1 && num <= 20) || (num >= 31 && num <= 55);
        });
      }
      return full.filter(c => ['A', 'F', 'G'].some(p => c.key.startsWith(p)));
    }
  },
  {
    id: 'cool',
    name: '冷色系',
    description: '蓝、绿、紫 色系',
    getColors: (system: ColorSystem) => {
      const full = buildFullPalette(system);
      if (system === '盼盼' || system === '咪小窝') {
        return full.filter(c => {
          const num = parseInt(c.key, 10);
          return (num >= 21 && num <= 30) || (num >= 60 && num <= 100);
        });
      }
      return full.filter(c => ['B', 'C', 'D'].some(p => c.key.startsWith(p)));
    }
  },
  {
    id: 'neutral',
    name: '中性色',
    description: '灰、白、黑 色系',
    getColors: (system: ColorSystem) => {
      const full = buildFullPalette(system);
      if (system === '盼盼' || system === '咪小窝') {
        return full.filter(c => {
          const num = parseInt(c.key, 10);
          return num >= 70 && num <= 100;
        });
      }
      return full.filter(c => c.key.startsWith('H'));
    }
  }
];
