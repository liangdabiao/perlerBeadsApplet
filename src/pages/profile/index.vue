<template>
  <view class="works-page">

    <view class="content-wrapper">
      <!-- <view class="page-header">
        <text class="page-title">我的作品</text>
        <view class="add-btn" @tap="handleGoEditor">
          <text class="add-icon">+</text>
        </view>
      </view> -->

      <view class="search-bar">
        <MIcon name="search" :size="20" color="#5C5852" />
        <text class="search-placeholder">搜索作品...</text>
      </view>

      <view class="category-tabs">
        <view
          v-for="tab in categoryTabs"
          :key="tab.value"
          :class="['category-item', { active: currentCategory === tab.value }]"
          @tap="handleCategoryChange(tab.value)"
        >
          <text class="category-text">{{ tab.label }}</text>
        </view>
      </view>

      <scroll-view
        scroll-y
        class="works-scroll"
        :refresher-enabled="true"
        :refresher-triggered="isRefreshing"
        @refresherrefresh="handleRefresh"
      >
        <view class="works-grid">
          <view
            v-for="item in cardList"
            :key="item.id"
            class="work-card"
            @tap="handleViewDetail(item)"
            @longpress="handleCardLongPress(item)"
          >
            <view class="work-preview">
              <image
                :src="item.pngTempPath"
                class="preview-image"
                mode="aspectFit"
              />
              <view :class="['status-badge', item.status]">
                {{ item.status === 'finished' ? '已完成' : '进行中' }}
              </view>
            </view>
            <view class="work-info">
              <text class="work-title">{{ item.title }}</text>
              <view class="work-meta">
                <view class="tag-list">
                  <text v-for="(tag, idx) in item.tags.slice(0, 2)" :key="idx" class="tag">{{ tag }}</text>
                </view>
                <text class="work-date">{{ formatDate(item.createdAt) }}</text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="isLoading" class="loading-wrapper">
          <text>加载中...</text>
        </view>

        <view v-if="!isLoading && cardList.length === 0" class="empty-wrapper">
          <text class="empty-text">{{ getEmptyText() }}</text>
          <view v-if="currentCategory === 'all'" class="empty-btn" @tap="handleGoEditor">去创作</view>
        </view>
      </scroll-view>
    </view>

    <!-- <view class="bottom-nav-container">
      <view class="nav-pill">
        <view class="nav-item active" @tap="handleSwitchTab('works')">
          <text class="nav-icon">🖼️</text>
          <text class="nav-label">作品</text>
        </view>
        <view class="nav-item" @tap="handleSwitchTab('editor')">
          <text class="nav-icon">✏️</text>
          <text class="nav-label">编辑</text>
        </view>
        <view class="nav-item" @tap="handleSwitchTab('profile')">
          <text class="nav-icon">👤</text>
          <text class="nav-label">我的</text>
        </view>
      </view>
    </view> -->

    <CustomTabBar />
    <canvas type="2d" id="exportCanvas" style="position: fixed; left: -9999px; top: -9999px; width: 256px; height: 256px;"></canvas>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import Taro, { useDidShow } from '@tarojs/taro'
import CustomTabBar from '@/custom-tab-bar/index.vue'
import MIcon from '@/components/MIcon/index.vue'
import './index.scss'
import { getPixelArtList, deletePixelArt, PixelArtItemStorage, PixelArtStatus, updatePixelArt } from '@/utils/storage'
import { useEditorTempStore } from '@/stores/editorTemp'
import { arrayBufferToTempFilePath, upscalePixelArtPng, checkTempFileExists } from '@/utils/pixelArt'
import { base64ToArrayBuffer } from '@/utils/base64'

interface DisplayItem extends PixelArtItemStorage {
  canvasHeight: number
  imageUrl?: string
}

const categoryTabs = [
  { label: '全部', value: 'all' },
  { label: '最近', value: 'recent' },
  { label: '收藏', value: 'favorite' }
]

const currentCategory = ref('all')
const allList = ref<DisplayItem[]>([])
const cardList = ref<DisplayItem[]>([])
const isLoading = ref(false)
const isRefreshing = ref(false)

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}

const getEmptyText = (): string => {
  const texts: Record<string, string> = {
    all: '暂无作品，快去创作吧~',
    recent: '暂无最近的作品',
    favorite: '暂无收藏的作品'
  }
  return texts[currentCategory.value] || '暂无内容'
}

const regenerateThumbnail = async (item: PixelArtItemStorage): Promise<string> => {
  const buffer = base64ToArrayBuffer(item.pngData)
  const originalPath = await arrayBufferToTempFilePath(buffer)
  const hdPath = await upscalePixelArtPng(originalPath, item.gridSize, true)
  await updatePixelArt(item.id, { pngTempPath: hdPath })
  return hdPath
}

const ensureThumbnailExists = async (item: PixelArtItemStorage): Promise<string> => {
  if (item.pngTempPath) {
    const exists = await checkTempFileExists(item.pngTempPath)
    if (exists) {
      return item.pngTempPath
    }
  }
  return await regenerateThumbnail(item)
}

const fetchCardList = async (isRefresh = false) => {
  if (isLoading.value) return
  isLoading.value = true

  try {
    const list = await getPixelArtList()
    const displayList: DisplayItem[] = await Promise.all(
      list.map(async (item) => {
        const pngTempPath = await ensureThumbnailExists(item)
        return {
          ...item,
          pngTempPath,
          canvasHeight: 150,
        }
      })
    )

    allList.value = displayList
    filterByCategory()
    await nextTick()
  } catch (error) {
    Taro.showToast({
      title: '加载失败',
      icon: 'none'
    })
    console.log('加载失败', error)
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

const filterByCategory = () => {
  if (currentCategory.value === 'all') {
    cardList.value = allList.value
  } else if (currentCategory.value === 'recent') {
    const sorted = [...allList.value].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    cardList.value = sorted.slice(0, 10)
  } else if (currentCategory.value === 'favorite') {
    cardList.value = allList.value.filter(item => item.status === 'finished')
  }
}

const handleCategoryChange = (value: string) => {
  if (currentCategory.value === value) return
  currentCategory.value = value
  filterByCategory()
}

const handleRefresh = async () => {
  isRefreshing.value = true
  await fetchCardList(true)
}

const handleGoEditor = () => {
  Taro.switchTab({
    url: '/pages/editor/index'
  })
}

const handleSwitchTab = (tab: string) => {
  if (tab === 'works') {
    return
  } else if (tab === 'editor') {
    Taro.switchTab({ url: '/pages/editor/index' })
  } else if (tab === 'profile') {
    Taro.switchTab({ url: '/pages/profile/index' })
  }
}

const handleCardLongPress = (item: DisplayItem) => {
  const statusLabel = item.status === 'finished' ? '标记为进行中' : '标记为已完成'
  Taro.showActionSheet({
    itemList: ['查看详情', '编辑', '导出', statusLabel, '删除'],
    success: async (res) => {
      const tapIndex = res.tapIndex
      if (tapIndex === 0) {
        handleViewDetail(item)
      } else if (tapIndex === 1) {
        try {
          Taro.showLoading({ title: '加载中...' })
          const { setTempData } = useEditorTempStore()
          setTempData({
            gridSize: item.gridSize,
            pngBuffer: base64ToArrayBuffer(item.pngData),
            pngTempPath: item.pngTempPath
          })
          Taro.hideLoading()
          Taro.switchTab({
            url: '/pages/editor/index'
          })
        } catch (error) {
          Taro.hideLoading()
          Taro.showToast({ title: '加载失败', icon: 'error' })
        }
      } else if (tapIndex === 2) {
        handleExport(item)
      } else if (tapIndex === 3) {
        handleToggleStatus(item)
      } else if (tapIndex === 4) {
        handleDelete(item)
      }
    }
  })
}

const handleViewDetail = (item: DisplayItem) => {
  try {
    Taro.setStorageSync(`pixelart_detail_${item.id}`, item)
    Taro.navigateTo({
      url: `/pages/detail/index?id=${item.id}`
    })
  } catch (error) {
    console.error('跳转详情页失败:', error)
    Taro.showToast({
      title: '跳转失败',
      icon: 'none'
    })
  }
}

const handleToggleStatus = async (item: DisplayItem) => {
  const newStatus: PixelArtStatus = item.status === 'finished' ? 'unfinished' : 'finished'
  const success = await updatePixelArt(item.id, { status: newStatus })
  if (success) {
    Taro.showToast({ title: '状态已更新', icon: 'success' })
    await fetchCardList(true)
  } else {
    Taro.showToast({ title: '更新失败', icon: 'error' })
  }
}

const handleExport = async (item: DisplayItem) => {
  try {
    Taro.showLoading({ title: '导出中...' })
    const tempFilePath = await arrayBufferToTempFilePath(base64ToArrayBuffer(item.pngData))

    await new Promise<void>((resolve, reject) => {
      Taro.saveImageToPhotosAlbum({
        filePath: tempFilePath,
        success: () => resolve(),
        fail: (err) => {
          if (err.errMsg.includes('auth deny')) {
            Taro.showModal({
              title: '提示',
              content: '需要您授权保存相册权限',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  Taro.openSetting({
                    success: (settingRes) => {
                      if (settingRes.authSetting['scope.writePhotosAlbum']) {
                        Taro.saveImageToPhotosAlbum({
                          filePath: tempFilePath,
                          success: () => resolve(),
                          fail: reject
                        })
                      } else {
                        reject(new Error('用户拒绝授权'))
                      }
                    }
                  })
                } else {
                  reject(new Error('用户拒绝授权'))
                }
              }
            })
          } else {
            reject(err)
          }
        }
      })
    })

    Taro.hideLoading()
    Taro.showToast({ title: '导出成功', icon: 'success' })
  } catch (error) {
    Taro.hideLoading()
    Taro.showToast({ title: '导出失败', icon: 'error' })
  }
}

const handleDelete = async (item: DisplayItem) => {
  Taro.showModal({
    title: '确认删除',
    content: `确定要删除「${item.title}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        const success = await deletePixelArt(item.id)
        if (success) {
          Taro.showToast({ title: '删除成功', icon: 'success' })
          await fetchCardList(true)
        } else {
          Taro.showToast({ title: '删除失败', icon: 'error' })
        }
      }
    }
  })
}

onMounted(() => {
  fetchCardList()
})

useDidShow(() => {
  fetchCardList(true)
})
</script>
