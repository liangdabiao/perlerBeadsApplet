<template>
  <view class="home-page">
    <view class="search-bar">
      <view class="search-input-wrapper" @tap="handleSearchFocus">
        
        <input
          v-model="searchKeyword"
          class="search-input"
          placeholder="搜索拼豆模板"
          placeholder-class="search-placeholder"
          confirm-type="search"
          @confirm="handleSearch"
          @input="handleSearchInput"
        />
        <view v-if="searchKeyword" class="clear-btn" @tap.stop="clearSearch">
          
        </view>
      </view>
      <view class="search-btn" @tap="handleSearch">
        <text>搜索</text>
      </view>
    </view>

    <view class="category-tabs">
      <scroll-view scroll-x class="tabs-scroll">
        <view class="tabs-wrapper">
          <view
            v-for="(tab, index) in categories"
            :key="index"
            :class="['tab-item', { active: currentCategory === tab.value }]"
            @tap="handleCategoryChange(tab.value)"
          >
            <text>{{ tab.label }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <scroll-view
      scroll-y
      class="content-scroll"
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="handleRefresh"
      @scrolltolower="handleLoadMore"
    >
      <view class="waterfall-container">
        <view class="waterfall-column">
          <view
            v-for="item in leftColumnItems"
            :key="item.id"
            class="template-card"
            @tap="handleTemplateTap(item)"
          >
            <image
              class="template-image"
              :src="item.coverImage"
              mode="widthFix"
              lazy-load
            />
            <view class="template-info">
              <text class="template-title">{{ item.title }}</text>
              <view class="template-meta">
                <view class="author-info">
                  <image class="author-avatar" :src="item.authorAvatar" mode="aspectFill" />
                  <text class="author-name">{{ item.authorName }}</text>
                </view>
                <view class="like-info">
                  
                  <text class="like-count">{{ formatCount(item.likeCount) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view class="waterfall-column">
          <view
            v-for="item in rightColumnItems"
            :key="item.id"
            class="template-card"
            @tap="handleTemplateTap(item)"
          >
            <image
              class="template-image"
              :src="item.coverImage"
              mode="widthFix"
              lazy-load
            />
            <view class="template-info">
              <text class="template-title">{{ item.title }}</text>
              <view class="template-meta">
                <view class="author-info">
                  <image class="author-avatar" :src="item.authorAvatar" mode="aspectFill" />
                  <text class="author-name">{{ item.authorName }}</text>
                </view>
                <view class="like-info">
                  
                  <text class="like-count">{{ formatCount(item.likeCount) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="isLoading" class="loading-wrapper">
        <text>加载中...</text>
      </view>

      <view v-if="!hasMore && templateList.length > 0" class="no-more-wrapper">
        <text>没有更多了~</text>
      </view>

      <view v-if="!isLoading && templateList.length === 0" class="empty-wrapper">
        
        <text class="empty-text">暂无模板</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import './index.scss'

interface TemplateItem {
  id: string
  title: string
  coverImage: string
  authorName: string
  authorAvatar: string
  likeCount: number
  height: number
}

const categories = [
  { label: '推荐', value: 'recommend' },
  { label: '最新', value: 'latest' },
  { label: '热门', value: 'hot' },
  { label: '动物', value: 'animal' },
  { label: '植物', value: 'plant' },
  { label: '人物', value: 'character' },
  { label: '风景', value: 'landscape' },
  { label: '动漫', value: 'anime' },
  { label: '美食', value: 'food' }
]

const searchKeyword = ref('')
const currentCategory = ref('recommend')
const templateList = ref<TemplateItem[]>([])
const page = ref(1)
const pageSize = 10
const isLoading = ref(false)
const isRefreshing = ref(false)
const hasMore = ref(true)

const leftColumnItems = computed(() => {
  return templateList.value.filter((_, index) => index % 2 === 0)
})

const rightColumnItems = computed(() => {
  return templateList.value.filter((_, index) => index % 2 === 1)
})

const formatCount = (count: number): string => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w'
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count.toString()
}

const generateMockData = (pageNum: number): TemplateItem[] => {
  const mockImages = [
    'https://picsum.photos/300/400?random=',
    'https://picsum.photos/300/350?random=',
    'https://picsum.photos/300/450?random=',
    'https://picsum.photos/300/380?random=',
    'https://picsum.photos/300/420?random='
  ]
  const mockTitles = [
    '可爱小猫咪拼豆教程',
    '夏日清凉水果系列',
    '卡通人物拼豆合集',
    '梦幻星空拼豆图案',
    '复古花朵拼豆设计',
    '萌宠狗狗拼豆模板',
    '清新植物拼豆系列',
    '节日主题拼豆作品',
    '动漫角色拼豆教程',
    '美食拼豆图案分享'
  ]
  const mockAuthors = [
    '拼豆达人', '手工爱好者', '创意工坊', '拼豆小能手', '艺术创作者',
    'DIY达人', '拼豆新手', '手工匠人', '拼豆艺术家', '创意达人'
  ]

  const data: TemplateItem[] = []
  const startIndex = (pageNum - 1) * pageSize

  for (let i = 0; i < pageSize; i++) {
    const randomIndex = startIndex + i
    data.push({
      id: `template_${randomIndex}`,
      title: mockTitles[randomIndex % mockTitles.length],
      coverImage: mockImages[randomIndex % mockImages.length] + randomIndex,
      authorName: mockAuthors[randomIndex % mockAuthors.length],
      authorAvatar: `https://picsum.photos/50/50?random=avatar${randomIndex}`,
      likeCount: Math.floor(Math.random() * 10000) + 100,
      height: Math.floor(Math.random() * 150) + 250
    })
  }
  return data
}

const fetchTemplateList = async (isRefresh = false) => {
  if (isLoading.value) return

  if (isRefresh) {
    page.value = 1
    hasMore.value = true
  }

  if (!hasMore.value) return

  isLoading.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    const newData = generateMockData(page.value)

    if (isRefresh) {
      templateList.value = newData
      isRefreshing.value = false
    } else {
      templateList.value = [...templateList.value, ...newData]
    }

    if (newData.length < pageSize) {
      hasMore.value = false
    } else {
      page.value++
    }
  } catch (error) {
    Taro.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

const handleRefresh = async () => {
  isRefreshing.value = true
  await fetchTemplateList(true)
}

const handleLoadMore = () => {
  if (!isLoading.value && hasMore.value) {
    fetchTemplateList()
  }
}

const handleSearchInput = (e: any) => {
  searchKeyword.value = e.detail.value
}

const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    Taro.showToast({
      title: '请输入搜索关键词',
      icon: 'none'
    })
    return
  }

  Taro.showLoading({ title: '搜索中...' })

  setTimeout(() => {
    Taro.hideLoading()
    page.value = 1
    hasMore.value = true
    templateList.value = generateMockData(1)

    Taro.showToast({
      title: `搜索"${searchKeyword.value}"`,
      icon: 'none'
    })
  }, 500)
}

const clearSearch = () => {
  searchKeyword.value = ''
  handleRefresh()
}

const handleSearchFocus = () => {
}

const handleCategoryChange = (value: string) => {
  if (currentCategory.value === value) return

  currentCategory.value = value
  page.value = 1
  hasMore.value = true
  templateList.value = []

  fetchTemplateList(true)
}

const handleTemplateTap = (item: TemplateItem) => {
  Taro.showToast({
    title: `点击了: ${item.title}`,
    icon: 'none'
  })
}

onMounted(() => {
  fetchTemplateList()
})
</script>
