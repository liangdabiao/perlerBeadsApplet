<template>
  <view class="menu-bar">
    <view class="menu-wrapper">
      <view class="menu-item" @tap="handleUndo">
        <MIcon name="undo" :size="30" color="#5C5852" />
      </view>
      <text class="menu-label">撤销</text>
    </view>
    <view class="menu-wrapper">
      <view class="menu-item" @tap="handleRedo">
        <MIcon name="redo" :size="30" color="#5C5852" />
      </view>
      <text class="menu-label">重做</text>
    </view>
    <view class="menu-wrapper">
      <view class="menu-item" @tap="handleClear">
        <MIcon name="cancel" :size="30" color="#5C5852" />
      </view>
      <text class="menu-label">清空</text>
    </view>
    <view class="menu-wrapper">
      <view class="menu-item" @tap="handleSave">
        <MIcon name="save" :size="30" color="#5C5852" />
      </view>
      <text class="menu-label">保存</text>
    </view>
    <view class="menu-wrapper">
      <view class="menu-item" @tap="handleExport">
        <MIcon name="get_app" :size="30" color="#5C5852" />
      </view>
      <text class="menu-label">导出</text>
    </view>
    <view class="menu-wrapper">
      <view class="menu-item" @tap="handleImport">
        <MIcon name="publish" :size="30" color="#5C5852" />
      </view>
      <text class="menu-label">导入</text>
    </view>
    <view class="menu-wrapper">
      <view class="menu-item" @tap="handleZoomOut">
        <MIcon name="zoom_out" :size="30" color="#5C5852" />
      </view>
      <text class="menu-label">缩小</text>
    </view>
    <view class="menu-wrapper">
      <view class="menu-item" @tap="handleZoomIn">
        <MIcon name="zoom_in" :size="30" color="#5C5852" />
      </view>
      <text class="menu-label">放大</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import Taro from '@tarojs/taro'
import MIcon from '@/components/MIcon/index.vue'
import './index.scss'

const emit = defineEmits<{
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'clear'): void
  (e: 'save'): void
  (e: 'export'): void
  (e: 'import'): void
  (e: 'zoomIn'): void
  (e: 'zoomOut'): void
}>()

const handleUndo = () => {
  emit('undo')
}

const handleRedo = () => {
  emit('redo')
}

const handleClear = () => {
  Taro.showModal({
    title: '提示',
    content: '确定要清空画布吗？',
    success: (res) => {
      if (res.confirm) {
        emit('clear')
      }
    }
  })
}

const handleSave = () => {
  emit('save')
}

const handleExport = () => {
  emit('export')
}

const handleImport = () => {
  emit('import')
}

const handleZoomIn = () => {
  emit('zoomIn')
}

const handleZoomOut = () => {
  emit('zoomOut')
}
</script>
