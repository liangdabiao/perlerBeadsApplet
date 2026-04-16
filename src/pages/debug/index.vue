<template>
  <view class="debug-page">
    <view class="debug-header">
      <text class="title">Debug Tools</text>
      <text class="subtitle">开发调试工具</text>
    </view>

    <view class="debug-section">
      <view class="section-title">
        <text>数据管理</text>
      </view>
      <view class="debug-item" @tap="showDataEditor">
        <text class="item-label">数据编辑器</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <view class="debug-section">
      <view class="section-title">
        <text>存储信息</text>
      </view>
      <view class="debug-item" @tap="getStorageInfo">
        <text class="item-label">获取存储信息</text>
        <text class="arrow">›</text>
      </view>
      <view class="debug-item" @tap="clearStorage">
        <text class="item-label">清除本地存储</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <view class="debug-section">
      <view class="section-title">
        <text>系统信息</text>
      </view>
      <view class="debug-item" @tap="getSystemInfo">
        <text class="item-label">获取系统信息</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <view class="debug-section">
      <view class="section-title">
        <text>路由跳转</text>
      </view>
      <view class="debug-item" @tap="goToEditor">
        <text class="item-label">跳转编辑器</text>
        <text class="arrow">›</text>
      </view>
      <view class="debug-item" @tap="goToProfile">
        <text class="item-label">跳转我的</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <view class="debug-section">
      <view class="section-title">
        <text>Toast 测试</text>
      </view>
      <view class="button-group">
        <view class="btn btn-primary" @tap="showToast('success')">成功</view>
        <view class="btn btn-info" @tap="showToast('loading')">加载</view>
        <view class="btn btn-warning" @tap="showToast('none')">无图标</view>
        <view class="btn btn-danger" @tap="showToast('error')">错误</view>
      </view>
    </view>

    <view class="debug-section">
      <view class="section-title">
        <text>日志输出</text>
      </view>
      <view class="log-container">
        <view v-for="(log, index) in logs" :key="index" class="log-item">
          <text class="log-time">{{ log.time }}</text>
          <text class="log-content">{{ log.message }}</text>
        </view>
        <view v-if="logs.length === 0" class="log-empty">
          <text>暂无日志</text>
        </view>
      </view>
      <view class="button-group">
        <view class="btn btn-default" @tap="clearLogs">清除日志</view>
      </view>
    </view>

    <view v-if="dataEditorVisible" class="data-editor-wrapper">
      <view class="popup-close" @tap="dataEditorVisible = false">
        <text class="arrow-left">‹</text>
        <text>返回</text>
      </view>
      <DataEditor ref="dataEditorRef" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Taro from '@tarojs/taro'
import DataEditor from './components/dataEditor/index.vue'
import './index.scss'

interface LogItem {
  time: string
  message: string
}

const logs = ref<LogItem[]>([])
const dataEditorVisible = ref(false)
const dataEditorRef = ref<InstanceType<typeof DataEditor> | null>(null)

const addLog = (message: string) => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  logs.value.unshift({ time, message })
  if (logs.value.length > 50) {
    logs.value.pop()
  }
}

const showDataEditor = () => {
  dataEditorVisible.value = true
}

const getStorageInfo = () => {
  try {
    const info = Taro.getStorageInfoSync()
    const message = `Keys: ${info.keys.join(', ')} | Size: ${info.currentSize}KB`
    addLog(message)
    Taro.showModal({
      title: '存储信息',
      content: `Keys: ${info.keys.length}\n当前大小: ${info.currentSize}KB\n限制大小: ${info.limitSize}KB`,
      showCancel: false
    })
  } catch (e) {
    addLog(`获取存储信息失败: ${e}`)
  }
}

const clearStorage = () => {
  Taro.showModal({
    title: '确认清除',
    content: '确定要清除所有本地存储吗？',
    success: (res) => {
      if (res.confirm) {
        try {
          Taro.clearStorageSync()
          addLog('本地存储已清除')
          Taro.showToast({ title: '清除成功', icon: 'success' })
        } catch (e) {
          addLog(`清除失败: ${e}`)
        }
      }
    }
  })
}

const getSystemInfo = () => {
  try {
    const info = Taro.getSystemInfoSync()
    const message = `${info.brand} ${info.model} | ${info.system}`
    addLog(message)
    Taro.showModal({
      title: '系统信息',
      content: `品牌: ${info.brand}\n型号: ${info.model}\n系统: ${info.system}\n版本: ${info.version}\n屏幕: ${info.screenWidth}x${info.screenHeight}\n像素比: ${info.pixelRatio}`,
      showCancel: false
    })
  } catch (e) {
    addLog(`获取系统信息失败: ${e}`)
  }
}

const goToEditor = () => {
  Taro.switchTab({ url: '/pages/editor/index' })
}

const goToProfile = () => {
  Taro.switchTab({ url: '/pages/profile/index' })
}

const showToast = (type: string) => {
  const configs: Record<string, { title: string; icon: 'success' | 'loading' | 'error' | 'none' }> = {
    success: { title: '操作成功', icon: 'success' },
    loading: { title: '加载中...', icon: 'loading' },
    none: { title: '这是一条提示', icon: 'none' },
    error: { title: '操作失败', icon: 'error' }
  }
  const config = configs[type]
  Taro.showToast(config)
  addLog(`Toast: ${config.title}`)
}

const clearLogs = () => {
  logs.value = []
}
</script>
