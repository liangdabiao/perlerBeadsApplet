<template>
  <view class="settings-page">
    
    <view class="menu-section">
      <!-- <view class="menu-item" @tap="handleMenuTap('feedback')">
        <text class="menu-text">意见反馈</text>
        
      </view> -->
      <!-- <view class="menu-item" @tap="handleMenuTap('cache')">
        
        <text class="menu-text">清除缓存</text>
        <text class="menu-extra">{{ cacheSize }}</text>
        
      </view> -->
      <view class="menu-item" @tap="handleMenuTap('about')">
        
        <text class="menu-text">暂未实现</text>
        
      </view>
    </view>
    
    <view class="menu-section">
      <!-- <view class="menu-item" @tap="handleMenuTap('about')">
        
        <text class="menu-text">关于我们</text>
        
      </view>
      <view class="menu-item" @tap="handleMenuTap('privacy')">
        
        <text class="menu-text">隐私政策</text>
        
      </view>
      <view class="menu-item" @tap="handleMenuTap('terms')">
        
        <text class="menu-text">用户协议</text>
        
      </view> -->
    </view>
    
    <view class="version-info">
      <text class="version-text">版本 {{ version }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { appConfig } from '@/config/app'
import './index.scss'

const cacheSize = ref('0KB')
const version = ref('')

const getCacheSize = () => {
  try {
    const fs = Taro.getFileSystemManager()
    const tmpPath = `${Taro.env.USER_DATA_PATH}`
    
    let totalSize = 0
    try {
      const stat = fs.statSync(tmpPath)
      if (stat.isDirectory()) {
        const files = fs.readdirSync(tmpPath)
      console.log("读取文件：",files);
        files.forEach(file => {
          try {
            const filePath = `${tmpPath}/${file}`
            const fileStat = fs.statSync(filePath)
            if (!fileStat.isDirectory()) {
              totalSize += fileStat.size
            }
          } catch (error) {
            console.error('获取文件大小失败:', error)
          }
        })
      }
      
    } catch (error) {
      console.error('读取tmp目录失败:', error)
    }
    
    const sizeInKB = Math.round(totalSize / 1024)
    cacheSize.value = sizeInKB > 0 ? `${sizeInKB}KB` : '0KB'
  } catch (error) {
    console.error('获取缓存大小失败:', error)
    cacheSize.value = '0KB'
  }
}

const clearCache = () => {
  try {
    const fs = Taro.getFileSystemManager()
    const tmpPath = `${Taro.env.USER_DATA_PATH}/tmp`
    
    try {
      const stat = fs.statSync(tmpPath)
      if (stat.isDirectory()) {
        const files = fs.readdirSync(tmpPath)
        files.forEach(file => {
          try {
            const filePath = `${tmpPath}/${file}`
            const fileStat = fs.statSync(filePath)
            if (!fileStat.isDirectory()) {
              fs.unlinkSync(filePath)
            }
          } catch (error) {
            console.error('删除文件失败:', error)
          }
        })
      }
    } catch (error) {
      console.error('读取tmp目录失败:', error)
    }
    
    cacheSize.value = '0KB'
  } catch (error) {
    console.error('清除缓存失败:', error)
  }
}

onMounted(() => {
  console.log('process',process.env.TARO_ENV);
  version.value = process.env.TARO_APP_VERSION
  getCacheSize()
})

const handleMenuTap = (type: string) => {
  switch (type) {
    case 'feedback':
      Taro.showToast({
        title: '功能开发中',
        icon: 'none'
      })
      break
    case 'about':
      Taro.showToast({
        title: '关于我们功能开发中',
        icon: 'none'
      })
      break
    case 'cache':
      Taro.showModal({
        title: '提示',
        content: '确定要清除缓存吗？',
        success: (res) => {
          if (res.confirm) {
            Taro.showLoading({ title: '清除中...' })
            setTimeout(() => {
              Taro.hideLoading()
              clearCache()
              Taro.showToast({
                title: '清除成功',
                icon: 'success'
              })
            }, 500)
          }
        }
      })
      break
    case 'privacy':
      Taro.showToast({
        title: '隐私政策功能开发中',
        icon: 'none'
      })
      break
    case 'terms':
      Taro.showToast({
        title: '用户协议功能开发中',
        icon: 'none'
      })
      break
    default:
      break
  }
}
</script>
