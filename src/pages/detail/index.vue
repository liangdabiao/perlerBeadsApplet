<template>
  <view class="detail-page">
    <view class="canvas-container">
      <DrawPanel
        ref="drawPanelRef"
        :grid-size="gridSize"
        :canvas-width="canvasWidth"
        :canvas-height="canvasHeight"
        :view-only="true"
      />
    </view>
    
    <view class="info-section">
      <view class="title-row">
        <text class="title">{{ item.title }}</text>
        <view :class="['status-badge', item.status]">
          {{ item.status === 'finished' ? '已完成' : '进行中' }}
        </view>
      </view>
      
      <view v-if="item.description" class="description">
        <text class="description-text">{{ item.description }}</text>
      </view>
      
      <view v-if="item.tags && item.tags.length > 0" class="tags-row">
        <view v-for="(tag, idx) in item.tags" :key="idx" class="tag">
          <text class="tag-text">{{ tag }}</text>
        </view>
      </view>
      
      <view class="meta-row">
        <text class="meta-text">网格: {{ gridSize }} x {{ gridSize }}</text>
        <text class="meta-text">{{ formatDate(item.createdAt) }}</text>
      </view>
      
      <view class="action-buttons">
        <view class="action-btn" @tap="handleExport">
          <text class="btn-text">下载图纸</text>
        </view>
        <view class="action-btn" @tap="handleToggleStatus">
          <text class="btn-text">{{ item.status === 'finished' ? '标注为进行中' : '标注为已完成' }}</text>
        </view>
      </view>
    </view>
    
    <canvas type="2d" id="exportCanvas" style="position: fixed; left: -9999px; top: -9999px; width: 256px; height: 256px;"></canvas>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import Taro from '@tarojs/taro'
import DrawPanel from '@/pages/editor/components/drawPanel/index.vue'
import { arrayBufferToTempFilePath, pngToPixelArtData, exportPatternToGallery } from '@/utils/pixelArt'
import { PixelArtItemStorage, PixelArtStatus, updatePixelArt } from '@/utils/storage'
import './index.scss'
import { base64ToArrayBuffer } from '@/utils/base64'
 


const item = ref<PixelArtItemStorage>({
  id: '',
  title: '',
  description: '',
  tags: [],
  status: 'unfinished',
  gridSize: 16,
  pngData: '',
  pngTempPath: '',
  createdAt: '',
  updatedAt: ''
})

const gridSize = ref(16)
const canvasWidth = ref(0)
const canvasHeight = ref(0)
const drawPanelRef = ref<InstanceType<typeof DrawPanel>>()
const currentPixelData = ref<string[]>([])

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  return `${year}/${month}/${day} ${hour}:${minute}`
}

const loadPixelArt = async () => {
  try {
    Taro.showLoading({ title: '加载中...' })
    
    const tempFilePath = await arrayBufferToTempFilePath(base64ToArrayBuffer(item.value.pngData))
    const pixelData = await pngToPixelArtData(tempFilePath, item.value.gridSize)
    
    currentPixelData.value = pixelData.pixelData
    gridSize.value = item.value.gridSize
    
    const systemInfo = Taro.getSystemInfoSync()
    const screenWidth = systemInfo.windowWidth
    const screenHeight = systemInfo.windowHeight
    
    const canvasSize = Math.min(screenWidth, screenHeight * 0.6)
    canvasWidth.value = canvasSize
    canvasHeight.value = canvasSize
    
    await nextTick()
    
    if (drawPanelRef.value) {
      drawPanelRef.value.setPixelData(pixelData.pixelData)
    }
    
    Taro.hideLoading()
  } catch (error) {
    Taro.hideLoading()
    console.error('加载像素画失败:', error,item)
    Taro.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
}

const handleExport = async () => {
  try {
    const data = {
      gridSize: gridSize.value,
      pixelData: currentPixelData.value
    }
    
    Taro.showLoading({ title: '下载图纸中...' })
    await exportPatternToGallery(data, {
      showGrid: true,
      gridInterval: 10,
      showCoordinates: true,
      showCellNumbers: true,
      gridLineColor: '#555555',
      includeStats: true,
      exportCsv: false
    }, 'MARD', item.value.title)
    Taro.hideLoading()
  } catch (error) {
    Taro.hideLoading()
    Taro.showToast({ title: '下载失败', icon: 'error' })
  }
}

const handleToggleStatus = async () => {
  const newStatus: PixelArtStatus = item.value.status === 'finished' ? 'unfinished' : 'finished'
  const success = await updatePixelArt(item.value.id, { status: newStatus })
  if (success) {
    item.value.status = newStatus
    Taro.showToast({ title: '状态已更新', icon: 'success' })
  } else {
    Taro.showToast({ title: '更新失败', icon: 'error' })
  }
}

onMounted(() => {
  const instance = Taro.getCurrentInstance()
  const params = instance.router?.params
  
  if (params && params.id) {
    try {
      const data = Taro.getStorageSync(`pixelart_detail_${params.id}`)
      if (data) {
        item.value = data
        loadPixelArt()
      } else {
        Taro.showToast({
          title: '数据不存在',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('读取数据失败:', error)
      Taro.showToast({
        title: '数据加载失败',
        icon: 'none'
      })
    }
  } else {
    Taro.showToast({
      title: '缺少参数',
      icon: 'none'
    })
  }
})
</script>
