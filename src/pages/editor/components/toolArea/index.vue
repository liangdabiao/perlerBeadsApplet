<template>
  <view class="tool-area">
    <view v-if="showColorPicker" class="color-picker-section">
      <view class="color-grid">
        <view class="color-row">
          <view v-for="(color, index) in colorRow1" :key="'row1-' + index"
            :class="['color-item', { active: currentColor === color }]" :style="{ backgroundColor: color }"
            @tap="handleColorSelect(color)">
            <MIcon v-if="currentColor === color" name="check" :size="18" color="#FFFFFF" />
          </view>
        </view>
        <view class="color-row">
          <view v-for="(color, index) in colorRow2" :key="'row2-' + index"
            :class="['color-item', { active: currentColor === color, 'white-color': color === '#FFFFFF' }]"
            :style="{ backgroundColor: color }" @tap="handleColorSelect(color)">
            <MIcon v-if="currentColor === color" name="check" :size="18" color="rgba(0,0,0,0.5)" />
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
      <!-- <view class="tool-wrapper">
        <view :class="['tool-item', { active: currentTool === 'fill' }]" @tap="handleToolChange('fill')">
          <MIcon name="format_color_fill" :size="36" :color="currentTool === 'fill' ? '#FFFFFF' : '#5C5852'" />
        </view>
        <text class="tool-label">填充</text>
      </view> -->
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
      <scroll-view scroll-y class="panel-content">
        <view class="color-set-list">
          <view v-for="(colorSet, index) in colorSets" :key="index"
            :class="['color-set-item', { active: currentColorSetId === colorSet.id }]"
            @tap="handleColorSetSelect(colorSet)">
            <view class="color-set-info">
              <text class="color-set-name">{{ colorSet.name }}</text>
              <text class="color-set-desc">{{ colorSet.description }}</text>
            </view>
            <view class="color-set-preview">
              <view v-for="(color, colorIndex) in colorSet.colors.slice(0, 8)" :key="colorIndex" class="preview-color"
                :style="{ backgroundColor: color }" />
            </view>
            <view v-if="currentColorSetId === colorSet.id" class="color-set-check">
              <MIcon name="check" :size="20" color="#FFFFFF" />
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import MIcon from '@/components/MIcon/index.vue'
import './index.scss'

interface ColorSet {
  id: string
  name: string
  description: string
  colors: string[]
}

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

const colorRow1 = [
  '#C4634E', '#7A9B76', '#F5D547', '#5B8DB8', '#9B7CB6',
  '#2D2A26', '#FF6B6B', '#95E1A8', '#74C0FC'
]

const colorRow2 = [
  '#FFFFFF', '#E8913A', '#E87A9A', '#5BB8A8', '#8B6F5C',
  '#9A9A9A', '#6B4C7A', '#F5E6D3', '#87CEEB'
]

const gridSizes = [16, 24, 32, 48, 100]

const colorSets: ColorSet[] = [
  {
    id: 'default',
    name: '默认颜色集',
    description: '常用的基础颜色',
    colors: [...colorRow1, ...colorRow2]
  },
  {
    id: 'warm',
    name: '暖色调',
    description: '温暖明亮的颜色',
    colors: [
      '#FF6B6B', '#FF8E8E', '#E85555', '#FFD93D', '#F9F871',
      '#FF9F45', '#FFBD35', '#FFA07A', '#FF7F50', '#FF6347',
      '#FF4500', '#FFA500', '#FFB6C1', '#FFC0CB', '#FF69B4'
    ]
  },
  {
    id: 'cool',
    name: '冷色调',
    description: '清新凉爽的颜色',
    colors: [
      '#4ECDC4', '#6ED9D2', '#3DBDB4', '#1890FF', '#40A9FF',
      '#69C0FF', '#91D5FF', '#B37FEB', '#9254DE', '#722ED1',
      '#531DAB', '#36CFC9', '#13C2C2', '#08979C', '#006D75'
    ]
  },
  {
    id: 'pastel',
    name: '柔和色',
    description: '柔和淡雅的颜色',
    colors: [
      '#FFD6E7', '#FFB3C6', '#FF9ECB', '#E2F0CB', '#C7E9B0',
      '#B5EAD7', '#95E1D3', '#F38181', '#FCE38A', '#EAFFD0',
      '#AA96DA', '#FCBAD3', '#FFFFD2', '#A8D8EA', '#AA96DA'
    ]
  },
  {
    id: 'vibrant',
    name: '鲜艳色',
    description: '鲜艳夺目的颜色',
    colors: [
      '#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF',
      '#FF5400', '#FF0054', '#FF0099', '#9D4EDD', '#5A189A',
      '#00BBF9', '#00F5D4', '#00B4D8', '#0077B6', '#03045E'
    ]
  },
  {
    id: 'grayscale',
    name: '灰度色',
    description: '黑白灰色系',
    colors: [
      '#FFFFFF', '#F5F5F5', '#E8E8E8', '#D9D9D9', '#BFBFBF',
      '#8C8C8C', '#595959', '#434343', '#262626', '#1F1F1F',
      '#000000', '#FAFAFA', '#F0F0F0', '#D9D9D9', '#BFBFBF'
    ]
  }
]

const showColorPicker = computed(() => {
  return ['brush', 'eraser', 'fill'].includes(currentTool.value)
})

const handleColorSelect = (color: string) => {
  // currentColor.value = color
  // emit('update:modelValue', color)
  // if (currentTool.value === 'eraser') {
  //   currentTool.value = 'brush'
  //   emit('toolChange', 'brush')
  // }
}

const handleGridSizeChange = (size: number) => {
  currentGridSize.value = size
  emit('update:gridSize', size)
}

const handleToolChange = (tool: string) => {
  currentTool.value = tool
  emit('toolChange', tool)
}

const handleOpenColorSetPanel = () => {
  showColorSetPanel.value = true
  emit('canvasVisibleChange', false)
}

const handleCloseColorSetPanel = () => {
  showColorSetPanel.value = false
  emit('canvasVisibleChange', true)
}

const handleColorSetSelect = (colorSet: ColorSet) => {
  currentColorSetId.value = colorSet.id
  showColorSetPanel.value = false

  emit('canvasVisibleChange', true)
  emit('colorSetChange', colorSet.colors)
}

watch(() => props.modelValue, (newVal) => {
  currentColor.value = newVal
})

watch(() => props.gridSize, (newVal) => {
  currentGridSize.value = newVal
})

onMounted(() => {
  const defaultSet = colorSets.find(set => set.id === currentColorSetId.value)
  if (defaultSet) {
    emit('colorSetChange', defaultSet.colors)
  }
})
</script>
