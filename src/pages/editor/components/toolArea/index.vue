<template>
  <view class="tool-area">
    <view v-if="showColorPicker" class="color-picker-section">
      <view class="color-grid">
        <view class="color-row" v-for="(rowColors, rowIndex) in colorRows" :key="'row-' + rowIndex">
          <view v-for="(color, colorIndex) in rowColors" :key="'color-' + rowIndex + '-' + colorIndex"
            :class="['color-item', { active: currentColor.toUpperCase() === color.toUpperCase(), 'white-color': color.toUpperCase() === '#FFFFFF' }]"
            :style="{ backgroundColor: color }"
            @tap="handleColorSelect(color)">
            <MIcon v-if="currentColor.toUpperCase() === color.toUpperCase()" name="check" :size="18" :color="color.toUpperCase() === '#FFFFFF' ? 'rgba(0,0,0,0.5)' : '#FFFFFF'" />
          </view>
        </view>
      </view>
      <view class="color-set-btn" @tap="handleOpenColorSetPanel">
        <MIcon name="palette" :size="36" color="#2D2A26" />
      </view>
    </view>

    <view v-else-if="currentTool === 'grid'" class="grid-size-section">
      <view class="grid-size-list">
        <view v-for="size in gridSizes" :key="size" :class="['grid-size-item', { active: currentGridSize === size }]"
          @tap="handleGridSizeChange(size)">
          <text>{{ size }}</text>
        </view>
      </view>
    </view>

    <view class="tool-bar">
      <view class="tool-wrapper">
        <view :class="['tool-item', { active: currentTool === 'brush' }]" @tap="handleToolChange('brush')">
          <MIcon name="edit" :size="36" :color="currentTool === 'brush' ? '#FFFFFF' : '#5C5852'" />
        </view>
        <text class="tool-label">画笔</text>
      </view>
      <view class="tool-wrapper">
        <view :class="['tool-item', { active: currentTool === 'eraser' }]" @tap="handleToolChange('eraser')">
          <MIcon name="delete" :size="36" :color="currentTool === 'eraser' ? '#FFFFFF' : '#5C5852'" />
        </view>
        <text class="tool-label">橡皮</text>
      </view>
      <view class="tool-wrapper">
        <view :class="['tool-item', { active: currentTool === 'grid' }]" @tap="handleToolChange('grid')">
          <MIcon name="grid_on" :size="36" :color="currentTool === 'grid' ? '#FFFFFF' : '#5C5852'" />
        </view>
        <text class="tool-label">网格</text>
      </view>
      <view class="tool-wrapper">
        <view :class="['tool-item', { active: currentTool === 'select' }]" @tap="handleToolChange('select')">
          <MIcon name="touch_app" :size="36" :color="currentTool === 'select' ? '#FFFFFF' : '#5C5852'" />
        </view>
        <text class="tool-label">选择</text>
      </view>
      <view class="tool-wrapper">
        <view :class="['tool-item', { active: currentTool === 'move' }]" @tap="handleToolChange('move')">
          <MIcon name="open_with" :size="36" :color="currentTool === 'move' ? '#FFFFFF' : '#5C5852'" />
        </view>
        <text class="tool-label">移动</text>
      </view>
    </view>
  </view>

  <view v-if="showColorSetPanel" class="color-set-panel-mask" @tap="handleCloseColorSetPanel">
    <view class="color-set-panel" @tap.stop>
      <view class="panel-header">
        <text class="panel-title">选择颜色集</text>
        <view class="panel-close" @tap="handleCloseColorSetPanel">
          <MIcon name="close" :size="24" color="#5C5852" />
        </view>
      </view>

      <view class="color-system-selector-simple">
        <view class="section-label">选择色号系统</view>
        <view class="system-list">
          <view
            v-for="system in colorSystemOptions"
            :key="system.key"
            :class="['system-item', { active: currentColorSystem === system.key }]"
            @tap="handleColorSystemSelect(system.key as ColorSystem)"
          >
            <text>{{ system.name }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import MIcon from '@/components/MIcon/index.vue'
import {
  ColorSystem,
  PaletteColor,
  colorSystemOptions,
  buildFullPalette
} from '@/utils/colorUtils'
import './index.scss'

interface Props {
  modelValue?: string
  gridSize?: number
  canvasVisible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '#C4634E',
  gridSize: 16
})

const emit = defineEmits<{
  (e: 'update:modelValue', color: string): void
  (e: 'update:gridSize', size: number): void
  (e: 'toolChange', tool: string): void
  (e: 'canvasVisibleChange', visible: boolean): void
  (e: 'colorSetChange', colors: string[]): void
}>()

const currentColor = ref(props.modelValue)
const currentGridSize = ref(props.gridSize)
const currentTool = ref('brush')
const showColorSetPanel = ref(false)
const currentColorSetId = ref('default')
const activeColorPalette = ref<string[]>([])

const currentColorSystem = ref<ColorSystem>('MARD')

const defaultColors = [
  '#C4634E', '#7A9B76', '#F5D547', '#5B8DB8', '#9B7CB6',
  '#2D2A26', '#FF6B6B', '#95E1A8', '#74C0FC',
  '#FFFFFF', '#E8913A', '#E87A9A', '#5BB8A8', '#8B6F5C',
  '#9A9A9A', '#6B4C7A', '#F5E6D3', '#87CEEB'
].map(c => c.toUpperCase())

const colorRows = computed(() => {
  const colors = activeColorPalette.value.length > 0
    ? activeColorPalette.value
    : defaultColors;
  
  const rows: string[][] = [];
  const colorsPerRow = 9;
  
  for (let i = 0; i < colors.length; i += colorsPerRow) {
    rows.push(colors.slice(i, i + colorsPerRow));
  }
  
  return rows;
})

const updateColorPalette = (colors: string[]) => {
  activeColorPalette.value = colors;
}

const gridSizes = [16, 24, 32, 48, 100]

const showColorPicker = computed(() => {
  return ['brush', 'eraser', 'fill'].includes(currentTool.value)
})

const handleColorSelect = (color: string) => {
  currentColor.value = color.toUpperCase();
  emit('update:modelValue', color.toUpperCase());
  if (currentTool.value === 'eraser') {
    currentTool.value = 'brush';
    emit('toolChange', 'brush');
  }
};

const handleGridSizeChange = (size: number) => {
  currentGridSize.value = size;
  emit('update:gridSize', size);
};

const handleToolChange = (tool: string) => {
  currentTool.value = tool;
  emit('toolChange', tool);
};

const handleOpenColorSetPanel = () => {
  showColorSetPanel.value = true;
  emit('canvasVisibleChange', false);
};

const handleCloseColorSetPanel = () => {
  showColorSetPanel.value = false;
  emit('canvasVisibleChange', true);
};

const handleColorSystemSelect = (system: ColorSystem) => {
  currentColorSystem.value = system;
  const fullPalette = buildFullPalette(system);
  const selectedColors = fullPalette.map(c => c.hex.toUpperCase());
  updateColorPalette(selectedColors);
  emit('colorSetChange', selectedColors);
  if (selectedColors.length > 0) {
    currentColor.value = selectedColors[0];
    emit('update:modelValue', selectedColors[0]);
  }
  showColorSetPanel.value = false;
  emit('canvasVisibleChange', true);
};

watch(() => props.modelValue, (newVal) => {
  currentColor.value = newVal ? newVal.toUpperCase() : newVal;
});

watch(() => props.gridSize, (newVal) => {
  currentGridSize.value = newVal;
});

onMounted(() => {
  const fullPalette = buildFullPalette('MARD');
  const selectedColors = fullPalette.map(c => c.hex.toUpperCase());
  updateColorPalette(selectedColors);
  emit('colorSetChange', selectedColors);
  if (selectedColors.length > 0) {
    currentColor.value = selectedColors[0];
    emit('update:modelValue', selectedColors[0]);
  }
});
</script>

<style lang="scss" scoped>
.color-system-selector-simple {
  padding: 16px;

  .section-label {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
  }

  .system-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .system-item {
    padding: 14px 16px;
    background: #f5f5f5;
    border-radius: 8px;
    font-size: 15px;
    color: #333;

    &.active {
      background: #2D2A26;
      color: #fff;
    }
  }
}
</style>
