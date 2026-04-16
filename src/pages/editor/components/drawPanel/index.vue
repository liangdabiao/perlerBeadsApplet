<template>
  <view class="draw-panel">
    <canvas
      :id="canvasId"
      type="2d"
      :style="{ 
        width: canvasWidth + 'px', 
        height: canvasHeight + 'px',
        position: hideMode ? 'absolute' : 'relative',
        left: hideMode ? '-9999px' : 'auto'
      }"
      class="draw-canvas"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
    />
    <image
      v-if="hideMode && imageUrl"
      :src="imageUrl"
      :style="{ 
        width: canvasWidth + 'px', 
        height: canvasHeight + 'px'
      }"
      class="draw-image"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import Taro from '@tarojs/taro'
import './index.scss'

/**
 * 绘画面板组件 Props 接口定义
 * @property gridSize - 网格大小（N x N 的像素网格）
 * @property currentColor - 当前选中的绘制颜色
 * @property canvasWidth - 画布宽度（像素）
 * @property canvasHeight - 画布高度（像素）
 * @property currentTool - 当前使用的工具（brush: 画笔, move: 移动）
 */
interface Props {
  gridSize?: number
  currentColor?: string
  canvasWidth?: number
  canvasHeight?: number
  currentTool?: string
  viewOnly?: boolean
  hideMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  gridSize: 16,
  currentColor: '#FF6B6B',
  canvasWidth: 0,
  canvasHeight: 0,
  currentTool: 'brush',
  viewOnly: false,
  hideMode: false
})

const emit = defineEmits<{
  (e: 'update:pixelData', data: string[]): void
}>()

const MIN_SCALE = 0.3
const MAX_SCALE = 6
const canvasId = 'pixelCanvas'
let pixelData: string[] = []
const cellSize = ref(0)
const canvasWidth = ref(0)
const canvasHeight = ref(0)
let canvas: any = null
let ctx: CanvasRenderingContext2D | null = null
let isDrawing = false
let hasPainted = false
let lastDrawTime = 0
const DRAW_THROTTLE = 16
let lastTouchPos: { row: number; col: number } | null = null

const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
let isPinching = false
let initialPinchDistance = 0
let initialScale = 1
let lastMoveTouch: { x: number; y: number } | null = null
let isMovingCanvas = false
let isTwoFingerPanning = false
let lastTwoFingerCenter: { x: number; y: number } | null = null

const imageUrl = ref('')

let offscreenCanvas: any = null
let offscreenCtx: CanvasRenderingContext2D | null = null
let imageDataBuffer: Uint8ClampedArray | null = null
let offscreenImageData: ImageData | null = null
let rafId: number | null = null
let needsRebuildBitmap = true

const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

const rgbToHex = (r: number, g: number, b: number) => {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

const updateImageUrl = () => {
  if (!offscreenCanvas) return
  try {
    Taro.canvasToTempFilePath({
      canvas: offscreenCanvas,
      success: (res) => {
        imageUrl.value = res.tempFilePath
      },
      fail: (err) => {
        console.error('Failed to convert canvas to image:', err)
      }
    })
  } catch (e) {
    console.error('Failed to update image URL:', e)
  }
}

const initImageBuffer = () => {
  const size = props.gridSize * props.gridSize * 4
  imageDataBuffer = new Uint8ClampedArray(size)
  imageDataBuffer.fill(255)
  if (offscreenCtx) {
    offscreenImageData = offscreenCtx.createImageData(props.gridSize, props.gridSize)
  }
}

const writePixelToBuffer = (row: number, col: number, color: string) => {
  if (!imageDataBuffer) return
  const { r, g, b } = hexToRgb(color)
  const idx = (row * props.gridSize + col) * 4
  imageDataBuffer[idx] = r
  imageDataBuffer[idx + 1] = g
  imageDataBuffer[idx + 2] = b
  imageDataBuffer[idx + 3] = 255
}

const flushBufferToOffscreen = (blockSize: number, targetSize: number) => {
  if (!offscreenCtx || !imageDataBuffer) return
  if (!offscreenImageData || offscreenImageData.width !== targetSize || offscreenImageData.height !== targetSize) {
    offscreenImageData = offscreenCtx.createImageData(targetSize, targetSize)
  }
  const dst = offscreenImageData.data
  const g = props.gridSize
  const rowStride = targetSize * 4
  for (let row = 0; row < g; row++) {
    for (let col = 0; col < g; col++) {
      const srcIdx = (row * g + col) * 4
      const r = imageDataBuffer[srcIdx]
      const gg = imageDataBuffer[srcIdx + 1]
      const b = imageDataBuffer[srcIdx + 2]
      const a = 255
      const startY = row * blockSize
      const startX = col * blockSize
      for (let by = 0; by < blockSize; by++) {
        let base = ((startY + by) * targetSize + startX) * 4
        for (let bx = 0; bx < blockSize; bx++) {
          dst[base] = r
          dst[base + 1] = gg
          dst[base + 2] = b
          dst[base + 3] = a
          base += 4
        }
      }
    }
  }
  offscreenCtx.putImageData(offscreenImageData, 0, 0)
}

const initPixelData = () => {
  const total = props.gridSize * props.gridSize
  pixelData = new Array(total).fill('#FFFFFF')
  initImageBuffer()
}

const scheduleRender = () => {
  if (rafId != null) return
  const raf: any = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : (cb: any) => setTimeout(cb, 16)
  rafId = raf(() => {
    rafId = null
    drawFullGrid()
  })
}

const reinitOffscreenCanvas = (size: number) => {
  offscreenCanvas = Taro.createOffscreenCanvas({
    type: '2d',
    width: size,
    height: size
  })
  offscreenCtx = offscreenCanvas.getContext('2d')
  if (offscreenCtx) {
    offscreenImageData = offscreenCtx.createImageData(size, size)
  } else {
    offscreenImageData = null
  }
  needsRebuildBitmap = true
}

/**
 * 计算每个单元格的尺寸
 * 根据画布尺寸和网格大小，计算每个像素格子的边长
 */
const calculateCellSize = () => {
  if (props.canvasWidth > 0 && props.canvasHeight > 0) {
    canvasWidth.value = props.canvasWidth
    canvasHeight.value = props.canvasHeight
    const minSize = Math.min(canvasWidth.value, canvasHeight.value)
    cellSize.value = minSize / props.gridSize
  }
}

const initCanvas = async () => {
  calculateCellSize()
  await nextTick()
  
  const minSize = Math.min(canvasWidth.value, canvasHeight.value)
  const initialSize = Math.max(1, Math.round(minSize * scale.value))
  reinitOffscreenCanvas(initialSize)
  
  initImageBuffer()
  
  const query = Taro.createSelectorQuery()
  query.select(`#${canvasId}`)
    .fields({ node: true, size: true })
    .exec((res) => {
      if (res && res[0]) {
        canvas = res[0].node
        ctx = canvas.getContext('2d')
        
        const dpr = Taro.getSystemInfoSync().pixelRatio || 1
        canvas.width = canvasWidth.value * dpr
        canvas.height = canvasHeight.value * dpr
        if (ctx) {
          ctx.scale(dpr, dpr)
        }
        
        drawFullGrid()
      }
    })
}

/**
 * 绘制完整的像素网格
 * 遍历所有像素格子，根据 pixelData 绘制颜色，并绘制网格线
 * 支持缩放和平移变换
 */
const drawFullGrid = () => {
  if (!ctx) return
  
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  
  ctx.fillStyle = '#F5F5F5'
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
  
  const minSize = Math.min(canvasWidth.value, canvasHeight.value)
  const centerX = (canvasWidth.value - minSize) / 2
  const centerY = (canvasHeight.value - minSize) / 2
  const targetSizeRaw = minSize * scale.value
  const blockSize = Math.max(1, Math.round(targetSizeRaw / props.gridSize))
  const targetSize = blockSize * props.gridSize
  if (!offscreenCanvas || offscreenCanvas.width !== targetSize || offscreenCanvas.height !== targetSize) {
    reinitOffscreenCanvas(targetSize)
  }
  if (needsRebuildBitmap) {
    flushBufferToOffscreen(blockSize, targetSize)
    needsRebuildBitmap = false
  }
  const left = centerX + scale.value * offsetX.value
  const top = centerY + scale.value * offsetY.value
  if (offscreenCanvas) {
    ctx.drawImage(offscreenCanvas, left, top)
  }
  const shouldDrawGridLines = blockSize >= 6
  if (shouldDrawGridLines) {
    ctx.strokeStyle = '#E8E8E8'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    for (let i = 0; i <= props.gridSize; i++) {
      const x = left + i * blockSize
      ctx.moveTo(x, top)
      ctx.lineTo(x, top + targetSize)
    }
    for (let j = 0; j <= props.gridSize; j++) {
      const y = top + j * blockSize
      ctx.moveTo(left, y)
      ctx.lineTo(left + targetSize, y)
    }
    ctx.stroke()
  }
  
  ctx.restore?.()
  
  if (props.hideMode && offscreenCanvas) {
    updateImageUrl()
  }
}

/**
 * 绘制单个像素格子
 * @param row - 行索引
 * @param col - 列索引
 * @param color - 填充颜色
 */
const drawSingleCell = (row: number, col: number, color: string) => {
  writePixelToBuffer(row, col, color)
}

/**
 * 根据触摸坐标计算对应的像素格子位置
 * @param touchX - 触摸点 X 坐标
 * @param touchY - 触摸点 Y 坐标
 * @returns 返回 { row, col } 或 null（如果触摸点在网格外）
 */
const getPixelPosition = (touchX: number, touchY: number) => {
  const minSize = Math.min(canvasWidth.value, canvasHeight.value)
  const centerX = (canvasWidth.value - minSize) / 2
  const centerY = (canvasHeight.value - minSize) / 2
  const targetSizeRaw = minSize * scale.value
  const blockSize = Math.max(1, Math.round(targetSizeRaw / props.gridSize))
  const targetSize = blockSize * props.gridSize
  const left = centerX + scale.value * offsetX.value
  const top = centerY + scale.value * offsetY.value
  const col = Math.floor((touchX - left) / blockSize)
  const row = Math.floor((touchY - top) / blockSize)
  if (col >= 0 && col < props.gridSize && row >= 0 && row < props.gridSize) {
    return { row, col }
  }
  return null
}

/**
 * 计算两个触摸点之间的距离
 * @param touch1 - 第一个触摸点
 * @param touch2 - 第二个触摸点
 * @returns 两点之间的欧几里得距离
 */
const getTouchDistance = (touch1: any, touch2: any) => {
  const dx = touch1.x - touch2.x
  const dy = touch1.y - touch2.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 计算两个触摸点的中心点
 * @param touch1 - 第一个触摸点
 * @param touch2 - 第二个触摸点
 * @returns 中心点坐标 { x, y }
 */
const getTouchCenter = (touch1: any, touch2: any) => {
  return {
    x: (touch1.x + touch2.x) / 2,
    y: (touch1.y + touch2.y) / 2
  }
}

/**
 * 绘制单个像素点
 * @param row - 行索引
 * @param col - 列索引
 */
const paintPixel = (row: number, col: number) => {
  const index = row * props.gridSize + col
  const color = props.currentTool === 'eraser' ? '#FFFFFF' : props.currentColor
  if (pixelData[index] !== color) {
    pixelData[index] = color
    writePixelToBuffer(row, col, color)
    scheduleRender()
    needsRebuildBitmap = true
    hasPainted = true
  }
}

/**
 * Bresenham 直线算法
 * 用于在两点之间绘制连续的像素线
 * @param x0 - 起点列索引
 * @param y0 - 起点行索引
 * @param x1 - 终点列索引
 * @param y1 - 终点行索引
 * @returns 直线上所有像素点的坐标数组
 */
const bresenhamLine = (x0: number, y0: number, x1: number, y1: number): Array<{ row: number; col: number }> => {
  const points: Array<{ row: number; col: number }> = []
  
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  
  let x = x0
  let y = y0
  
  while (true) {
    points.push({ row: y, col: x })
    
    if (x === x1 && y === y1) break
    
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
  
  return points
}

/**
 * 绘制两点之间的像素线
 * @param startRow - 起点行索引
 * @param startCol - 起点列索引
 * @param endRow - 终点行索引
 * @param endCol - 终点列索引
 */
const paintLine = (startRow: number, startCol: number, endRow: number, endCol: number) => {
  const points = bresenhamLine(startCol, startRow, endCol, endRow)
  const color = props.currentTool === 'eraser' ? '#FFFFFF' : props.currentColor
  for (const point of points) {
    const idx = point.row * props.gridSize + point.col
    if (pixelData[idx] !== color) {
      pixelData[idx] = color
      writePixelToBuffer(point.row, point.col, color)
      hasPainted = true
    }
  }
  scheduleRender()
  needsRebuildBitmap = true
}

/**
 * 处理触摸开始事件
 * 支持单指绘制、双指缩放和平移操作
 */
const handleTouchStart = (e: any) => {
  const touches = e.touches
  
  if (touches.length === 2) {
    isDrawing = false
    isMovingCanvas = false
    lastTouchPos = null
    isPinching = true
    initialPinchDistance = getTouchDistance(touches[0], touches[1])
    initialScale = scale.value
    lastTwoFingerCenter = getTouchCenter(touches[0], touches[1])
    return
  }
  
  if (props.viewOnly) {
    isMovingCanvas = true
    lastMoveTouch = { x: touches[0].x, y: touches[0].y }
    return
  }
  
  if (props.currentTool === 'move') {
    isDrawing = true
    lastMoveTouch = { x: touches[0].x, y: touches[0].y }
    return
  }
  
  isDrawing = true
  hasPainted = false
  const touch = touches[0]
  const pos = getPixelPosition(touch.x, touch.y)
  if (pos) {
    paintPixel(pos.row, pos.col)
    lastTouchPos = pos
  } else {
    isMovingCanvas = true
    lastMoveTouch = { x: touch.x, y: touch.y }
  }
}

/**
 * 处理触摸移动事件
 * 根据当前状态处理缩放、平移或绘制操作
 */
const handleTouchMove = (e: any) => {
  const touches = e.touches
  
  if (isPinching && touches.length === 2) {
    const currentDistance = getTouchDistance(touches[0], touches[1])
    const scaleChange = currentDistance / initialPinchDistance
    const newScale = initialScale * scaleChange
    
    if (newScale >= MIN_SCALE && newScale <= MAX_SCALE) {
      scale.value = newScale
    }
    
    if (lastTwoFingerCenter) {
      const currentCenter = getTouchCenter(touches[0], touches[1])
      const dx = currentCenter.x - lastTwoFingerCenter.x
      const dy = currentCenter.y - lastTwoFingerCenter.y
      offsetX.value += dx
      offsetY.value += dy
      lastTwoFingerCenter = currentCenter
    }
    
    scheduleRender()
    return
  }
  
  if (props.viewOnly && isMovingCanvas && touches.length === 1) {
    const touch = touches[0]
    if (lastMoveTouch) {
      const dx = touch.x - lastMoveTouch.x
      const dy = touch.y - lastMoveTouch.y
      offsetX.value += dx
      offsetY.value += dy
      scheduleRender()
    }
    lastMoveTouch = { x: touch.x, y: touch.y }
    return
  }
  
  if (props.currentTool === 'move' && isDrawing && touches.length === 1) {
    const touch = touches[0]
    if (lastMoveTouch) {
      const dx = touch.x - lastMoveTouch.x
      const dy = touch.y - lastMoveTouch.y
      offsetX.value += dx
      offsetY.value += dy
      scheduleRender()
    }
    lastMoveTouch = { x: touch.x, y: touch.y }
    return
  }
  
  if (isMovingCanvas && touches.length === 1) {
    const touch = touches[0]
    if (lastMoveTouch) {
      const dx = touch.x - lastMoveTouch.x
      const dy = touch.y - lastMoveTouch.y
      offsetX.value += dx
      offsetY.value += dy
      scheduleRender()
    }
    lastMoveTouch = { x: touch.x, y: touch.y }
    return
  }
  
  if (isPinching) return
  
  if (!isDrawing) return
  
  const now = Date.now()
  if (now - lastDrawTime < DRAW_THROTTLE) return
  lastDrawTime = now
  
  const touch = touches[0]
  const pos = getPixelPosition(touch.x, touch.y)
  if (pos) {
    if (lastTouchPos) {
      paintLine(lastTouchPos.row, lastTouchPos.col, pos.row, pos.col)
    } else {
      paintPixel(pos.row, pos.col)
    }
    lastTouchPos = pos
  }
}

/**
 * 处理触摸结束事件
 * 重置所有触摸相关的状态标志
 */
const handleTouchEnd = () => {
  isPinching = false
  isTwoFingerPanning = false
  isDrawing = false
  isMovingCanvas = false
  lastTouchPos = null
  lastMoveTouch = null
  lastTwoFingerCenter = null
  
  if (hasPainted) {
    emitPixelData()
    hasPainted = false
  }
}

/**
 * 向父组件同步像素数据
 * 只在需要时调用，避免频繁触发 Vue 依赖追踪
 */
const emitPixelData = () => {
  emit('update:pixelData', [...pixelData])
}

/**
 * 清空画布
 * 将所有像素重置为白色并重绘网格
 */
const clearCanvas = () => {
  initPixelData()
  scheduleRender()
  needsRebuildBitmap = true
  emitPixelData()
}

/**
 * 设置像素数据
 * @param data - 像素颜色数组
 */
const setPixelData = (data: string[]) => {
  pixelData = [...data]
  initImageBuffer()
  for (let row = 0; row < props.gridSize; row++) {
    for (let col = 0; col < props.gridSize; col++) {
      const index = row * props.gridSize + col
      const color = pixelData[index] || '#FFFFFF'
      writePixelToBuffer(row, col, color)
    }
  }
  scheduleRender()
  needsRebuildBitmap = true
}

/**
 * 获取当前像素数据
 * @returns 像素颜色数组的副本
 */
const getPixelData = () => {
  return [...pixelData]
}

/**
 * 放大视图
 * 每次增加 0.2 倍，最大 3 倍
 */
const zoomIn = () => {
  const newScale = Math.min(scale.value + 0.2, MAX_SCALE)
  scale.value = newScale
  scheduleRender()
  needsRebuildBitmap = true
}

/**
 * 缩小视图
 * 每次减少 0.2 倍，最小 0.5 倍
 */
const zoomOut = () => {
  const newScale = Math.max(scale.value - 0.2, MIN_SCALE)
  scale.value = newScale
  scheduleRender()
  needsRebuildBitmap = true
}

/**
 * 重置视图
 * 将缩放比例和偏移量恢复到初始状态
 */
const resetView = () => {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
  scheduleRender()
  needsRebuildBitmap = true
}

/**
 * 重新初始化画布
 * 当画布尺寸变化时调用，重新计算尺寸并重绘
 */
const reinitCanvas = async () => {
  calculateCellSize()
  await nextTick()
  
  const query = Taro.createSelectorQuery()
  query.select(`#${canvasId}`)
    .fields({ node: true, size: true })
    .exec((res) => {
      if (res && res[0]) {
        canvas = res[0].node
        ctx = canvas.getContext('2d')
        
        const dpr = Taro.getSystemInfoSync().pixelRatio || 1
        canvas.width = canvasWidth.value * dpr
        canvas.height = canvasHeight.value * dpr
        if (ctx) {
          ctx.scale(dpr, dpr)
        }
        
        drawFullGrid()
      }
    })
}

defineExpose({
  clearCanvas,
  setPixelData,
  getPixelData,
  redraw: drawFullGrid,
  reinitCanvas,
  zoomIn,
  zoomOut,
  resetView
})

watch(() => props.gridSize, () => {
  initPixelData()
  calculateCellSize()
  const minSize = Math.min(canvasWidth.value, canvasHeight.value)
  const size = Math.max(1, Math.round(minSize * scale.value))
  reinitOffscreenCanvas(size)
  drawFullGrid()
})

watch([() => props.canvasWidth, () => props.canvasHeight], () => {
  reinitCanvas()
})

watch(() => props.hideMode, (newVal) => {
  if (newVal) {
    updateImageUrl()
  }
})

onMounted(() => {
  initPixelData()
  initCanvas()
})
</script>
